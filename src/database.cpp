#include "database.hpp"
#include "config_manager.hpp"
#include <spdlog/spdlog.h>
#include <cmath>

void Database::connect() {
    std::string db_url = ConfigManager::getEnv("DATABASE_URL", "postgresql://qwirik:smash_password@localhost/smashcore");
    try {
        conn = std::make_unique<pqxx::connection>(db_url);
        pqxx::work W(*conn);
        
        // Таблица истории датчиков
        W.exec("CREATE TABLE IF NOT EXISTS sensor_readings ("
               "id SERIAL PRIMARY KEY, "
               "device_id VARCHAR(50), "
               "temperature NUMERIC(5,2), "
               "humidity NUMERIC(5,2), "
               "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");

        // Таблица текущих статусов и состояний
        W.exec("CREATE TABLE IF NOT EXISTS device_status ("
               "device_id VARCHAR(50) PRIMARY KEY, "
               "status VARCHAR(50), "
               "last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");

        // Таблица очереди команд с указанием источника (origin)
        W.exec("CREATE TABLE IF NOT EXISTS device_commands ("
               "id SERIAL PRIMARY KEY, "
               "device_id VARCHAR(50), "
               "command VARCHAR(100), "
               "origin VARCHAR(20), "
               "is_executed BOOLEAN DEFAULT FALSE, "
               "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");

        // Таблица правил автоматизации
        W.exec("CREATE TABLE IF NOT EXISTS rules ("
               "id SERIAL PRIMARY KEY, "
               "name VARCHAR(50), "
               "trigger_dev VARCHAR(50), "
               "condition VARCHAR(5), "
               "threshold NUMERIC(5,2), "
               "action_dev VARCHAR(50), "
               "action_cmd VARCHAR(50))");
        
        W.commit();
        spdlog::info("Connected to PostgreSQL successfully");
    } catch (const std::exception& e) {
        spdlog::error("DB Connection error: {}", e.what());
    }
}


void Database::add_rule(const std::string& name, const std::string& t_dev, const std::string& cond, double val, const std::string& a_dev, const std::string& a_cmd) {
    try {
        pqxx::work W(*conn);
        W.exec(pqxx::zview("INSERT INTO rules (name, trigger_dev, condition, threshold, action_dev, action_cmd) VALUES ($1, $2, $3, $4, $5, $6)"),
               pqxx::params{name, t_dev, cond, val, a_dev, a_cmd});
        W.commit();
    } catch (const std::exception& e) { spdlog::error("Rule error: {}", e.what()); }
}

void Database::list_rules() {
    try {
        pqxx::nontransaction N(*conn);
        pqxx::result R = N.exec("SELECT name, trigger_dev, condition, threshold, action_dev, action_cmd FROM rules");
        std::cout << "\n" << std::left << std::setw(15) << "RULE NAME" << std::setw(20) << "IF DEVICE" << std::setw(10) << "COND" << std::setw(20) << "THEN ACTION\n";
        std::cout << std::string(65, '-') << "\n";
        for (auto row : R) {
            std::cout << std::left << std::setw(15) << row[0].c_str() 
                      << std::setw(20) << row[1].c_str() 
                      << row[2].c_str() << " " << std::setw(6) << row[3].c_str() 
                      << row[4].c_str() << " -> " << row[5].c_str() << "\n";
        }
    } catch (...) { std::cout << "Rules table empty or error.\n"; }
}



void Database::save_reading(const std::string& device_id, double temp, double hum) {
    try {
        pqxx::work W(*conn);
        W.exec_params("INSERT INTO sensor_readings (device_id, temperature, humidity) VALUES ($1, $2, $3)", 
                      device_id, temp, hum);
        W.commit();
        spdlog::info("Telemetry: {} -> T:{} H:{}", device_id, temp, hum);
    } catch (const std::exception& e) { spdlog::error("Save error: {}", e.what()); }
}

void Database::update_status(const std::string& device_id, const std::string& status) {
    try {
        pqxx::work W(*conn);
        W.exec_params("INSERT INTO device_status (device_id, status) VALUES ($1, $2) "
                      "ON CONFLICT (device_id) DO UPDATE SET status=$2, last_seen=NOW()", 
                      device_id, status);
        W.commit();
    } catch (const std::exception& e) { spdlog::error("Status update error: {}", e.what()); }
}

json Database::get_all_devices() {
    json res = json::array();
    try {
        pqxx::nontransaction N(*conn);
        pqxx::result R = N.exec("SELECT device_id, status, last_seen FROM device_status ORDER BY device_id");
        for (auto row : R) {
            res.push_back({
                {"device", row[0].c_str()},
                {"status", row[1].c_str()},
                {"last_seen", row[2].c_str()}
            });
        }
    } catch (...) {}
    return res;
}

json Database::get_device_history(const std::string& device_id, int limit) {
    json res = json::array();
    try {
        pqxx::nontransaction N(*conn);
        pqxx::result R = N.exec_params("SELECT temperature, humidity, created_at FROM sensor_readings "
                                       "WHERE device_id=$1 ORDER BY created_at DESC LIMIT $2", 
                                       device_id, limit);
        for (auto row : R) {
            res.push_back({{"t", row[0].as<double>()}, {"h", row[1].as<double>()}, {"time", row[2].c_str()}});
        }
    } catch (...) {}
    return res;
}

void Database::add_command(const std::string& device_id, const std::string& cmd, std::string origin) {
    try {
        pqxx::work W(*conn);
        W.exec_params("INSERT INTO device_commands (device_id, command, origin) VALUES ($1, $2, $3)", 
                      device_id, cmd, origin);
        W.commit();
    } catch (...) {}
}

std::string Database::get_pending_command(const std::string& device_id) {
    try {
        pqxx::work W(*conn);
        pqxx::result R = W.exec_params("SELECT id, command FROM device_commands "
                                       "WHERE device_id=$1 AND is_executed=FALSE ORDER BY created_at ASC LIMIT 1", 
                                       device_id);
        if (R.empty()) return "";
        
        std::string cmd = R[0][1].as<std::string>();
        W.exec_params("UPDATE device_commands SET is_executed=TRUE WHERE id=$1", R[0][0].as<int>());
        W.commit();
        return cmd;
    } catch (...) { return ""; }
}

void Database::check_heartbeats() {
    try {
        pqxx::work W(*conn);
        // Если устройства нет 30 секунд — ставим статус offline, но сохраняем последнее состояние
        W.exec("UPDATE device_status SET status = 'offline' "
               "WHERE last_seen < NOW() - INTERVAL '30 seconds' AND status NOT LIKE 'offline%'");
        W.commit();
    } catch (...) {}
}

void Database::process_rules() {
    try {
        pqxx::nontransaction N(*conn);
        pqxx::result rules = N.exec("SELECT trigger_dev, condition, threshold, action_dev, action_cmd FROM rules");
        
        for (auto r : rules) {
            std::string t_dev = r[0].as<std::string>();
            std::string cond = r[1].as<std::string>();
            double val = r[2].as<double>();
            
            pqxx::result last = N.exec_params("SELECT temperature FROM sensor_readings WHERE device_id=$1 ORDER BY created_at DESC LIMIT 1", t_dev);
            if (!last.empty()) {
                double current = last[0][0].as<double>();
                bool fire = false;
                if (cond == ">" && current > val) fire = true;
                else if (cond == "<" && current < val) fire = true;
                else if (cond == "==" && std::abs(current - val) < 0.1) fire = true;

                if (fire) {
                    // Проверяем, нет ли уже такой невыполненной команды в очереди (защита от спама)
                    pqxx::result dup = N.exec_params("SELECT id FROM device_commands WHERE device_id=$1 AND command=$2 AND is_executed=FALSE", 
                                                    r[3].as<std::string>(), r[4].as<std::string>());
                    if (dup.empty()) {
                        add_command(r[3].as<std::string>(), r[4].as<std::string>(), "automation");
                        spdlog::info("Rule triggered! Action: {} -> {}", r[3].as<std::string>(), r[4].as<std::string>());
                    }
                }
            }
        }
    } catch (...) {}
}

void Database::delete_device(const std::string& device_id) {
    try {
        pqxx::work W(*conn);
        W.exec_params("DELETE FROM device_status WHERE device_id=$1", device_id);
        W.commit();
        spdlog::info("Device {} deleted from DB", device_id);
    } catch (...) {}
}

void Database::seed_test_data() {
    try {
        pqxx::work W(*conn);
        pqxx::result R = W.exec("SELECT count(*) FROM device_status");
        if (R[0][0].as<int>() == 0) {
            W.exec("INSERT INTO device_status (device_id, status) VALUES "
                   "('ESP_LivingRoom', 'online | relay:off'), "
                   "('ESP_Kitchen', 'offline'), "
                   "('Relay_Bedroom', 'online | relay:off')");
            
            // Добавим правило по умолчанию: если в гостиной > 25 градусов, включить реле в спальне
            W.exec("INSERT INTO rules (name, trigger_dev, condition, threshold, action_dev, action_cmd) "
                   "VALUES ('AutoCool', 'ESP_LivingRoom', '>', 25.0, 'Relay_Bedroom', 'relay_on')");
            
            W.commit();
            spdlog::info("Test data and default rule seeded.");
        } else { W.commit(); }
    } catch (...) {}
}

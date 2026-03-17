#include "database.hpp"
#include "config_manager.hpp"
#include <spdlog/spdlog.h>
#include <iostream>

void Database::connect() {
    // Берем строку подключения из .env
    std::string db_url = ConfigManager::getEnv("DATABASE_URL", "");
    
    try {
        conn = std::make_unique<pqxx::connection>(db_url);
        if (conn->is_open()) {
            spdlog::info("Connected to PostgreSQL successfully: {}", conn->dbname());
            
            // Создаем структурированную таблицу
            pqxx::work W(*conn);
            W.exec("CREATE TABLE IF NOT EXISTS sensor_readings ("
                   "id SERIAL PRIMARY KEY, "
                   "device_id VARCHAR(50) NOT NULL, "
                   "temperature NUMERIC(5, 2), "
                   "humidity NUMERIC(5, 2), "
                   "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
            W.commit();
        }
    } catch (const std::exception& e) {
        spdlog::error("Database connection error: {}", e.what());
    }
}

void Database::save_reading(const std::string& device_id, double temp, double hum) {
    if (!conn || !conn->is_open()) {
        spdlog::error("Cannot save data: Database is not connected.");
        return;
    }
    
    try {
        pqxx::work W(*conn);
        W.exec("INSERT INTO sensor_readings (device_id, temperature, humidity) VALUES ($1, $2, $3)",
            pqxx::params{device_id, temp, hum}
        );
        W.commit();
        spdlog::info("Saved to DB: {} | {} | {}", device_id, temp, hum);
    } catch (const std::exception& e) {
        spdlog::error("Failed to insert reading: {}", e.what());
    }
}

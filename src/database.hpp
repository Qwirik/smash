#ifndef DATABASE_HPP
#define DATABASE_HPP

#include <pqxx/pqxx>
#include <string>
#include <memory>
#include <vector>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

class Database {
public:
    Database() = default;
    void connect();
    void seed_test_data();
    
    void save_reading(const std::string& device_id, double temp, double hum);
    void update_status(const std::string& device_id, const std::string& status);
    json get_all_devices();
    json get_device_history(const std::string& device_id, int limit = 20);
    
    void add_command(const std::string& device_id, const std::string& cmd, std::string origin = "system");
    std::string get_pending_command(const std::string& device_id);
    void delete_device(const std::string& device_id);

    void check_heartbeats();
    void process_rules();
    void process_time_rules();
    void add_time_rule(const std::string& name, const std::string& time_cron, const std::string& action_dev, const std::string& action_cmd);
    void register_device(const std::string& device_id, const std::string& device_type);
    
    // Rule management
    void add_rule(const std::string& name, const std::string& t_dev, const std::string& cond, double val, const std::string& a_dev, const std::string& a_cmd);
    void list_rules();
    void delete_rule(const std::string& name);

private:
    std::unique_ptr<pqxx::connection> conn;
};

#endif

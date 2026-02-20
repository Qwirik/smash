#pragma once
#include <pqxx/pqxx>
#include <string>
#include <memory>

class Database {
public:
    Database(const std::string& conn_str);
    void connect();
    void save_reading(const std::string& device_id, double temp, double hum);

private:
    std::string connection_string;
    std::unique_ptr<pqxx::connection> conn;
};

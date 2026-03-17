#ifndef DATABASE_HPP
#define DATABASE_HPP

#include <pqxx/pqxx>
#include <string>
#include <memory>

class Database {
public:
    // Конструктор по умолчанию (без параметров)
    Database() = default;
    
    void connect();
    void save_reading(const std::string& device_id, double temp, double hum);
    
private:
    std::unique_ptr<pqxx::connection> conn;
};

#endif

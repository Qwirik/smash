#include "database.hpp"
#include <spdlog/spdlog.h>

Database::Database(const std::string& conn_str) : connection_string(conn_str) {}

void Database::connect() {
    try {
        conn = std::make_unique<pqxx::connection>(connection_string);
        if (conn->is_open()) {
            spdlog::info("Connected to PostgreSQL successfully: {}", conn->dbname());
        }
    } catch (const std::exception& e) {
        spdlog::error("Database connection error: {}", e.what());
    }
}

void Database::save_reading(const std::string& device_id, double temp, double hum) {
    try {
        pqxx::work W(*conn);
        W.exec_params("INSERT INTO sensor_readings (device_id, temperature, humidity) VALUES ($1, $2, $3)",
            device_id,
	    temp,
	    hum
        );
        W.commit();
        spdlog::debug("Data saved to DB for device: {}", device_id);
    } catch (const std::exception& e) {
        spdlog::error("Failed to save data: {}", e.what());
    }
}

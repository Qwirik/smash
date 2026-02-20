#include "crow/app.h"
#include "crow/logging.h"
#include "database.hpp"
#include "config_manager.hpp"
#include <spdlog/spdlog.h>

class SpdlogHandler : public crow::ILogHandler {
public:
    void log(const std::string& message, crow::LogLevel level) override {
        switch (level) {
            case crow::LogLevel::Debug:   spdlog::debug(message); break;
            case crow::LogLevel::Info:    spdlog::info(message);  break;
            case crow::LogLevel::Warning: spdlog::warn(message);  break;
            case crow::LogLevel::Error:   spdlog::error(message); break;
            case crow::LogLevel::Critical: spdlog::critical(message); break;
            default: spdlog::info(message); break;
        }
    }
};



int main() {
    spdlog::set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] %v");
    
    static SpdlogHandler custom_logger;
    crow::logger::setHandler(&custom_logger);
    
    ConfigManager::init();

    std::string db_url = ConfigManager::getEnv("DATABASE_URL");
    int port = 8080; // В идеале достать из config.json через парсер

    spdlog::info("Starting SmashCore with DB: {}", db_url);

    Database db(db_url);
    db.connect();


    crow::SimpleApp app;

    CROW_ROUTE(app, "/api/data").methods(crow::HTTPMethod::Post)([&db](const crow::request& req){
    auto x = crow::json::load(req.body);
    if (!x) return crow::response(400, "Invalid JSON");

    if (!x.has("device") || !x.has("sensors") || 
        !x["sensors"].has("temp") || !x["sensors"].has("hum")) {
        spdlog::warn("Payload missing required fields");
        return crow::response(400, "Missing fields: device, sensors.temp or sensors.hum");
    }

    try {
        db.save_reading(
            x["device"].s(), 
            x["sensors"]["temp"].d(), 
            x["sensors"]["hum"].d()
        );
        return crow::response(200, "Data Received");
    } catch (const std::exception& e) {
        spdlog::error("DB Error: {}", e.what());
        return crow::response(500, "Database insertion failed");
    }
}); 

    app.port(8080).multithreaded().run();
}

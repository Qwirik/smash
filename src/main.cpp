#include <crow.h>
#include <spdlog/spdlog.h>
#include <nlohmann/json.hpp>
#include "config_manager.hpp"
#include "database.hpp"

using json = nlohmann::json;

class SpdlogHandler : public crow::ILogHandler {
public:
    void log(const std::string& message, crow::LogLevel level) override {
        switch (level) {
            case crow::LogLevel::Debug:    spdlog::debug(message); break;
            case crow::LogLevel::Info:     spdlog::info(message);  break;
            case crow::LogLevel::Warning:  spdlog::warn(message);  break;
            case crow::LogLevel::Error:    spdlog::error(message); break;
            case crow::LogLevel::Critical: spdlog::critical(message); break;
            default: spdlog::info(message); break;
        }
    }
};

// 2. ГЛАВНАЯ ФУНКЦИЯ
int main() {
    ConfigManager::init();

    SpdlogHandler logger;
    crow::logger::setHandler(&logger);
    crow::logger::setLogLevel(crow::LogLevel::Debug);
    Database db;
    db.connect();

    crow::SimpleApp app;

    // Роут для приема данных от ESP32/ESP8266
    CROW_ROUTE(app, "/api/data").methods(crow::HTTPMethod::POST)
    ([&db](const crow::request& req){
        try {
            // Превращаем сырой текст запроса в JSON объект
            auto body = json::parse(req.body);
            
            // Прямое извлечение данных без циклов и парсеров
            std::string device_id = body["device"];
            double temp = body["sensors"]["temp"];
            double hum = body["sensors"]["hum"];

            db.save_reading(device_id, temp, hum);
            return crow::response(200, "Data correctly saved to PostgreSQL");
            
        } catch (const std::exception& e) {
            // Если плата прислала кривой JSON или забыла поля
            spdlog::error("JSON Parsing Error: {}", e.what());
            return crow::response(400, "Invalid JSON structure");
        }
    });

    int port = std::stoi(ConfigManager::getConfig("server_port", "8080"));
    spdlog::info("Starting SmashCore Server on port {}", port);
    app.port(port).multithreaded().run();

    return 0;
}

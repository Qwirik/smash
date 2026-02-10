#include "crow/app.h"
#include <spdlog/spdlog.h>

int main() {
    spdlog::set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] %v");
    spdlog::info("Starting SmashCore Server...");

    crow::SimpleApp app;

    // 1. Главная страница (Health Check)
    CROW_ROUTE(app, "/")([](){
        return "SmashCore API is Online!";
    });

    // 2. Основной маршрут для приема данных от ESP8266
    CROW_ROUTE(app, "/api/data").methods(crow::HTTPMethod::Post)([](const crow::request& req){
        auto x = crow::json::load(req.body);

        if (!x) {
            spdlog::error("Failed to parse JSON body");
            return crow::response(400, "Invalid JSON");
        }

        std::string device_name = x["device"].s();
        double temperature = x["temp"].d();

        spdlog::info("Received Data -> Device: {} | Temp: {} C", device_name, temperature);

        return crow::response(200, "Data Synced");
    });

    app.port(8080).multithreaded().run();
}

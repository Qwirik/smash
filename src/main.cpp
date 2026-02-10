#include "crow/app.h"
#include <spdlog/spdlog.h>

int main() {
    spdlog::set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] %v");
		
    spdlog::info("Starting SmashCore Server...");

    crow::SimpleApp app;

    // Маршрут 1: Главная страница
    CROW_ROUTE(app, "/")([](){
        return "SmashCore API is Online!";
    });

    // Маршрут 2: Тестовый прием данных от ESP
    CROW_ROUTE(app, "/api/test")([](){
        spdlog::info("ESP8266 sent a test heartbeat!");
        return "OK";
    });

    // Запуск на порту 8080
    app.port(8080).multithreaded().run();
}

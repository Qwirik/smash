#include "api_router.hpp"
#include "config_manager.hpp"
#include <nlohmann/json.hpp>
#include <spdlog/spdlog.h>

using json = nlohmann::json;

// Вспомогательная функция для добавления CORS заголовков
void set_cors(crow::response& res) {
    res.add_header("Access-Control-Allow-Origin", "*");
    res.add_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.add_header("Access-Control-Allow-Headers", "Content-Type, X-API-Key");
}

// Проверка ключа администратора
bool is_admin(const crow::request& req) {
    return req.get_header_value("X-API-Key") == ConfigManager::getEnv("MASTER_API_KEY", "admin123");
}

void setup_api_routes(crow::SimpleApp& app, Database& db) {
    
    // --- 1. АППАРАТНОЕ API (Для ESP32) ---

    // Прием данных с датчиков
    CROW_ROUTE(app, "/api/data").methods(crow::HTTPMethod::POST)([&db](const crow::request& req){
        try {
            auto j = json::parse(req.body);
            db.save_reading(j["device"], j["sensors"]["temp"], j["sensors"]["hum"]);
            // При получении данных считаем, что устройство online
            db.update_status(j["device"], "online"); 
            return crow::response(200);
        } catch (...) { return crow::response(400); }
    });

    // Опрос очереди команд устройством (Long polling)
    CROW_ROUTE(app, "/api/command/<string>")([&db](std::string id){
        return json({{"command", db.get_pending_command(id)}}).dump();
    });

    // Подтверждение выполнения команды от устройства
    CROW_ROUTE(app, "/api/ack").methods(crow::HTTPMethod::POST)([&db](const crow::request& req){
        try {
            auto j = json::parse(req.body);
            db.update_status(j["device"], "online | " + j["state"].get<std::string>());
            return crow::response(200);
        } catch (...) { return crow::response(400); }
    });


    // --- 2. ВЕБ API (Для сайта / Dashboard) ---

    // Список всех устройств и их текущих состояний
    CROW_ROUTE(app, "/api/web/devices")([&db](){
        crow::response res(db.get_all_devices().dump());
        set_cors(res);
        return res;
    });

    // История для графиков
    CROW_ROUTE(app, "/api/web/history/<string>")([&db](std::string id){
        crow::response res(db.get_device_history(id).dump());
        set_cors(res);
        return res;
    });

    // Управление устройством через сайт
    CROW_ROUTE(app, "/api/web/command").methods(crow::HTTPMethod::POST, crow::HTTPMethod::OPTIONS)([&db](const crow::request& req){
        crow::response res;
        set_cors(res);
        if (req.method == crow::HTTPMethod::OPTIONS) return crow::response(204);

        if (!is_admin(req)) {
            res.code = 401;
            return res;
        }

        try {
            auto j = json::parse(req.body);
            db.add_command(j["device"], j["command"], "web_dashboard");
            res.code = 200;
            res.body = "Queued";
        } catch (...) { res.code = 400; }
        return res;
    });
}

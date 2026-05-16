#include "api_router.hpp"
#include "config_manager.hpp"
#include <nlohmann/json.hpp>
#include <spdlog/spdlog.h>

using json = nlohmann::json;

// Helper function to add CORS headers
void set_cors(crow::response& res) {
    res.add_header("Access-Control-Allow-Origin", "*");
    res.add_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.add_header("Access-Control-Allow-Headers", "Content-Type, X-API-Key");
}

// Check admin key
bool is_admin(const crow::request& req) {
    return req.get_header_value("X-API-Key") == ConfigManager::getEnv("MASTER_API_KEY", "admin123");
}

void setup_api_routes(crow::SimpleApp& app, Database& db) {
    
    // --- 1. HARDWARE API (For ESP32) ---

    // Receive sensor data
    CROW_ROUTE(app, "/api/data").methods(crow::HTTPMethod::POST)([&db](const crow::request& req){
        try {
            auto j = json::parse(req.body);
            db.save_reading(j["device"], j["sensors"]["temp"], j["sensors"]["hum"]);
            // When receiving data consider the device is online
            db.update_status(j["device"], "online"); 
            return crow::response(200);
        } catch (...) { return crow::response(400); }
    });

    // Device command queue polling (Long polling)
    CROW_ROUTE(app, "/api/command/<string>")([&db](std::string id){
        return json({{"command", db.get_pending_command(id)}}).dump();
    });

    // Device command execution confirmation
    CROW_ROUTE(app, "/api/ack").methods(crow::HTTPMethod::POST)([&db](const crow::request& req){
        try {
            auto j = json::parse(req.body);
            db.update_status(j["device"], "online | " + j["state"].get<std::string>());
            return crow::response(200);
        } catch (...) { return crow::response(400); }
    });


    // Register new device
    CROW_ROUTE(app, "/api/register").methods(crow::HTTPMethod::POST)([&db](const crow::request& req){
        try {
            auto j = json::parse(req.body);
            db.register_device(j["device"], j.value("type", "unknown"));
            return crow::response(200);
        } catch (...) { return crow::response(400); }
    });

    // --- 2. WEB API (For website / Dashboard) ---

    // List of all devices and their current states
    CROW_ROUTE(app, "/api/web/devices")([&db](){
        crow::response res(db.get_all_devices().dump());
        set_cors(res);
        return res;
    });

    // History for charts
    CROW_ROUTE(app, "/api/web/history/<string>")([&db](std::string id){
        crow::response res(db.get_device_history(id).dump());
        set_cors(res);
        return res;
    });

    // Device control via website
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

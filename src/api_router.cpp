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

    // Process endpoint for neuro network / external script
    CROW_ROUTE(app, "/api/process").methods(crow::HTTPMethod::POST, crow::HTTPMethod::OPTIONS)([&db](const crow::request& req){
        crow::response res;
        set_cors(res);
        if (req.method == crow::HTTPMethod::OPTIONS) return crow::response(204);

        if (!is_admin(req)) {
            res.code = 401;
            return res;
        }

        std::string file_path = "";
        try {
            crow::multipart::message msg(req);
            std::string text_content = "";
            std::string original_filename = "";

            auto text_part = msg.part_map.find("text");
            if (text_part != msg.part_map.end()) {
                text_content = text_part->second.body;
            }

            auto file_part = msg.part_map.find("file");
            if (file_part != msg.part_map.end()) {
                // Generate a temp filename
                original_filename = "upload.tmp";
                auto cd = file_part->second.get_header_object("Content-Disposition");
                if (cd.params.count("filename")) {
                    std::string raw_name = cd.params.at("filename");
                    // Sanitize filename to prevent path traversal
                    original_filename = "";
                    for (char c : raw_name) {
                        if (std::isalnum(c) || c == '.' || c == '-' || c == '_') {
                            original_filename += c;
                        }
                    }
                    if (original_filename.empty()) original_filename = "upload.tmp";
                }

                // Generate filename using nanoseconds to avoid collision
                auto now = std::chrono::high_resolution_clock::now();
                auto nanos = std::chrono::duration_cast<std::chrono::nanoseconds>(now.time_since_epoch()).count();
                file_path = "/tmp/smash_upload_" + std::to_string(nanos) + "_" + original_filename;
                std::ofstream out(file_path, std::ios::binary);
                if (out) {
                    out.write(file_part->second.body.data(), file_part->second.body.size());
                    out.close();
                } else {
                    res.code = 500;
                    res.body = R"({"error": "Failed to write file"})";
                    return res;
                }
            }

            std::string ai_cmd = ConfigManager::getConfig("ai_processor_cmd");
            if (ai_cmd.empty()) {
                ai_cmd = ConfigManager::getEnv("AI_PROCESSOR_CMD");
            }

            if (ai_cmd.empty()) {
                res.code = 500;
                res.body = R"({"error": "AI_PROCESSOR_CMD not configured"})";
                return res;
            }

            // Execute the script
            // Construct command: cmd 'filepath' 'text'
            // We must escape single quotes in strings to avoid shell injection
            auto escape_shell_arg = [](const std::string& str) {
                std::string escaped = "'";
                for (char c : str) {
                    if (c == '\'') escaped += "'\\''";
                    else escaped += c;
                }
                escaped += "'";
                return escaped;
            };

            std::string exec_cmd = ai_cmd;
            if (!file_path.empty()) {
                exec_cmd += " " + escape_shell_arg(file_path);
            } else {
                exec_cmd += " ''";
            }
            if (!text_content.empty()) {
                exec_cmd += " " + escape_shell_arg(text_content);
            }

            std::string result = "";
            FILE* pipe = popen(exec_cmd.c_str(), "r");
            if (!pipe) {
                res.code = 500;
                res.body = R"({"error": "Failed to run processor"})";
                return res;
            }

            char buffer[128];
            while (fgets(buffer, sizeof(buffer), pipe) != nullptr) {
                result += buffer;
            }
            pclose(pipe);

            // Parse result from JSON
            json result_j = json::parse(result);

            if (result_j.contains("type") && result_j["type"] == "command") {
                std::string dev = result_j["device"];
                std::string cmd = result_j["command"];
                db.add_command(dev, cmd, "ai_processor");
                res.code = 200;
                res.body = json{{"status", "command_queued"}, {"device", dev}, {"command", cmd}}.dump();
            } else if (result_j.contains("type") && result_j["type"] == "file") {
                std::string out_path = result_j["path"];
                std::ifstream in(out_path, std::ios::binary);
                if (in) {
                    std::ostringstream contents;
                    contents << in.rdbuf();
                    res.body = contents.str();
                    // Basic content type detection
                    if (out_path.find(".wav") != std::string::npos) {
                        res.add_header("Content-Type", "audio/wav");
                    } else if (out_path.find(".mp3") != std::string::npos) {
                        res.add_header("Content-Type", "audio/mpeg");
                    } else {
                        res.add_header("Content-Type", "application/octet-stream");
                    }
                    res.code = 200;
                } else {
                    res.code = 500;
                    res.body = R"({"error": "Output file not found"})";
                }
            } else {
                res.code = 500;
                res.body = R"({"error": "Invalid response from processor"})";
            }

        } catch (const std::exception& e) {
            res.code = 400;
            res.body = json{{"error", e.what()}}.dump();
        }

        // Ensure temp file is cleaned up no matter what
        if (!file_path.empty()) {
            std::remove(file_path.c_str());
        }

        return res;
    });
}

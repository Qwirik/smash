#include <filesystem>
#include "config_manager.hpp"
#include <spdlog/spdlog.h>
#include <fstream>
#include <filesystem>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

std::map<std::string, std::string> ConfigManager::env_cache;
std::map<std::string, std::string> ConfigManager::config_cache;

std::string ConfigManager::getConfig(const std::string& key, const std::string& default_val) {
    if (config_cache.count(key)) return config_cache[key];
    return default_val;
}

std::string ConfigManager::getEnv(const std::string& key, const std::string& default_val) {
    if (env_cache.count(key)) return env_cache[key];
    return default_val;
}

void ConfigManager::init() {
    // Read secrets from .env
    if (!std::filesystem::exists(".env")) {
        spdlog::warn(".env file not found! Generating default .env...");
        std::ofstream new_env(".env");
        new_env << "DATABASE_URL=postgresql://qwirik:smash_password@localhost/smashcore\n";
        new_env << "MASTER_API_KEY=admin123\n";
        new_env.close();
    }

    std::ifstream env_file(".env");
    if (env_file.is_open()) {
        std::string line;
        while (std::getline(env_file, line)) {
            size_t pos = line.find('=');
            if (pos != std::string::npos) {
                env_cache[line.substr(0, pos)] = line.substr(pos + 1);
            }
        }
        env_file.close();
    }

    // Read settings from config.json via nlohmann/json
    if (!std::filesystem::exists("config.json")) {
        spdlog::warn("config.json not found! Generating default config.json...");
        std::ofstream new_conf("config.json");
        json default_conf = {{"server_port", 8080}};
        new_conf << default_conf.dump(4);
        new_conf.close();
    }

    std::ifstream conf_file("config.json");
    if (conf_file.is_open()) {
        json parsed_data;
        try {
            conf_file >> parsed_data;
            if (parsed_data.contains("server_port")) {
                int port = parsed_data["server_port"];
                config_cache["server_port"] = std::to_string(port);
            }
        } catch (...) {}
        conf_file.close();
    }
}

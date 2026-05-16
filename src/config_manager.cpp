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
    } else {
        spdlog::warn(".env file not found!");
    }

    // Read settings from config.json via nlohmann/json
    std::ifstream conf_file("config.json");
    if (conf_file.is_open()) {
        json parsed_data;
        conf_file >> parsed_data;
        
        int port = parsed_data["server_port"];
        config_cache["server_port"] = std::to_string(port);
        
        conf_file.close();
    } else {
        spdlog::warn("config.json not found!");
    }
}

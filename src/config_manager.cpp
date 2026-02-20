#include "config_manager.hpp"
#include <spdlog/spdlog.h>
#include <iostream>

std::map<std::string, std::string> ConfigManager::env_cache;

void ConfigManager::init() {
    // 1. Проверка .env
    if (!std::filesystem::exists(".env")) {
        spdlog::warn(".env file missing! Starting auto-setup...");
        createDefaultEnv();
    }

    // 2. Проверка config.json
    if (!std::filesystem::exists("config.json")) {
        spdlog::warn("config.json missing! Creating default configuration...");
        createDefaultConfig();
    }

    // Логика загрузки (упрощенно читаем .env в память)
    std::ifstream env_file(".env");
    std::string line;
    while (std::getline(env_file, line)) {
        size_t pos = line.find('=');
        if (pos != std::string::npos) {
            env_cache[line.substr(0, pos)] = line.substr(pos + 1);
        }
    }
}


void ConfigManager::createDefaultEnv() {
    std::ofstream env(".env");
    // Оставляем пустые значения или пометки "ЗАМЕНИ МЕНЯ"
    env << "DATABASE_URL=host=INSERT_HOST port=5432 dbname=smashcore user=INSERT_USER password=INSERT_PASSWORD\n";
    env.close();
    spdlog::warn("Default .env created. PLEASE EDIT IT with your real credentials!");
}

void ConfigManager::createDefaultConfig() {
    std::ofstream conf("config.json");
    // Используем простой JSON формат
    conf << "{\n  \"server_port\": 8080,\n  \"log_level\": \"debug\",\n  \"app_name\": \"SmashCore-V1\"\n}\n";
    conf.close();
    spdlog::info("SUCCESS: Default config.json created.");
}

std::string ConfigManager::getEnv(const std::string& key, const std::string& default_val) {
    return env_cache.count(key) ? env_cache[key] : default_val;
}

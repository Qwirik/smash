#pragma once
#include <string>
#include <fstream>
#include <filesystem>
#include <map>

class ConfigManager {
public:
    // Главная функция: проверяет файлы и загружает данные
    static void init();

    // Получение настроек
    static std::string getEnv(const std::string& key, const std::string& default_val = "");
    static std::string getConfig(const std::string& key, const std::string& default_val = "");

private:
    static void createDefaultEnv();
    static void createDefaultConfig();
    static std::map<std::string, std::string> env_cache;
    static std::map<std::string, std::string> config_cache;
};

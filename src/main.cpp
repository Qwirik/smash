#include <crow.h>
#include <spdlog/spdlog.h>
#include "config_manager.hpp"
#include "database.hpp"
#include "api_router.hpp"
#include "logger.hpp"
#include "cli.hpp"

int main() {
    auto sink = std::make_shared<AsyncReadlineSink<std::mutex>>();
    spdlog::set_default_logger(std::make_shared<spdlog::logger>("smash", sink));
    spdlog::set_pattern("[%Y-%m-%d %H:%M:%S] [%l] %v");

    setenv("DATABASE_URL", "postgresql://qwirik:smash_password@localhost/smashcore", 1);
    setenv("MASTER_API_KEY", "admin123", 1);
    ConfigManager::init();

    Database db;
    db.connect();
    db.seed_test_data();
    g_db = &db;

    SpdlogHandler crow_logger;
    crow::logger::setHandler(&crow_logger);
    crow::logger::setLogLevel(crow::LogLevel::Info);

    crow::SimpleApp app;
    app.loglevel(crow::LogLevel::Warning); 
    setup_api_routes(app, db);

    std::thread engine_thread([&db]() {
        while (server_running) {
            db.check_heartbeats();
            db.process_rules();
            db.process_time_rules();
            std::this_thread::sleep_for(std::chrono::seconds(2));
        }
    });

    std::thread cli_thread([&app]() {
        run_cli(app);
    });

    app.port(8080).multithreaded().run();
    server_running = false;
    if (engine_thread.joinable()) engine_thread.join();
    if (cli_thread.joinable()) cli_thread.join();
    
    spdlog::shutdown();
    std::quick_exit(0); 
}

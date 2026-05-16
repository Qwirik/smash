#ifndef CLI_HPP
#define CLI_HPP

#include "database.hpp"
#include <atomic>
#include <crow.h>

extern std::atomic<bool> server_running;
extern Database* g_db;

void setup_cli();
void run_cli(crow::SimpleApp& app);

#endif

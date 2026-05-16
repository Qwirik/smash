#ifndef API_ROUTER_HPP
#define API_ROUTER_HPP

#include <crow.h>
#include "database.hpp"

void setup_api_routes(crow::SimpleApp& app, Database& db);

#endif

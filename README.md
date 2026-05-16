# SmashCore 0.1 🚀

**SmashCore** is a high-performance C++ backend for smart home systems. Built with modern C++20, PostgreSQL, and Crow microframework, it provides a robust platform for collecting telemetry from IoT devices (like ESP32), queueing commands, and running both trigger-based and time-based automation rules.

## ✨ Features

- **Fast & Lightweight:** Built in C++ using `crow` for API handling.
- **Hardware & Web APIs:** Dedicated routes for IoT devices (telemetry, long-polling, acks) and a Web Dashboard.
- **Automation Rules:** Create conditional rules (e.g., `IF Temperature > 25 THEN turn_on_fan`).
- **Time-based Scenarios:** Schedule actions to trigger at specific times (e.g., `08:00 -> open_blinds`).
- **Interactive CLI:** Built-in interactive shell with auto-completion, live monitoring (`watch` mode), and DB management.
- **Easy Registration:** Simple endpoints to register new devices dynamically.

## 🛠 Prerequisites

Ensure you have the following installed on your system (Ubuntu/Debian example):

```bash
sudo apt-get update
sudo apt-get install cmake g++ libpqxx-dev libspdlog-dev nlohmann-json3-dev postgresql-server-dev-all libasio-dev libreadline-dev
```

## 🚀 Building the Project

1. Clone the repository and its submodules (if any):
   ```bash
   git clone <repo-url>
   cd smash
   ```
2. Create a build directory and compile:
   ```bash
   mkdir build && cd build
   cmake ..
   make
   ```
3. Ensure PostgreSQL is running and you have created a database (default URL: `postgresql://qwirik:smash_password@localhost/smashcore`). Update the `.env` file or export environment variables if needed.

## 🎮 Running the Server

Run the built executable from the `build` directory:
```bash
./SmashCore
```

Once running, you will be presented with the interactive CLI prompt:
```
[2024-05-16 14:00:00] [info] Connected to PostgreSQL successfully
SmashCore Ready. Type 'help'.
> help
Commands:
  devices   - List all connected devices
  stats     - Quick DB statistics
  watch     - Real-time live monitor
  send      - send <device_id> <command>
  rmdev     - rmdev <device_id>
  rules     - View all automation rules
  addrule   - addrule <name> <trig_dev> <cond> <val> <act_dev> <act_cmd>
  addtimer  - addtimer <name> <HH:MM> <act_dev> <act_cmd>
  register  - register <device_id> <type>
  clear     - Clear terminal screen
  exit/quit - Shutdown server
>
```

## 📚 API Documentation

Detailed API documentation is available in two formats:
- **Markdown:** `API_DOCS.md` - A clear, readable document.
- **OpenAPI:** `openapi.yaml` - For importing into Postman, Swagger UI, or other API tools.

## 👨‍💻 Architecture

The project is structured as follows:
- `src/main.cpp` - Entry point and server orchestration.
- `src/cli.cpp` - Interactive command-line interface logic.
- `src/api_router.cpp` - Definition of all HTTP endpoints (using Crow).
- `src/database.cpp` - PostgreSQL database interaction using `pqxx`.
- `src/config_manager.cpp` - Configuration loading (`.env` and `config.json`).
- `src/logger.hpp` - Custom `spdlog` integration for terminal logging.

---
*Happy hacking with your Smart Home!* 🏠💡

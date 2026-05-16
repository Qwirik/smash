#include "cli.hpp"
#include "logger.hpp"
#include <iostream>
#include <sstream>
#include <vector>
#include <cstring>
#include <iomanip>
#include <thread>
#include <sys/select.h>
#include <unistd.h>
#include <readline/readline.h>
#include <readline/history.h>
#include <spdlog/spdlog.h>
#include <chrono>

std::queue<std::string> log_queue;
std::mutex log_mutex;
std::atomic<bool> server_running{true};
Database* g_db = nullptr;

const char* cmd_vocab[] = {"help", "clear", "devices", "stats", "send", "rmdev", "rules", "addrule", "addtimer", "register", "watch", "exit", "quit", nullptr};
const char* common_actions[] = {"relay_on", "relay_off", "reboot", "update", nullptr};

char* command_generator(const char* text, int state) {
    static int list_index, len;
    const char* name;
    if (!state) { list_index = 0; len = strlen(text); }
    while ((name = cmd_vocab[list_index++])) {
        if (strncmp(name, text, len) == 0) return strdup(name);
    }
    return nullptr;
}

char** smash_completion(const char* text, int start, int end) {
    rl_attempted_completion_over = 1;
    std::string line(rl_line_buffer);
    if (start == 0) return rl_completion_matches(text, command_generator);

    if (line.find("send ") == 0 || line.find("rmdev ") == 0) {
        std::istringstream iss(line);
        std::vector<std::string> words; std::string w;
        while(iss >> w) words.push_back(w);

        if (words.size() == 1 || (words.size() == 2 && line.back() != ' ')) {
            return rl_completion_matches(text, [](const char* text, int state) -> char* {
                static size_t idx; static std::vector<std::string> names;
                if(!state) {
                    idx = 0; names.clear();
                    if (g_db) {
                        auto devs = g_db->get_all_devices();
                        for(auto& d : devs) names.push_back(d["device"].get<std::string>());
                    }
                }
                while(idx < names.size()) {
                    if(!strncmp(names[idx].c_str(), text, strlen(text))) return strdup(names[idx++].c_str());
                    idx++;
                }
                return (char*)nullptr;
            });
        }
        if (line.find("send ") == 0 && (words.size() == 2 || (words.size() == 3 && line.back() != ' '))) {
            return rl_completion_matches(text, [](const char* text, int state) -> char* {
                static int i; if(!state) i = 0;
                while(const char* n = common_actions[i++]) if(!strncmp(n, text, strlen(text))) return strdup(n);
                return (char*)nullptr;
            });
        }
    }
    return nullptr;
}

void handle_cli(char* line) {
    if (!line) { server_running = false; std::exit(0); return; }
    std::string cmd_str(line);
    if (!cmd_str.empty()) add_history(line);

    std::istringstream iss(cmd_str);
    std::vector<std::string> args; std::string t;
    while(iss >> t) args.push_back(t);

    if (args.empty()) { free(line); return; }
    std::string act = args[0];

    if (act == "exit" || act == "quit") {
        server_running = false;
    }
    else if (act == "clear") {
        std::cout << "\x1b[2J\x1b[H";
    }
    else if (act == "help") {
        std::cout << "Commands:\n"
                  << "  devices   - List all connected devices\n"
                  << "  stats     - Quick DB statistics\n"
                  << "  watch     - Real-time live monitor\n"
                  << "  send      - send <device_id> <command>\n"
                  << "  rmdev     - rmdev <device_id>\n"
                  << "  rules     - View all automation rules\n"
                  << "  addrule   - addrule <name> <trig_dev> <cond> <val> <act_dev> <act_cmd>\n"
                  << "  addtimer  - addtimer <name> <HH:MM> <act_dev> <act_cmd>\n"
                  << "  register  - register <device_id> <type>\n"
                  << "  clear     - Clear terminal screen\n"
                  << "  exit/quit - Shutdown server\n";
    }
    else if (act == "devices" && g_db) {
        auto devs = g_db->get_all_devices();
        std::cout << "\n" << std::left << std::setw(20) << "DEVICE ID" << std::setw(15) << "LINK" << std::setw(15) << "STATE" << "LAST SEEN\n" << std::string(70, '-') << "\n";
        for (auto& d : devs) {
            std::string s = d["status"].get<std::string>();
            std::string link = (s.find("offline") != std::string::npos) ? "\x1b[31mOFFLINE\x1b[0m" : "\x1b[32mONLINE\x1b[0m";
            std::string state = (s.find("relay:on") != std::string::npos) ? "\x1b[33m[ ON ]\x1b[0m" : "[ OFF ]";
            std::cout << std::left << std::setw(20) << d["device"].get<std::string>() << std::setw(24) << link << std::setw(24) << state << d["last_seen"].get<std::string>() << "\n";
        }
    }
    else if (act == "stats" && g_db) {
        auto devs = g_db->get_all_devices();
        int online = 0;
        for (auto& d : devs) if (d["status"].get<std::string>().find("online") != std::string::npos) online++;
        std::cout << "\n--- STATS ---\nDevices: " << devs.size() << "\nOnline:  " << online << "\n-------------\n";
    }
    else if (act == "watch") {
        std::cout << "Watch mode active. Press Enter to stop.\n";
        while(server_running) {
            fd_set fds; FD_ZERO(&fds); FD_SET(STDIN_FILENO, &fds);
            struct timeval tv = {0, 0};
            if (select(STDIN_FILENO + 1, &fds, NULL, NULL, &tv) > 0) break;
            std::cout << "\x1b[2J\x1b[H--- LIVE MONITOR ---\n";
            auto devs = g_db->get_all_devices();
            for (auto& d : devs) {
                std::string s = d["status"].get<std::string>();
                std::string link = (s.find("offline") != std::string::npos) ? "\x1b[31mOFF\x1b[0m" : "\x1b[32mON\x1b[0m";
                std::cout << "[" << link << "] " << d["device"].get<std::string>() << "\n";
            }
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }
    }
    else if (act == "send" && g_db) {
        if (args.size() < 3) std::cout << "Error: Syntax is 'send <device> <command>'\n";
        else {
            g_db->add_command(args[1], args[2], "cli");
            spdlog::info("CLI: Command '{}' queued for device '{}'", args[2], args[1]);
        }
    }
    else if (act == "rmdev" && g_db) {
        if (args.size() < 2) std::cout << "Usage: rmdev <id>\n";
        else g_db->delete_device(args[1]);
    }
    else if (act == "rules" && g_db) {
        g_db->list_rules();
    }
    else if (act == "addtimer" && g_db) {
        if (args.size() < 5) std::cout << "Error: addtimer <name> <HH:MM> <act_dev> <act_cmd>\n";
        else {
            g_db->add_time_rule(args[1], args[2], args[3], args[4]);
            spdlog::info("Timer rule '{}' added successfully.", args[1]);
        }
    }
    else if (act == "register" && g_db) {
        if (args.size() < 3) std::cout << "Error: register <device_id> <type>\n";
        else {
            g_db->register_device(args[1], args[2]);
            spdlog::info("Device '{}' manually registered.", args[1]);
        }
    }
    else if (act == "addrule" && g_db) {
        if (args.size() < 7) std::cout << "Error: addrule <name> <trig_dev> <cond> <val> <act_dev> <act_cmd>\n";
        else {
            g_db->add_rule(args[1], args[2], args[3], std::stod(args[4]), args[5], args[6]);
            spdlog::info("Rule '{}' added successfully.", args[1]);
        }
    }
    else {
        std::cout << "Unknown command: " << act << "\n";
    }

    free(line);
}

void setup_cli() {
    rl_attempted_completion_function = smash_completion;
    rl_callback_handler_install("> ", handle_cli);
}

void run_cli(crow::SimpleApp& app) {
    std::this_thread::sleep_for(std::chrono::milliseconds(300));
    std::cout << "\x1b[32mSmashCore Ready.\x1b[0m Type 'help'.\n";
    setup_cli();
    while (server_running) {
        fd_set fds; FD_ZERO(&fds); FD_SET(STDIN_FILENO, &fds);
        struct timeval tv = {0, 50000};
        if (select(STDIN_FILENO + 1, &fds, NULL, NULL, &tv) > 0) rl_callback_read_char();
        std::lock_guard<std::mutex> lock(log_mutex);
        while (!log_queue.empty()) {
            rl_save_prompt(); rl_replace_line("", 0); rl_redisplay();
            std::cout << log_queue.front(); log_queue.pop();
            rl_restore_prompt(); rl_on_new_line(); rl_redisplay();
        }
    }
    rl_callback_handler_remove();
    app.stop();
}

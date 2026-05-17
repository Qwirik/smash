#ifndef LOGGER_HPP
#define LOGGER_HPP

#include <crow.h>
#include <spdlog/spdlog.h>
#include <spdlog/sinks/base_sink.h>
#include <mutex>
#include <queue>
#include <string>

extern std::queue<std::string> log_queue;
extern std::mutex log_mutex;

template<typename Mutex>
class AsyncReadlineSink : public spdlog::sinks::base_sink<Mutex> {
protected:
    void sink_it_(const spdlog::details::log_msg& msg) override {
        spdlog::memory_buf_t formatted;
        spdlog::sinks::base_sink<Mutex>::formatter_->format(msg, formatted);
        std::string log_str(formatted.data(), formatted.size());

        std::string color = "";
        if (msg.level == spdlog::level::info) color = "[32m";
        else if (msg.level >= spdlog::level::warn) color = "[31m";

        size_t pos = log_str.find("[info]");
        if (pos == std::string::npos) pos = log_str.find("[error]");

        if (pos != std::string::npos) {
            log_str.insert(pos + 1, color);
            log_str.insert(log_str.find("]", pos) + 1, "[0m");
        }

        // Ensure no double newlines and carriage returns
        if (!log_str.empty() && log_str.back() == '\n') log_str.pop_back();

        std::lock_guard<std::mutex> lock(log_mutex);
        log_queue.push(log_str + "\n");
    }
    void flush_() override {}
};

class SpdlogHandler : public crow::ILogHandler {
public:
    void log(const std::string& message, crow::LogLevel level) override {
        switch (level) {
            case crow::LogLevel::Debug:    spdlog::debug(message); break;
            case crow::LogLevel::Info:     spdlog::info(message);  break;
            case crow::LogLevel::Warning:  spdlog::warn(message);  break;
            case crow::LogLevel::Error:    spdlog::error(message); break;
            case crow::LogLevel::Critical: spdlog::critical(message); break;
            default: spdlog::info(message); break;
        }
    }
};

#endif

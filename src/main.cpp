#include <spdlog/spdlog.h>

int main(){

	spdlog::info("SmashCore v0.1.0 is starting...");

	spdlog::warn("Checking hardware sensors... (mock)");
    	spdlog::error("No sensors found, but we are cool!");	
	return 0;
}

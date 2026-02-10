cmake_minimum_required(VERSION 3.10)
project(SmashCore VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)

add_subdirectory(third_party/spdlog)

find_package(Threads REQUIRED)

add_executable(${PROJECT_NAME} src/main.cpp)

target_include_directories(${PROJECT_NAME} PRIVATE 
    third_party/crow/include
)

target_link_libraries(${PROJECT_NAME} PRIVATE 
    spdlog::spdlog
    Threads::Threads
)

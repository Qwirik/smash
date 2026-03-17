cmake_minimum_required(VERSION 3.10)
project(SmashCore VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Блок сторонних зависимостей
add_subdirectory(third_party/spdlog)
add_subdirectory(third_party/json) # <--- Добавляем подмодуль JSON

find_package(Threads REQUIRED)
find_package(PkgConfig REQUIRED)

pkg_check_modules(PQXX REQUIRED libpqxx)

set(SOURCES
    src/main.cpp
    src/database.cpp
    src/config_manager.cpp
)

add_executable(${PROJECT_NAME} ${SOURCES})

target_include_directories(${PROJECT_NAME} PRIVATE 
    src
    third_party/crow/include
    ${PQXX_INCLUDE_DIRS}


)

target_link_libraries(${PROJECT_NAME} PRIVATE 
    spdlog::spdlog
    nlohmann_json::nlohmann_json 
    Threads::Threads
    ${PQXX_LIBRARIES}
)

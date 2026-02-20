cmake_minimum_required(VERSION 3.10)
project(SmashCore VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_subdirectory(third_party/spdlog)

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
    Threads::Threads
    ${PQXX_LIBRARIES}
)

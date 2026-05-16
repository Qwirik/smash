cmake_minimum_required(VERSION 3.10)
project(SmashCore VERSION 0.1.0 LANGUAGES CXX)

# Настройки стандарта C++
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 1. Поиск системных зависимостей
find_package(Threads REQUIRED)
find_package(PkgConfig REQUIRED)
pkg_check_modules(PQXX REQUIRED libpqxx)

# 2. Добавление встроенных подмодулей (third_party)
cmake_minimum_required(VERSION 3.10)
project(SmashCore VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 1. Системные пакеты
find_package(Threads REQUIRED)
find_package(PkgConfig REQUIRED)
pkg_check_modules(PQXX REQUIRED libpqxx)

# 2. Подмодули third_party
add_subdirectory(third_party/spdlog)
add_subdirectory(third_party/json)

# 3. Список исходных файлов (ДОБАВЛЕН api_router.cpp)
set(SOURCES
    src/main.cpp
    src/database.cpp
    src/config_manager.cpp
    src/api_router.cpp
)

# 4. Цель сборки
add_executable(${PROJECT_NAME} ${SOURCES})

# 5. Инклюды
target_include_directories(${PROJECT_NAME} PRIVATE 
    src
    third_party/crow/include
    ${PQXX_INCLUDE_DIRS}
)

# 6. Линковка (Критически важен порядок)
target_link_libraries(${PROJECT_NAME} PRIVATE
    readline
    spdlog::spdlog
    nlohmann_json::nlohmann_json 
    Threads::Threads
    pqxx
    pq
)

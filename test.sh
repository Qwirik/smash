#!/bin/bash

BASE_URL="http://localhost:8080"
API_KEY="admin123"

echo "=== SmashCore API Test Script ==="

echo -e "\n1. Registering a new device..."
curl -s -X POST "$BASE_URL/api/register" \
     -H "Content-Type: application/json" \
     -d '{"device": "Test_Sensor", "type": "temperature"}'

echo -e "\n\n2. Sending telemetry data..."
curl -s -X POST "$BASE_URL/api/data" \
     -H "Content-Type: application/json" \
     -d '{"device": "Test_Sensor", "sensors": {"temp": 26.5, "hum": 50.0}}'

echo -e "\n\n3. Sending a web command to the device..."
curl -s -X POST "$BASE_URL/api/web/command" \
     -H "Content-Type: application/json" \
     -H "X-API-Key: $API_KEY" \
     -d '{"device": "Test_Sensor", "command": "turn_on_led"}'

echo -e "\n\n4. Polling for commands (Device side)..."
curl -s -X GET "$BASE_URL/api/command/Test_Sensor"

echo -e "\n\n5. Acknowledging command..."
curl -s -X POST "$BASE_URL/api/ack" \
     -H "Content-Type: application/json" \
     -d '{"device": "Test_Sensor", "state": "led:on"}'

echo -e "\n\n6. Fetching all devices..."
curl -s -X GET "$BASE_URL/api/web/devices" | jq . 2>/dev/null || curl -s -X GET "$BASE_URL/api/web/devices"

echo -e "\n\n7. Fetching device history..."
curl -s -X GET "$BASE_URL/api/web/history/Test_Sensor" | jq . 2>/dev/null || curl -s -X GET "$BASE_URL/api/web/history/Test_Sensor"

echo -e "\n\n=== Tests Completed ==="

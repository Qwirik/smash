# SmashCore API Documentation

This document describes the API endpoints provided by the SmashCore backend. It contains both Hardware APIs (used by IoT devices like ESP32) and Web APIs (used by web dashboards).

## Authentication

Some Web APIs require authentication via the `X-API-Key` header.
- **Header**: `X-API-Key`
- **Default Value**: `admin123` (can be configured via `MASTER_API_KEY` env var)

---

## 1. Hardware API

These endpoints are designed to be used by ESP32 or other microcontrollers to report data and fetch commands.

### `POST /api/data`
Receive telemetry data from sensors. Marks the device as online.

**Request JSON:**
```json
{
  "device": "ESP_LivingRoom",
  "sensors": {
    "temp": 24.5,
    "hum": 45.0
  }
}
```

### `GET /api/command/{device_id}`
Long-polling endpoint for devices to check if there are pending commands.

**Response JSON:**
```json
{
  "command": "relay_on"
}
```
*(If no command is pending, returns an empty string `""`)*

### `POST /api/ack`
Acknowledge command execution and update current state.

**Request JSON:**
```json
{
  "device": "ESP_LivingRoom",
  "state": "relay:on"
}
```

### `POST /api/register`
Conveniently register a new device manually or from the device itself upon boot.

**Request JSON:**
```json
{
  "device": "New_ESP_Node",
  "type": "temp_humidity_sensor"
}
```

---

## 2. Web API

These endpoints are designed for the Dashboard/Frontend. They include CORS headers.

### `GET /api/web/devices`
Get a list of all devices, their statuses, and last seen timestamps.

**Response JSON:**
```json
[
  {
    "device": "ESP_LivingRoom",
    "status": "online | relay:on",
    "last_seen": "2023-10-27 10:00:00"
  }
]
```

### `GET /api/web/history/{device_id}`
Retrieve historical temperature and humidity data for charting.

**Response JSON:**
```json
[
  {
    "t": 24.5,
    "h": 45.0,
    "time": "2023-10-27 10:00:00"
  }
]
```

### `POST /api/web/command`
Send a command to a device from the web dashboard.
**Requires Authentication (`X-API-Key`).**

**Request JSON:**
```json
{
  "device": "ESP_LivingRoom",
  "command": "relay_off"
}
```

**Response:** `200 OK` ("Queued") or `401 Unauthorized`.

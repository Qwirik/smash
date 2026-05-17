import axios from "axios";

const api = axios.create({
  // Используем относительный путь для проксирования через Vite
  // или если в продакшене, то VITE_API_URL
  baseURL: import.meta.env.DEV ? "/api" : (import.meta.env.VITE_API_URL || "http://127.0.0.1:8080/api"),
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // Мы будем использовать token как X-API-Key
  if (token) {
    config.headers["X-API-Key"] = token;
  }
  return config;
});

export default api;

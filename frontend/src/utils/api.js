import axios from "axios";

const api = axios.create({
  // Строго используем относительный путь, чтобы CORS не срабатывал.
  // Vite Dev Server будет проксировать это на 8080.
  // В Production (nginx) запросы на /api также нужно будет проксировать на 8080.
  baseURL: "/api",
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

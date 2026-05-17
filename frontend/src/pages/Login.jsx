import { useState } from "react";
import api from "../utils/api";

export default function Login() {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      // Чтобы проверить правильность X-API-Key, попробуем запросить список устройств.
      // Если вернется 401 Unauthorized, значит ключ неверен.
      await api.get("/web/devices", {
        headers: {
          "X-API-Key": apiKey
        }
      });

      // Сохраняем как token для interceptor-а (см. utils/api.js)
      localStorage.setItem("token", apiKey);
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      setError("Неверный API Ключ или сервер недоступен");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#f4f6fb",
      fontFamily: "Arial"
    }}>
      <div style={{
        width: "380px",
        background: "#fff",
        padding: "35px",
        borderRadius: "24px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
      }}>
        <h2 style={{ textAlign: "center", marginBottom: "25px" }}>
          Авторизация
        </h2>

        {error && (
          <div style={{ color: "red", marginBottom: "15px", textAlign: "center" }}>
            {error}
          </div>
        )}

        <input
          placeholder="API Ключ (Напр. admin123)"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={inputStyle}
        />

        <button onClick={handleSubmit} style={buttonStyle}>
          Войти
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px",
  marginBottom: "16px",
  borderRadius: "12px",
  border: "1px solid #ddd",
  fontSize: "15px",
  boxSizing: "border-box"
};

const buttonStyle = {
  width: "100%",
  padding: "14px",
  border: "none",
  borderRadius: "12px",
  cursor: "pointer",
  fontSize: "15px",
  background: "#000",
  color: "#fff"
};

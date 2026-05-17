import { useState } from "react";
import axios from "axios";

export default function Login() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:3000/api/auth/login", {
        login,
        password
      });

      localStorage.setItem("token", res.data.token);
      window.location.href = "/";
    } catch (err) {
      setError(err.response?.data?.message || "Ошибка авторизации");
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
          placeholder="Логин"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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

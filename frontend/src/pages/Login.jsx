import { useState } from "react";
import axios from "axios";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async () => {
    const res = await axios.post("http://127.0.0.1:3000/api/auth/login", {
      email
    });

    localStorage.setItem("token", res.data.token);
    window.location.href = "/";
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
          {isRegister ? "Регистрация" : "Авторизация"}
        </h2>

        {isRegister && (
          <input
            placeholder="Имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        )}

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <button onClick={handleSubmit} style={buttonStyle}>
          {isRegister ? "Создать аккаунт" : "Войти"}
        </button>

        <p style={{
          textAlign: "center",
          marginTop: "18px",
          color: "#666"
        }}>
          {isRegister ? "Уже есть аккаунт?" : "Нет аккаунта?"}{" "}
          <span
            onClick={() => setIsRegister(!isRegister)}
            style={{
              color: "#000",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            {isRegister ? "Войти" : "Регистрация"}
          </span>
        </p>
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
  fontSize: "15px"
};
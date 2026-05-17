import { useState } from "react";
import axios from "axios";
import { styles } from "../utils/styles";

export default function ProfileModal({ title, theme, onClose }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleUpdate = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:3000/api/auth/update-credentials", {
        newLogin: login,
        newPassword: password,
      });
      setMessage(res.data.message);
      setError("");
      setLogin("");
      setPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Ошибка обновления данных");
      setMessage("");
    }
  };

  return (
    <div style={styles.overlay}>
      <div
        style={{
          ...styles.modal,
          background: theme.card,
          color: theme.text,
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>{title}</h2>

        {title === "Безопасность" ? (
          <div style={styles.formGrid}>
            {message && <div style={{ color: "green" }}>{message}</div>}
            {error && <div style={{ color: "red" }}>{error}</div>}

            <input
              placeholder="Новый логин"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              style={styles.input}
            />
            <input
              placeholder="Новый пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
            <div style={styles.modalButtons}>
              <button style={styles.addBtn} onClick={handleUpdate}>
                Обновить
              </button>
              <button style={{...styles.cancelBtn, color: theme.text, background: "transparent"}} onClick={onClose}>
                Закрыть
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p>Здесь будут настройки для: {title}</p>
            <div style={styles.modalButtons}>
              <button style={{...styles.cancelBtn, color: theme.text, background: "transparent", border: "1px solid"}} onClick={onClose}>
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

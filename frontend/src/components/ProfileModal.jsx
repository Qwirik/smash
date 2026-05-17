import { useState } from "react";
import { styles } from "../utils/styles";

export default function ProfileModal({ title, theme, onClose }) {
  const [newKey, setNewKey] = useState("");
  const [message, setMessage] = useState("");

  const handleUpdate = () => {
    if (!newKey) return;

    // В SmashCore нет прямого эндпоинта для смены ключа через WEB API (судя по доке)
    // Поэтому мы просто обновляем ключ авторизации в localStorage
    localStorage.setItem("token", newKey);
    setMessage("API Ключ локально обновлен");
    setNewKey("");
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

            <p style={{ fontSize: "14px", marginBottom: "10px" }}>
              Смена X-API-Key для этого устройства
            </p>

            <input
              placeholder="Новый API Ключ"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
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

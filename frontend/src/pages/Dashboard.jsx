import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [tab, setTab] = useState("dashboard");
  const [profileOpen, setProfileOpen] = useState(false);

  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  const [devices, setDevices] = useState([]);
  const [inviteLink, setInviteLink] = useState("");

  const [groups, setGroups] = useState([
    {
      id: 1,
      name: "Освещение",
      devices: [1],
      status: true,
      lastActivity: "19:10"
    }
  ]);

  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Анна",
      role: "Семья",
      permissions: [1]
    },
    {
      id: 2,
      name: "Максим",
      role: "Гость",
      permissions: []
    }
  ]);

  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceRoom, setNewDeviceRoom] = useState("");

  const [newGroupName, setNewGroupName] = useState("");
  const [selectedDevicesForGroup, setSelectedDevicesForGroup] =
    useState([]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:3000/api/devices")
      .then((res) => setDevices(res.data))
      .catch(() => {
        setDevices([
          {
            id: 1,
            name: "Лампа",
            room: "Кухня",
            status: true,
            activity: "18:42"
          },
          {
            id: 2,
            name: "Кондиционер",
            room: "Спальня",
            status: false,
            activity: "17:15"
          },
          {
            id: 3,
            name: "Камера",
            room: "Гостиная",
            status: true,
            activity: "19:01"
          }
        ]);
      });
  }, []);

  const currentTheme = themes[theme];

  const toggleDevice = (id) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === id
          ? {
              ...device,
              status: !device.status,
              activity: "Только что"
            }
          : device
      )
    );

    if (selectedDevice?.id === id) {
      setSelectedDevice((prev) => ({
        ...prev,
        status: !prev.status,
        activity: "Только что"
      }));
    }
  };

  const toggleGroup = (groupId) => {
    const group = groups.find((g) => g.id === groupId);

    if (!group) return;

    const newStatus = !group.status;

    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              status: newStatus,
              lastActivity: "Только что"
            }
          : g
      )
    );

    setDevices((prev) =>
      prev.map((device) =>
        group.devices.includes(device.id)
          ? {
              ...device,
              status: newStatus
            }
          : device
      )
    );

    if (selectedGroup?.id === groupId) {
      setSelectedGroup((prev) => ({
        ...prev,
        status: newStatus,
        lastActivity: "Только что"
      }));
    }
  };

  const addDevice = () => {
    if (!newDeviceName || !newDeviceRoom) return;

    const newDevice = {
      id: Date.now(),
      name: newDeviceName,
      room: newDeviceRoom,
      status: false,
      activity: "Никогда"
    };

    setDevices([...devices, newDevice]);

    setNewDeviceName("");
    setNewDeviceRoom("");
  };

  const createGroup = () => {
    if (!newGroupName) return;

    const newGroup = {
      id: Date.now(),
      name: newGroupName,
      devices: selectedDevicesForGroup,
      status: false,
      lastActivity: "Никогда"
    };

    setGroups([...groups, newGroup]);

    setNewGroupName("");
    setSelectedDevicesForGroup([]);
  };

  const generateInvite = () => {
    const code = Math.random()
      .toString(36)
      .substring(2, 10);

    setInviteLink(
      `https://smarthome.app/invite/${code}`
    );
  };

  const toggleUserPermission = (deviceId) => {
    setSelectedUser((prev) => {
      const exists =
        prev.permissions.includes(deviceId);

      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter(
              (id) => id !== deviceId
            )
          : [...prev.permissions, deviceId]
      };
    });
  };

  const saveUserPermissions = () => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? selectedUser
          : u
      )
    );

    setSelectedUser(null);
  };

  return (
    <div
      style={{
        ...styles.page,
        background: currentTheme.bg,
        color: currentTheme.text
      }}
    >
      <header style={styles.header}>
        <h1 style={{ color: currentTheme.accent }}>
          Smart Home
        </h1>

        <div style={styles.rightHeader}>
          <nav style={styles.nav}>
            <NavBtn
              title="Главная"
              active={tab === "dashboard"}
              onClick={() => setTab("dashboard")}
              theme={currentTheme}
            />

            <NavBtn
              title="Устройства"
              active={tab === "devices"}
              onClick={() => setTab("devices")}
              theme={currentTheme}
            />

            <NavBtn
              title="Пользователи"
              active={tab === "users"}
              onClick={() => setTab("users")}
              theme={currentTheme}
            />

            <NavBtn
              title="Ссылки"
              active={tab === "links"}
              onClick={() => setTab("links")}
              theme={currentTheme}
            />
          </nav>

          <div style={{ position: "relative" }}>
            <div
              style={{
                ...styles.avatar,
                background: currentTheme.card
              }}
              onClick={() =>
                setProfileOpen(!profileOpen)
              }
            />

            {profileOpen && (
              <div
                style={{
                  ...styles.profileMenu,
                  background: currentTheme.card,
                  color: currentTheme.text
                }}
              >
                <div style={{ marginBottom: 20 }}>
                  <strong>
                    Главный администратор
                  </strong>

                  <div
                    style={{
                      opacity: 0.6,
                      marginTop: 5,
                      fontSize: 13
                    }}
                  >
                    admin@smarthome.com
                  </div>
                </div>

                <div style={styles.menuList}>
                  <button
                    style={{
                      ...styles.menuBtn,
                      background: currentTheme.bg,
                      color: currentTheme.text
                    }}
                    onClick={() =>
                      alert("Раздел личных данных")
                    }
                  >
                    Личные данные
                  </button>

                  <button
                    style={{
                      ...styles.menuBtn,
                      background: currentTheme.bg,
                      color: currentTheme.text
                    }}
                    onClick={() =>
                      alert(
                        "Настройки безопасности"
                      )
                    }
                  >
                    Безопасность
                  </button>

                  <button
                    style={{
                      ...styles.menuBtn,
                      background: currentTheme.bg,
                      color: currentTheme.text
                    }}
                    onClick={() =>
                      alert(
                        "Настройки уведомлений"
                      )
                    }
                  >
                    Уведомления
                  </button>

                  <button
                    style={{
                      ...styles.menuBtn,
                      background: currentTheme.bg,
                      color: currentTheme.text
                    }}
                    onClick={() =>
                      alert("История входов")
                    }
                  >
                    История входов
                  </button>
                </div>

                <div style={{ marginTop: 20 }}>
                  <div>Тема интерфейса:</div>

                  <div style={styles.themeBlock}>
                    <button
                      style={styles.themeBtn}
                      onClick={() =>
                        setTheme("light")
                      }
                    >
                      Light
                    </button>

                    <button
                      style={styles.themeBtn}
                      onClick={() =>
                        setTheme("dark")
                      }
                    >
                      Dark
                    </button>

                    <button
                      style={styles.themeBtn}
                      onClick={() =>
                        setTheme("neon")
                      }
                    >
                      Neon
                    </button>
                  </div>
                </div>

                <button
                  style={styles.logoutBtn}
                  onClick={() => {
                    localStorage.removeItem(
                      "token"
                    );

                    alert(
                      "Вы вышли из системы"
                    );

                    setProfileOpen(false);
                  }}
                >
                  Выйти
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {tab === "dashboard" && (
        <>
          <h2>Статистика</h2>

          <div style={styles.grid}>
            <Card
              title="Устройств"
              value={devices.length}
              theme={currentTheme}
            />

            <Card
              title="Групп"
              value={groups.length}
              theme={currentTheme}
            />

            <Card
              title="Пользователей"
              value={users.length}
              theme={currentTheme}
            />

            <Card
              title="Сервер"
              value="ONLINE"
              theme={currentTheme}
            />
          </div>
        </>
      )}

      {tab === "devices" && (
        <>
          <h2>Устройства</h2>

          <div
            style={{
              ...styles.card,
              background: currentTheme.card,
              marginBottom: 20
            }}
          >
            <h3>Добавить устройство</h3>

            <div style={styles.formGrid}>
              <input
                placeholder="Название"
                value={newDeviceName}
                onChange={(e) =>
                  setNewDeviceName(
                    e.target.value
                  )
                }
                style={styles.input}
              />

              <input
                placeholder="Комната"
                value={newDeviceRoom}
                onChange={(e) =>
                  setNewDeviceRoom(
                    e.target.value
                  )
                }
                style={styles.input}
              />

              <button
                style={styles.addBtn}
                onClick={addDevice}
              >
                Добавить устройство
              </button>
            </div>
          </div>

          {devices.map((device) => (
            <div
              key={device.id}
              style={{
                ...styles.deviceCard,
                background: currentTheme.card
              }}
            >
              <div
                style={{
                  flex: 1,
                  cursor: "pointer"
                }}
                onClick={() =>
                  setSelectedDevice(device)
                }
              >
                <strong>{device.name}</strong>

                <div>{device.room}</div>

                <small>
                  Последняя активность:
                  {" "}
                  {device.activity}
                </small>
              </div>

              <button
                onClick={() =>
                  toggleDevice(device.id)
                }
                style={{
                  ...styles.toggleBtn,
                  background: device.status
                    ? "#35c759"
                    : "#999"
                }}
              >
                {device.status
                  ? "ВКЛ"
                  : "ВЫКЛ"}
              </button>
            </div>
          ))}

          <h2 style={{ marginTop: 40 }}>
            Группы устройств
          </h2>

          <div
            style={{
              ...styles.card,
              background: currentTheme.card,
              marginBottom: 20
            }}
          >
            <h3>Создать группу</h3>

            <input
              placeholder="Название группы"
              value={newGroupName}
              onChange={(e) =>
                setNewGroupName(
                  e.target.value
                )
              }
              style={{
                ...styles.input,
                marginBottom: 20
              }}
            />

            {devices.map((device) => (
              <label
                key={device.id}
                style={styles.checkboxRow}
              >
                <input
                  type="checkbox"
                  checked={selectedDevicesForGroup.includes(
                    device.id
                  )}
                  onChange={() => {
                    setSelectedDevicesForGroup(
                      (prev) =>
                        prev.includes(
                          device.id
                        )
                          ? prev.filter(
                              (id) =>
                                id !== device.id
                            )
                          : [
                              ...prev,
                              device.id
                            ]
                    );
                  }}
                />

                {device.name}
              </label>
            ))}

            <button
              style={{
                ...styles.addBtn,
                marginTop: 20
              }}
              onClick={createGroup}
            >
              Создать группу
            </button>
          </div>

          {groups.map((group) => (
            <div
              key={group.id}
              style={{
                ...styles.deviceCard,
                background: currentTheme.card
              }}
            >
              <div
                style={{
                  flex: 1,
                  cursor: "pointer"
                }}
                onClick={() =>
                  setSelectedGroup(group)
                }
              >
                <strong>{group.name}</strong>

                <div>
                  Устройств:
                  {" "}
                  {group.devices.length}
                </div>

                <small>
                  Последнее включение:
                  {" "}
                  {group.lastActivity}
                </small>
              </div>

              <button
                onClick={() =>
                  toggleGroup(group.id)
                }
                style={{
                  ...styles.toggleBtn,
                  background: group.status
                    ? "#35c759"
                    : "#999"
                }}
              >
                {group.status
                  ? "ВКЛ"
                  : "ВЫКЛ"}
              </button>
            </div>
          ))}
        </>
      )}

      {tab === "users" && (
        <>
          <h2>Пользователи</h2>

          {users.map((user) => (
            <div
              key={user.id}
              style={{
                ...styles.deviceCard,
                background: currentTheme.card
              }}
            >
              <div>
                <strong>{user.name}</strong>

                <div>{user.role}</div>

                <small>
                  Доступно устройств:
                  {" "}
                  {user.permissions.length}
                </small>
              </div>

              <button
                style={styles.addBtn}
                onClick={() =>
                  setSelectedUser(user)
                }
              >
                Управление
              </button>
            </div>
          ))}
        </>
      )}

      {tab === "links" && (
        <>
          <h2>Ссылки приглашения</h2>

          <div
            style={{
              ...styles.card,
              background: currentTheme.card
            }}
          >
            <button
              style={styles.addBtn}
              onClick={generateInvite}
            >
              Создать ссылку
            </button>

            {inviteLink && (
              <div style={{ marginTop: 20 }}>
                <strong>Ссылка:</strong>

                <div style={{ marginTop: 10 }}>
                  {inviteLink}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {selectedUser && (
        <div style={styles.overlay}>
          <div
            style={{
              ...styles.modal,
              background: currentTheme.card,
              color: currentTheme.text
            }}
          >
            <h2>
              Права пользователя:
              {" "}
              {selectedUser.name}
            </h2>

            {devices.map((device) => (
              <label
                key={device.id}
                style={styles.checkboxRow}
              >
                <input
                  type="checkbox"
                  checked={selectedUser.permissions.includes(
                    device.id
                  )}
                  onChange={() =>
                    toggleUserPermission(
                      device.id
                    )
                  }
                />

                {device.name}
              </label>
            ))}

            <div style={styles.modalButtons}>
              <button
                style={styles.addBtn}
                onClick={
                  saveUserPermissions
                }
              >
                Сохранить
              </button>

              <button
                style={styles.cancelBtn}
                onClick={() =>
                  setSelectedUser(null)
                }
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {(selectedDevice ||
        selectedGroup) && (
        <div
          style={{
            ...styles.drawer,
            background: currentTheme.card,
            color: currentTheme.text,
            transform:
              "translateX(0)"
          }}
        >
          <div style={styles.drawerHeader}>
            <h2>
              {selectedDevice?.name ||
                selectedGroup?.name}
            </h2>

            <button
              style={styles.closeBtn}
              onClick={() => {
                setSelectedDevice(null);
                setSelectedGroup(null);
              }}
            >
              ✕
            </button>
          </div>

          <div style={styles.drawerContent}>
            {selectedDevice && (
              <>
                <p>
                  Комната:
                  {" "}
                  {selectedDevice.room}
                </p>

                <p>
                  Статус:
                  {" "}
                  {selectedDevice.status
                    ? "Включено"
                    : "Выключено"}
                </p>

                <p>
                  Последняя активность:
                  {" "}
                  {selectedDevice.activity}
                </p>
              </>
            )}

            {selectedGroup && (
              <>
                <p>
                  Устройств:
                  {" "}
                  {
                    selectedGroup.devices
                      .length
                  }
                </p>

                <p>
                  Последнее включение:
                  {" "}
                  {
                    selectedGroup.lastActivity
                  }
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NavBtn({
  title,
  active,
  onClick,
  theme
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        color: theme.text,
        borderBottom: active
          ? `2px solid ${theme.accent}`
          : "2px solid transparent",
        cursor: "pointer",
        paddingBottom: 5
      }}
    >
      {title}
    </button>
  );
}

function Card({
  title,
  value,
  theme
}) {
  return (
    <div
      style={{
        ...styles.card,
        background: theme.card
      }}
    >
      <div>{title}</div>

      <h2
        style={{
          color: theme.accent
        }}
      >
        {value}
      </h2>
    </div>
  );
}

const themes = {
  light: {
    bg: "#f5f7fb",
    card: "#ffffff",
    text: "#111",
    accent: "#0066ff"
  },

  dark: {
    bg: "#111827",
    card: "#1f2937",
    text: "#ffffff",
    accent: "#8b5cf6"
  },

  neon: {
    bg: "#060818",
    card: "#0f172a",
    text: "#00ffff",
    accent: "#ff00ff"
  }
};

const styles = {
  page: {
    minHeight: "100vh",
    padding: 30,
    transition: "0.3s"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 40
  },

  rightHeader: {
    display: "flex",
    gap: 30,
    alignItems: "center"
  },

  nav: {
    display: "flex",
    gap: 20
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    cursor: "pointer"
  },

  profileMenu: {
    position: "absolute",
    right: 0,
    top: 55,
    width: 260,
    padding: 20,
    borderRadius: 20,
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.25)",
    zIndex: 5000,
    display: "flex",
    flexDirection: "column",
    gap: 12
  },

  menuList: {
    display: "grid",
    gap: 10
  },

  menuBtn: {
    border: "none",
    padding: 14,
    borderRadius: 12,
    cursor: "pointer",
    textAlign: "left",
    transition: "0.2s",
    fontSize: 14,
    width: "100%"
  },

  themeBlock: {
    display: "flex",
    gap: 10,
    marginTop: 10
  },

  themeBtn: {
    flex: 1,
    border: "none",
    padding: 10,
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: "bold"
  },

  logoutBtn: {
    width: "100%",
    border: "none",
    padding: 14,
    borderRadius: 12,
    cursor: "pointer",
    background: "#ff4d4d",
    color: "#fff",
    fontWeight: "bold",
    marginTop: 20
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: 20
  },

  card: {
    padding: 20,
    borderRadius: 20
  },

  formGrid: {
    display: "grid",
    gap: 15
  },

  input: {
    border: "1px solid #ddd",
    padding: 12,
    borderRadius: 12
  },

  addBtn: {
    border: "none",
    padding: 12,
    borderRadius: 12,
    cursor: "pointer",
    background: "#0066ff",
    color: "#fff"
  },

  cancelBtn: {
    border: "none",
    padding: 12,
    borderRadius: 12,
    cursor: "pointer"
  },

  deviceCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  toggleBtn: {
    border: "none",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: "bold"
  },

  checkboxRow: {
    display: "flex",
    gap: 10,
    marginBottom: 10,
    alignItems: "center"
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5000
  },

  modal: {
    width: 400,
    borderRadius: 20,
    padding: 25
  },

  modalButtons: {
    display: "flex",
    gap: 10,
    marginTop: 20
  },

  drawer: {
    position: "fixed",
    top: 0,
    right: 0,
    width: 400,
    height: "100%",
    padding: 30,
    transition: "0.4s",
    zIndex: 4000,
    boxShadow:
      "-5px 0 30px rgba(0,0,0,0.2)"
  },

  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  closeBtn: {
    border: "none",
    background: "transparent",
    fontSize: 22,
    cursor: "pointer"
  },

  drawerContent: {
    marginTop: 30,
    display: "grid",
    gap: 20
  }
};
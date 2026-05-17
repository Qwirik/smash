import { useEffect, useState } from "react";
import api from "../utils/api";
import NavBtn from "../components/NavBtn";
import Card from "../components/Card";
import ProfileModal from "../components/ProfileModal";
import { themes } from "../utils/theme";
import { styles } from "../utils/styles";

export default function Dashboard() {
  const [tab, setTab] = useState("dashboard");
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

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

  const fetchDevices = () => {
    api
      .get("/web/devices")
      .then((res) => {
        const mappedDevices = res.data.map((d, index) => {
          const isRelayOn = d.status && d.status.includes("relay:on");
          return {
            id: d.device || index, // Use device string as ID
            name: d.device,
            room: "N/A", // SmashCore doesn't provide room info by default
            status: isRelayOn, // Treat relay:on as true, otherwise false
            activity: d.last_seen || "Неизвестно"
          };
        });
        setDevices(mappedDevices);
      })
      .catch((err) => {
        console.error("Ошибка при получении устройств с SmashCore:", err);
        // Fallback data if backend is not running yet
        setDevices([
          {
            id: "ESP_LivingRoom",
            name: "ESP_LivingRoom",
            room: "Гостиная",
            status: true,
            activity: "2023-10-27 10:00:00"
          }
        ]);
      });
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const currentTheme = themes[theme];

  const toggleDevice = async (id) => {
    const deviceToToggle = devices.find(d => d.id === id);
    if (!deviceToToggle) return;

    const newStatus = !deviceToToggle.status;
    const commandStr = newStatus ? "relay_on" : "relay_off";

    // Optimistic update
    setDevices((prev) =>
      prev.map((device) =>
        device.id === id
          ? {
              ...device,
              status: newStatus,
              activity: "Только что"
            }
          : device
      )
    );

    if (selectedDevice?.id === id) {
      setSelectedDevice((prev) => ({
        ...prev,
        status: newStatus,
        activity: "Только что"
      }));
    }

    try {
      await api.post("/web/command", {
        device: id, // device identifier
        command: commandStr
      });
    } catch (err) {
      console.error("Failed to send command", err);
      alert("Ошибка при отправке команды устройству.");
      // Revert optimistic update
      fetchDevices();
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
                    onClick={() => {
                      setProfileOpen(false);
                      setActiveModal("Личные данные");
                    }}
                  >
                    Личные данные
                  </button>

                  <button
                    style={{
                      ...styles.menuBtn,
                      background: currentTheme.bg,
                      color: currentTheme.text
                    }}
                    onClick={() => {
                      setProfileOpen(false);
                      setActiveModal("Безопасность");
                    }}
                  >
                    Безопасность
                  </button>

                  <button
                    style={{
                      ...styles.menuBtn,
                      background: currentTheme.bg,
                      color: currentTheme.text
                    }}
                    onClick={() => {
                      setProfileOpen(false);
                      setActiveModal("Уведомления");
                    }}
                  >
                    Уведомления
                  </button>

                  <button
                    style={{
                      ...styles.menuBtn,
                      background: currentTheme.bg,
                      color: currentTheme.text
                    }}
                    onClick={() => {
                      setProfileOpen(false);
                      setActiveModal("История входов");
                    }}
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

      {activeModal && (
        <ProfileModal
          title={activeModal}
          theme={currentTheme}
          onClose={() => setActiveModal(null)}
        />
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

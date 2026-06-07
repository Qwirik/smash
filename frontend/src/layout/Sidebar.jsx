import React from "react";
import {
  Home,
  Grid,
  MonitorSmartphone,
  Activity,
  Settings
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: "Home", icon: <Home size={20} />, path: "/" },
    { name: "Rooms", icon: <Grid size={20} />, path: "/rooms" },
    { name: "Devices", icon: <MonitorSmartphone size={20} />, path: "/devices" },
    { name: "Statistics", icon: <Activity size={20} />, path: "/statistics" },
  ];

  return (
    <div style={styles.sidebar}>
      <div style={styles.logoContainer}>
        <h1 style={styles.logoTitle}>SMASHOME</h1>
        <p style={styles.logoSubtitle}>Atmospheric Intelligence</p>
      </div>

      <nav style={styles.nav}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navBtn,
                background: isActive ? "#161b33" : "transparent",
                color: isActive ? "#ffffff" : "#6b7280",
                fontWeight: isActive ? "600" : "500",
              }}
            >
              <span style={{ marginRight: 15 }}>{item.icon}</span>
              {item.name}
            </button>
          );
        })}
      </nav>

      <div style={styles.bottomNav}>
        <button
          onClick={() => navigate("/settings")}
          style={{
            ...styles.navBtn,
            background: location.pathname === "/settings" ? "#161b33" : "transparent",
            color: location.pathname === "/settings" ? "#ffffff" : "#6b7280",
          }}
        >
          <span style={{ marginRight: 15 }}><Settings size={20} /></span>
          Settings
        </button>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: "260px",
    height: "100vh",
    backgroundColor: "#ffffff",
    borderRight: "1px solid #f3f4f6",
    display: "flex",
    flexDirection: "column",
    padding: "30px 20px",
    boxSizing: "border-box",
    position: "fixed",
    top: 0,
    left: 0,
  },
  logoContainer: {
    marginBottom: "50px",
    paddingLeft: "10px",
  },
  logoTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#161b33",
    margin: 0,
  },
  logoSubtitle: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "5px 0 0 0",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    flex: 1,
  },
  navBtn: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "12px 15px",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "15px",
    transition: "all 0.2s ease",
    textAlign: "left",
  },
  bottomNav: {
    marginTop: "auto",
  }
};
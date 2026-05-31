import React from "react";
import Sidebar from "./Sidebar";
import { Search, Sun, Bell } from "lucide-react";

export default function Layout({ children, title, subtitle }) {
  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        <header style={styles.header}>
          <div style={styles.headerTitles}>
            {title && <h2 style={styles.pageTitle}>{title}</h2>}
            {subtitle && <p style={styles.pageSubtitle}>{subtitle}</p>}
          </div>

          <div style={styles.headerActions}>
            <button style={styles.iconBtn}><Search size={20} /></button>
            <button style={styles.iconBtn}><Sun size={20} /></button>
            <button style={styles.iconBtn}><Bell size={20} /></button>
            <div style={styles.avatar}>
               <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Profile" style={styles.avatarImg} />
            </div>
          </div>
        </header>

        <div style={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f9fafc",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  main: {
    marginLeft: "260px", // Sidebar width
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    height: "80px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 40px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #f3f4f6",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  headerTitles: {
    display: "flex",
    flexDirection: "column",
  },
  pageTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "700",
    color: "#161b33",
  },
  pageSubtitle: {
    margin: "5px 0 0 0",
    fontSize: "14px",
    color: "#6b7280",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    color: "#6b7280",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "5px",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    overflow: "hidden",
    cursor: "pointer",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  content: {
    padding: "40px",
    flex: 1,
  }
};
export const styles = {
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
    borderRadius: 12,
    width: "100%",
    boxSizing: "border-box"
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

export default function NavBtn({ title, active, onClick, theme }) {
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

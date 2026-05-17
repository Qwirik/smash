import { styles } from "../utils/styles";

export default function Card({ title, value, theme }) {
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

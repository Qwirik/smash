const router = require("express").Router();
const jwt = require("jsonwebtoken");

const SECRET = "secret";

// In-memory credentials
let currentLogin = "admin";
let currentPassword = "password";

router.post("/login", (req, res) => {
  const { login, password } = req.body;

  if (login === currentLogin && password === currentPassword) {
    const user = {
      id: 1,
      login,
      role: "owner"
    };

    const token = jwt.sign(user, SECRET);
    return res.json({ token });
  }

  return res.status(401).json({ message: "Неверный логин или пароль" });
});

router.post("/update-credentials", (req, res) => {
  // Для простоты пока без проверки токена, но в реальном приложении это нужно делать
  const { newLogin, newPassword } = req.body;

  if (!newLogin || !newPassword) {
    return res.status(400).json({ message: "Логин и пароль не могут быть пустыми" });
  }

  currentLogin = newLogin;
  currentPassword = newPassword;

  res.json({ message: "Данные успешно обновлены" });
});

module.exports = router;

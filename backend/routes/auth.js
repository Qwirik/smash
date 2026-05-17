const router = require("express").Router();
const jwt = require("jsonwebtoken");

const SECRET = "secret";

router.post("/login", (req, res) => {
  const { email } = req.body;

  const user = {
    id: 1,
    email,
    role: "owner"
  };

  const token = jwt.sign(user, SECRET);

  res.json({ token });
});

module.exports = router;
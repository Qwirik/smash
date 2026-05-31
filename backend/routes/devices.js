const router = require("express").Router();

router.get("/", (req, res) => {
  res.json([
    { id: 1, name: "ESP32 Kitchen", status: "online" },
    { id: 2, name: "ESP32 Bedroom", status: "offline" }
  ]);
});

module.exports = router;
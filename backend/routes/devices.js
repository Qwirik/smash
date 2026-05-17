const router = require("express").Router();

router.get("/", (req, res) => {
  res.json([
    {
      device: "ESP_LivingRoom",
      status: "online | relay:on",
      last_seen: "2023-10-27 10:00:00"
    },
    {
      device: "ESP_Kitchen",
      status: "online | relay:off",
      last_seen: "2023-10-27 10:05:00"
    }
  ]);
});

module.exports = router;
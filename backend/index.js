const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/devices", require("./routes/devices"));

app.get("/", (req, res) => {
  res.send("Backend работает");
});

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});

const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("WebSocket connected");

  setInterval(() => {
    ws.send(
      JSON.stringify({
        message: `[${new Date().toLocaleTimeString()}] Device ping`
      })
    );
  }, 3000);
});
const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");

const app = express();

app.use(cors({
  origin: "*",
  allowedHeaders: ["Content-Type", "X-API-Key"]
}));
app.use(express.json());

// Simple middleware to check API Key
app.use((req, res, next) => {
  if (req.path.startsWith("/api/web")) {
    // Allow preflight requests
    if (req.method === "OPTIONS") {
      return next();
    }

    const apiKey = req.headers["x-api-key"];
    if (apiKey !== "admin123") {
      console.log(`Unauthorized access attempt with key: ${apiKey}`);
      return res.status(401).json({ message: "Unauthorized" });
    }
  }
  next();
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/web/devices", require("./routes/devices"));

// Mock command endpoint
app.post("/api/web/command", (req, res) => {
  console.log("Command received:", req.body);
  res.json({ message: "Queued" });
});

app.get("/", (req, res) => {
  res.send("Backend работает");
});

app.listen(8080, () => {
  console.log("Server started on http://localhost:8080");
});

const wss = new WebSocket.Server({ port: 8081 });

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
require("dotenv").config();

const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const registerSocketHandlers = require("./server/socketHandlers");
const historyStore = require("./server/historyStore");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.get("/api/status", (req, res) => {
  res.json({ status: "ok", uptimeSeconds: Math.round(process.uptime()) });
});

app.get("/api/history", (req, res) => {
  const limit = Number(req.query.limit) || 10;
  res.json({ history: historyStore.getRecent(limit) });
});

registerSocketHandlers(io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Tic Tac Toe server running on http://localhost:${PORT}`);
});

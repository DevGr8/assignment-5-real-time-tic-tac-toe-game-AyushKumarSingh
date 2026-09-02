const GameManager = require("./gameManager");
const historyStore = require("./historyStore");

const AUTO_RESET_DELAY_MS = Number(process.env.AUTO_RESET_DELAY_MS) || 5000;
const USERNAME_PATTERN = /^[a-zA-Z0-9 _-]{2,20}$/;

function registerSocketHandlers(io) {
  const game = new GameManager();
  let resetTimer = null;
  let matchStartedAt = null;

  const broadcastState = () => io.emit("state-update", game.publicState());
  const broadcastHistory = () =>
    io.emit("history-update", { history: historyStore.getRecent(10) });

  io.on("connection", (socket) => {
    // A newly connected client (e.g. mid-game observer) gets the current picture.
    socket.emit("state-update", game.publicState());
    socket.emit("history-update", { history: historyStore.getRecent(10) });

    socket.on("join-game", ({ username } = {}) => {
      const trimmed = (username || "").trim();

      if (!USERNAME_PATTERN.test(trimmed)) {
        return socket.emit("join-error", {
          message: "Name must be 2-20 characters (letters, numbers, spaces).",
        });
      }

      const nameTaken = Object.values(game.players).some(
        (p) => p.username.toLowerCase() === trimmed.toLowerCase()
      );
      if (nameTaken) {
        return socket.emit("join-error", { message: "That name is already in use." });
      }

      try {
        const symbol = game.addPlayer(socket.id, trimmed);
        socket.emit("join-success", { username: trimmed, symbol });

        if (game.status === "playing") {
          matchStartedAt = Date.now();
        }

        broadcastState();
      } catch (err) {
        socket.emit("join-error", { message: err.message });
      }
    });

    socket.on("make-move", ({ index } = {}) => {
      try {
        const result = game.applyMove(socket.id, index);
        io.emit("move-made", result);

        if (result.winnerSymbol || result.isDraw) {
          const winner = result.winnerSymbol
            ? Object.values(game.players).find((p) => p.symbol === result.winnerSymbol)
            : null;

          const entry = historyStore.addResult({
            playerX: Object.values(game.players).find((p) => p.symbol === "X")?.username || "X",
            playerO: Object.values(game.players).find((p) => p.symbol === "O")?.username || "O",
            winner: winner ? winner.username : "Draw",
            winnerSymbol: result.winnerSymbol,
            result: result.isDraw ? "draw" : "win",
            durationSeconds: matchStartedAt
              ? Math.round((Date.now() - matchStartedAt) / 1000)
              : null,
            playedAt: new Date().toISOString(),
          });

          io.emit("game-over", {
            winnerSymbol: result.winnerSymbol,
            winnerName: winner ? winner.username : null,
            isDraw: result.isDraw,
            winningLine: result.winningLine,
          });
          broadcastHistory();

          clearTimeout(resetTimer);
          resetTimer = setTimeout(() => {
            game.reset();
            broadcastState();
            io.emit("game-reset", { message: "Game reset. Please join again." });
          }, AUTO_RESET_DELAY_MS);
        }
      } catch (err) {
        socket.emit("move-error", { message: err.message });
      }
    });

    socket.on("reset-request", () => {
      clearTimeout(resetTimer);
      game.reset();
      broadcastState();
      io.emit("game-reset", { message: "Game was reset manually." });
    });

    socket.on("disconnect", () => {
      const player = game.removePlayer(socket.id);
      if (player) {
        io.emit("player-left", { username: player.username, symbol: player.symbol });
        broadcastState();
      }
    });
  });
}

module.exports = registerSocketHandlers;

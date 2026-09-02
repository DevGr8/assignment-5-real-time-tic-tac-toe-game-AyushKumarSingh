const socket = io();

const loginScreen = document.getElementById("login-screen");
const gameScreen = document.getElementById("game-screen");
const usernameInput = document.getElementById("username-input");
const joinBtn = document.getElementById("join-btn");
const loginError = document.getElementById("login-error");
const playersBar = document.getElementById("players-bar");
const statusLine = document.getElementById("status-line");
const boardEl = document.getElementById("board");
const resetBtn = document.getElementById("reset-btn");
const historyList = document.getElementById("history-list");
const winnerModal = document.getElementById("winner-modal");
const winnerText = document.getElementById("winner-text");

let mySymbol = null;
let myUsername = null;

function renderBoard(cells, winningLine = []) {
  boardEl.innerHTML = "";
  cells.forEach((value, index) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    if (value) cell.classList.add("taken", value.toLowerCase());
    if (winningLine && winningLine.includes(index)) cell.classList.add("win");
    cell.textContent = value || "";
    cell.addEventListener("click", () => {
      if (!value) socket.emit("make-move", { index });
    });
    boardEl.appendChild(cell);
  });
}

function renderPlayers(players) {
  playersBar.innerHTML = players
    .map((p) => `<span>${p.symbol}: ${p.username}</span>`)
    .join(" · ") || "<span>Waiting for players…</span>";
}

function renderHistory(history) {
  historyList.innerHTML = "";
  if (!history.length) {
    historyList.innerHTML = "<li>No games played yet</li>";
    return;
  }
  history.forEach((game) => {
    const li = document.createElement("li");
    const label = game.result === "draw" ? "Draw" : `${game.winner} won`;
    li.innerHTML = `<span>${game.playerX} vs ${game.playerO}</span><span>${label}</span>`;
    historyList.appendChild(li);
  });
}

joinBtn.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  loginError.textContent = "";
  socket.emit("join-game", { username: name });
});

usernameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") joinBtn.click();
});

resetBtn.addEventListener("click", () => socket.emit("reset-request"));

socket.on("join-success", ({ username, symbol }) => {
  myUsername = username;
  mySymbol = symbol;
  loginScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
});

socket.on("join-error", ({ message }) => {
  loginError.textContent = message;
});

socket.on("state-update", (state) => {
  renderPlayers(state.players);
  renderBoard(state.board, state.winningLine || []);

  if (state.status === "waiting") {
    statusLine.textContent = "Waiting for another player…";
  } else if (state.status === "playing") {
    statusLine.textContent =
      state.turn === mySymbol ? "Your turn" : `Waiting for ${state.turn}'s move`;
  } else if (state.status === "finished") {
    statusLine.textContent = "Game over";
  }
});

socket.on("move-made", ({ board, turn, winningLine }) => {
  renderBoard(board, winningLine || []);
  statusLine.textContent = turn === mySymbol ? "Your turn" : `Waiting for ${turn}'s move`;
});

socket.on("move-error", ({ message }) => {
  statusLine.textContent = message;
});

socket.on("game-over", ({ winnerName, isDraw }) => {
  winnerText.textContent = isDraw ? "It's a draw!" : `${winnerName} wins! 🎉`;
  winnerModal.classList.remove("hidden");
  setTimeout(() => winnerModal.classList.add("hidden"), 4000);
});

socket.on("game-reset", () => {
  mySymbol = null;
  gameScreen.classList.add("hidden");
  loginScreen.classList.remove("hidden");
  usernameInput.value = "";
});

socket.on("player-left", ({ username }) => {
  statusLine.textContent = `${username} disconnected. Game reset.`;
});

socket.on("history-update", ({ history }) => renderHistory(history));

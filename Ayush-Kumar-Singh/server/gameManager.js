const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],           // diagonals
];

/**
 * Holds the state for a single tic-tac-toe room: the two seated players,
 * the board, whose turn it is, and whether a game is currently live.
 * All mutation happens here so socket handlers stay thin.
 */
class GameManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = Array(9).fill(null);
    this.players = {}; // socketId -> { username, symbol }
    this.turn = "X";
    this.status = "waiting"; // waiting | playing | finished
    this.winningLine = null;
  }

  get playerCount() {
    return Object.keys(this.players).length;
  }

  isFull() {
    return this.playerCount >= 2;
  }

  addPlayer(socketId, username) {
    if (this.isFull()) {
      throw new Error("Game is full. Only two players are allowed.");
    }

    const takenSymbols = Object.values(this.players).map((p) => p.symbol);
    const symbol = takenSymbols.includes("X") ? "O" : "X";

    this.players[socketId] = { username, symbol };

    if (this.isFull()) {
      this.status = "playing";
    }

    return symbol;
  }

  removePlayer(socketId) {
    const player = this.players[socketId];
    delete this.players[socketId];
    // Any disconnect mid-game invalidates the current match.
    this.board = Array(9).fill(null);
    this.turn = "X";
    this.status = this.playerCount > 0 ? "waiting" : "waiting";
    this.winningLine = null;
    return player;
  }

  applyMove(socketId, index) {
    const player = this.players[socketId];

    if (!player) {
      throw new Error("You are not part of this game.");
    }
    if (this.status !== "playing") {
      throw new Error("Game is not currently active.");
    }
    if (player.symbol !== this.turn) {
      throw new Error("It is not your turn.");
    }
    if (index < 0 || index > 8) {
      throw new Error("Invalid board position.");
    }
    if (this.board[index] !== null) {
      throw new Error("That square is already taken.");
    }

    this.board[index] = player.symbol;

    const winningLine = this._findWinningLine(player.symbol);
    const isDraw = !winningLine && this.board.every((cell) => cell !== null);

    if (winningLine || isDraw) {
      this.status = "finished";
      this.winningLine = winningLine;
    } else {
      this.turn = this.turn === "X" ? "O" : "X";
    }

    return {
      board: [...this.board],
      turn: this.turn,
      winnerSymbol: winningLine ? player.symbol : null,
      winningLine,
      isDraw,
    };
  }

  _findWinningLine(symbol) {
    return (
      WIN_LINES.find((line) => line.every((i) => this.board[i] === symbol)) ||
      null
    );
  }

  publicState() {
    return {
      board: [...this.board],
      turn: this.turn,
      status: this.status,
      playerCount: this.playerCount,
      players: Object.values(this.players),
      winningLine: this.winningLine,
    };
  }
}

module.exports = GameManager;

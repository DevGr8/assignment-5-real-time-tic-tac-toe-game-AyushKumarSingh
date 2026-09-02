# Real-Time Tic Tac Toe

A two-player, real-time Tic Tac Toe game built with **Node.js**, **Express**, and **Socket.io**. The server holds the single source of truth for the game — every move, turn change, win, and reset is validated server-side and broadcast to both connected clients over WebSockets.

## Project Structure

```text
Ayush-Kumar-Singh/
├── server/
│   ├── gameManager.js     # board state, turn order, win/draw detection
│   ├── historyStore.js    # simple JSON-file backed match history
│   └── socketHandlers.js  # wires Socket.io events to GameManager
├── public/
│   ├── index.html
│   ├── style.css
│   └── client.js          # Socket.io client + DOM rendering
├── server.js               # Express + Socket.io entry point
├── package.json
└── .env.example
```

## How It Works

1. **Join** — a player enters a username and emits `join-game`. The first player becomes **X**, the second **O**. A third connection is rejected with "Game is full."
2. **Play** — clicking a cell emits `make-move`; the server checks it's a valid, in-turn move before updating the board and broadcasting `move-made` to everyone.
3. **Win/draw detection** — the server checks all 8 winning lines after each move. On a finish it emits `game-over`, writes the result to `data/history.json`, and pushes the updated history list.
4. **Auto-reset** — a few seconds after a game ends, the server clears the board and sends both players back to the login screen. A manual **Reset Game** button is also available at any time.
5. **Disconnects** — if either player leaves mid-game, the other is notified and the room resets.

## Setup

```bash
npm install
cp .env.example .env   # adjust PORT / AUTO_RESET_DELAY_MS if needed
npm start
```

Open `http://localhost:3000` in two separate browser windows (e.g. one normal + one incognito) so each gets its own socket connection, join with two different names, and play.

## Socket Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `join-game` | `{ username }` | Attempt to join as a player |
| `make-move` | `{ index }` | Play on square 0-8 |
| `reset-request` | — | Manually reset the game |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `join-success` | `{ username, symbol }` | Confirms your seat and symbol |
| `join-error` | `{ message }` | Why the join failed |
| `state-update` | full room state | Sent on connect and after any change |
| `move-made` | `{ board, turn, winningLine }` | Broadcast after every valid move |
| `move-error` | `{ message }` | Why a move was rejected |
| `game-over` | `{ winnerName, isDraw, winningLine }` | Match result |
| `game-reset` | `{ message }` | Room cleared, please rejoin |
| `player-left` | `{ username, symbol }` | A player disconnected |
| `history-update` | `{ history }` | Latest saved match results |

## REST Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/status` | Basic server health/uptime |
| `GET` | `/api/history?limit=10` | Most recent finished games |

## Notes on Persistence

Match history is stored in a local `data/history.json` file (created automatically, git-ignored) rather than an external database, so the app runs immediately with no extra account setup. Swapping in Firestore/MongoDB later would only mean replacing `server/historyStore.js`.

## Author

**Ayush Kumar Singh**

## Deployed Link
https://assignment-5-real-time-tic-tac-toe-game-1nnh.onrender.com/

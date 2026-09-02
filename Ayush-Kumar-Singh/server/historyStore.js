const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, "[]", "utf-8");
  }
}

function readHistory() {
  ensureStore();
  try {
    const raw = fs.readFileSync(HISTORY_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read history file:", err.message);
    return [];
  }
}

function addResult(entry) {
  ensureStore();
  const history = readHistory();
  history.unshift(entry); // newest first
  const trimmed = history.slice(0, 50); // keep the store small
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
  return trimmed;
}

function getRecent(limit = 10) {
  return readHistory().slice(0, limit);
}

module.exports = { addResult, getRecent };

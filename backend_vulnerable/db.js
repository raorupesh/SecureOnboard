const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'secureonboard.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Failed to open audit DB', err);
    return;
  }
});

// Initialize schema
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      actor_id TEXT,
      actor_role TEXT,
      target_profile_id TEXT,
      event_type TEXT NOT NULL,
      details TEXT
    )
  `);
});

function logAction({ actorId = null, actorRole = null, targetProfileId = null, eventType, details = null }) {
  return new Promise((resolve, reject) => {
    const ts = new Date().toISOString();
    const stmt = db.prepare(`INSERT INTO actions (timestamp, actor_id, actor_role, target_profile_id, event_type, details) VALUES (?, ?, ?, ?, ?, ?)`);
    const detailsStr = details && typeof details !== 'string' ? JSON.stringify(details) : details;
    stmt.run(ts, actorId, actorRole, targetProfileId, eventType, detailsStr, function (err) {
      stmt.finalize();
      if (err) return reject(err);
      resolve({ id: this.lastID, timestamp: ts });
    });
  });
}

function getActions({ limit = 100, offset = 0, profileId = null } = {}) {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM actions';
    const params = [];
    if (profileId) {
      sql += ' WHERE target_profile_id = ?';
      params.push(profileId);
    }
    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

module.exports = { logAction, getActions };

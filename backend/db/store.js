/**
 * Lightweight file-based JSON datastore.
 *
 * This is intentionally simple so the MVP has zero native/binary
 * dependencies and runs anywhere Node.js runs. Each "table" is an
 * array kept in memory and persisted to a single JSON file on disk.
 *
 * Swap-out path for production: replace the methods in this file with
 * calls to PostgreSQL (see README.md "Moving to Postgres" section) --
 * the route files only depend on the methods exposed here, not on the
 * storage mechanism, so the rest of the app does not need to change.
 */
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

const DEFAULT_SCHEMA = {
  users: [],
  employees: [],
  departments: [],
  projects: [],
  tasks: [],
  attendance: [],
  notifications: [],
  auditLogs: [],
  company: [],
};

function load() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_SCHEMA, null, 2));
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  const parsed = JSON.parse(raw);
  // Ensure any new collections added later always exist
  return { ...DEFAULT_SCHEMA, ...parsed };
}

let db = load();

function persist() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

const store = {
  /** Return the full array for a collection (by reference; do not mutate directly) */
  all(collection) {
    return db[collection] || [];
  },

  find(collection, predicate) {
    return (db[collection] || []).find(predicate);
  },

  filter(collection, predicate) {
    return (db[collection] || []).filter(predicate);
  },

  insert(collection, record) {
    if (!db[collection]) db[collection] = [];
    db[collection].push(record);
    persist();
    return record;
  },

  update(collection, id, updates) {
    const list = db[collection] || [];
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    persist();
    return list[idx];
  },

  remove(collection, id) {
    const list = db[collection] || [];
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    list.splice(idx, 1);
    persist();
    return true;
  },

  reset() {
    db = { ...DEFAULT_SCHEMA };
    persist();
  },

  reload() {
    db = load();
  },
};

module.exports = store;

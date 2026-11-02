const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
const backupDir = path.join(__dirname, '..', 'backups');
const dbPath = path.join(dataDir, 'pathfinder.db');

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(backupDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS backups (
      id TEXT PRIMARY KEY,
      file_path TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      size_bytes INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT,
      description TEXT,
      parent_id TEXT,
      map_id TEXT,
      coordinates TEXT,
      status TEXT DEFAULT 'established',
      player_visible INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS houses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      motto TEXT,
      seat TEXT,
      ruler TEXT,
      status TEXT DEFAULT 'established',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS npcs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      title TEXT,
      race TEXT,
      occupation TEXT,
      location_id TEXT,
      house_id TEXT,
      status TEXT DEFAULT 'alive',
      gm_only INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS factions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      headquarters TEXT,
      status TEXT DEFAULT 'established',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS maps (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      map_type TEXT,
      parent_id TEXT,
      file_path TEXT,
      status TEXT DEFAULT 'known',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shops (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT,
      location_id TEXT,
      owner TEXT,
      shopkeeper_id TEXT,
      description TEXT,
      gm_notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'undiscovered',
      summary TEXT,
      giver TEXT,
      location_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      session_number INTEGER,
      campaign_date TEXT,
      summary TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      event_date TEXT,
      summary TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS simulation_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      date TEXT,
      status TEXT DEFAULT 'proposed',
      details TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS player_discoveries (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      details TEXT,
      visible_to_players INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const defaults = [
    ['app_name', 'The World Atlas'],
    ['campaign_name', 'Untitled Campaign'],
    ['gm_name', 'Game Master'],
    ['campaign_date', '1-01-0001'],
    ['player_display_mode', 'off'],
    ['last_backup_path', '']
  ];

  const upsertSetting = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (@key, @value, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `);

  defaults.forEach(([key, value]) => {
    upsertSetting.run({ key, value });
  });
}

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings ORDER BY key ASC').all();
  return Object.fromEntries(rows.map(({ key, value }) => [key, value]));
}

function saveSetting(key, value) {
  if (!key || value === undefined) {
    throw new Error('A setting key and value are required.');
  }

  const statement = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (@key, @value, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `);

  statement.run({ key, value: String(value) });
  return getSettings();
}

function getCounts() {
  const tableNames = ['locations', 'houses', 'npcs', 'factions', 'maps', 'shops', 'quests', 'sessions', 'timeline_events', 'simulation_events'];
  const summary = {};

  tableNames.forEach((tableName) => {
    try {
      const result = db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get();
      summary[tableName] = result.count;
    } catch (error) {
      summary[tableName] = 0;
    }
  });

  return summary;
}

function searchRecords(query) {
  const normalized = String(query || '').trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const tables = [
    { name: 'locations', labelColumn: 'name', summaryColumn: 'type' },
    { name: 'houses', labelColumn: 'name', summaryColumn: 'seat' },
    { name: 'npcs', labelColumn: 'name', summaryColumn: 'title' },
    { name: 'factions', labelColumn: 'name', summaryColumn: 'description' },
    { name: 'maps', labelColumn: 'name', summaryColumn: 'map_type' },
    { name: 'shops', labelColumn: 'name', summaryColumn: 'type' },
    { name: 'quests', labelColumn: 'name', summaryColumn: 'status' },
    { name: 'sessions', labelColumn: 'summary', summaryColumn: 'campaign_date' }
  ];

  const matches = [];

  tables.forEach(({ name, labelColumn, summaryColumn }) => {
    try {
      const rows = db.prepare(`SELECT * FROM ${name}`).all();
      rows.forEach((row) => {
        const label = row[labelColumn] || 'Unnamed';
        const summary = row[summaryColumn] || '';
        const haystack = `${label} ${summary}`.toLowerCase();
        if (haystack.includes(normalized)) {
          matches.push({ type: name, id: row.id, label, summary: summary || 'Record match', status: row.status || 'active' });
        }
      });
    } catch (error) {
      // Ignore missing tables while the application foundations are still being added.
    }
  });

  return matches.slice(0, 20);
}

function createBackup() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const destination = path.join(backupDir, `pathfinder-backup-${stamp}.db`);
  fs.copyFileSync(dbPath, destination);

  const stats = fs.statSync(destination);
  const record = {
    id: `backup-${stamp}`,
    file_path: destination,
    size_bytes: stats.size
  };

  db.prepare(`
    INSERT INTO backups (id, file_path, created_at, size_bytes)
    VALUES (@id, @file_path, CURRENT_TIMESTAMP, @size_bytes)
    ON CONFLICT(id) DO UPDATE SET file_path = excluded.file_path, created_at = CURRENT_TIMESTAMP, size_bytes = excluded.size_bytes
  `).run(record);

  saveSetting('last_backup_path', destination);

  return {
    id: record.id,
    file_path: destination,
    size_bytes: stats.size,
    created_at: new Date().toISOString()
  };
}

function listBackups() {
  return db.prepare('SELECT id, file_path, created_at, size_bytes FROM backups ORDER BY created_at DESC').all();
}

module.exports = {
  db,
  initializeDatabase,
  getSettings,
  saveSetting,
  getCounts,
  searchRecords,
  createBackup,
  listBackups
};

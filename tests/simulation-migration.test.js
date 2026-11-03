const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Database = require('better-sqlite3');

test('existing simulation tables and pending results survive the schema migration', (t) => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pathfinder-simulation-migration-'));
  fs.mkdirSync(dataDir, { recursive: true });
  const databasePath = path.join(dataDir, 'pathfinder.db');
  const legacyDatabase = new Database(databasePath);
  legacyDatabase.exec(`
    CREATE TABLE simulation_event_tables (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      roll_range TEXT,
      weight INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE simulation_cycles (
      id TEXT PRIMARY KEY,
      previous_date TEXT,
      new_date TEXT,
      interval_label TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE simulation_results (
      id TEXT PRIMARY KEY,
      cycle_id TEXT NOT NULL REFERENCES simulation_cycles(id) ON DELETE CASCADE,
      table_id TEXT NOT NULL REFERENCES simulation_event_tables(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      event_date TEXT,
      location_name TEXT,
      involved_text TEXT,
      roll_result TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO simulation_event_tables (id, name, category) VALUES ('legacy-table', 'Old event', 'political');
    INSERT INTO simulation_cycles (id, previous_date, new_date) VALUES ('legacy-cycle', '1-01-0001', '2-01-0001');
    INSERT INTO simulation_results (id, cycle_id, table_id, title) VALUES ('legacy-result', 'legacy-cycle', 'legacy-table', 'Old proposal');
  `);
  legacyDatabase.close();
  process.env.PATHFINDER_DATA_DIR = dataDir;
  delete require.cache[require.resolve('../src/db')];
  const database = require('../src/db');

  t.after(() => {
    database.db.close();
    delete process.env.PATHFINDER_DATA_DIR;
    delete require.cache[require.resolve('../src/db')];
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  database.initializeDatabase();
  const eventTable = database.getEventTable('legacy-table');
  const result = database.getSimulationResult('legacy-result');
  assert.equal(eventTable.group_name, 'political');
  assert.equal(result.status, 'pending');
  assert.equal(result.timeline_event_id, null);
  assert.ok(result.decided_at === null);
});

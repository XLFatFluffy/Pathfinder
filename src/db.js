const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
const backupDir = path.join(__dirname, '..', 'backups');
const mapStorageDir = path.join(dataDir, 'maps');
const dbPath = path.join(dataDir, 'pathfinder.db');
const mapTypes = new Set(['world', 'continent', 'region', 'kingdom', 'city', 'settlement', 'interior', 'dungeon']);
const mapStatuses = new Set(['unknown', 'known', 'available_for_purchase', 'purchased', 'discovered', 'reward', 'lost']);

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(backupDir, { recursive: true });
fs.mkdirSync(mapStorageDir, { recursive: true });

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
      description TEXT,
      original_filename TEXT,
      mime_type TEXT,
      file_size INTEGER,
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

  const mapColumns = db.prepare('PRAGMA table_info(maps)').all().map(({ name }) => name);
  const mapMigrations = [
    ['description', 'TEXT'],
    ['original_filename', 'TEXT'],
    ['mime_type', 'TEXT'],
    ['file_size', 'INTEGER']
  ];

  mapMigrations.forEach(([column, definition]) => {
    if (!mapColumns.includes(column)) {
      db.exec(`ALTER TABLE maps ADD COLUMN ${column} ${definition}`);
    }
  });

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
  const assetsDirectory = `${destination}.assets`;
  const copiedAssets = [];
  let databaseCopied = false;

  try {
    const checkpoint = db.pragma('wal_checkpoint(FULL)')[0];
    if (checkpoint?.busy) {
      throw new Error('The database is busy and could not be safely backed up.');
    }

    fs.copyFileSync(dbPath, destination);
    databaseCopied = true;
    fs.mkdirSync(assetsDirectory);

    const mapsWithArtwork = db.prepare('SELECT file_path FROM maps WHERE file_path IS NOT NULL').all();
    mapsWithArtwork.forEach(({ file_path: filePath }) => {
      const resolvedPath = path.resolve(filePath);
      const relativePath = path.relative(mapStorageDir, resolvedPath);
      if (!relativePath || relativePath === '.' || relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
        throw new Error('A map references artwork outside the local map library.');
      }
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Map artwork is missing and could not be backed up: ${path.basename(resolvedPath)}`);
      }
      const assetCopy = path.join(assetsDirectory, path.basename(resolvedPath));
      copiedAssets.push(assetCopy);
      fs.copyFileSync(resolvedPath, assetCopy);
    });

    const sizeBytes = fs.statSync(destination).size
      + copiedAssets.reduce((total, assetPath) => total + fs.statSync(assetPath).size, 0);
    const record = {
      id: `backup-${stamp}`,
      file_path: destination,
      size_bytes: sizeBytes
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
      assets_directory: assetsDirectory,
      size_bytes: sizeBytes,
      created_at: new Date().toISOString()
    };
  } catch (error) {
    copiedAssets.forEach((assetPath) => {
      if (fs.existsSync(assetPath)) fs.unlinkSync(assetPath);
    });
    if (fs.existsSync(assetsDirectory)) fs.rmdirSync(assetsDirectory);
    if (databaseCopied && fs.existsSync(destination)) fs.unlinkSync(destination);
    throw error;
  }
}

function listBackups() {
  return db.prepare('SELECT id, file_path, created_at, size_bytes FROM backups ORDER BY created_at DESC').all();
}

function listMaps() {
  return db.prepare(`
    SELECT maps.*, parent.name AS parent_name
    FROM maps
    LEFT JOIN maps AS parent ON parent.id = maps.parent_id
    ORDER BY maps.name COLLATE NOCASE ASC
  `).all();
}

function getMap(id) {
  return db.prepare('SELECT * FROM maps WHERE id = ?').get(id);
}

function validateMapParent(parentId, mapId = null) {
  if (!parentId) return;
  if (parentId === mapId) {
    throw mapValidationError('A map cannot be its own parent.');
  }
  if (!getMap(parentId)) {
    throw mapValidationError('The selected parent map does not exist.');
  }

  let ancestor = parentId;
  while (ancestor) {
    if (ancestor === mapId) {
      throw mapValidationError('This parent would create a map hierarchy cycle.');
    }
    const parent = getMap(ancestor);
    ancestor = parent?.parent_id || null;
  }
}

function createMap({ id, name, mapType, parentId, status, description, filePath, originalFilename, mimeType, fileSize }) {
  const normalizedName = String(name || '').trim();
  if (!normalizedName) {
    throw mapValidationError('A map name is required.');
  }
  validateMapType(mapType || 'world');
  validateMapStatus(status || 'unknown');
  validateMapParent(parentId);

  db.prepare(`
    INSERT INTO maps (
      id, name, map_type, parent_id, file_path, status, description,
      original_filename, mime_type, file_size, updated_at
    ) VALUES (
      @id, @name, @mapType, @parentId, @filePath, @status, @description,
      @originalFilename, @mimeType, @fileSize, CURRENT_TIMESTAMP
    )
  `).run({
    id,
    name: normalizedName,
    mapType: mapType || 'world',
    parentId: parentId || null,
    filePath: filePath || null,
    status: status || 'unknown',
    description: description || '',
    originalFilename: originalFilename || null,
    mimeType: mimeType || null,
    fileSize: fileSize || null
  });

  return getMap(id);
}

function updateMap(id, { name, mapType, parentId, status, description, filePath, originalFilename, mimeType, fileSize }) {
  const current = getMap(id);
  if (!current) return null;

  const normalizedName = String(name ?? current.name).trim();
  if (!normalizedName) {
    throw mapValidationError('A map name is required.');
  }
  validateMapType(mapType || current.map_type);
  validateMapStatus(status || current.status);
  const nextParentId = parentId === undefined ? current.parent_id : (parentId || null);
  validateMapParent(nextParentId, id);

  db.prepare(`
    UPDATE maps SET
      name = @name,
      map_type = @mapType,
      parent_id = @parentId,
      status = @status,
      description = @description,
      file_path = @filePath,
      original_filename = @originalFilename,
      mime_type = @mimeType,
      file_size = @fileSize,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run({
    id,
    name: normalizedName,
    mapType: mapType || current.map_type,
    parentId: nextParentId,
    status: status || current.status,
    description: description === undefined ? current.description : description,
    filePath: filePath === undefined ? current.file_path : filePath,
    originalFilename: originalFilename === undefined ? current.original_filename : originalFilename,
    mimeType: mimeType === undefined ? current.mime_type : mimeType,
    fileSize: fileSize === undefined ? current.file_size : fileSize
  });

  return getMap(id);
}

function getMapDependents(id) {
  return {
    childMaps: db.prepare('SELECT COUNT(*) AS count FROM maps WHERE parent_id = ?').get(id).count,
    locations: db.prepare('SELECT COUNT(*) AS count FROM locations WHERE map_id = ?').get(id).count
  };
}

function deleteMap(id) {
  const map = getMap(id);
  if (!map) return null;
  const dependents = getMapDependents(id);
  if (dependents.childMaps || dependents.locations) {
    const error = new Error('This map is in use by other campaign records.');
    error.dependents = dependents;
    throw error;
  }

  db.prepare('DELETE FROM maps WHERE id = ?').run(id);
  return map;
}

function validateMapType(mapType) {
  if (!mapTypes.has(mapType)) {
    throw mapValidationError('Choose a supported map level.');
  }
}

function validateMapStatus(status) {
  if (!mapStatuses.has(status)) {
    throw mapValidationError('Choose a supported player-knowledge status.');
  }
}

function mapValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

module.exports = {
  db,
  initializeDatabase,
  getSettings,
  saveSetting,
  getCounts,
  searchRecords,
  createBackup,
  listBackups,
  mapStorageDir,
  listMaps,
  getMap,
  createMap,
  updateMap,
  deleteMap
};

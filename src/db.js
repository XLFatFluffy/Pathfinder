const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
const backupDir = path.join(__dirname, '..', 'backups');
const mapStorageDir = path.join(dataDir, 'maps');
const dbPath = path.join(dataDir, 'pathfinder.db');
const mapTypes = new Set(['world', 'continent', 'region', 'kingdom', 'city', 'settlement', 'interior', 'dungeon']);
const mapStatuses = new Set(['unknown', 'known', 'available_for_purchase', 'purchased', 'discovered', 'reward', 'lost']);
const markerCategories = new Set(['city', 'town', 'village', 'castle', 'fortress', 'ruins', 'natural_landmark', 'road', 'port', 'point_of_interest', 'hidden_location']);
const houseStatuses = new Set(['established', 'dormant', 'extinct', 'disbanded']);
const locationTypes = new Set([
  ...markerCategories,
  'continent', 'region', 'kingdom', 'principality', 'duchy', 'county', 'territory',
  'district', 'wilderness_area', 'dungeon', 'building'
]);

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(backupDir, { recursive: true });
fs.mkdirSync(mapStorageDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

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
      gm_notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS houses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      motto TEXT,
      heraldry TEXT,
      founding_history TEXT,
      seat TEXT,
      ruler TEXT,
      territorial_holdings TEXT,
      military_strength TEXT,
      wealth TEXT,
      resources TEXT,
      political_influence TEXT,
      religious_affiliations TEXT,
      objectives TEXT,
      gm_secrets TEXT,
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

    CREATE TABLE IF NOT EXISTS map_markers (
      id TEXT PRIMARY KEY,
      map_id TEXT NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
      location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      x REAL NOT NULL CHECK (x >= 0 AND x <= 1),
      y REAL NOT NULL CHECK (y >= 0 AND y <= 1),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (map_id, location_id)
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

  const locationColumns = db.prepare('PRAGMA table_info(locations)').all().map(({ name }) => name);
  if (!locationColumns.includes('gm_notes')) {
    db.exec('ALTER TABLE locations ADD COLUMN gm_notes TEXT');
  }

  const houseColumns = db.prepare('PRAGMA table_info(houses)').all().map(({ name }) => name);
  const houseMigrations = [
    ['heraldry', 'TEXT'],
    ['founding_history', 'TEXT'],
    ['territorial_holdings', 'TEXT'],
    ['military_strength', 'TEXT'],
    ['wealth', 'TEXT'],
    ['resources', 'TEXT'],
    ['political_influence', 'TEXT'],
    ['religious_affiliations', 'TEXT'],
    ['objectives', 'TEXT'],
    ['gm_secrets', 'TEXT']
  ];

  houseMigrations.forEach(([column, definition]) => {
    if (!houseColumns.includes(column)) {
      db.exec(`ALTER TABLE houses ADD COLUMN ${column} ${definition}`);
    }
  });

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
    {
      name: 'houses',
      labelColumn: 'name',
      summaryColumn: 'seat',
      searchColumns: ['motto', 'heraldry', 'founding_history', 'ruler', 'territorial_holdings', 'military_strength', 'wealth', 'resources', 'political_influence', 'religious_affiliations', 'objectives']
    },
    { name: 'npcs', labelColumn: 'name', summaryColumn: 'title' },
    { name: 'factions', labelColumn: 'name', summaryColumn: 'description' },
    { name: 'maps', labelColumn: 'name', summaryColumn: 'map_type' },
    { name: 'shops', labelColumn: 'name', summaryColumn: 'type' },
    { name: 'quests', labelColumn: 'name', summaryColumn: 'status' },
    { name: 'sessions', labelColumn: 'summary', summaryColumn: 'campaign_date' }
  ];

  const matches = [];

  tables.forEach(({ name, labelColumn, summaryColumn, searchColumns = [] }) => {
    try {
      const rows = db.prepare(`SELECT * FROM ${name}`).all();
      rows.forEach((row) => {
        const label = row[labelColumn] || 'Unnamed';
        const summary = row[summaryColumn] || '';
        const additionalText = searchColumns.map((column) => row[column] || '').join(' ');
        const haystack = `${label} ${summary} ${additionalText}`.toLowerCase();
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

function listHouses() {
  return db.prepare('SELECT * FROM houses ORDER BY name COLLATE NOCASE ASC').all();
}

function getHouse(id) {
  return db.prepare('SELECT * FROM houses WHERE id = ?').get(id) || null;
}

function validateHouse(house) {
  if (typeof house.name !== 'string' || !house.name.trim()) {
    throw houseValidationError('A house name is required.');
  }
  if (house.name.length > 160) {
    throw houseValidationError('House names cannot exceed 160 characters.');
  }
  if (!houseStatuses.has(house.status)) {
    throw houseValidationError('Choose a supported house status.');
  }
  [
    'motto',
    'heraldry',
    'foundingHistory',
    'seat',
    'ruler',
    'territorialHoldings',
    'militaryStrength',
    'wealth',
    'resources',
    'politicalInfluence',
    'religiousAffiliations',
    'objectives',
    'gmSecrets'
  ].forEach((field) => validateOptionalText(house[field], field));
}

function validateHousePayload(house) {
  if (!house || typeof house !== 'object' || Array.isArray(house)) {
    throw houseValidationError('House data must be an object.');
  }
}

function createHouse(house) {
  validateHousePayload(house);
  const record = {
    id: crypto.randomUUID(),
    name: house.name,
    status: house.status ?? 'established',
    motto: house.motto ?? '',
    heraldry: house.heraldry ?? '',
    foundingHistory: house.foundingHistory ?? '',
    seat: house.seat ?? '',
    ruler: house.ruler ?? '',
    territorialHoldings: house.territorialHoldings ?? '',
    militaryStrength: house.militaryStrength ?? '',
    wealth: house.wealth ?? '',
    resources: house.resources ?? '',
    politicalInfluence: house.politicalInfluence ?? '',
    religiousAffiliations: house.religiousAffiliations ?? '',
    objectives: house.objectives ?? '',
    gmSecrets: house.gmSecrets ?? ''
  };
  validateHouse(record);
  record.name = record.name.trim();

  db.prepare(`
    INSERT INTO houses (
      id, name, motto, heraldry, founding_history, seat, ruler, territorial_holdings,
      military_strength, wealth, resources, political_influence, religious_affiliations,
      objectives, gm_secrets, status, updated_at
    ) VALUES (
      @id, @name, @motto, @heraldry, @foundingHistory, @seat, @ruler, @territorialHoldings,
      @militaryStrength, @wealth, @resources, @politicalInfluence, @religiousAffiliations,
      @objectives, @gmSecrets, @status, CURRENT_TIMESTAMP
    )
  `).run(record);

  return getHouse(record.id);
}

function updateHouse(id, house) {
  const current = getHouse(id);
  if (!current) return null;
  validateHousePayload(house);

  const record = {
    id,
    name: house.name === undefined ? current.name : house.name,
    status: house.status === undefined ? current.status : house.status,
    motto: house.motto === undefined ? current.motto : house.motto,
    heraldry: house.heraldry === undefined ? current.heraldry : house.heraldry,
    foundingHistory: house.foundingHistory === undefined ? current.founding_history : house.foundingHistory,
    seat: house.seat === undefined ? current.seat : house.seat,
    ruler: house.ruler === undefined ? current.ruler : house.ruler,
    territorialHoldings: house.territorialHoldings === undefined ? current.territorial_holdings : house.territorialHoldings,
    militaryStrength: house.militaryStrength === undefined ? current.military_strength : house.militaryStrength,
    wealth: house.wealth === undefined ? current.wealth : house.wealth,
    resources: house.resources === undefined ? current.resources : house.resources,
    politicalInfluence: house.politicalInfluence === undefined ? current.political_influence : house.politicalInfluence,
    religiousAffiliations: house.religiousAffiliations === undefined ? current.religious_affiliations : house.religiousAffiliations,
    objectives: house.objectives === undefined ? current.objectives : house.objectives,
    gmSecrets: house.gmSecrets === undefined ? current.gm_secrets : house.gmSecrets
  };
  validateHouse(record);
  record.name = record.name.trim();

  db.prepare(`
    UPDATE houses SET
      name = @name,
      motto = @motto,
      heraldry = @heraldry,
      founding_history = @foundingHistory,
      seat = @seat,
      ruler = @ruler,
      territorial_holdings = @territorialHoldings,
      military_strength = @militaryStrength,
      wealth = @wealth,
      resources = @resources,
      political_influence = @politicalInfluence,
      religious_affiliations = @religiousAffiliations,
      objectives = @objectives,
      gm_secrets = @gmSecrets,
      status = @status,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run(record);

  return getHouse(id);
}

function deleteHouse(id) {
  const house = getHouse(id);
  if (!house) return null;
  const npcs = db.prepare('SELECT COUNT(*) AS count FROM npcs WHERE house_id = ?').get(id).count;
  if (npcs) {
    const error = new Error('This house is referenced by NPC records.');
    error.dependents = { npcs };
    throw error;
  }
  db.prepare('DELETE FROM houses WHERE id = ?').run(id);
  return house;
}

function getMap(id) {
  return db.prepare('SELECT * FROM maps WHERE id = ?').get(id);
}

function listLocations() {
  return db.prepare(`
    SELECT
      locations.*,
      COUNT(DISTINCT map_markers.id) AS marker_count,
      GROUP_CONCAT(DISTINCT maps.name) AS map_names,
      MIN(map_markers.map_id) AS first_map_id
    FROM locations
    LEFT JOIN map_markers ON map_markers.location_id = locations.id
    LEFT JOIN maps ON maps.id = map_markers.map_id
    GROUP BY locations.id
    ORDER BY locations.name COLLATE NOCASE ASC
  `).all();
}

function getLocation(id) {
  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(id);
  if (!location) return null;

  const markers = db.prepare(`
    SELECT map_markers.id AS marker_id, map_markers.map_id, map_markers.category,
      map_markers.x, map_markers.y, maps.name AS map_name
    FROM map_markers
    JOIN maps ON maps.id = map_markers.map_id
    WHERE map_markers.location_id = ?
    ORDER BY maps.name COLLATE NOCASE ASC
  `).all(id);

  return { ...location, markers, marker_count: markers.length };
}

function getMapMarkers(mapId) {
  return db.prepare(`
    SELECT
      map_markers.id AS marker_id,
      map_markers.map_id,
      map_markers.location_id,
      map_markers.category,
      map_markers.x,
      map_markers.y,
      locations.name,
      locations.type,
      locations.description,
      locations.gm_notes,
      locations.player_visible,
      locations.status,
      maps.name AS map_name
    FROM map_markers
    JOIN locations ON locations.id = map_markers.location_id
    JOIN maps ON maps.id = map_markers.map_id
    WHERE map_markers.map_id = ?
    ORDER BY locations.name COLLATE NOCASE ASC
  `).all(mapId);
}

function createMapMarker(mapId, marker) {
  if (!getMap(mapId)) {
    const error = new Error('Map not found.');
    error.statusCode = 404;
    throw error;
  }

  const category = validateMarkerCategory(marker.category);
  const x = validateNormalizedCoordinate(marker.x, 'x');
  const y = validateNormalizedCoordinate(marker.y, 'y');
  const locationId = marker.locationId || crypto.randomUUID();
  const markerId = crypto.randomUUID();
  const existingLocation = marker.locationId ? getLocation(marker.locationId) : null;

  if (marker.locationId && !existingLocation) {
    const error = new Error('The selected location does not exist.');
    error.statusCode = 404;
    throw error;
  }
  if (!existingLocation) {
    validateLocation(marker.name, marker.type);
    validateOptionalText(marker.description, 'Description');
    validateOptionalText(marker.gmNotes, 'GM notes');
  }
  const playerVisible = existingLocation ? 1 : normalizePlayerVisibility(marker.playerVisible, true);

  const insert = db.transaction(() => {
    if (!existingLocation) {
      db.prepare(`
        INSERT INTO locations (
          id, name, type, description, gm_notes, status, player_visible, updated_at
        ) VALUES (
          @id, @name, @type, @description, @gmNotes, 'established', @playerVisible, CURRENT_TIMESTAMP
        )
      `).run({
        id: locationId,
        name: String(marker.name).trim(),
        type: marker.type,
        description: marker.description || '',
        gmNotes: marker.gmNotes || '',
        playerVisible
      });
    }

    db.prepare(`
      INSERT INTO map_markers (id, map_id, location_id, category, x, y, updated_at)
      VALUES (@id, @mapId, @locationId, @category, @x, @y, CURRENT_TIMESTAMP)
    `).run({ id: markerId, mapId, locationId, category, x, y });

    return getMapMarkers(mapId).find((entry) => entry.marker_id === markerId);
  });

  return insert();
}

function updateLocation(id, { name, type, description, gmNotes, playerVisible }) {
  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(id);
  if (!location) return null;

  const nextName = name === undefined ? location.name : name;
  const nextType = type ?? location.type;
  validateLocation(nextName, nextType);
  validateOptionalText(description === undefined ? location.description : description, 'Description');
  validateOptionalText(gmNotes === undefined ? location.gm_notes : gmNotes, 'GM notes');
  const nextPlayerVisible = normalizePlayerVisibility(playerVisible, Boolean(location.player_visible));

  db.prepare(`
    UPDATE locations SET
      name = @name,
      type = @type,
      description = @description,
      gm_notes = @gmNotes,
      player_visible = @playerVisible,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run({
    id,
    name: nextName.trim(),
    type: nextType,
    description: description === undefined ? location.description : description,
    gmNotes: gmNotes === undefined ? location.gm_notes : gmNotes,
    playerVisible: nextPlayerVisible
  });

  return getLocation(id);
}

function getLocationDependents(id) {
  return {
    childLocations: db.prepare('SELECT COUNT(*) AS count FROM locations WHERE parent_id = ?').get(id).count,
    npcs: db.prepare('SELECT COUNT(*) AS count FROM npcs WHERE location_id = ?').get(id).count,
    shops: db.prepare('SELECT COUNT(*) AS count FROM shops WHERE location_id = ?').get(id).count,
    quests: db.prepare('SELECT COUNT(*) AS count FROM quests WHERE location_id = ?').get(id).count
  };
}

function deleteLocation(id) {
  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(id);
  if (!location) return null;

  const dependents = getLocationDependents(id);
  if (Object.values(dependents).some((count) => count > 0)) {
    const error = new Error('This location is referenced by other campaign records.');
    error.dependents = dependents;
    throw error;
  }

  db.prepare('DELETE FROM locations WHERE id = ?').run(id);
  return location;
}

function updateMapMarker(mapId, markerId, { x, y }) {
  const normalizedX = validateNormalizedCoordinate(x, 'x');
  const normalizedY = validateNormalizedCoordinate(y, 'y');
  const result = db.prepare(`
    UPDATE map_markers
    SET x = ?, y = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND map_id = ?
  `).run(normalizedX, normalizedY, markerId, mapId);

  return result.changes ? getMapMarkers(mapId).find((entry) => entry.marker_id === markerId) : null;
}

function deleteMapMarker(mapId, markerId) {
  const result = db.prepare('DELETE FROM map_markers WHERE id = ? AND map_id = ?').run(markerId, mapId);
  return result.changes > 0;
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
    locations: db.prepare('SELECT COUNT(*) AS count FROM locations WHERE map_id = ?').get(id).count,
    markers: db.prepare('SELECT COUNT(*) AS count FROM map_markers WHERE map_id = ?').get(id).count
  };
}

function deleteMap(id) {
  const map = getMap(id);
  if (!map) return null;
  const dependents = getMapDependents(id);
  if (dependents.childMaps || dependents.locations || dependents.markers) {
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

function validateMarkerCategory(category) {
  if (!markerCategories.has(category)) {
    throw mapValidationError('Choose a supported marker category.');
  }
  return category;
}

function validateLocation(name, type) {
  if (typeof name !== 'string' || !name.trim()) {
    throw mapValidationError('A location name is required.');
  }
  if (name.length > 160) {
    throw mapValidationError('Location names cannot exceed 160 characters.');
  }
  if (!locationTypes.has(type)) {
    throw mapValidationError('Choose a supported location type.');
  }
}

function validateOptionalText(value, label) {
  if (value !== undefined && value !== null && typeof value !== 'string') {
    throw mapValidationError(`${label} must be text.`);
  }
  if (typeof value === 'string' && value.length > 4000) {
    throw mapValidationError(`${label} cannot exceed 4,000 characters.`);
  }
}

function normalizePlayerVisibility(value, defaultValue) {
  if (value === undefined) return defaultValue ? 1 : 0;
  if (value === true || value === 1) return 1;
  if (value === false || value === 0) return 0;
  throw mapValidationError('Player visibility must be true or false.');
}

function validateNormalizedCoordinate(value, axis) {
  const coordinate = Number(value);
  if (!Number.isFinite(coordinate) || coordinate < 0 || coordinate > 1) {
    throw mapValidationError(`The marker ${axis} coordinate must be between 0 and 1.`);
  }
  return coordinate;
}

function mapValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function houseValidationError(message) {
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
  listHouses,
  getHouse,
  createHouse,
  updateHouse,
  deleteHouse,
  createMap,
  updateMap,
  deleteMap,
  listLocations,
  getLocation,
  getMapMarkers,
  createMapMarker,
  updateLocation,
  deleteLocation,
  updateMapMarker,
  deleteMapMarker,
  markerCategories: [...markerCategories],
  locationTypes: [...locationTypes]
};

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const { createCampaignDataService } = require('./campaign-data');
const {
  DEFAULT_CALENDAR_MONTHS,
  normalizeCalendarMonths,
  parseCalendarMonthLines,
  parseCampaignDate,
  formatCampaignDate,
  advanceCampaignDate
} = require('./calendar');

const dataDir = process.env.PATHFINDER_DATA_DIR
  ? path.resolve(process.env.PATHFINDER_DATA_DIR)
  : path.join(__dirname, '..', 'data');
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
const campaignDataService = createCampaignDataService(db, getSettings, saveSetting);

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

    CREATE TABLE IF NOT EXISTS npc_relationships (
      id TEXT PRIMARY KEY,
      npc_id TEXT NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
      related_npc_id TEXT NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
      relationship_type TEXT NOT NULL CHECK (relationship_type IN ('parent', 'sibling', 'spouse', 'former_spouse')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (npc_id != related_npc_id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS npc_relationships_unique_pair
    ON npc_relationships (
      CASE WHEN npc_id < related_npc_id THEN npc_id ELSE related_npc_id END,
      CASE WHEN npc_id < related_npc_id THEN related_npc_id ELSE npc_id END
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

    CREATE TABLE IF NOT EXISTS shop_inventory (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
      item_name TEXT NOT NULL,
      description TEXT,
      item_category TEXT,
      quantity INTEGER DEFAULT 0,
      price REAL DEFAULT 0,
      currency TEXT DEFAULT 'gp',
      condition TEXT DEFAULT 'standard',
      availability TEXT DEFAULT 'available',
      special_notes TEXT,
      player_visible INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS simulation_event_tables (
      id TEXT PRIMARY KEY,
      group_name TEXT NOT NULL DEFAULT 'General',
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      roll_range TEXT,
      weight INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS simulation_cycles (
      id TEXT PRIMARY KEY,
      previous_date TEXT,
      new_date TEXT,
      interval_label TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS simulation_results (
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
      decided_at TEXT,
      timeline_event_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS simulation_rolls (
      id TEXT PRIMARY KEY,
      cycle_id TEXT NOT NULL REFERENCES simulation_cycles(id) ON DELETE CASCADE,
      group_name TEXT NOT NULL,
      roll_result TEXT NOT NULL,
      event_table_id TEXT REFERENCES simulation_event_tables(id) ON DELETE SET NULL,
      result_id TEXT REFERENCES simulation_results(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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

  const simulationTableColumns = db.prepare('PRAGMA table_info(simulation_event_tables)').all().map(({ name }) => name);
  if (!simulationTableColumns.includes('group_name')) {
    db.exec("ALTER TABLE simulation_event_tables ADD COLUMN group_name TEXT NOT NULL DEFAULT 'General'");
    db.exec("UPDATE simulation_event_tables SET group_name = COALESCE(NULLIF(TRIM(category), ''), 'General')");
  }

  const simulationResultColumns = db.prepare('PRAGMA table_info(simulation_results)').all().map(({ name }) => name);
  if (!simulationResultColumns.includes('decided_at')) {
    db.exec('ALTER TABLE simulation_results ADD COLUMN decided_at TEXT');
  }
  if (!simulationResultColumns.includes('timeline_event_id')) {
    db.exec('ALTER TABLE simulation_results ADD COLUMN timeline_event_id TEXT');
  }

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
    ['calendar_months', JSON.stringify(DEFAULT_CALENDAR_MONTHS)],
    ['player_display_mode', 'off'],
    ['last_backup_path', '']
  ];

  const insertDefault = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (@key, @value)');

  defaults.forEach(([key, value]) => {
    insertDefault.run({ key, value });
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
  const tableNames = ['locations', 'houses', 'npcs', 'factions', 'maps', 'shops', 'quests', 'sessions', 'player_discoveries', 'timeline_events', 'simulation_events'];
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
    { name: 'sessions', labelColumn: 'summary', summaryColumn: 'campaign_date' },
    { name: 'player_discoveries', labelColumn: 'title', summaryColumn: 'category', searchColumns: ['details'] },
    { name: 'timeline_events', labelColumn: 'title', summaryColumn: 'category' },
    { name: 'simulation_events', labelColumn: 'title', summaryColumn: 'status' }
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

function listNpcs() {
  return db.prepare(`
    SELECT
      npcs.*,
      locations.name AS location_name,
      houses.name AS house_name
    FROM npcs
    LEFT JOIN locations ON locations.id = npcs.location_id
    LEFT JOIN houses ON houses.id = npcs.house_id
    ORDER BY npcs.name COLLATE NOCASE ASC
  `).all();
}

function getNpc(id) {
  return db.prepare(`
    SELECT
      npcs.*,
      locations.name AS location_name,
      houses.name AS house_name
    FROM npcs
    LEFT JOIN locations ON locations.id = npcs.location_id
    LEFT JOIN houses ON houses.id = npcs.house_id
    WHERE npcs.id = ?
  `).get(id) || null;
}

function validateNpc(npc) {
  if (typeof npc.name !== 'string' || !npc.name.trim()) {
    throw npcValidationError('An NPC name is required.');
  }
  if (npc.name.length > 160) {
    throw npcValidationError('NPC names cannot exceed 160 characters.');
  }
  if (npc.title !== undefined && npc.title !== null && typeof npc.title !== 'string') {
    throw npcValidationError('NPC titles must be text.');
  }
  if (npc.race !== undefined && npc.race !== null && typeof npc.race !== 'string') {
    throw npcValidationError('NPC races must be text.');
  }
  if (npc.occupation !== undefined && npc.occupation !== null && typeof npc.occupation !== 'string') {
    throw npcValidationError('NPC occupations must be text.');
  }
  if (npc.location_id && !db.prepare('SELECT 1 FROM locations WHERE id = ?').get(npc.location_id)) {
    throw npcValidationError('The chosen location does not exist.');
  }
  if (npc.house_id && !db.prepare('SELECT 1 FROM houses WHERE id = ?').get(npc.house_id)) {
    throw npcValidationError('The chosen house does not exist.');
  }
  if (npc.status !== undefined && npc.status !== null && typeof npc.status !== 'string') {
    throw npcValidationError('NPC status must be text.');
  }
  if (npc.gm_only !== undefined && npc.gm_only !== null && typeof npc.gm_only !== 'number' && typeof npc.gm_only !== 'boolean') {
    throw npcValidationError('GM-only status must be true or false.');
  }
}

function createNpc(npc) {
  if (!npc || typeof npc !== 'object' || Array.isArray(npc)) {
    throw npcValidationError('NPC data must be an object.');
  }

  const record = {
    id: crypto.randomUUID(),
    name: String(npc.name || '').trim(),
    title: npc.title ?? '',
    race: npc.race ?? '',
    occupation: npc.occupation ?? '',
    location_id: npc.location_id ?? null,
    house_id: npc.house_id ?? null,
    status: npc.status ?? 'alive',
    gm_only: npc.gm_only === undefined ? 0 : Number(Boolean(npc.gm_only))
  };
  validateNpc(record);

  db.prepare(`
    INSERT INTO npcs (id, name, title, race, occupation, location_id, house_id, status, gm_only, updated_at)
    VALUES (@id, @name, @title, @race, @occupation, @location_id, @house_id, @status, @gm_only, CURRENT_TIMESTAMP)
  `).run(record);

  return getNpc(record.id);
}

function updateNpc(id, npc) {
  const current = getNpc(id);
  if (!current) return null;
  if (!npc || typeof npc !== 'object' || Array.isArray(npc)) {
    throw npcValidationError('NPC data must be an object.');
  }

  const record = {
    id,
    name: npc.name === undefined ? current.name : String(npc.name).trim(),
    title: npc.title === undefined ? current.title : (npc.title ?? ''),
    race: npc.race === undefined ? current.race : (npc.race ?? ''),
    occupation: npc.occupation === undefined ? current.occupation : (npc.occupation ?? ''),
    location_id: npc.location_id === undefined ? current.location_id : (npc.location_id || null),
    house_id: npc.house_id === undefined ? current.house_id : (npc.house_id || null),
    status: npc.status === undefined ? current.status : (npc.status ?? 'alive'),
    gm_only: npc.gm_only === undefined ? current.gm_only : Number(Boolean(npc.gm_only))
  };
  validateNpc(record);

  db.prepare(`
    UPDATE npcs SET
      name = @name,
      title = @title,
      race = @race,
      occupation = @occupation,
      location_id = @location_id,
      house_id = @house_id,
      status = @status,
      gm_only = @gm_only,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run(record);

  return getNpc(id);
}

function deleteNpc(id) {
  const npc = getNpc(id);
  if (!npc) return null;
  db.prepare('DELETE FROM npcs WHERE id = ?').run(id);
  return npc;
}

function listNpcRelationships(npcId = null) {
  const rows = npcId
    ? db.prepare(`
      SELECT relationships.*, subject.name AS subject_name, related.name AS related_name
      FROM npc_relationships AS relationships
      JOIN npcs AS subject ON subject.id = relationships.npc_id
      JOIN npcs AS related ON related.id = relationships.related_npc_id
      WHERE relationships.npc_id = ? OR relationships.related_npc_id = ?
      ORDER BY subject.name COLLATE NOCASE ASC, related.name COLLATE NOCASE ASC
    `).all(npcId, npcId)
    : db.prepare(`
      SELECT relationships.*, subject.name AS subject_name, related.name AS related_name
      FROM npc_relationships AS relationships
      JOIN npcs AS subject ON subject.id = relationships.npc_id
      JOIN npcs AS related ON related.id = relationships.related_npc_id
      ORDER BY subject.name COLLATE NOCASE ASC, related.name COLLATE NOCASE ASC
    `).all();

  return rows.map((row) => {
    const anchorIsParent = row.relationship_type === 'parent' && row.npc_id === npcId;
    const anchorIsChild = row.relationship_type === 'parent' && row.related_npc_id === npcId;
    const subjectIsAnchor = row.npc_id === npcId;
    return {
      ...row,
      anchor_name: npcId ? (subjectIsAnchor ? row.subject_name : row.related_name) : row.subject_name,
      related_npc_name: npcId ? (subjectIsAnchor ? row.related_name : row.subject_name) : row.related_name,
      relationship_type: row.relationship_type === 'parent'
        ? (anchorIsParent ? 'child' : (anchorIsChild ? 'parent' : row.relationship_type))
        : row.relationship_type
    };
  });
}

function getNpcRelationship(id) {
  return db.prepare('SELECT * FROM npc_relationships WHERE id = ?').get(id) || null;
}

function validateNpcRelationship(relationship) {
  if (typeof relationship.npc_id !== 'string' || !db.prepare('SELECT 1 FROM npcs WHERE id = ?').get(relationship.npc_id)) {
    throw npcValidationError('Choose an existing NPC for this family relationship.');
  }
  if (typeof relationship.related_npc_id !== 'string' || !db.prepare('SELECT 1 FROM npcs WHERE id = ?').get(relationship.related_npc_id)) {
    throw npcValidationError('Choose an existing related NPC.');
  }
  if (relationship.npc_id === relationship.related_npc_id) {
    throw npcValidationError('An NPC cannot have a family relationship with themself.');
  }
  if (!['parent', 'child', 'sibling', 'spouse', 'former_spouse'].includes(relationship.relationship_type)) {
    throw npcValidationError('Choose a supported family relationship.');
  }
  validateOptionalText(relationship.notes, 'Family relationship notes');
}

function createNpcRelationship(relationship) {
  if (!relationship || typeof relationship !== 'object' || Array.isArray(relationship)) {
    throw npcValidationError('Family relationship data must be an object.');
  }
  const record = {
    id: crypto.randomUUID(),
    npc_id: relationship.npc_id,
    related_npc_id: relationship.related_npc_id,
    relationship_type: relationship.relationship_type,
    notes: relationship.notes ?? ''
  };
  validateNpcRelationship(record);

  const existing = db.prepare(`
    SELECT 1 FROM npc_relationships
    WHERE (npc_id = @npc_id AND related_npc_id = @related_npc_id)
       OR (npc_id = @related_npc_id AND related_npc_id = @npc_id)
  `).get(record);
  if (existing) {
    throw npcValidationError('A relationship between these NPCs already exists. Edit or remove it before adding another.');
  }

  if (record.relationship_type === 'child') {
    record.relationship_type = 'parent';
  } else if (record.relationship_type === 'parent') {
    [record.npc_id, record.related_npc_id] = [record.related_npc_id, record.npc_id];
  } else if (record.npc_id > record.related_npc_id) {
    [record.npc_id, record.related_npc_id] = [record.related_npc_id, record.npc_id];
  }

  db.prepare(`
    INSERT INTO npc_relationships (id, npc_id, related_npc_id, relationship_type, notes, updated_at)
    VALUES (@id, @npc_id, @related_npc_id, @relationship_type, @notes, CURRENT_TIMESTAMP)
  `).run(record);
  return getNpcRelationship(record.id);
}

function deleteNpcRelationship(id) {
  const relationship = getNpcRelationship(id);
  if (!relationship) return null;
  db.prepare('DELETE FROM npc_relationships WHERE id = ?').run(id);
  return relationship;
}

function listFactions() {
  return db.prepare('SELECT * FROM factions ORDER BY name COLLATE NOCASE ASC').all();
}

function getFaction(id) {
  return db.prepare('SELECT * FROM factions WHERE id = ?').get(id) || null;
}

function validateFaction(faction) {
  if (typeof faction.name !== 'string' || !faction.name.trim()) {
    throw factionValidationError('A faction name is required.');
  }
  if (faction.name.length > 160) {
    throw factionValidationError('Faction names cannot exceed 160 characters.');
  }
  if (faction.description !== undefined && faction.description !== null && typeof faction.description !== 'string') {
    throw factionValidationError('Faction descriptions must be text.');
  }
  if (faction.headquarters !== undefined && faction.headquarters !== null && typeof faction.headquarters !== 'string') {
    throw factionValidationError('Faction headquarters must be text.');
  }
  if (faction.status !== undefined && faction.status !== null && typeof faction.status !== 'string') {
    throw factionValidationError('Faction status must be text.');
  }
}

function createFaction(faction) {
  if (!faction || typeof faction !== 'object' || Array.isArray(faction)) {
    throw factionValidationError('Faction data must be an object.');
  }
  const record = {
    id: crypto.randomUUID(),
    name: String(faction.name || '').trim(),
    description: faction.description ?? '',
    headquarters: faction.headquarters ?? '',
    status: faction.status ?? 'established'
  };
  validateFaction(record);

  db.prepare(`
    INSERT INTO factions (id, name, description, headquarters, status, updated_at)
    VALUES (@id, @name, @description, @headquarters, @status, CURRENT_TIMESTAMP)
  `).run(record);

  return getFaction(record.id);
}

function updateFaction(id, faction) {
  const current = getFaction(id);
  if (!current) return null;
  if (!faction || typeof faction !== 'object' || Array.isArray(faction)) {
    throw factionValidationError('Faction data must be an object.');
  }
  const record = {
    id,
    name: faction.name === undefined ? current.name : String(faction.name).trim(),
    description: faction.description === undefined ? current.description : (faction.description ?? ''),
    headquarters: faction.headquarters === undefined ? current.headquarters : (faction.headquarters ?? ''),
    status: faction.status === undefined ? current.status : (faction.status ?? 'established')
  };
  validateFaction(record);

  db.prepare(`
    UPDATE factions SET
      name = @name,
      description = @description,
      headquarters = @headquarters,
      status = @status,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run(record);

  return getFaction(id);
}

function deleteFaction(id) {
  const faction = getFaction(id);
  if (!faction) return null;
  db.prepare('DELETE FROM factions WHERE id = ?').run(id);
  return faction;
}

function listShops() {
  return db.prepare(`
    SELECT
      shops.*,
      locations.name AS location_name,
      npcs.name AS shopkeeper_name
    FROM shops
    LEFT JOIN locations ON locations.id = shops.location_id
    LEFT JOIN npcs ON npcs.id = shops.shopkeeper_id
    ORDER BY shops.name COLLATE NOCASE ASC
  `).all();
}

function listShopInventory(shopId) {
  return db.prepare('SELECT * FROM shop_inventory WHERE shop_id = ? ORDER BY item_name COLLATE NOCASE ASC').all(shopId);
}

function getShopInventoryItem(id) {
  return db.prepare('SELECT * FROM shop_inventory WHERE id = ?').get(id) || null;
}

function validateShopInventoryItem(item) {
  if (typeof item.item_name !== 'string' || !item.item_name.trim()) {
    throw shopInventoryValidationError('An item name is required.');
  }
  if (item.description !== undefined && item.description !== null && typeof item.description !== 'string') {
    throw shopInventoryValidationError('Item descriptions must be text.');
  }
  if (item.item_category !== undefined && item.item_category !== null && typeof item.item_category !== 'string') {
    throw shopInventoryValidationError('Item categories must be text.');
  }
  if (item.quantity !== undefined && item.quantity !== null && (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 0)) {
    throw shopInventoryValidationError('Quantity must be a whole number of zero or more.');
  }
  if (item.price !== undefined && item.price !== null && (!Number.isFinite(Number(item.price)) || Number(item.price) < 0)) {
    throw shopInventoryValidationError('Price must be zero or greater.');
  }
  if (item.currency !== undefined && item.currency !== null && typeof item.currency !== 'string') {
    throw shopInventoryValidationError('Currency must be text.');
  }
  if (item.availability !== undefined && item.availability !== null && typeof item.availability !== 'string') {
    throw shopInventoryValidationError('Availability status must be text.');
  }
  if (item.condition !== undefined && item.condition !== null && typeof item.condition !== 'string') {
    throw shopInventoryValidationError('Condition must be text.');
  }
  if (item.special_notes !== undefined && item.special_notes !== null && typeof item.special_notes !== 'string') {
    throw shopInventoryValidationError('Special notes must be text.');
  }
}

function createShopInventoryItem(shopId, item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw shopInventoryValidationError('Inventory data must be an object.');
  }
  if (!getShop(shopId)) {
    throw shopInventoryValidationError('The selected shop does not exist.');
  }
  const record = {
    id: crypto.randomUUID(),
    shop_id: shopId,
    item_name: String(item.item_name || '').trim(),
    description: item.description ?? '',
    item_category: item.item_category ?? '',
    quantity: Number(item.quantity ?? 0),
    price: Number(item.price ?? 0),
    currency: item.currency ?? 'gp',
    condition: item.condition ?? 'standard',
    availability: item.availability ?? 'available',
    special_notes: item.special_notes ?? '',
    player_visible: item.player_visible === undefined ? 1 : Number(Boolean(item.player_visible))
  };
  validateShopInventoryItem(record);

  db.prepare(`
    INSERT INTO shop_inventory (id, shop_id, item_name, description, item_category, quantity, price, currency, condition, availability, special_notes, player_visible, updated_at)
    VALUES (@id, @shop_id, @item_name, @description, @item_category, @quantity, @price, @currency, @condition, @availability, @special_notes, @player_visible, CURRENT_TIMESTAMP)
  `).run(record);

  return getShopInventoryItem(record.id);
}

function updateShopInventoryItem(id, item) {
  const current = getShopInventoryItem(id);
  if (!current) return null;
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw shopInventoryValidationError('Inventory data must be an object.');
  }

  const record = {
    id,
    shop_id: item.shop_id === undefined ? current.shop_id : item.shop_id,
    item_name: item.item_name === undefined ? current.item_name : String(item.item_name).trim(),
    description: item.description === undefined ? current.description : (item.description ?? ''),
    item_category: item.item_category === undefined ? current.item_category : (item.item_category ?? ''),
    quantity: item.quantity === undefined ? current.quantity : Number(item.quantity),
    price: item.price === undefined ? current.price : Number(item.price),
    currency: item.currency === undefined ? current.currency : (item.currency ?? 'gp'),
    condition: item.condition === undefined ? current.condition : (item.condition ?? 'standard'),
    availability: item.availability === undefined ? current.availability : (item.availability ?? 'available'),
    special_notes: item.special_notes === undefined ? current.special_notes : (item.special_notes ?? ''),
    player_visible: item.player_visible === undefined ? current.player_visible : Number(Boolean(item.player_visible))
  };
  validateShopInventoryItem(record);

  db.prepare(`
    UPDATE shop_inventory SET
      shop_id = @shop_id,
      item_name = @item_name,
      description = @description,
      item_category = @item_category,
      quantity = @quantity,
      price = @price,
      currency = @currency,
      condition = @condition,
      availability = @availability,
      special_notes = @special_notes,
      player_visible = @player_visible,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run(record);

  return getShopInventoryItem(id);
}

function deleteShopInventoryItem(id) {
  const item = getShopInventoryItem(id);
  if (!item) return null;
  db.prepare('DELETE FROM shop_inventory WHERE id = ?').run(id);
  return item;
}

function getShop(id) {
  return db.prepare(`
    SELECT
      shops.*,
      locations.name AS location_name,
      npcs.name AS shopkeeper_name
    FROM shops
    LEFT JOIN locations ON locations.id = shops.location_id
    LEFT JOIN npcs ON npcs.id = shops.shopkeeper_id
    WHERE shops.id = ?
  `).get(id) || null;
}

function validateShop(shop) {
  if (typeof shop.name !== 'string' || !shop.name.trim()) {
    throw shopValidationError('A shop name is required.');
  }
  if (shop.name.length > 160) {
    throw shopValidationError('Shop names cannot exceed 160 characters.');
  }
  if (shop.location_id && !db.prepare('SELECT 1 FROM locations WHERE id = ?').get(shop.location_id)) {
    throw shopValidationError('The chosen location does not exist.');
  }
  if (shop.shopkeeper_id && !db.prepare('SELECT 1 FROM npcs WHERE id = ?').get(shop.shopkeeper_id)) {
    throw shopValidationError('The chosen shopkeeper does not exist.');
  }
  if (shop.type !== undefined && shop.type !== null && typeof shop.type !== 'string') {
    throw shopValidationError('Shop type must be text.');
  }
  if (shop.owner !== undefined && shop.owner !== null && typeof shop.owner !== 'string') {
    throw shopValidationError('Shop owner must be text.');
  }
  if (shop.description !== undefined && shop.description !== null && typeof shop.description !== 'string') {
    throw shopValidationError('Shop description must be text.');
  }
  if (shop.gm_notes !== undefined && shop.gm_notes !== null && typeof shop.gm_notes !== 'string') {
    throw shopValidationError('Shop GM notes must be text.');
  }
}

function createShop(shop) {
  if (!shop || typeof shop !== 'object' || Array.isArray(shop)) {
    throw shopValidationError('Shop data must be an object.');
  }
  const record = {
    id: crypto.randomUUID(),
    name: String(shop.name || '').trim(),
    type: shop.type ?? '',
    location_id: shop.location_id ?? null,
    owner: shop.owner ?? '',
    shopkeeper_id: shop.shopkeeper_id ?? null,
    description: shop.description ?? '',
    gm_notes: shop.gm_notes ?? ''
  };
  validateShop(record);

  db.prepare(`
    INSERT INTO shops (id, name, type, location_id, owner, shopkeeper_id, description, gm_notes, updated_at)
    VALUES (@id, @name, @type, @location_id, @owner, @shopkeeper_id, @description, @gm_notes, CURRENT_TIMESTAMP)
  `).run(record);

  return getShop(record.id);
}

function updateShop(id, shop) {
  const current = getShop(id);
  if (!current) return null;
  if (!shop || typeof shop !== 'object' || Array.isArray(shop)) {
    throw shopValidationError('Shop data must be an object.');
  }
  const record = {
    id,
    name: shop.name === undefined ? current.name : String(shop.name).trim(),
    type: shop.type === undefined ? current.type : (shop.type ?? ''),
    location_id: shop.location_id === undefined ? current.location_id : (shop.location_id || null),
    owner: shop.owner === undefined ? current.owner : (shop.owner ?? ''),
    shopkeeper_id: shop.shopkeeper_id === undefined ? current.shopkeeper_id : (shop.shopkeeper_id || null),
    description: shop.description === undefined ? current.description : (shop.description ?? ''),
    gm_notes: shop.gm_notes === undefined ? current.gm_notes : (shop.gm_notes ?? '')
  };
  validateShop(record);

  db.prepare(`
    UPDATE shops SET
      name = @name,
      type = @type,
      location_id = @location_id,
      owner = @owner,
      shopkeeper_id = @shopkeeper_id,
      description = @description,
      gm_notes = @gm_notes,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run(record);

  return getShop(id);
}

function deleteShop(id) {
  const shop = getShop(id);
  if (!shop) return null;
  db.prepare('DELETE FROM shops WHERE id = ?').run(id);
  return shop;
}

function listEventTables() {
  return db.prepare('SELECT * FROM simulation_event_tables ORDER BY group_name COLLATE NOCASE ASC, name COLLATE NOCASE ASC').all();
}

function getEventTable(id) {
  return db.prepare('SELECT * FROM simulation_event_tables WHERE id = ?').get(id) || null;
}

function validateEventTable(eventTable) {
  if (typeof eventTable.group_name !== 'string' || !eventTable.group_name.trim()) {
    throw simulationTableValidationError('An event table group name is required.');
  }
  if (eventTable.group_name.trim().length > 120) {
    throw simulationTableValidationError('Event table group names cannot exceed 120 characters.');
  }
  if (typeof eventTable.name !== 'string' || !eventTable.name.trim()) {
    throw simulationTableValidationError('An event table name is required.');
  }
  if (eventTable.name.trim().length > 160) {
    throw simulationTableValidationError('Event names cannot exceed 160 characters.');
  }
  if (eventTable.description !== undefined && eventTable.description !== null && typeof eventTable.description !== 'string') {
    throw simulationTableValidationError('Description must be text.');
  }
  if (eventTable.category !== undefined && eventTable.category !== null && typeof eventTable.category !== 'string') {
    throw simulationTableValidationError('Category must be text.');
  }
  if (eventTable.roll_range !== undefined && eventTable.roll_range !== null && typeof eventTable.roll_range !== 'string') {
    throw simulationTableValidationError('Roll range must be text.');
  }
  const rollRange = String(eventTable.roll_range || '').trim();
  if (rollRange && !parseEventRollRange(rollRange)) {
    throw simulationTableValidationError('Roll range must be a positive number or inclusive range, such as 12 or 21-40.');
  }
  if (eventTable.weight !== undefined && eventTable.weight !== null
      && (!Number.isSafeInteger(Number(eventTable.weight)) || Number(eventTable.weight) < 1 || Number(eventTable.weight) > 1000000)) {
    throw simulationTableValidationError('Weight must be a whole number from 1 to 1000000.');
  }
}

function createEventTable(eventTable) {
  if (!eventTable || typeof eventTable !== 'object' || Array.isArray(eventTable)) {
    throw simulationTableValidationError('Event table data must be an object.');
  }
  const record = {
    id: crypto.randomUUID(),
    group_name: String(eventTable.group_name || 'General').trim(),
    name: String(eventTable.name || '').trim(),
    description: eventTable.description ?? '',
    category: eventTable.category ?? '',
    roll_range: eventTable.roll_range ?? '',
    weight: Number(eventTable.weight ?? 1)
  };
  validateEventTable(record);

  db.prepare(`
    INSERT INTO simulation_event_tables (id, group_name, name, description, category, roll_range, weight, updated_at)
    VALUES (@id, @group_name, @name, @description, @category, @roll_range, @weight, CURRENT_TIMESTAMP)
  `).run(record);

  return getEventTable(record.id);
}

function updateEventTable(id, eventTable) {
  const current = getEventTable(id);
  if (!current) return null;
  if (!eventTable || typeof eventTable !== 'object' || Array.isArray(eventTable)) {
    throw simulationTableValidationError('Event table data must be an object.');
  }

  const record = {
    id,
    group_name: eventTable.group_name === undefined ? current.group_name : String(eventTable.group_name).trim(),
    name: eventTable.name === undefined ? current.name : String(eventTable.name).trim(),
    description: eventTable.description === undefined ? current.description : (eventTable.description ?? ''),
    category: eventTable.category === undefined ? current.category : (eventTable.category ?? ''),
    roll_range: eventTable.roll_range === undefined ? current.roll_range : (eventTable.roll_range ?? ''),
    weight: eventTable.weight === undefined ? current.weight : Number(eventTable.weight)
  };
  validateEventTable(record);

  db.prepare(`
    UPDATE simulation_event_tables SET
      group_name = @group_name,
      name = @name,
      description = @description,
      category = @category,
      roll_range = @roll_range,
      weight = @weight,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run(record);

  return getEventTable(id);
}

function deleteEventTable(id) {
  const eventTable = getEventTable(id);
  if (!eventTable) return null;
  const dependents = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM simulation_results WHERE table_id = @id) AS results,
      (SELECT COUNT(*) FROM simulation_rolls WHERE event_table_id = @id) AS rolls
  `).get({ id });
  if (dependents.results || dependents.rolls) {
    const error = simulationTableValidationError('This event entry is part of simulation history and cannot be deleted.');
    error.statusCode = 409;
    error.dependents = dependents;
    throw error;
  }
  db.prepare('DELETE FROM simulation_event_tables WHERE id = ?').run(id);
  return eventTable;
}

function parseEventRollRange(value) {
  const match = String(value || '').trim().match(/^(\d{1,6})(?:\s*-\s*(\d{1,6}))?$/);
  if (!match) return null;
  const minimum = Number(match[1]);
  const maximum = Number(match[2] || match[1]);
  return minimum > 0 && maximum >= minimum ? { minimum, maximum } : null;
}

function listSimulationCycles() {
  return db.prepare('SELECT * FROM simulation_cycles ORDER BY created_at DESC').all();
}

function getCampaignCalendar() {
  const settings = getSettings();
  let months;
  try {
    months = normalizeCalendarMonths(JSON.parse(settings.calendar_months));
  } catch (error) {
    if (error.statusCode) throw error;
    throw new Error('The saved campaign calendar is invalid. Review its month settings and save again.');
  }
  const campaignDate = formatCampaignDate(parseCampaignDate(settings.campaign_date, months));
  return { campaignDate, months };
}

function saveCampaignCalendar(campaignDate, monthLines) {
  const months = parseCalendarMonthLines(monthLines);
  const normalizedDate = formatCampaignDate(parseCampaignDate(campaignDate, months));
  const transaction = db.transaction(() => {
    saveSetting('campaign_date', normalizedDate);
    saveSetting('calendar_months', JSON.stringify(months));
  });
  transaction();
  return { campaignDate: normalizedDate, months };
}

function advanceCampaignTime(amount, unit) {
  const { campaignDate, months } = getCampaignCalendar();
  const newDate = advanceCampaignDate(campaignDate, Number(amount), unit, months);
  const intervalLabel = `${amount} ${unit === 'custom' ? 'custom day' : unit}${Number(amount) === 1 ? '' : 's'}`;
  const id = crypto.randomUUID();
  const rollPlans = createEventTableRollPlans();
  const transaction = db.transaction(() => {
    saveSetting('campaign_date', newDate);
    db.prepare(`
      INSERT INTO simulation_cycles (id, previous_date, new_date, interval_label, notes, created_at)
      VALUES (@id, @previous_date, @new_date, @interval_label, '', CURRENT_TIMESTAMP)
    `).run({
      id,
      previous_date: campaignDate,
      new_date: newDate,
      interval_label: intervalLabel
    });
    const rolledResults = rollPlans.map((plan) => rollEventTable(plan, id, newDate));
    return rolledResults;
  });
  const results = transaction();
  return {
    ...db.prepare('SELECT * FROM simulation_cycles WHERE id = ?').get(id),
    results
  };
}

function createEventTableRollPlans() {
  const groups = new Map();
  listEventTables().forEach((entry) => {
    const groupName = entry.group_name || 'General';
    const group = groups.get(groupName) || [];
    group.push(entry);
    groups.set(groupName, group);
  });

  return [...groups.entries()].map(([groupName, entries]) => {
    const parsedRanges = entries.map((entry) => parseEventRollRange(entry.roll_range));
    const usesRanges = parsedRanges.some(Boolean);
    if (usesRanges && parsedRanges.some((range) => !range)) {
      throw simulationTableValidationError(`Every entry in "${groupName}" needs a roll range, or all ranges must be blank to use weights.`);
    }

    if (usesRanges) {
      const sortedRanges = parsedRanges.map((range, index) => ({ ...range, entry: entries[index] }))
        .sort((left, right) => left.minimum - right.minimum);
      for (let index = 1; index < sortedRanges.length; index += 1) {
        if (sortedRanges[index].minimum <= sortedRanges[index - 1].maximum) {
          throw simulationTableValidationError(`Roll ranges in "${groupName}" overlap.`);
        }
      }
      return {
        groupName,
        mode: 'range',
        faces: Math.max(...sortedRanges.map(({ maximum }) => maximum)),
        entries: sortedRanges
      };
    }

    const totalWeight = entries.reduce((total, entry) => total + Number(entry.weight || 1), 0);
    if (!Number.isSafeInteger(totalWeight) || totalWeight <= 0 || totalWeight >= 2 ** 48) {
      throw simulationTableValidationError(`The total weight in "${groupName}" is too large to roll.`);
    }
    return { groupName, mode: 'weight', totalWeight, entries };
  });
}

function rollEventTable(plan, cycleId, eventDate) {
  let selectedEntry = null;
  let rollResult;
  if (plan.mode === 'range') {
    const roll = crypto.randomInt(1, plan.faces + 1);
    selectedEntry = plan.entries.find(({ minimum, maximum }) => roll >= minimum && roll <= maximum)?.entry || null;
    rollResult = `d${plan.faces} roll ${roll}`;
  } else {
    const draw = crypto.randomInt(1, plan.totalWeight + 1);
    let cumulativeWeight = 0;
    selectedEntry = plan.entries.find((entry) => {
      cumulativeWeight += Number(entry.weight || 1);
      return draw <= cumulativeWeight;
    });
    rollResult = `weighted draw ${draw}/${plan.totalWeight}`;
  }

  let result = null;
  if (selectedEntry) {
    result = createSimulationResult(
      cycleId,
      selectedEntry.id,
      selectedEntry.name,
      selectedEntry.description,
      selectedEntry.category,
      eventDate,
      '',
      '',
      rollResult
    );
  }
  db.prepare(`
    INSERT INTO simulation_rolls (id, cycle_id, group_name, roll_result, event_table_id, result_id)
    VALUES (@id, @cycle_id, @group_name, @roll_result, @event_table_id, @result_id)
  `).run({
    id: crypto.randomUUID(),
    cycle_id: cycleId,
    group_name: plan.groupName,
    roll_result: rollResult,
    event_table_id: selectedEntry?.id || null,
    result_id: result?.id || null
  });
  return result;
}

function createSimulationResult(cycleId, eventTableId, title, description, category, eventDate, locationName, involvedText, rollResult, status = 'pending') {
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO simulation_results (id, cycle_id, table_id, title, description, category, event_date, location_name, involved_text, roll_result, status, updated_at)
    VALUES (@id, @cycle_id, @table_id, @title, @description, @category, @event_date, @location_name, @involved_text, @roll_result, @status, CURRENT_TIMESTAMP)
  `).run({
    id,
    cycle_id: cycleId,
    table_id: eventTableId,
    title,
    description,
    category,
    event_date: eventDate,
    location_name: locationName || '',
    involved_text: involvedText || '',
    roll_result: rollResult || '',
    status
  });
  return db.prepare('SELECT * FROM simulation_results WHERE id = ?').get(id);
}

function listSimulationResults(cycleId) {
  return db.prepare('SELECT * FROM simulation_results WHERE cycle_id = ? ORDER BY created_at DESC').all(cycleId);
}

function listSimulationRolls(cycleId) {
  return db.prepare('SELECT * FROM simulation_rolls WHERE cycle_id = ? ORDER BY created_at ASC').all(cycleId);
}

function getSimulationResult(id) {
  return db.prepare(`
    SELECT simulation_results.*, simulation_event_tables.group_name AS table_group, simulation_cycles.new_date AS cycle_date
    FROM simulation_results
    LEFT JOIN simulation_event_tables ON simulation_event_tables.id = simulation_results.table_id
    LEFT JOIN simulation_cycles ON simulation_cycles.id = simulation_results.cycle_id
    WHERE simulation_results.id = ?
  `).get(id) || null;
}

function updateSimulationResult(id, changes) {
  const current = getSimulationResult(id);
  if (!current) return null;
  if (!['pending', 'postponed'].includes(current.status)) {
    const error = simulationTableValidationError('Only pending or postponed developments can be edited.');
    error.statusCode = 409;
    throw error;
  }
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
    throw simulationTableValidationError('Development changes must be an object.');
  }

  const fields = {
    title: changes.title === undefined ? current.title : changes.title,
    description: changes.description === undefined ? current.description : changes.description,
    category: changes.category === undefined ? current.category : changes.category,
    event_date: changes.eventDate === undefined ? current.event_date : changes.eventDate,
    location_name: changes.locationName === undefined ? current.location_name : changes.locationName,
    involved_text: changes.involvedText === undefined ? current.involved_text : changes.involvedText
  };
  if (typeof fields.title !== 'string' || !fields.title.trim() || fields.title.length > 200) {
    throw simulationTableValidationError('A development title of 1 to 200 characters is required.');
  }
  for (const [field, value] of Object.entries(fields)) {
    if (typeof value !== 'string') {
      throw simulationTableValidationError(`Development ${field.replaceAll('_', ' ')} must be text.`);
    }
    if (value.length > 4000) {
      throw simulationTableValidationError(`Development ${field.replaceAll('_', ' ')} cannot exceed 4000 characters.`);
    }
  }
  db.prepare(`
    UPDATE simulation_results SET
      title = @title,
      description = @description,
      category = @category,
      event_date = @event_date,
      location_name = @location_name,
      involved_text = @involved_text,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run({ id, ...fields });
  return getSimulationResult(id);
}

function decideSimulationResult(id, decision) {
  const current = getSimulationResult(id);
  if (!current) return null;
  if (!['approve', 'reject', 'postpone'].includes(decision)) {
    throw simulationTableValidationError('Choose approve, reject, or postpone.');
  }
  if (!['pending', 'postponed'].includes(current.status)) {
    const error = simulationTableValidationError('This development already has a final decision.');
    error.statusCode = 409;
    throw error;
  }

  const transaction = db.transaction(() => {
    let timelineEventId = null;
    if (decision === 'approve') {
      timelineEventId = crypto.randomUUID();
      const summaryParts = [current.description].filter(Boolean);
      if (current.location_name) summaryParts.push(`Location: ${current.location_name}`);
      if (current.involved_text) summaryParts.push(`Involved: ${current.involved_text}`);
      if (current.roll_result) summaryParts.push(`Simulation roll: ${current.roll_result}`);
      summaryParts.push(`Approved from ${current.table_group || 'simulation'} during the cycle ending ${current.cycle_date || current.event_date || 'an unknown date'}.`);
      db.prepare(`
        INSERT INTO timeline_events (id, title, category, event_date, summary, updated_at)
        VALUES (@id, @title, @category, @event_date, @summary, CURRENT_TIMESTAMP)
      `).run({
        id: timelineEventId,
        title: current.title,
        category: current.category || '',
        event_date: current.event_date || current.cycle_date || '',
        summary: summaryParts.join('\n')
      });
    }
    const status = decision === 'approve' ? 'approved' : (decision === 'reject' ? 'rejected' : 'postponed');
    db.prepare(`
      UPDATE simulation_results
      SET status = @status, decided_at = CURRENT_TIMESTAMP, timeline_event_id = @timeline_event_id, updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `).run({ id, status, timeline_event_id: timelineEventId });
  });
  transaction();
  return getSimulationResult(id);
}

function listQuests() {
  return db.prepare(`
    SELECT
      quests.*,
      locations.name AS location_name
    FROM quests
    LEFT JOIN locations ON locations.id = quests.location_id
    ORDER BY quests.name COLLATE NOCASE ASC
  `).all();
}

function getQuest(id) {
  return db.prepare(`
    SELECT
      quests.*,
      locations.name AS location_name
    FROM quests
    LEFT JOIN locations ON locations.id = quests.location_id
    WHERE quests.id = ?
  `).get(id) || null;
}

function validateQuest(quest) {
  if (typeof quest.name !== 'string' || !quest.name.trim()) {
    throw questValidationError('A quest name is required.');
  }
  if (quest.name.length > 160) {
    throw questValidationError('Quest names cannot exceed 160 characters.');
  }
  if (quest.status && typeof quest.status !== 'string') {
    throw questValidationError('Quest status must be text.');
  }
  if (quest.summary !== undefined && quest.summary !== null && typeof quest.summary !== 'string') {
    throw questValidationError('Quest summary must be text.');
  }
  if (quest.giver !== undefined && quest.giver !== null && typeof quest.giver !== 'string') {
    throw questValidationError('Quest giver must be text.');
  }
  if (quest.location_id && !db.prepare('SELECT 1 FROM locations WHERE id = ?').get(quest.location_id)) {
    throw questValidationError('The chosen location does not exist.');
  }
}

function createQuest(quest) {
  if (!quest || typeof quest !== 'object' || Array.isArray(quest)) {
    throw questValidationError('Quest data must be an object.');
  }
  const record = {
    id: crypto.randomUUID(),
    name: String(quest.name || '').trim(),
    status: quest.status ?? 'undiscovered',
    summary: quest.summary ?? '',
    giver: quest.giver ?? '',
    location_id: quest.location_id ?? null
  };
  validateQuest(record);

  db.prepare(`
    INSERT INTO quests (id, name, status, summary, giver, location_id, updated_at)
    VALUES (@id, @name, @status, @summary, @giver, @location_id, CURRENT_TIMESTAMP)
  `).run(record);

  return getQuest(record.id);
}

function updateQuest(id, quest) {
  const current = getQuest(id);
  if (!current) return null;
  if (!quest || typeof quest !== 'object' || Array.isArray(quest)) {
    throw questValidationError('Quest data must be an object.');
  }
  const record = {
    id,
    name: quest.name === undefined ? current.name : String(quest.name).trim(),
    status: quest.status === undefined ? current.status : (quest.status ?? 'undiscovered'),
    summary: quest.summary === undefined ? current.summary : (quest.summary ?? ''),
    giver: quest.giver === undefined ? current.giver : (quest.giver ?? ''),
    location_id: quest.location_id === undefined ? current.location_id : (quest.location_id || null)
  };
  validateQuest(record);

  db.prepare(`
    UPDATE quests SET
      name = @name,
      status = @status,
      summary = @summary,
      giver = @giver,
      location_id = @location_id,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run(record);

  return getQuest(id);
}

function deleteQuest(id) {
  const quest = getQuest(id);
  if (!quest) return null;
  db.prepare('DELETE FROM quests WHERE id = ?').run(id);
  return quest;
}

function listSessions() {
  return db.prepare('SELECT * FROM sessions ORDER BY session_number ASC, created_at ASC').all();
}

function getSession(id) {
  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) || null;
}

function validateSession(session) {
  if (session.session_number !== undefined && session.session_number !== null && (!Number.isInteger(Number(session.session_number)) || Number(session.session_number) < 1)) {
    throw sessionValidationError('Session numbers must be positive integers.');
  }
  if (session.campaign_date !== undefined && session.campaign_date !== null && typeof session.campaign_date !== 'string') {
    throw sessionValidationError('Campaign date must be text.');
  }
  if (session.summary !== undefined && session.summary !== null && typeof session.summary !== 'string') {
    throw sessionValidationError('Session summary must be text.');
  }
}

function createSession(session) {
  if (!session || typeof session !== 'object' || Array.isArray(session)) {
    throw sessionValidationError('Session data must be an object.');
  }
  const record = {
    id: crypto.randomUUID(),
    session_number: session.session_number === undefined ? null : Number(session.session_number),
    campaign_date: session.campaign_date ?? '',
    summary: session.summary ?? ''
  };
  validateSession(record);

  db.prepare(`
    INSERT INTO sessions (id, session_number, campaign_date, summary, updated_at)
    VALUES (@id, @session_number, @campaign_date, @summary, CURRENT_TIMESTAMP)
  `).run(record);

  return getSession(record.id);
}

function updateSession(id, session) {
  const current = getSession(id);
  if (!current) return null;
  if (!session || typeof session !== 'object' || Array.isArray(session)) {
    throw sessionValidationError('Session data must be an object.');
  }
  const record = {
    id,
    session_number: session.session_number === undefined ? current.session_number : Number(session.session_number),
    campaign_date: session.campaign_date === undefined ? current.campaign_date : (session.campaign_date ?? ''),
    summary: session.summary === undefined ? current.summary : (session.summary ?? '')
  };
  validateSession(record);

  db.prepare(`
    UPDATE sessions SET
      session_number = @session_number,
      campaign_date = @campaign_date,
      summary = @summary,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run(record);

  return getSession(id);
}

function deleteSession(id) {
  const session = getSession(id);
  if (!session) return null;
  db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  return session;
}

function listPlayerDiscoveries() {
  return db.prepare(`
    SELECT * FROM player_discoveries
    ORDER BY visible_to_players ASC, title COLLATE NOCASE ASC
  `).all();
}

function getPlayerDiscovery(id) {
  return db.prepare('SELECT * FROM player_discoveries WHERE id = ?').get(id) || null;
}

function validatePlayerDiscovery(discovery) {
  if (typeof discovery.title !== 'string' || !discovery.title.trim()) {
    throw discoveryValidationError('A discovery title is required.');
  }
  if (discovery.title.length > 200) {
    throw discoveryValidationError('Discovery titles cannot exceed 200 characters.');
  }
  for (const [field, label, maxLength] of [
    ['category', 'Discovery category', 100],
    ['details', 'Discovery details', 4000]
  ]) {
    if (discovery[field] !== undefined && discovery[field] !== null && typeof discovery[field] !== 'string') {
      throw discoveryValidationError(`${label} must be text.`);
    }
    if (typeof discovery[field] === 'string' && discovery[field].length > maxLength) {
      throw discoveryValidationError(`${label} cannot exceed ${maxLength} characters.`);
    }
  }
  if (discovery.visible_to_players !== 0 && discovery.visible_to_players !== 1) {
    throw discoveryValidationError('Player visibility must be true or false.');
  }
}

function createPlayerDiscovery(discovery) {
  if (!discovery || typeof discovery !== 'object' || Array.isArray(discovery)) {
    throw discoveryValidationError('Discovery data must be an object.');
  }
  const record = {
    id: crypto.randomUUID(),
    title: typeof discovery.title === 'string' ? discovery.title.trim() : (discovery.title ?? ''),
    category: discovery.category ?? '',
    details: discovery.details ?? '',
    visible_to_players: normalizeDiscoveryVisibility(discovery.visible_to_players, 0)
  };
  validatePlayerDiscovery(record);
  db.prepare(`
    INSERT INTO player_discoveries (id, title, category, details, visible_to_players, updated_at)
    VALUES (@id, @title, @category, @details, @visible_to_players, CURRENT_TIMESTAMP)
  `).run(record);
  return getPlayerDiscovery(record.id);
}

function updatePlayerDiscovery(id, discovery) {
  const current = getPlayerDiscovery(id);
  if (!current) return null;
  if (!discovery || typeof discovery !== 'object' || Array.isArray(discovery)) {
    throw discoveryValidationError('Discovery data must be an object.');
  }
  const record = {
    id,
    title: discovery.title === undefined
      ? current.title
      : (typeof discovery.title === 'string' ? discovery.title.trim() : (discovery.title ?? '')),
    category: discovery.category === undefined ? current.category : (discovery.category ?? ''),
    details: discovery.details === undefined ? current.details : (discovery.details ?? ''),
    visible_to_players: discovery.visible_to_players === undefined
      ? current.visible_to_players
      : normalizeDiscoveryVisibility(discovery.visible_to_players, current.visible_to_players)
  };
  validatePlayerDiscovery(record);
  db.prepare(`
    UPDATE player_discoveries SET
      title = @title,
      category = @category,
      details = @details,
      visible_to_players = @visible_to_players,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run(record);
  return getPlayerDiscovery(id);
}

function deletePlayerDiscovery(id) {
  const discovery = getPlayerDiscovery(id);
  if (!discovery) return null;
  db.prepare('DELETE FROM player_discoveries WHERE id = ?').run(id);
  return discovery;
}

function listTimelineEvents() {
  return db.prepare('SELECT * FROM timeline_events ORDER BY event_date COLLATE NOCASE ASC, created_at ASC').all();
}

function getTimelineEvent(id) {
  return db.prepare('SELECT * FROM timeline_events WHERE id = ?').get(id) || null;
}

function validateTimelineEvent(event) {
  if (typeof event.title !== 'string' || !event.title.trim()) {
    throw timelineValidationError('A timeline title is required.');
  }
  if (event.title.length > 200) {
    throw timelineValidationError('Timeline titles cannot exceed 200 characters.');
  }
  if (event.category !== undefined && event.category !== null && typeof event.category !== 'string') {
    throw timelineValidationError('Timeline category must be text.');
  }
  if (event.event_date !== undefined && event.event_date !== null && typeof event.event_date !== 'string') {
    throw timelineValidationError('Timeline event dates must be text.');
  }
  if (event.summary !== undefined && event.summary !== null && typeof event.summary !== 'string') {
    throw timelineValidationError('Timeline summary must be text.');
  }
}

function createTimelineEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    throw timelineValidationError('Timeline event data must be an object.');
  }
  const record = {
    id: crypto.randomUUID(),
    title: String(event.title || '').trim(),
    category: event.category ?? '',
    event_date: event.event_date ?? '',
    summary: event.summary ?? ''
  };
  validateTimelineEvent(record);

  db.prepare(`
    INSERT INTO timeline_events (id, title, category, event_date, summary, updated_at)
    VALUES (@id, @title, @category, @event_date, @summary, CURRENT_TIMESTAMP)
  `).run(record);

  return getTimelineEvent(record.id);
}

function updateTimelineEvent(id, event) {
  const current = getTimelineEvent(id);
  if (!current) return null;
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    throw timelineValidationError('Timeline event data must be an object.');
  }
  const record = {
    id,
    title: event.title === undefined ? current.title : String(event.title).trim(),
    category: event.category === undefined ? current.category : (event.category ?? ''),
    event_date: event.event_date === undefined ? current.event_date : (event.event_date ?? ''),
    summary: event.summary === undefined ? current.summary : (event.summary ?? '')
  };
  validateTimelineEvent(record);

  db.prepare(`
    UPDATE timeline_events SET
      title = @title,
      category = @category,
      event_date = @event_date,
      summary = @summary,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run(record);

  return getTimelineEvent(id);
}

function deleteTimelineEvent(id) {
  const event = getTimelineEvent(id);
  if (!event) return null;
  db.prepare('DELETE FROM timeline_events WHERE id = ?').run(id);
  return event;
}

function listSimulationEvents() {
  return db.prepare('SELECT * FROM simulation_events ORDER BY date COLLATE NOCASE ASC, created_at ASC').all();
}

function getSimulationEvent(id) {
  return db.prepare('SELECT * FROM simulation_events WHERE id = ?').get(id) || null;
}

function validateSimulationEvent(event) {
  if (typeof event.title !== 'string' || !event.title.trim()) {
    throw simulationValidationError('A simulation title is required.');
  }
  if (event.title.length > 200) {
    throw simulationValidationError('Simulation titles cannot exceed 200 characters.');
  }
  if (event.category !== undefined && event.category !== null && typeof event.category !== 'string') {
    throw simulationValidationError('Simulation category must be text.');
  }
  if (event.date !== undefined && event.date !== null && typeof event.date !== 'string') {
    throw simulationValidationError('Simulation dates must be text.');
  }
  if (event.status !== undefined && event.status !== null && typeof event.status !== 'string') {
    throw simulationValidationError('Simulation status must be text.');
  }
  if (event.details !== undefined && event.details !== null && typeof event.details !== 'string') {
    throw simulationValidationError('Simulation details must be text.');
  }
}

function createSimulationEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    throw simulationValidationError('Simulation event data must be an object.');
  }
  const record = {
    id: crypto.randomUUID(),
    title: String(event.title || '').trim(),
    category: event.category ?? '',
    date: event.date ?? '',
    status: event.status ?? 'proposed',
    details: event.details ?? ''
  };
  validateSimulationEvent(record);

  db.prepare(`
    INSERT INTO simulation_events (id, title, category, date, status, details, updated_at)
    VALUES (@id, @title, @category, @date, @status, @details, CURRENT_TIMESTAMP)
  `).run(record);

  return getSimulationEvent(record.id);
}

function updateSimulationEvent(id, event) {
  const current = getSimulationEvent(id);
  if (!current) return null;
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    throw simulationValidationError('Simulation event data must be an object.');
  }
  const record = {
    id,
    title: event.title === undefined ? current.title : String(event.title).trim(),
    category: event.category === undefined ? current.category : (event.category ?? ''),
    date: event.date === undefined ? current.date : (event.date ?? ''),
    status: event.status === undefined ? current.status : (event.status ?? 'proposed'),
    details: event.details === undefined ? current.details : (event.details ?? '')
  };
  validateSimulationEvent(record);

  db.prepare(`
    UPDATE simulation_events SET
      title = @title,
      category = @category,
      date = @date,
      status = @status,
      details = @details,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run(record);

  return getSimulationEvent(id);
}

function deleteSimulationEvent(id) {
  const event = getSimulationEvent(id);
  if (!event) return null;
  db.prepare('DELETE FROM simulation_events WHERE id = ?').run(id);
  return event;
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

function normalizeDiscoveryVisibility(value, defaultValue) {
  if (value === undefined) return defaultValue ? 1 : 0;
  if (value === true || value === 1) return 1;
  if (value === false || value === 0) return 0;
  throw discoveryValidationError('Player visibility must be true or false.');
}

function validateNormalizedCoordinate(value, axis) {
  const coordinate = Number(value);
  if (!Number.isFinite(coordinate) || coordinate < 0 || coordinate > 1) {
    throw mapValidationError(`The marker ${axis} coordinate must be between 0 and 1.`);
  }
  return coordinate;
}

function npcValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function factionValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function shopValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function questValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function sessionValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function timelineValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function discoveryValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function simulationValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function simulationTableValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function shopInventoryValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
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
  ...campaignDataService,
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
  listNpcs,
  getNpc,
  createNpc,
  updateNpc,
  deleteNpc,
  listNpcRelationships,
  getNpcRelationship,
  createNpcRelationship,
  deleteNpcRelationship,
  listFactions,
  getFaction,
  createFaction,
  updateFaction,
  deleteFaction,
  listShops,
  getShop,
  createShop,
  updateShop,
  deleteShop,
  listShopInventory,
  getShopInventoryItem,
  createShopInventoryItem,
  updateShopInventoryItem,
  deleteShopInventoryItem,
  listEventTables,
  getEventTable,
  createEventTable,
  updateEventTable,
  deleteEventTable,
  listSimulationCycles,
  listSimulationRolls,
  getCampaignCalendar,
  saveCampaignCalendar,
  advanceCampaignTime,
  getSimulationResult,
  updateSimulationResult,
  decideSimulationResult,
  createSimulationResult,
  listSimulationResults,
  listQuests,
  getQuest,
  createQuest,
  updateQuest,
  deleteQuest,
  listSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  listPlayerDiscoveries,
  getPlayerDiscovery,
  createPlayerDiscovery,
  updatePlayerDiscovery,
  deletePlayerDiscovery,
  listTimelineEvents,
  getTimelineEvent,
  createTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
  listSimulationEvents,
  getSimulationEvent,
  createSimulationEvent,
  updateSimulationEvent,
  deleteSimulationEvent,
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

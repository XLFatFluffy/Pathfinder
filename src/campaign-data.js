const { normalizeCalendarMonths, parseCampaignDate } = require('./calendar');

const FORMAT = 'pathfinder-campaign';
const SCHEMA_VERSION = 1;
const CATEGORY_TABLES = {
  world: ['locations', 'maps', 'map_markers'],
  people: ['houses', 'npcs', 'factions', 'npc_relationships'],
  commerce: ['shops', 'shop_inventory'],
  campaign: ['quests', 'sessions', 'timeline_events', 'simulation_events', 'player_discoveries'],
  simulation: ['simulation_event_tables', 'simulation_cycles', 'simulation_results', 'simulation_rolls']
};
const SETTINGS_KEYS = [
  'app_name',
  'campaign_name',
  'gm_name',
  'campaign_date',
  'calendar_months',
  'player_display_mode'
];
const IMPORT_ORDER = Object.values(CATEGORY_TABLES).flat();
const RELATIONSHIPS = {
  locations: { parent_id: 'locations', map_id: 'maps' },
  maps: { parent_id: 'maps' },
  npcs: { location_id: 'locations', house_id: 'houses' },
  npc_relationships: { npc_id: 'npcs', related_npc_id: 'npcs' },
  shops: { location_id: 'locations', shopkeeper_id: 'npcs' },
  map_markers: { map_id: 'maps', location_id: 'locations' },
  shop_inventory: { shop_id: 'shops' },
  simulation_results: {
    cycle_id: 'simulation_cycles',
    table_id: 'simulation_event_tables',
    timeline_event_id: 'timeline_events'
  },
  simulation_rolls: {
    cycle_id: 'simulation_cycles',
    event_table_id: 'simulation_event_tables',
    result_id: 'simulation_results'
  },
  quests: { location_id: 'locations' }
};
const NATURAL_KEYS = {
  locations: ['name', 'parent_id'],
  maps: ['name', 'parent_id'],
  houses: ['name'],
  npcs: ['name'],
  npc_relationships: ['npc_id', 'related_npc_id'],
  factions: ['name'],
  shops: ['name', 'location_id'],
  shop_inventory: ['shop_id', 'item_name'],
  simulation_event_tables: ['name'],
  map_markers: ['map_id', 'location_id'],
  quests: ['name'],
  timeline_events: ['title', 'event_date'],
  simulation_events: ['title', 'date'],
  player_discoveries: ['title', 'category']
};

function createCampaignDataService(database, getSettings, saveSetting) {
  const tableColumns = new Map();

  function columnsFor(table) {
    if (!tableColumns.has(table)) {
      tableColumns.set(table, database.prepare(`PRAGMA table_info(${table})`).all());
    }
    return tableColumns.get(table);
  }

  function validateCategorySelection(categories) {
    if (!Array.isArray(categories) || categories.length === 0) {
      throw dataError('Choose at least one campaign category to export.');
    }
    const invalid = categories.filter((category) => !Object.hasOwn(CATEGORY_TABLES, category));
    if (invalid.length) {
      throw dataError(`Unknown export category: ${invalid.join(', ')}.`);
    }
    return [...new Set(categories)];
  }

  function exportCampaignData(selectedCategories = Object.keys(CATEGORY_TABLES)) {
    const categories = validateCategorySelection(selectedCategories);
    const records = {};
    for (const category of categories) {
      for (const table of CATEGORY_TABLES[category]) {
        records[table] = database.prepare(`SELECT * FROM ${table} ORDER BY id`).all().map((row) => {
          if (table !== 'maps') return row;
          const { file_path: _localArtworkPath, ...portableMap } = row;
          return portableMap;
        });
      }
    }

    const settings = getSettings();
    return {
      format: FORMAT,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      includedCategories: categories,
      settings: Object.fromEntries(SETTINGS_KEYS
        .filter((key) => settings[key] !== undefined)
        .map((key) => [key, settings[key]])),
      records,
      notes: [
        'GM-only notes and secrets are included in this export.',
        'Map artwork is not embedded; the map records retain artwork metadata, but local file paths are omitted.'
      ]
    };
  }

  function previewCampaignImport(payload, options = {}) {
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      throw dataError('Import options must be a JSON object.');
    }
    const { overwriteSettings = false } = options;
    validateEnvelope(payload);
    if (typeof overwriteSettings !== 'boolean') {
      throw dataError('The overwrite-settings option must be true or false.');
    }
    const plannedRecords = [];
    const report = {
      format: FORMAT,
      schemaVersion: SCHEMA_VERSION,
      categories: {},
      settings: { added: [], unchanged: [], conflicts: [] },
      records: { insert: 0, duplicate: 0, conflict: 0 },
      canImport: false,
      overwriteSettings
    };

    const recordCollections = payload.records || {};
    const categoryForTable = new Map(Object.entries(CATEGORY_TABLES)
      .flatMap(([category, tables]) => tables.map((table) => [table, category])));
    for (const table of Object.keys(recordCollections)) {
      if (!IMPORT_ORDER.includes(table)) {
        throw dataError(`The import contains an unsupported record collection: ${table}.`);
      }
      if (!payload.includedCategories.includes(categoryForTable.get(table))) {
        throw dataError(`The "${table}" collection is present, but its category is not marked as included.`);
      }
    }

    const seenRecordIds = new Map();
    const seenNaturalKeys = new Map();
    const existingNaturalKeyIndexes = new Map();
    for (const [category, tables] of Object.entries(CATEGORY_TABLES)) {
      if (!payload.includedCategories.includes(category)) continue;
      const categoryReport = { insert: 0, duplicate: 0, conflict: 0 };
      for (const table of tables) {
        const rows = recordCollections[table] ?? [];
        if (!Array.isArray(rows)) {
          throw dataError(`The "${table}" collection must be an array.`);
        }
        for (const row of rows) {
          plannedRecords.push(classifyRecord(
            table,
            row,
            category,
            seenRecordIds,
            seenNaturalKeys,
            existingNaturalKeyIndexes
          ));
        }
      }
      report.categories[category] = categoryReport;
    }

    let dependencyChanged;
    do {
      dependencyChanged = false;
      for (const item of plannedRecords) {
        if (item.state === 'insert') {
          for (const [field, referencedTable] of Object.entries(RELATIONSHIPS[item.table] || {})) {
            const referencedId = item.row[field];
            if (referencedId && !recordExistsOrWillImport(database, referencedTable, referencedId, plannedRecords)) {
              item.state = 'conflict';
              item.reason = `${field} references a record that is not present or eligible for import.`;
              dependencyChanged = true;
              break;
            }
          }
        }
      }
    } while (dependencyChanged);

    for (const item of plannedRecords) {
      const counts = report.categories[item.category];
      counts[item.state] += 1;
      report.records[item.state] += 1;
    }

    const existingSettings = getSettings();
    validateImportedSettings(payload.settings, existingSettings);
    for (const [key, value] of Object.entries(payload.settings || {})) {
      if (!SETTINGS_KEYS.includes(key)) {
        report.settings.conflicts.push({ key, reason: 'Unsupported setting.' });
        continue;
      }
      const existing = existingSettings[key];
      if (existing === undefined) {
        report.settings.added.push(key);
      } else if (String(existing) === String(value)) {
        report.settings.unchanged.push(key);
      } else {
        report.settings.conflicts.push({ key, reason: 'The current setting differs from the imported setting.' });
      }
    }
    report.canImport = report.records.insert > 0
      || report.settings.added.length > 0
      || (overwriteSettings && report.settings.conflicts.some(({ key }) => SETTINGS_KEYS.includes(key)));

    const importDetails = plannedRecords
      .filter((item) => item.state !== 'insert')
      .map(({ table, row, state, reason }) => ({
        collection: table,
        id: row?.id || '',
        name: recordLabel(table, row),
        status: state,
        reason
      }));
    report.details = importDetails.slice(0, 100);
    report.detailsTruncated = Math.max(0, importDetails.length - report.details.length);
    return { report, plannedRecords };
  }

  function importCampaignData(payload, options = {}) {
    const { report, plannedRecords } = previewCampaignImport(payload, options);
    if (!report.canImport) {
      throw dataError('There are no new, non-conflicting campaign records or settings to import.');
    }

    const transaction = database.transaction(() => {
      for (const item of plannedRecords) {
        if (item.state === 'insert') insertRecord(item.table, item.row);
      }

      const currentSettings = getSettings();
      for (const [key, value] of Object.entries(payload.settings || {})) {
        if (!SETTINGS_KEYS.includes(key)) continue;
        if (currentSettings[key] === undefined || (options.overwriteSettings && String(currentSettings[key]) !== String(value))) {
          saveSetting(key, value);
        }
      }
    });

    transaction();
    return report;
  }

  function classifyRecord(table, row, category, seenRecordIds, seenNaturalKeys, existingNaturalKeyIndexes) {
    const item = { table, row, category, state: 'insert', reason: '' };
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      item.state = 'conflict';
      item.reason = 'Record must be a JSON object.';
      return item;
    }

    const columns = columnsFor(table);
    const allowedColumns = new Set(columns.map(({ name }) => name));
    for (const key of Object.keys(row)) {
      if (key === 'file_path' && table === 'maps') continue;
      if (!allowedColumns.has(key)) {
        item.state = 'conflict';
        item.reason = `Unsupported field "${key}".`;
        return item;
      }
    }

    for (const column of columns) {
      if (column.notnull && column.dflt_value === null && row[column.name] === undefined) {
        item.state = 'conflict';
        item.reason = `Required field "${column.name}" is missing.`;
        return item;
      }
      if (row[column.name] !== undefined && row[column.name] !== null && !isValidColumnValue(row[column.name], column.type)) {
        item.state = 'conflict';
        item.reason = `Field "${column.name}" has an invalid value type.`;
        return item;
      }
    }
    if (typeof row.id !== 'string' || !row.id.trim()) {
      item.state = 'conflict';
      item.reason = 'A stable record ID is required.';
      return item;
    }

    const seenIdsForTable = seenRecordIds.get(table) || new Map();
    const sameImportId = seenIdsForTable.get(row.id);
    if (sameImportId) {
      item.state = recordsMatch(sameImportId, row, columnsFor(table)) ? 'duplicate' : 'conflict';
      item.reason = item.state === 'duplicate'
        ? 'This record ID appears more than once in the import.'
        : 'This record ID appears more than once with different data in the import.';
      return item;
    }
    seenIdsForTable.set(row.id, row);
    seenRecordIds.set(table, seenIdsForTable);

    const existing = database.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(row.id);
    if (existing) {
      item.state = recordsMatch(existing, row, columnsFor(table)) ? 'duplicate' : 'conflict';
      item.reason = item.state === 'duplicate'
        ? 'This record ID already exists with matching data.'
        : 'This record ID already exists with different data; existing data was not changed.';
      return item;
    }

    if (table === 'npc_relationships') {
      if (!['parent', 'sibling', 'spouse', 'former_spouse'].includes(row.relationship_type)) {
        item.state = 'conflict';
        item.reason = 'The family relationship type is not supported.';
        return item;
      }
      const existingPair = database.prepare(`
        SELECT * FROM npc_relationships
        WHERE (npc_id = @npc_id AND related_npc_id = @related_npc_id)
           OR (npc_id = @related_npc_id AND related_npc_id = @npc_id)
      `).get(row);
      if (existingPair) {
        item.state = recordsMatch(existingPair, row, columnsFor(table)) ? 'duplicate' : 'conflict';
        item.reason = item.state === 'duplicate'
          ? 'This family relationship already exists.'
          : 'A different family relationship already exists between these NPCs.';
        return item;
      }
      const pairKey = JSON.stringify([row.npc_id, row.related_npc_id].sort());
      let seenPairs = seenNaturalKeys.get(table);
      if (!seenPairs) {
        seenPairs = new Map();
        seenNaturalKeys.set(table, seenPairs);
      }
      const priorPair = seenPairs.get(pairKey);
      if (priorPair) {
        item.state = recordsMatch(priorPair, row, columnsFor(table)) ? 'duplicate' : 'conflict';
        item.reason = item.state === 'duplicate'
          ? 'This family relationship appears more than once in the import.'
          : 'Conflicting family relationships between these NPCs appear in the import.';
        return item;
      }
      seenPairs.set(pairKey, row);
      return item;
    }

    const naturalKey = NATURAL_KEYS[table];
    if (naturalKey && naturalKey.every((field) => row[field] !== undefined)
        && String(row[naturalKey[0]] ?? '').trim()) {
      const key = JSON.stringify(naturalKey.map((field) => normalizeValue(row[field])));
      const seenKeysForTable = seenNaturalKeys.get(table) || new Set();
      if (seenKeysForTable.has(key)) {
        item.state = 'duplicate';
        item.reason = `A record with the same ${naturalKey.join(' and ')} appears more than once in the import.`;
        return item;
      }
      seenKeysForTable.add(key);
      seenNaturalKeys.set(table, seenKeysForTable);

      let existingKeys = existingNaturalKeyIndexes.get(table);
      if (!existingKeys) {
        existingKeys = new Set(database.prepare(`SELECT * FROM ${table}`).all().map((record) => (
          JSON.stringify(naturalKey.map((field) => normalizeValue(record[field])))
        )));
        existingNaturalKeyIndexes.set(table, existingKeys);
      }
      if (existingKeys.has(key)) {
        item.state = 'duplicate';
        item.reason = `A record with the same ${naturalKey.join(' and ')} already exists under a different ID.`;
      }
    }
    return item;
  }

  function insertRecord(table, row) {
    const columns = columnsFor(table)
      .map(({ name }) => name)
      .filter((name) => name !== 'file_path' && row[name] !== undefined);
    const placeholders = columns.map((column) => `@${column}`).join(', ');
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    database.prepare(sql).run(Object.fromEntries(columns.map((column) => [column, row[column]])));
  }

  return { exportCampaignData, previewCampaignImport, importCampaignData };
}

function validateEnvelope(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw dataError('The selected file must contain a Pathfinder campaign JSON object.');
  }
  if (payload.format !== FORMAT) {
    throw dataError(`This is not a ${FORMAT} export.`);
  }
  if (payload.schemaVersion !== SCHEMA_VERSION) {
    throw dataError(`Unsupported campaign JSON schema version: ${payload.schemaVersion}.`);
  }
  if (typeof payload.exportedAt !== 'string' || Number.isNaN(Date.parse(payload.exportedAt))) {
    throw dataError('The export must include a valid export timestamp.');
  }
  if (!Array.isArray(payload.includedCategories)
      || payload.includedCategories.length === 0
      || payload.includedCategories.some((category) => !Object.hasOwn(CATEGORY_TABLES, category))) {
    throw dataError('The export must list at least one supported campaign category.');
  }
  if (new Set(payload.includedCategories).size !== payload.includedCategories.length) {
    throw dataError('The export contains a duplicate campaign category.');
  }
  if (!payload.records || typeof payload.records !== 'object' || Array.isArray(payload.records)) {
    throw dataError('The export is missing its record collections.');
  }
  if (payload.settings !== undefined && (!payload.settings || typeof payload.settings !== 'object' || Array.isArray(payload.settings))) {
    throw dataError('Campaign settings must be a JSON object.');
  }
}

function validateImportedSettings(settings = {}, existingSettings = {}) {
  for (const [key, value] of Object.entries(settings)) {
    if (!SETTINGS_KEYS.includes(key)) continue;
    if (typeof value !== 'string') {
      throw dataError(`Imported setting "${key}" must be text.`);
    }
  }

  const monthsValue = settings.calendar_months || existingSettings.calendar_months;
  const dateValue = settings.campaign_date || existingSettings.campaign_date;
  if (monthsValue && dateValue) {
    let months;
    try {
      months = normalizeCalendarMonths(JSON.parse(monthsValue));
    } catch (error) {
      throw dataError(`The imported calendar settings are invalid: ${error.message}`);
    }
    try {
      parseCampaignDate(dateValue, months);
    } catch (error) {
      throw dataError(`The imported campaign date is invalid: ${error.message}`);
    }
  }
}

function recordExistsOrWillImport(database, table, id, plannedRecords) {
  if (database.prepare(`SELECT 1 FROM ${table} WHERE id = ?`).get(id) !== undefined) return true;
  return plannedRecords.some((item) => item.table === table && item.row?.id === id && item.state === 'insert');
}

function isValidColumnValue(value, declaredType) {
  const type = String(declaredType || '').toUpperCase();
  if (type.includes('INT') || type.includes('REAL') || type.includes('FLOA') || type.includes('DOUB')) {
    return typeof value === 'number' && Number.isFinite(value);
  }
  if (type.includes('TEXT') || type.includes('CHAR') || type.includes('CLOB')) {
    return typeof value === 'string';
  }
  return ['string', 'number', 'boolean'].includes(typeof value);
}

function recordsMatch(existing, imported, columns) {
  const excluded = new Set(['created_at', 'updated_at', 'file_path']);
  return columns
    .map(({ name }) => name)
    .filter((name) => !excluded.has(name))
    .every((name) => normalizeValue(existing[name]) === normalizeValue(imported[name]));
}

function normalizeValue(value) {
  if (value === undefined || value === null || value === '') return '';
  return String(value);
}

function recordLabel(table, row) {
  if (!row || typeof row !== 'object') return '';
  return row.name || row.title || row.item_name || `${table} ${row.id || ''}`.trim();
}

function dataError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

module.exports = {
  createCampaignDataService,
  campaignDataFormat: FORMAT,
  campaignDataSchemaVersion: SCHEMA_VERSION,
  campaignDataCategories: Object.keys(CATEGORY_TABLES)
};

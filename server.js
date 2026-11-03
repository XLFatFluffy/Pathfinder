const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const {
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
  listHouseRelationships,
  getHouseRelationship,
  createHouseRelationship,
  updateHouseRelationship,
  deleteHouseRelationship,
  listNpcs,
  getNpc,
  createNpc,
  updateNpc,
  deleteNpc,
  listNpcRelationships,
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
  listSimulationCycles,
  getCampaignCalendar,
  saveCampaignCalendar,
  advanceCampaignTime,
  listSimulationRolls,
  listSimulationResults,
  getSimulationResult,
  updateSimulationResult,
  decideSimulationResult,
  exportCampaignData,
  previewCampaignImport,
  importCampaignData,
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
  deleteMapMarker
} = require('./src/db');

const app = express();
const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');
const artworkTypes = {
  'image/png': { extension: '.png', signature: (bytes) => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  'image/jpeg': { extension: '.jpg', signature: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  'image/webp': { extension: '.webp', signature: (bytes) => bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' },
  'image/gif': { extension: '.gif', signature: (bytes) => ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6)) }
};
const upload = multer({
  storage: multer.diskStorage({
    destination: mapStorageDir,
    filename: (req, file, callback) => callback(null, `${crypto.randomUUID()}.upload`)
  }),
  limits: { fileSize: 100 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!artworkTypes[file.mimetype]) {
      const error = new Error('Unsupported map artwork. Use PNG, JPEG, WebP, or GIF.');
      error.statusCode = 400;
      callback(error);
      return;
    }
    callback(null, true);
  }
});

initializeDatabase();

app.use(express.json({ limit: '25mb' }));
app.use('/vendor/leaflet', express.static(path.join(__dirname, 'node_modules', 'leaflet', 'dist')));
app.use(express.static(publicDir));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: getSettings().app_name || 'The World Atlas',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/settings', (req, res) => {
  res.json(getSettings());
});

app.put('/api/settings', (req, res) => {
  const { key, value } = req.body || {};

  if (!key || value === undefined) {
    return res.status(400).json({ error: 'A setting key and value are required.' });
  }

  try {
    const settings = saveSetting(key, value);
    return res.json(settings);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/overview', (req, res) => {
  res.json({
    settings: getSettings(),
    counts: getCounts(),
    lastUpdated: new Date().toISOString()
  });
});

app.get('/api/search', (req, res) => {
  const query = req.query.q || '';
  res.json({ query, results: searchRecords(query) });
});

app.get('/api/backups', (req, res) => {
  res.json({ backups: listBackups() });
});

app.post('/api/backups', (req, res) => {
  try {
    const backup = createBackup();
    res.status(201).json({ backup, message: 'Backup created successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/data/export', (req, res) => {
  try {
    const categories = req.query.categories
      ? String(req.query.categories).split(',').map((category) => category.trim()).filter(Boolean)
      : undefined;
    const data = exportCampaignData(categories);
    const dateStamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Disposition', `attachment; filename="pathfinder-campaign-${dateStamp}.json"`);
    return res.json(data);
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to export campaign data.' });
  }
});

app.post('/api/data/import/preview', (req, res) => {
  try {
    const { payload, options = {} } = req.body || {};
    return res.json(previewCampaignImport(payload, options).report);
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to validate campaign import.' });
  }
});

app.post('/api/data/import', (req, res) => {
  try {
    const { payload, options = {} } = req.body || {};
    const report = importCampaignData(payload, options);
    return res.json({ report });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to import campaign data.' });
  }
});

app.get('/api/houses', (req, res) => {
  res.json({ houses: listHouses() });
});

app.get('/api/houses/:id', (req, res) => {
  const house = getHouse(req.params.id);
  if (!house) {
    return res.status(404).json({ error: 'House not found.' });
  }
  return res.json({ house });
});

app.post('/api/houses', (req, res) => {
  try {
    const house = createHouse(req.body);
    return res.status(201).json({ house });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to create house.' });
  }
});

app.put('/api/houses/:id', (req, res) => {
  try {
    const house = updateHouse(req.params.id, req.body);
    if (!house) {
      return res.status(404).json({ error: 'House not found.' });
    }
    return res.json({ house });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to update house.' });
  }
});

app.delete('/api/houses/:id', (req, res) => {
  try {
    const house = deleteHouse(req.params.id);
    if (!house) {
      return res.status(404).json({ error: 'House not found.' });
    }
    return res.json({ deleted: true });
  } catch (error) {
    if (error.dependents) {
      return res.status(409).json({ error: error.message, dependents: error.dependents });
    }
    console.error(error);
    return res.status(500).json({ error: error.message || 'Unable to delete house.' });
  }
});

app.get('/api/house-relationships', (req, res) => {
  res.json({ relationships: listHouseRelationships() });
});

app.get('/api/house-relationships/:id', (req, res) => {
  const relationship = getHouseRelationship(req.params.id);
  if (!relationship) {
    return res.status(404).json({ error: 'Political relationship not found.' });
  }
  return res.json({ relationship });
});

app.post('/api/house-relationships', (req, res) => {
  try {
    const relationship = createHouseRelationship(req.body || {});
    return res.status(201).json({ relationship });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to create political relationship.' });
  }
});

app.put('/api/house-relationships/:id', (req, res) => {
  try {
    const relationship = updateHouseRelationship(req.params.id, req.body || {});
    if (!relationship) {
      return res.status(404).json({ error: 'Political relationship not found.' });
    }
    return res.json({ relationship });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to update political relationship.' });
  }
});

app.delete('/api/house-relationships/:id', (req, res) => {
  try {
    const relationship = deleteHouseRelationship(req.params.id);
    if (!relationship) {
      return res.status(404).json({ error: 'Political relationship not found.' });
    }
    return res.json({ deleted: true });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to delete political relationship.' });
  }
});

app.get('/api/npcs', (req, res) => {
  res.json({ npcs: listNpcs() });
});

app.get('/api/npcs/:id', (req, res) => {
  const npc = getNpc(req.params.id);
  if (!npc) {
    return res.status(404).json({ error: 'NPC not found.' });
  }
  return res.json({ npc });
});

app.post('/api/npcs', (req, res) => {
  try {
    const npc = createNpc(req.body || {});
    return res.status(201).json({ npc });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to create NPC.' });
  }
});

app.put('/api/npcs/:id', (req, res) => {
  try {
    const npc = updateNpc(req.params.id, req.body || {});
    if (!npc) {
      return res.status(404).json({ error: 'NPC not found.' });
    }
    return res.json({ npc });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to update NPC.' });
  }
});

app.delete('/api/npcs/:id', (req, res) => {
  try {
    const npc = deleteNpc(req.params.id);
    if (!npc) {
      return res.status(404).json({ error: 'NPC not found.' });
    }
    return res.json({ deleted: true });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to delete NPC.' });
  }
});

app.get('/api/npc-relationships', (req, res) => {
  res.json({ relationships: listNpcRelationships() });
});

app.get('/api/npcs/:id/relationships', (req, res) => {
  const npc = getNpc(req.params.id);
  if (!npc) {
    return res.status(404).json({ error: 'NPC not found.' });
  }
  return res.json({ relationships: listNpcRelationships(req.params.id) });
});

app.post('/api/npc-relationships', (req, res) => {
  try {
    const relationship = createNpcRelationship(req.body || {});
    return res.status(201).json({ relationship });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to create family relationship.' });
  }
});

app.delete('/api/npc-relationships/:id', (req, res) => {
  try {
    const relationship = deleteNpcRelationship(req.params.id);
    if (!relationship) {
      return res.status(404).json({ error: 'Family relationship not found.' });
    }
    return res.json({ deleted: true });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to delete family relationship.' });
  }
});

app.get('/api/factions', (req, res) => {
  res.json({ factions: listFactions() });
});

app.get('/api/factions/:id', (req, res) => {
  const faction = getFaction(req.params.id);
  if (!faction) {
    return res.status(404).json({ error: 'Faction not found.' });
  }
  return res.json({ faction });
});

app.post('/api/factions', (req, res) => {
  try {
    const faction = createFaction(req.body || {});
    return res.status(201).json({ faction });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to create faction.' });
  }
});

app.put('/api/factions/:id', (req, res) => {
  try {
    const faction = updateFaction(req.params.id, req.body || {});
    if (!faction) {
      return res.status(404).json({ error: 'Faction not found.' });
    }
    return res.json({ faction });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to update faction.' });
  }
});

app.delete('/api/factions/:id', (req, res) => {
  try {
    const faction = deleteFaction(req.params.id);
    if (!faction) {
      return res.status(404).json({ error: 'Faction not found.' });
    }
    return res.json({ deleted: true });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to delete faction.' });
  }
});

app.get('/api/shops', (req, res) => {
  res.json({ shops: listShops() });
});

app.get('/api/shops/:id', (req, res) => {
  const shop = getShop(req.params.id);
  if (!shop) {
    return res.status(404).json({ error: 'Shop not found.' });
  }
  return res.json({ shop });
});

app.post('/api/shops', (req, res) => {
  try {
    const shop = createShop(req.body || {});
    return res.status(201).json({ shop });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to create shop.' });
  }
});

app.put('/api/shops/:id', (req, res) => {
  try {
    const shop = updateShop(req.params.id, req.body || {});
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found.' });
    }
    return res.json({ shop });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to update shop.' });
  }
});

app.delete('/api/shops/:id', (req, res) => {
  try {
    const shop = deleteShop(req.params.id);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found.' });
    }
    return res.json({ deleted: true });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to delete shop.' });
  }
});

app.get('/api/shops/:id/inventory', (req, res) => {
  const shopId = req.params.id;
  const shop = getShop(shopId);
  if (!shop) {
    return res.status(404).json({ error: 'Shop not found.' });
  }
  return res.json({ inventory: listShopInventory(shopId) });
});

app.post('/api/shops/:id/inventory', (req, res) => {
  const shopId = req.params.id;
  const shop = getShop(shopId);
  if (!shop) {
    return res.status(404).json({ error: 'Shop not found.' });
  }

  try {
    const item = createShopInventoryItem(shopId, req.body || {});
    return res.status(201).json({ item });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to create inventory item.' });
  }
});

app.put('/api/shops/:id/inventory/:inventoryId', (req, res) => {
  const shopId = req.params.id;
  const inventoryId = req.params.inventoryId;
  const shop = getShop(shopId);
  if (!shop) {
    return res.status(404).json({ error: 'Shop not found.' });
  }

  try {
    const item = updateShopInventoryItem(inventoryId, { ...req.body, shop_id: shopId });
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }
    return res.json({ item });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to update inventory item.' });
  }
});

app.delete('/api/shops/:id/inventory/:inventoryId', (req, res) => {
  const shopId = req.params.id;
  const inventoryId = req.params.inventoryId;
  const shop = getShop(shopId);
  if (!shop) {
    return res.status(404).json({ error: 'Shop not found.' });
  }

  try {
    const item = deleteShopInventoryItem(inventoryId);
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }
    return res.json({ deleted: true });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to delete inventory item.' });
  }
});

app.get('/api/simulation/tables', (req, res) => {
  res.json({ tables: listEventTables() });
});

app.get('/api/simulation/tables/:id', (req, res) => {
  const table = getEventTable(req.params.id);
  if (!table) {
    return res.status(404).json({ error: 'Simulation event table not found.' });
  }
  return res.json({ table });
});

app.post('/api/simulation/tables', (req, res) => {
  try {
    const table = createEventTable(req.body || {});
    return res.status(201).json({ table });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to create simulation table.' });
  }
});

app.put('/api/simulation/tables/:id', (req, res) => {
  try {
    const table = updateEventTable(req.params.id, req.body || {});
    if (!table) {
      return res.status(404).json({ error: 'Simulation event table not found.' });
    }
    return res.json({ table });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to update simulation table.' });
  }
});

app.delete('/api/simulation/tables/:id', (req, res) => {
  try {
    const table = deleteEventTable(req.params.id);
    if (!table) {
      return res.status(404).json({ error: 'Simulation event table not found.' });
    }
    return res.json({ deleted: true });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to delete simulation table.' });
  }
});

app.get('/api/simulation/results/:id', (req, res) => {
  const result = getSimulationResult(req.params.id);
  if (!result) {
    return res.status(404).json({ error: 'Simulation development not found.' });
  }
  return res.json({ result });
});

app.put('/api/simulation/results/:id', (req, res) => {
  try {
    const result = updateSimulationResult(req.params.id, req.body || {});
    if (!result) {
      return res.status(404).json({ error: 'Simulation development not found.' });
    }
    return res.json({ result });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to edit simulation development.' });
  }
});

app.post('/api/simulation/results/:id/decision', (req, res) => {
  try {
    const result = decideSimulationResult(req.params.id, req.body?.decision);
    if (!result) {
      return res.status(404).json({ error: 'Simulation development not found.' });
    }
    return res.json({ result });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to record simulation decision.' });
  }
});

app.get('/api/quests', (req, res) => {
  res.json({ quests: listQuests() });
});

app.get('/api/quests/:id', (req, res) => {
  const quest = getQuest(req.params.id);
  if (!quest) {
    return res.status(404).json({ error: 'Quest not found.' });
  }
  return res.json({ quest });
});

app.post('/api/quests', (req, res) => {
  try {
    const quest = createQuest(req.body || {});
    return res.status(201).json({ quest });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to create quest.' });
  }
});

app.put('/api/quests/:id', (req, res) => {
  try {
    const quest = updateQuest(req.params.id, req.body || {});
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found.' });
    }
    return res.json({ quest });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to update quest.' });
  }
});

app.delete('/api/quests/:id', (req, res) => {
  try {
    const quest = deleteQuest(req.params.id);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found.' });
    }
    return res.json({ deleted: true });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to delete quest.' });
  }
});

app.get('/api/sessions', (req, res) => {
  res.json({ sessions: listSessions() });
});

app.get('/api/sessions/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }
  return res.json({ session });
});

app.post('/api/sessions', (req, res) => {
  try {
    const session = createSession(req.body || {});
    return res.status(201).json({ session });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to create session log.' });
  }
});

app.put('/api/sessions/:id', (req, res) => {
  try {
    const session = updateSession(req.params.id, req.body || {});
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    return res.json({ session });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to update session log.' });
  }
});

app.delete('/api/sessions/:id', (req, res) => {
  try {
    const session = deleteSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    return res.json({ deleted: true });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to delete session log.' });
  }
});

app.get('/api/discoveries', (req, res) => {
  res.json({ discoveries: listPlayerDiscoveries() });
});

app.get('/api/discoveries/:id', (req, res) => {
  const discovery = getPlayerDiscovery(req.params.id);
  if (!discovery) {
    return res.status(404).json({ error: 'Player discovery not found.' });
  }
  return res.json({ discovery });
});

app.post('/api/discoveries', (req, res) => {
  try {
    const discovery = createPlayerDiscovery(req.body || {});
    return res.status(201).json({ discovery });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to create player discovery.' });
  }
});

app.put('/api/discoveries/:id', (req, res) => {
  try {
    const discovery = updatePlayerDiscovery(req.params.id, req.body || {});
    if (!discovery) {
      return res.status(404).json({ error: 'Player discovery not found.' });
    }
    return res.json({ discovery });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to update player discovery.' });
  }
});

app.delete('/api/discoveries/:id', (req, res) => {
  try {
    const discovery = deletePlayerDiscovery(req.params.id);
    if (!discovery) {
      return res.status(404).json({ error: 'Player discovery not found.' });
    }
    return res.json({ deleted: true });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to delete player discovery.' });
  }
});

app.get('/api/timeline', (req, res) => {
  res.json({ timeline: listTimelineEvents() });
});

app.get('/api/timeline/:id', (req, res) => {
  const event = getTimelineEvent(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Timeline event not found.' });
  }
  return res.json({ event });
});

app.post('/api/timeline', (req, res) => {
  try {
    const event = createTimelineEvent(req.body || {});
    return res.status(201).json({ event });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to create timeline event.' });
  }
});

app.put('/api/timeline/:id', (req, res) => {
  try {
    const event = updateTimelineEvent(req.params.id, req.body || {});
    if (!event) {
      return res.status(404).json({ error: 'Timeline event not found.' });
    }
    return res.json({ event });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to update timeline event.' });
  }
});

app.delete('/api/timeline/:id', (req, res) => {
  try {
    const event = deleteTimelineEvent(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Timeline event not found.' });
    }
    return res.json({ deleted: true });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to delete timeline event.' });
  }
});

app.get('/api/simulation/clock', (req, res) => {
  const cycles = listSimulationCycles().map((cycle) => ({
    ...cycle,
    results: listSimulationResults(cycle.id),
    rolls: listSimulationRolls(cycle.id)
  }));
  res.json({ calendar: getCampaignCalendar(), cycles });
});

app.put('/api/simulation/clock/calendar', (req, res) => {
  try {
    const calendar = saveCampaignCalendar(req.body?.campaignDate, req.body?.months);
    return res.json({ calendar });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to save the campaign calendar.' });
  }
});

app.post('/api/simulation/clock/advance', (req, res) => {
  try {
    const cycle = advanceCampaignTime(Number(req.body?.amount), req.body?.unit);
    return res.status(201).json({ cycle, calendar: getCampaignCalendar() });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to advance campaign time.' });
  }
});

app.get('/api/simulation', (req, res) => {
  res.json({ simulation: listSimulationEvents() });
});

app.get('/api/simulation/:id', (req, res) => {
  const event = getSimulationEvent(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Simulation event not found.' });
  }
  return res.json({ event });
});

app.post('/api/simulation', (req, res) => {
  try {
    const event = createSimulationEvent(req.body || {});
    return res.status(201).json({ event });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to create simulation event.' });
  }
});

app.put('/api/simulation/:id', (req, res) => {
  try {
    const event = updateSimulationEvent(req.params.id, req.body || {});
    if (!event) {
      return res.status(404).json({ error: 'Simulation event not found.' });
    }
    return res.json({ event });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to update simulation event.' });
  }
});

app.delete('/api/simulation/:id', (req, res) => {
  try {
    const event = deleteSimulationEvent(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Simulation event not found.' });
    }
    return res.json({ deleted: true });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to delete simulation event.' });
  }
});

app.get('/api/locations', (req, res) => {
  res.json({ locations: listLocations() });
});

app.get('/api/locations/:id', (req, res) => {
  const location = getLocation(req.params.id);
  if (!location) {
    return res.status(404).json({ error: 'Location not found.' });
  }
  return res.json({ location });
});

app.put('/api/locations/:id', (req, res) => {
  try {
    const location = updateLocation(req.params.id, req.body || {});
    if (!location) {
      return res.status(404).json({ error: 'Location not found.' });
    }
    return res.json({ location });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to update location.' });
  }
});

app.delete('/api/locations/:id', (req, res) => {
  try {
    const location = deleteLocation(req.params.id);
    if (!location) {
      return res.status(404).json({ error: 'Location not found.' });
    }
    return res.json({ deleted: true });
  } catch (error) {
    if (error.dependents) {
      return res.status(409).json({ error: error.message, dependents: error.dependents });
    }
    console.error(error);
    return res.status(500).json({ error: error.message || 'Unable to delete location.' });
  }
});

app.get('/api/maps/:id/markers', (req, res) => {
  if (!getMap(req.params.id)) {
    return res.status(404).json({ error: 'Map not found.' });
  }
  return res.json({ markers: getMapMarkers(req.params.id) });
});

app.post('/api/maps/:id/markers', (req, res) => {
  try {
    const marker = createMapMarker(req.params.id, req.body || {});
    return res.status(201).json({ marker });
  } catch (error) {
    const status = error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 409 : (error.statusCode || 500);
    if (status === 500) console.error(error);
    return res.status(status).json({ error: status === 409 ? 'That location already has a marker on this map.' : error.message });
  }
});

app.put('/api/maps/:mapId/markers/:markerId', (req, res) => {
  try {
    const marker = updateMapMarker(req.params.mapId, req.params.markerId, req.body || {});
    if (!marker) {
      return res.status(404).json({ error: 'Map marker not found.' });
    }
    return res.json({ marker });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to move marker.' });
  }
});

app.delete('/api/maps/:mapId/markers/:markerId', (req, res) => {
  const deleted = deleteMapMarker(req.params.mapId, req.params.markerId);
  if (!deleted) {
    return res.status(404).json({ error: 'Map marker not found.' });
  }
  return res.json({ deleted: true });
});

app.get('/api/maps', (req, res) => {
  res.json({ maps: listMaps() });
});

app.post('/api/maps', upload.single('artwork'), (req, res) => {
  const uploaded = req.file;
  let finalPath;

  try {
    if (uploaded && !isValidArtwork(uploaded.path, uploaded.mimetype)) {
      fs.unlinkSync(uploaded.path);
      return res.status(400).json({ error: 'The uploaded file content does not match its image type.' });
    }

    const id = crypto.randomUUID();
    if (uploaded) {
      finalPath = path.join(mapStorageDir, `${id}${artworkTypes[uploaded.mimetype].extension}`);
      fs.renameSync(uploaded.path, finalPath);
    }

    const map = createMap({
      id,
      name: req.body.name,
      mapType: req.body.mapType,
      parentId: req.body.parentId,
      status: req.body.status,
      description: req.body.description,
      filePath: finalPath,
      originalFilename: uploaded?.originalname,
      mimeType: uploaded?.mimetype,
      fileSize: uploaded?.size
    });

    return res.status(201).json({ map });
  } catch (error) {
    removeUploadedFiles(uploaded?.path, finalPath);
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to save map.' });
  }
});

app.put('/api/maps/:id', upload.single('artwork'), (req, res) => {
  const uploaded = req.file;
  const current = getMap(req.params.id);
  let finalPath;
  let updated = false;

  if (!current) {
    removeUploadedFiles(uploaded?.path);
    return res.status(404).json({ error: 'Map not found.' });
  }

  try {
    if (uploaded && !isValidArtwork(uploaded.path, uploaded.mimetype)) {
      fs.unlinkSync(uploaded.path);
      return res.status(400).json({ error: 'The uploaded file content does not match its image type.' });
    }

    if (uploaded) {
      finalPath = path.join(mapStorageDir, `${req.params.id}-${crypto.randomUUID()}${artworkTypes[uploaded.mimetype].extension}`);
      fs.renameSync(uploaded.path, finalPath);
    }

    const map = updateMap(req.params.id, {
      name: req.body.name,
      mapType: req.body.mapType,
      parentId: req.body.parentId,
      status: req.body.status,
      description: req.body.description,
      ...(uploaded ? {
        filePath: finalPath,
        originalFilename: uploaded.originalname,
        mimeType: uploaded.mimetype,
        fileSize: uploaded.size
      } : {})
    });
    updated = true;

    if (uploaded && current.file_path) {
      removeStoredArtwork(current.file_path);
    }
    return res.json({ map });
  } catch (error) {
    if (!updated) {
      removeUploadedFiles(uploaded?.path, finalPath);
    } else {
      console.error(error);
      return res.status(500).json({ error: 'Map was saved, but the previous artwork could not be removed.' });
    }
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to update map.' });
  }
});

app.get('/api/maps/:id/artwork', (req, res) => {
  const map = getMap(req.params.id);
  if (!map || !map.file_path || !isStoredArtworkPath(map.file_path)) {
    return res.status(404).json({ error: 'Map artwork not found.' });
  }

  res.type(map.mime_type);
  res.set('Cache-Control', 'private, max-age=3600, immutable');
  return res.sendFile(map.file_path, (error) => {
    if (error && !res.headersSent) {
      res.status(error.statusCode || 500).json({ error: 'Unable to read map artwork.' });
    }
  });
});

app.delete('/api/maps/:id', (req, res) => {
  try {
    const map = deleteMap(req.params.id);
    if (!map) {
      return res.status(404).json({ error: 'Map not found.' });
    }
    if (map.file_path) {
      removeStoredArtwork(map.file_path);
    }
    return res.json({ deleted: true });
  } catch (error) {
    if (error.dependents) {
      return res.status(409).json({
        error: error.message,
        dependents: error.dependents
      });
    }
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  const status = error instanceof multer.MulterError ? 400 : (error.statusCode || error.status || 500);
  if (status === 500) {
    console.error(error);
  }
  res.status(status).json({ error: error.message || 'An unexpected server error occurred.' });
});

app.listen(port, () => {
  console.log(`The World Atlas is running on http://localhost:${port}`);
});

function isValidArtwork(filePath, mimeType) {
  const artworkType = artworkTypes[mimeType];
  if (!artworkType) return false;
  const descriptor = fs.openSync(filePath, 'r');
  const bytes = Buffer.alloc(12);
  try {
    const bytesRead = fs.readSync(descriptor, bytes, 0, bytes.length, 0);
    return artworkType.signature(bytes.subarray(0, bytesRead));
  } finally {
    fs.closeSync(descriptor);
  }
}

function isStoredArtworkPath(filePath) {
  const resolvedPath = path.resolve(filePath);
  const relativePath = path.relative(mapStorageDir, resolvedPath);
  return relativePath !== '' && relativePath !== '.' && !relativePath.startsWith(`..${path.sep}`) && relativePath !== '..' && !path.isAbsolute(relativePath);
}

function removeStoredArtwork(filePath) {
  if (isStoredArtworkPath(filePath) && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function removeUploadedFiles(...paths) {
  paths.filter(Boolean).forEach((filePath) => {
    if (isStoredArtworkPath(filePath) && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
}

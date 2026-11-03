const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

async function findAvailablePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function waitForServer(child, url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) throw new Error('The server exited before becoming ready.');
    try {
      if ((await fetch(`${url}/api/health`)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('The server did not become ready in time.');
}

async function postJson(url, payload) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

test('campaign JSON export and preview-first import preserve links without overwrites', async (t) => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pathfinder-data-api-'));
  const port = await findAvailablePort();
  const url = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    env: { ...process.env, PATHFINDER_DATA_DIR: dataDir, PORT: String(port) },
    stdio: 'ignore'
  });

  t.after(async () => {
    if (child.exitCode === null) {
      child.kill('SIGTERM');
      await once(child, 'exit');
    }
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  await waitForServer(child, url);

  const campaign = {
    format: 'pathfinder-campaign',
    schemaVersion: 1,
    exportedAt: '2026-11-03T00:00:00.000Z',
    includedCategories: ['world', 'people'],
    settings: { campaign_name: 'Imported Campaign' },
    records: {
      locations: [{ id: 'location-1', name: 'Greyharbor', type: 'city', status: 'established', player_visible: 1 }],
      maps: [{ id: 'map-1', name: 'The Coast', map_type: 'continent', status: 'known', file_path: '/private/map.png' }],
      map_markers: [{ id: 'marker-1', map_id: 'map-1', location_id: 'location-1', category: 'city', x: 0.25, y: 0.75 }],
      houses: [{ id: 'house-1', name: 'House Northwind', status: 'established' }],
      npcs: [{ id: 'npc-1', name: 'Mara Venn', location_id: 'location-1', house_id: 'house-1', status: 'alive', gm_only: 1 }],
      factions: [{ id: 'faction-1', name: 'The Lantern Guild', status: 'established' }]
    }
  };

  const previewResponse = await postJson(`${url}/api/data/import/preview`, { payload: campaign });
  const preview = await previewResponse.json();
  assert.equal(previewResponse.status, 200, JSON.stringify(preview));
  assert.equal(preview.records.insert, 6);
  assert.equal(preview.canImport, true);
  assert.deepEqual(preview.settings.conflicts.map(({ key }) => key), ['campaign_name']);

  const importResponse = await postJson(`${url}/api/data/import`, { payload: campaign });
  const imported = await importResponse.json();
  assert.equal(importResponse.status, 200);
  assert.equal(imported.report.records.insert, 6);

  const exportResponse = await fetch(`${url}/api/data/export?categories=world,people`);
  const exported = await exportResponse.json();
  assert.equal(exportResponse.status, 200);
  assert.match(exportResponse.headers.get('content-disposition'), /pathfinder-campaign-/);
  assert.equal(exported.format, 'pathfinder-campaign');
  assert.equal(exported.schemaVersion, 1);
  assert.equal(exported.records.npcs[0].house_id, 'house-1');
  assert.equal(exported.records.map_markers[0].location_id, 'location-1');
  assert.equal(Object.hasOwn(exported.records.maps[0], 'file_path'), false);
  assert.equal(exported.settings.campaign_name, 'Untitled Campaign');

  const duplicateResponse = await postJson(`${url}/api/data/import/preview`, { payload: campaign });
  const duplicate = await duplicateResponse.json();
  assert.equal(duplicate.records.duplicate, 6);
  assert.equal(duplicate.canImport, false);

  const conflictCampaign = {
    ...campaign,
    includedCategories: ['world'],
    settings: {},
    records: { locations: [{ id: 'location-1', name: 'Renamed City', type: 'city', player_visible: 1 }] }
  };
  const conflictResponse = await postJson(`${url}/api/data/import/preview`, { payload: conflictCampaign });
  const conflict = await conflictResponse.json();
  assert.equal(conflict.records.conflict, 1);
  assert.equal(conflict.canImport, false);

  const orphanCampaign = {
    ...campaign,
    includedCategories: ['people'],
    settings: {},
    records: { npcs: [{ id: 'orphan', name: 'Unlinked NPC', location_id: 'missing-location' }] }
  };
  const orphanResponse = await postJson(`${url}/api/data/import/preview`, { payload: orphanCampaign });
  const orphan = await orphanResponse.json();
  assert.equal(orphan.records.conflict, 1);

  const explicitSettingsResponse = await postJson(`${url}/api/data/import`, {
    payload: campaign,
    options: { overwriteSettings: true }
  });
  assert.equal(explicitSettingsResponse.status, 200);
  const finalExport = await (await fetch(`${url}/api/data/export?categories=world`)).json();
  assert.equal(finalExport.settings.campaign_name, 'Imported Campaign');

  const invalidDiscoveryResponse = await postJson(`${url}/api/discoveries`, {
    title: 'Invalid visibility',
    visible_to_players: 'sometimes'
  });
  assert.equal(invalidDiscoveryResponse.status, 400);

  const createDiscoveryResponse = await postJson(`${url}/api/discoveries`, {
    title: 'The northern pass is open',
    category: 'Discovered location',
    details: 'The party found a safe route through the mountains.'
  });
  const createdDiscovery = await createDiscoveryResponse.json();
  assert.equal(createDiscoveryResponse.status, 201);
  assert.equal(createdDiscovery.discovery.visible_to_players, 0);

  const updateDiscoveryResponse = await fetch(`${url}/api/discoveries/${createdDiscovery.discovery.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visible_to_players: true })
  });
  const updatedDiscovery = await updateDiscoveryResponse.json();
  assert.equal(updateDiscoveryResponse.status, 200);
  assert.equal(updatedDiscovery.discovery.title, 'The northern pass is open');
  assert.equal(updatedDiscovery.discovery.visible_to_players, 1);

  const discoverySearch = await (await fetch(`${url}/api/search?q=mountains`)).json();
  assert.ok(discoverySearch.results.some((result) => result.type === 'player_discoveries'
    && result.id === createdDiscovery.discovery.id));

  const discoveryExport = await (await fetch(`${url}/api/data/export?categories=campaign`)).json();
  assert.equal(discoveryExport.records.player_discoveries.length, 1);
  assert.equal(discoveryExport.records.player_discoveries[0].visible_to_players, 1);

  const deleteDiscoveryResponse = await fetch(`${url}/api/discoveries/${createdDiscovery.discovery.id}`, {
    method: 'DELETE'
  });
  assert.equal(deleteDiscoveryResponse.status, 200);
  const missingDiscoveryResponse = await fetch(`${url}/api/discoveries/${createdDiscovery.discovery.id}`);
  assert.equal(missingDiscoveryResponse.status, 404);

  const invalidResponse = await postJson(`${url}/api/data/import/preview`, {
    payload: { ...campaign, schemaVersion: 99 }
  });
  assert.equal(invalidResponse.status, 400);
});

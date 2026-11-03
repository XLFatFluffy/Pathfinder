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

test('noble house relationships keep an auditable history and import without overwriting', async (t) => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pathfinder-house-relations-'));
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

  const crownResponse = await postJson(`${url}/api/houses`, { name: 'House Crown' });
  const crown = await crownResponse.json();
  assert.equal(crownResponse.status, 201);
  const valeResponse = await postJson(`${url}/api/houses`, { name: 'House Vale' });
  const vale = await valeResponse.json();
  assert.equal(valeResponse.status, 201);

  const invalidTypeResponse = await postJson(`${url}/api/house-relationships`, {
    house_id: crown.house.id,
    related_house_id: vale.house.id,
    relationship_type: 'best_friends'
  });
  assert.equal(invalidTypeResponse.status, 400);

  const selfResponse = await postJson(`${url}/api/house-relationships`, {
    house_id: crown.house.id,
    related_house_id: crown.house.id,
    relationship_type: 'allied'
  });
  assert.equal(selfResponse.status, 400);

  const createResponse = await postJson(`${url}/api/house-relationships`, {
    house_id: crown.house.id,
    related_house_id: vale.house.id,
    relationship_type: 'overlord',
    notes: 'House Vale owes fealty to House Crown.'
  });
  const created = await createResponse.json();
  assert.equal(createResponse.status, 201);
  assert.equal(created.relationship.effective_date, '1-01-0001');
  assert.equal(created.relationship.history.length, 1);
  assert.equal(created.relationship.history[0].relationship_type, 'overlord');

  const reversedDuplicateResponse = await postJson(`${url}/api/house-relationships`, {
    house_id: vale.house.id,
    related_house_id: crown.house.id,
    relationship_type: 'vassal'
  });
  assert.equal(reversedDuplicateResponse.status, 400);

  const blockedDelete = await fetch(`${url}/api/houses/${vale.house.id}`, { method: 'DELETE' });
  const blockedDeleteBody = await blockedDelete.json();
  assert.equal(blockedDelete.status, 409);
  assert.equal(blockedDeleteBody.dependents.relationships, 1);

  const updateResponse = await fetch(`${url}/api/house-relationships/${created.relationship.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      relationship_type: 'at_war',
      effective_date: '2-Frostfall-4715',
      notes: 'The border dispute became open conflict.'
    })
  });
  const updated = await updateResponse.json();
  assert.equal(updateResponse.status, 200);
  assert.equal(updated.relationship.relationship_type, 'at_war');
  assert.equal(updated.relationship.history.length, 2);
  assert.equal(updated.relationship.history[1].effective_date, '2-Frostfall-4715');
  assert.ok(updated.relationship.history[1].created_at > updated.relationship.history[0].created_at);

  const noOpResponse = await fetch(`${url}/api/house-relationships/${created.relationship.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      relationship_type: 'at_war',
      effective_date: '2-Frostfall-4715',
      notes: 'The border dispute became open conflict.'
    })
  });
  const noOp = await noOpResponse.json();
  assert.equal(noOp.relationship.history.length, 2);

  const exported = await (await fetch(`${url}/api/data/export?categories=people`)).json();
  assert.equal(exported.records.house_relationships.length, 1);
  assert.equal(exported.records.house_relationship_history.length, 2);
  const duplicatePreviewResponse = await postJson(`${url}/api/data/import/preview`, { payload: exported });
  const duplicatePreview = await duplicatePreviewResponse.json();
  assert.ok(duplicatePreview.records.duplicate >= 5);
  assert.equal(duplicatePreview.canImport, false);

  const conflictPreviewResponse = await postJson(`${url}/api/data/import/preview`, {
    payload: {
      ...exported,
      records: {
        house_relationships: [{
          id: 'alternate-house-relationship',
          house_id: vale.house.id,
          related_house_id: crown.house.id,
          relationship_type: 'vassal',
          notes: 'Different historical account.',
          effective_date: '1-01-0001'
        }]
      }
    }
  });
  const conflictPreview = await conflictPreviewResponse.json();
  assert.equal(conflictPreview.records.conflict, 1);
  assert.equal(conflictPreview.canImport, false);

  const deleteResponse = await fetch(`${url}/api/house-relationships/${created.relationship.id}`, { method: 'DELETE' });
  assert.equal(deleteResponse.status, 200);
  const missingResponse = await fetch(`${url}/api/house-relationships/${created.relationship.id}`);
  assert.equal(missingResponse.status, 404);
  const houseDeleteResponse = await fetch(`${url}/api/houses/${vale.house.id}`, { method: 'DELETE' });
  assert.equal(houseDeleteResponse.status, 200);
});

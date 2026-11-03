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

test('NPC family relationships are linked, perspective-aware, unique, and portable', async (t) => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pathfinder-npc-family-'));
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

  const parentResponse = await postJson(`${url}/api/npcs`, { name: 'Edda Vale' });
  const parent = await parentResponse.json();
  assert.equal(parentResponse.status, 201);
  const childResponse = await postJson(`${url}/api/npcs`, { name: 'Tarin Vale' });
  const childNpc = await childResponse.json();
  assert.equal(childResponse.status, 201);
  const siblingResponse = await postJson(`${url}/api/npcs`, { name: 'Mira Vale' });
  const sibling = await siblingResponse.json();
  assert.equal(siblingResponse.status, 201);

  const familyResponse = await postJson(`${url}/api/npc-relationships`, {
    npc_id: childNpc.npc.id,
    related_npc_id: parent.npc.id,
    relationship_type: 'parent',
    notes: 'Raised Tarin in the western manor.'
  });
  const family = await familyResponse.json();
  assert.equal(familyResponse.status, 201);

  const childView = await (await fetch(`${url}/api/npcs/${childNpc.npc.id}/relationships`)).json();
  assert.equal(childView.relationships.length, 1);
  assert.equal(childView.relationships[0].relationship_type, 'parent');
  assert.equal(childView.relationships[0].related_npc_name, 'Edda Vale');

  const parentView = await (await fetch(`${url}/api/npcs/${parent.npc.id}/relationships`)).json();
  assert.equal(parentView.relationships[0].relationship_type, 'child');
  assert.equal(parentView.relationships[0].related_npc_name, 'Tarin Vale');

  const duplicateResponse = await postJson(`${url}/api/npc-relationships`, {
    npc_id: parent.npc.id,
    related_npc_id: childNpc.npc.id,
    relationship_type: 'child'
  });
  assert.equal(duplicateResponse.status, 400);

  const selfResponse = await postJson(`${url}/api/npc-relationships`, {
    npc_id: parent.npc.id,
    related_npc_id: parent.npc.id,
    relationship_type: 'sibling'
  });
  assert.equal(selfResponse.status, 400);

  const siblingLink = await postJson(`${url}/api/npc-relationships`, {
    npc_id: childNpc.npc.id,
    related_npc_id: sibling.npc.id,
    relationship_type: 'sibling'
  });
  assert.equal(siblingLink.status, 201);

  const exported = await (await fetch(`${url}/api/data/export?categories=people`)).json();
  assert.equal(exported.records.npc_relationships.length, 2);
  assert.ok(exported.records.npc_relationships.some((entry) => entry.id === family.relationship.id));

  const deleteResponse = await fetch(`${url}/api/npc-relationships/${family.relationship.id}`, { method: 'DELETE' });
  assert.equal(deleteResponse.status, 200);
  const deletedChildView = await (await fetch(`${url}/api/npcs/${childNpc.npc.id}/relationships`)).json();
  assert.equal(deletedChildView.relationships.length, 1);
});

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

test('NPC status transitions retain dated history and round-trip through campaign JSON', async (t) => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pathfinder-npc-status-history-'));
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

  const createResponse = await postJson(`${url}/api/npcs`, {
    name: 'Sella Rook',
    status: 'alive',
    status_change_notes: 'Introduced at the harvest fair.'
  });
  const created = await createResponse.json();
  assert.equal(createResponse.status, 201);

  const initialHistoryResponse = await fetch(`${url}/api/npcs/${created.npc.id}/history`);
  const initialHistory = await initialHistoryResponse.json();
  assert.equal(initialHistoryResponse.status, 200);
  assert.equal(initialHistory.history.length, 1);
  assert.equal(initialHistory.history[0].previous_status, null);
  assert.equal(initialHistory.history[0].new_status, 'alive');
  assert.equal(initialHistory.history[0].notes, 'Introduced at the harvest fair.');

  const missingResponse = await fetch(`${url}/api/npcs/${created.npc.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'missing', status_change_notes: 'Failed to return from the northern road.' })
  });
  assert.equal(missingResponse.status, 200);
  const missing = await (await fetch(`${url}/api/npcs/${created.npc.id}/history`)).json();
  assert.equal(missing.history.length, 2);
  assert.equal(missing.history[1].previous_status, 'alive');
  assert.equal(missing.history[1].new_status, 'missing');
  assert.equal(missing.history[1].notes, 'Failed to return from the northern road.');

  const unchangedResponse = await fetch(`${url}/api/npcs/${created.npc.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'missing', status_change_notes: 'This note does not create a transition.' })
  });
  assert.equal(unchangedResponse.status, 200);
  const unchanged = await (await fetch(`${url}/api/npcs/${created.npc.id}/history`)).json();
  assert.equal(unchanged.history.length, 2);

  const exported = await (await fetch(`${url}/api/data/export?categories=people`)).json();
  assert.equal(exported.records.npc_status_history.length, 2);
  assert.ok(exported.records.npc_status_history.some((entry) => entry.new_status === 'missing'));

  const duplicatePreviewResponse = await postJson(`${url}/api/data/import/preview`, { payload: exported });
  const duplicatePreview = await duplicatePreviewResponse.json();
  assert.ok(duplicatePreview.records.duplicate >= 3);
  assert.equal(duplicatePreview.canImport, false);

  const deleteResponse = await fetch(`${url}/api/npcs/${created.npc.id}`, { method: 'DELETE' });
  assert.equal(deleteResponse.status, 200);
  const deletedHistoryResponse = await fetch(`${url}/api/npcs/${created.npc.id}/history`);
  assert.equal(deletedHistoryResponse.status, 404);
});

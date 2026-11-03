const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
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
      const response = await fetch(`${url}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('The server did not become ready in time.');
}

test('campaign clock API saves custom calendars and advances with a durable cycle', async (t) => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pathfinder-clock-api-'));
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
  const initialResponse = await fetch(`${url}/api/simulation/clock`);
  const initial = await initialResponse.json();
  assert.equal(initialResponse.status, 200);
  assert.equal(initial.calendar.months.length, 12);

  const saveResponse = await fetch(`${url}/api/simulation/clock/calendar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignDate: '30-01-0001', months: 'Frost: 30\nThaw: 28' })
  });
  assert.equal(saveResponse.status, 200);

  const advanceResponse = await fetch(`${url}/api/simulation/clock/advance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 1, unit: 'month' })
  });
  const advanced = await advanceResponse.json();
  assert.equal(advanceResponse.status, 201);
  assert.equal(advanced.calendar.campaignDate, '28-02-0001');

  const historyResponse = await fetch(`${url}/api/simulation/clock`);
  const history = await historyResponse.json();
  assert.equal(history.cycles.length, 1);
  assert.equal(history.cycles[0].previous_date, '30-01-0001');
  assert.equal(history.cycles[0].new_date, '28-02-0001');

  const invalidResponse = await fetch(`${url}/api/simulation/clock/advance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 1, unit: 'decade' })
  });
  assert.equal(invalidResponse.status, 400);
});

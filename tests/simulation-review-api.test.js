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

async function requestJson(url, method = 'GET', body) {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { response, payload: await response.json() };
}

test('time advancement records rolls and GM decisions gate timeline canon', async (t) => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pathfinder-simulation-review-'));
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
  const weighted = await requestJson(`${url}/api/simulation/tables`, 'POST', {
    group_name: 'Court Events',
    name: 'A royal envoy arrives',
    category: 'political',
    weight: 3,
    description: 'A neighboring court sends an envoy.'
  });
  assert.equal(weighted.response.status, 201);

  const rangedEntries = [];
  for (const [name, rollRange] of [['Clear skies', '1-50'], ['Heavy rain', '51-100']]) {
    const entry = await requestJson(`${url}/api/simulation/tables`, 'POST', {
      group_name: 'Weather',
      name,
      category: 'weather',
      roll_range: rollRange,
      weight: 1
    });
    assert.equal(entry.response.status, 201);
    rangedEntries.push(entry.payload.table);
  }

  const advance = await requestJson(`${url}/api/simulation/clock/advance`, 'POST', { amount: 1, unit: 'day' });
  assert.equal(advance.response.status, 201);
  assert.equal(advance.payload.calendar.campaignDate, '2-01-0001');
  assert.equal(advance.payload.cycle.results.filter(Boolean).length, 2);

  const history = await requestJson(`${url}/api/simulation/clock`);
  assert.equal(history.payload.cycles[0].rolls.length, 2);
  assert.match(history.payload.cycles[0].rolls.find((roll) => roll.group_name === 'Weather').roll_result, /^d100 roll \d+$/);
  const firstResults = history.payload.cycles[0].results;
  const politicalResult = firstResults.find((result) => result.table_id === weighted.payload.table.id);
  const weatherResult = firstResults.find((result) => rangedEntries.some((entry) => entry.id === result.table_id));
  assert.ok(politicalResult);
  assert.ok(weatherResult);
  const simulationExport = await requestJson(`${url}/api/data/export?categories=simulation`);
  assert.equal(simulationExport.payload.records.simulation_rolls.length, 2);
  assert.ok(simulationExport.payload.records.simulation_rolls.every((roll) => roll.result_id));

  const approved = await requestJson(`${url}/api/simulation/results/${politicalResult.id}/decision`, 'POST', { decision: 'approve' });
  assert.equal(approved.response.status, 200);
  assert.equal(approved.payload.result.status, 'approved');
  assert.ok(approved.payload.result.timeline_event_id);

  const postponed = await requestJson(`${url}/api/simulation/results/${weatherResult.id}/decision`, 'POST', { decision: 'postpone' });
  assert.equal(postponed.payload.result.status, 'postponed');
  const edited = await requestJson(`${url}/api/simulation/results/${weatherResult.id}`, 'PUT', {
    title: 'The storm breaks over the pass',
    description: 'Travel through the high pass becomes dangerous.',
    category: 'weather',
    eventDate: '2-01-0001',
    locationName: 'North Pass',
    involvedText: 'Travelers and local guides'
  });
  assert.equal(edited.response.status, 200);
  const approvedAfterEdit = await requestJson(`${url}/api/simulation/results/${weatherResult.id}/decision`, 'POST', { decision: 'approve' });
  assert.equal(approvedAfterEdit.payload.result.status, 'approved');
  assert.equal(approvedAfterEdit.payload.result.title, 'The storm breaks over the pass');

  const timeline = await requestJson(`${url}/api/timeline`);
  assert.equal(timeline.payload.timeline.length, 2);
  assert.ok(timeline.payload.timeline.some((event) => event.title === 'The storm breaks over the pass'));

  const duplicateDecision = await requestJson(`${url}/api/simulation/results/${politicalResult.id}/decision`, 'POST', { decision: 'approve' });
  assert.equal(duplicateDecision.response.status, 409);

  const secondAdvance = await requestJson(`${url}/api/simulation/clock/advance`, 'POST', { amount: 1, unit: 'day' });
  assert.equal(secondAdvance.response.status, 201);
  const secondCycle = secondAdvance.payload.cycle;
  const rejectedResult = secondCycle.results.find((result) => result.table_id === weighted.payload.table.id);
  const rejected = await requestJson(`${url}/api/simulation/results/${rejectedResult.id}/decision`, 'POST', { decision: 'reject' });
  assert.equal(rejected.payload.result.status, 'rejected');
  const rejectedTimeline = await requestJson(`${url}/api/timeline`);
  assert.equal(rejectedTimeline.payload.timeline.length, 2);

  const partialRange = await requestJson(`${url}/api/simulation/tables`, 'POST', {
    group_name: 'Broken Table',
    name: 'One ranged entry',
    roll_range: '1-10'
  });
  const partialWeight = await requestJson(`${url}/api/simulation/tables`, 'POST', {
    group_name: 'Broken Table',
    name: 'One weighted entry'
  });
  assert.equal(partialRange.response.status, 201);
  assert.equal(partialWeight.response.status, 201);
  const invalidAdvance = await requestJson(`${url}/api/simulation/clock/advance`, 'POST', { amount: 1, unit: 'day' });
  assert.equal(invalidAdvance.response.status, 400);
  assert.match(invalidAdvance.payload.error, /Every entry in "Broken Table"/);
  const unchangedClock = await requestJson(`${url}/api/simulation/clock`);
  assert.equal(unchangedClock.payload.calendar.campaignDate, '3-01-0001');
  assert.equal(unchangedClock.payload.cycles.length, 2);

  const fixedEntry = await requestJson(
    `${url}/api/simulation/tables/${partialWeight.payload.table.id}`,
    'PUT',
    { roll_range: '11-20' }
  );
  assert.equal(fixedEntry.response.status, 200);
  const resumedAdvance = await requestJson(`${url}/api/simulation/clock/advance`, 'POST', { amount: 1, unit: 'day' });
  assert.equal(resumedAdvance.response.status, 201);
  assert.equal(resumedAdvance.payload.cycle.results.filter(Boolean).length, 3);

  const protectedTable = await fetch(`${url}/api/simulation/tables/${weighted.payload.table.id}`, { method: 'DELETE' });
  assert.equal(protectedTable.status, 409);
});

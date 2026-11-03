const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pathfinder-calendar-'));
process.env.PATHFINDER_DATA_DIR = dataDir;

let database = require('../src/db');
database.initializeDatabase();

test('calendar configuration and time advances persist across database reopen', (t) => {
  t.after(() => {
    database.db.close();
    fs.rmSync(dataDir, { recursive: true, force: true });
    delete process.env.PATHFINDER_DATA_DIR;
  });

  database.saveCampaignCalendar('30-01-0001', 'Frost: 30\nThaw: 28');
  const cycle = database.advanceCampaignTime(1, 'month');
  assert.equal(cycle.previous_date, '30-01-0001');
  assert.equal(cycle.new_date, '28-02-0001');

  database.db.close();
  delete require.cache[require.resolve('../src/db')];
  database = require('../src/db');
  database.initializeDatabase();

  assert.deepEqual(database.getCampaignCalendar(), {
    campaignDate: '28-02-0001',
    months: [
      { name: 'Frost', days: 30 },
      { name: 'Thaw', days: 28 }
    ]
  });
  assert.equal(database.listSimulationCycles().length, 1);
});

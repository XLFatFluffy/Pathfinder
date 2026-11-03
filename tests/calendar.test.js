const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_CALENDAR_MONTHS,
  advanceCampaignDate,
  normalizeCalendarMonths,
  parseCalendarMonthLines
} = require('../src/calendar');

test('advances days through custom month and year boundaries', () => {
  const months = [{ name: 'Frost', days: 30 }, { name: 'Thaw', days: 28 }];
  assert.equal(advanceCampaignDate('30-01-0001', 1, 'day', months), '1-02-0001');
  assert.equal(advanceCampaignDate('28-02-0001', 1, 'day', months), '1-01-0002');
});

test('advances weeks and custom day intervals', () => {
  assert.equal(advanceCampaignDate('26-12-0001', 1, 'week', DEFAULT_CALENDAR_MONTHS), '3-01-0002');
  assert.equal(advanceCampaignDate('1-01-0001', 15, 'custom', DEFAULT_CALENDAR_MONTHS), '16-01-0001');
});

test('advances months and years while clamping to the destination month', () => {
  const months = [{ name: 'Long', days: 31 }, { name: 'Short', days: 28 }];
  assert.equal(advanceCampaignDate('31-01-0001', 1, 'month', months), '28-02-0001');
  assert.equal(advanceCampaignDate('12-01-0001', 1, 'year', months), '12-01-0002');
});

test('parses month definitions and rejects invalid calendar dates', () => {
  assert.deepEqual(parseCalendarMonthLines('Frost: 30\nThaw: 28'), [
    { name: 'Frost', days: 30 },
    { name: 'Thaw', days: 28 }
  ]);
  assert.throws(() => normalizeCalendarMonths([{ name: 'Frost', days: 0 }]), /between 1 and 1000/);
  assert.throws(() => advanceCampaignDate('29-02-0001', 1, 'day', [
    { name: 'Frost', days: 30 },
    { name: 'Thaw', days: 28 }
  ]), /does not exist/);
});

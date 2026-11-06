const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "../src/lib/campaign-calendar.ts");
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});
const calendarModule = new Module(sourcePath, module);
calendarModule.filename = sourcePath;
calendarModule.paths = Module._nodeModulePaths(path.dirname(sourcePath));
calendarModule._compile(compiled.outputText, sourcePath);

const {
  CAMPAIGN_FESTIVALS,
  CAMPAIGN_MONTHS,
  CAMPAIGN_WEEKDAYS,
  YEARTURN_DAYS,
  buildCampaignMonthView,
  campaignDateSortValue,
  getCampaignYearLength,
  isCampaignLeapYear,
} = calendarModule.exports;

test("campaign calendar matches the established twelve month names", () => {
  assert.deepEqual(CAMPAIGN_MONTHS, [
    "Frostwane",
    "Thawrise",
    "Greenwake",
    "Bloomtide",
    "Suncrest",
    "Highsun",
    "Goldleaf",
    "Harvestfall",
    "Emberwane",
    "Mistfall",
    "Duskreach",
    "Longnight",
  ]);
  assert.equal(CAMPAIGN_WEEKDAYS.length, 7);
  assert.equal(CAMPAIGN_FESTIVALS.length, 7);
  assert.deepEqual(YEARTURN_DAYS, [
    "Day of the Dead",
    "Day of Debts",
    "Day of Oaths",
    "Day of Ancestors",
    "New Year's Day",
  ]);
});

test("campaign months contain thirty sequential dates", () => {
  const month = buildCampaignMonthView("Harvestfall");
  assert.equal(month.length, 30);
  assert.deepEqual(
    [month[0].day, month.at(-1).day],
    [1, 30],
  );
  assert.ok(month.every((date) => date.month === "Harvestfall"));
  assert.throws(() => buildCampaignMonthView("Month 2"), /Unknown campaign month/);
});

test("campaign years add one leap day every fourth year", () => {
  assert.equal(isCampaignLeapYear(243), false);
  assert.equal(isCampaignLeapYear(244), true);
  assert.equal(getCampaignYearLength(243), 365);
  assert.equal(getCampaignYearLength(244), 366);
  assert.equal(isCampaignLeapYear(0), false);
});

test("campaign date ordering follows named months and preserves uncertainty", () => {
  assert.ok(
    campaignDateSortValue("30 Goldleaf, 243 AC") <
      campaignDateSortValue("1 Harvestfall, 243 AC"),
  );
  assert.ok(
    campaignDateSortValue("Day of Ancestors, 243 AC") <
      campaignDateSortValue("1 Frostwane, 244 AC"),
  );
  assert.ok(
    campaignDateSortValue("1 Frostwane, 1 BC") <
      campaignDateSortValue("1 Frostwane, 1 AC"),
  );
  assert.equal(
    campaignDateSortValue("Approximately 12 Harvestfall, 243 AC"),
    campaignDateSortValue("12 Harvestfall, 243 AC"),
  );
  assert.equal(campaignDateSortValue("chronology unresolved"), null);
});

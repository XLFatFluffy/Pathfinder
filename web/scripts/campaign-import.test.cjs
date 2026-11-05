const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "../src/lib/campaign-import.ts");
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});
const importModule = new Module(sourcePath, module);
importModule.filename = sourcePath;
importModule.paths = Module._nodeModulePaths(path.dirname(sourcePath));
importModule._compile(compiled.outputText, sourcePath);

const { parseCampaignImport } = importModule.exports;

function makeBundle(records) {
  return {
    format: "pathfinder-campaign-import",
    version: 1,
    title: "Test import",
    records,
  };
}

function metadata(key, visibility = "PLAYER_SHARED", canonStatus = "ESTABLISHED") {
  return {
    key,
    canon_status: canonStatus,
    visibility,
    knowledge_type: "fact",
    provenance: "campaign/source.md",
  };
}

test("parses valid records and resolves same-bundle links", () => {
  const parsed = parseCampaignImport(
    JSON.stringify(
      makeBundle({
        locations: [
          {
            ...metadata("old-town"),
            name: "Old Town",
            location_type: "settlement",
          },
        ],
        npcs: [
          {
            ...metadata("town-reeve"),
            name: "Town Reeve",
            location_key: "old-town",
          },
        ],
      }),
    ),
  );

  assert.deepEqual(parsed.issues, []);
  assert.equal(parsed.bundle.records.locations[0].name, "Old Town");
  assert.equal(parsed.bundle.records.npcs[0].location_key, "old-town");
});

test("rejects unsafe visibility, unknown fields, and links to the wrong entity type", () => {
  const parsed = parseCampaignImport(
    JSON.stringify(
      makeBundle({
        locations: [
          {
            ...metadata("secret-place", "PLAYER_SHARED", "UNRESOLVED"),
            name: "Secret Place",
            made_up_field: "must not be discarded",
          },
        ],
        npcs: [
          {
            ...metadata("guide"),
            name: "Guide",
            location_key: "guide",
          },
        ],
      }),
    ),
  );

  assert.equal(parsed.bundle, undefined);
  assert.ok(parsed.issues.some((issue) => issue.path.includes("visibility")));
  assert.ok(parsed.issues.some((issue) => issue.path.includes("made_up_field")));
  assert.ok(parsed.issues.some((issue) => issue.path.endsWith("location_key")));
});

test("rejects duplicate source keys and malformed JSON", () => {
  const duplicate = parseCampaignImport(
    JSON.stringify(
      makeBundle({
        locations: [
          { ...metadata("same"), name: "North Gate" },
          { ...metadata("same"), name: "South Gate" },
        ],
      }),
    ),
  );
  assert.equal(duplicate.bundle, undefined);
  assert.ok(duplicate.issues.some((issue) => issue.message.includes("Duplicate key")));

  const malformed = parseCampaignImport("{");
  assert.equal(malformed.bundle, undefined);
  assert.equal(malformed.issues[0].message, "The file is not valid JSON.");
});

test("enforces the import payload byte limit", () => {
  const parsed = parseCampaignImport(" ".repeat(500_001));
  assert.equal(parsed.bundle, undefined);
  assert.match(parsed.issues[0].message, /500,000 bytes or smaller/);
});

test("the prepared campaign bundle passes the live import schema", () => {
  const bundlePath = path.join(
    __dirname,
    "../../campaign/import/pathfinder_campaign_import.json",
  );
  const parsed = parseCampaignImport(fs.readFileSync(bundlePath, "utf8"));

  assert.deepEqual(parsed.issues, []);
  assert.equal(parsed.bundle?.title, "Pathfinder Campaign Canon Import");
  assert.equal(parsed.bundle?.records.locations.length, 24);
  assert.equal(parsed.bundle?.records.npcs.length, 43);
  assert.equal(parsed.bundle?.records.houses.length, 8);
  assert.equal(parsed.bundle?.records.factions.length, 11);
  assert.equal(parsed.bundle?.records.quests.length, 2);
});

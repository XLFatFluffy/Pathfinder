const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const originalPath = path.join(
  __dirname,
  "../../campaign/source_material/NSNG0001-DeluxeCharacterSheet.pdf",
);
const appPath = path.join(__dirname, "../public/pathfinder-character-sheet.pdf");

test("the app serves an unmodified copy of the canonical editable PDF", () => {
  const original = fs.readFileSync(originalPath);
  const appCopy = fs.readFileSync(appPath);

  assert.equal(original.subarray(0, 5).toString("ascii"), "%PDF-");
  assert.deepEqual(appCopy, original);
});

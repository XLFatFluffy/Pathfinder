const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "../src/lib/supabase-pagination.ts");
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});
const paginationModule = new Module(sourcePath, module);
paginationModule.filename = sourcePath;
paginationModule.paths = Module._nodeModulePaths(path.dirname(sourcePath));
paginationModule._compile(compiled.outputText, sourcePath);

const {
  getAllSupabaseRows,
  getAllSupabaseRowsOrThrow,
  supabaseReadPageSize,
} = paginationModule.exports;

test("reads every row across Supabase API page caps", async () => {
  const rows = Array.from({ length: 2305 }, (_, id) => ({ id }));
  const requestedRanges = [];
  const result = await getAllSupabaseRows(async (from, to) => {
    requestedRanges.push([from, to]);
    return {
      data: rows.slice(from, to + 1),
      error: null,
    };
  });

  assert.deepEqual(requestedRanges, [
    [0, supabaseReadPageSize - 1],
    [supabaseReadPageSize, supabaseReadPageSize * 2 - 1],
    [supabaseReadPageSize * 2, supabaseReadPageSize * 3 - 1],
  ]);
  assert.deepEqual(result.data, rows);
  assert.equal(result.error, undefined);
});

test("returns query errors instead of a partial result", async () => {
  const result = await getAllSupabaseRows(async () => ({
    data: null,
    error: { message: "database unavailable" },
  }));

  assert.equal(result.data, undefined);
  assert.equal(result.error, "database unavailable");
});

test("throwing pagination helper surfaces the database error", async () => {
  await assert.rejects(
    getAllSupabaseRowsOrThrow(async () => ({
      data: null,
      error: { message: "database unavailable" },
    })),
    /database unavailable/,
  );
});

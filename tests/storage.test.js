const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path");
const { openStore } = require("../lib/store");
test("compaction reclaims database pages while preserving retained records", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bridge-storage-")),
    file = path.join(dir, "db.sqlite"),
    store = openStore(file);
  try {
    store.write({
      trainer: { name: "Retained", rating: 8.4 },
      oldDetails: "x".repeat(600000),
    });
    store.compact();
    const before = fs.statSync(file).size;
    store.write({ trainer: { name: "Retained", rating: 8.4 } });
    store.compact();
    assert.ok(fs.statSync(file).size < before);
    assert.deepEqual(store.read().trainer, { name: "Retained", rating: 8.4 });
  } finally {
    store.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

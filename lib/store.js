const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs");
const path = require("node:path");
function openStore(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(
    "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL);",
  );
  return {
    read: () => {
      const row = db.prepare("SELECT body FROM state WHERE id=1").get();
      return row ? JSON.parse(row.body) : null;
    },
    write: (s) =>
      db
        .prepare(
          "INSERT INTO state(id,body) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body",
        )
        .run(JSON.stringify(s)),
    close: () => db.close(),
  };
}
module.exports = { openStore };

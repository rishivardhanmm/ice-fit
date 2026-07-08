import "dotenv/config";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getPool } from "./mssql.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, "schema.sql");
const schema = await readFile(schemaPath, "utf8");
const batches = schema
  .split(/^\s*GO\s*$/gim)
  .map((batch) => batch.trim())
  .filter(Boolean);

const pool = await getPool();

for (const batch of batches) {
  await pool.request().batch(batch);
}

await pool.close();
console.log(`Applied ${batches.length} schema batch(es) to ${process.env.DB_NAME ?? "ice_training_dev"}.`);


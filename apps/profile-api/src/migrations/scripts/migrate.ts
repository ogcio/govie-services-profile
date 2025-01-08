import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import Postgrator from "postgrator";
import type { EnvDbConfig } from "~/plugins/external/env.js";
import { getDbEnvs } from "./shared.js";

export async function doMigration(
  envDbConfig: EnvDbConfig,
  version = "max",
): Promise<void> {
  const client = new pg.Client({
    host: envDbConfig.POSTGRES_HOST,
    port: envDbConfig.POSTGRES_PORT,
    database: envDbConfig.POSTGRES_DATABASE,
    user: envDbConfig.POSTGRES_USER,
    password: envDbConfig.POSTGRES_PASSWORD,
  });

  try {
    await client.connect();

    const migrationDir = path.join(import.meta.dirname, "../sql");

    if (!fs.existsSync(migrationDir)) {
      throw new Error(
        `Migration directory "${migrationDir}" does not exist. Skipping migrations.`,
      );
    }

    const postgrator = new Postgrator({
      migrationPattern: path.join(migrationDir, "*"),
      driver: "pg",
      database: envDbConfig.POSTGRES_DATABASE,
      execQuery: (query) => client.query(query),
    });

    await postgrator.migrate(version);

    console.log("Migration completed!");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

let version = "max";
for (const arg of process.argv.slice(2)) {
  if (arg.length && arg.startsWith("version=")) {
    version = arg.replace("version=", "");
    break;
  }
}

doMigration(getDbEnvs(), version);

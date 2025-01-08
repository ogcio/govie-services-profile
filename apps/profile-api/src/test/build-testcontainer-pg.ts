import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { Client } from "pg";
import { createDatabase } from "../migrations/scripts/create-database.js";
import { dropDatabase } from "../migrations/scripts/drop-database.js";
import { doMigration } from "../migrations/scripts/migrate.js";

let container: StartedPostgreSqlContainer | undefined;
let pgClient: Client | undefined;

function getConfigFromContainer(started: StartedPostgreSqlContainer) {
  return {
    POSTGRES_DATABASE: started.getDatabase(),
    POSTGRES_HOST: started.getHost(),
    POSTGRES_PASSWORD: started.getPassword(),
    POSTGRES_PORT: started.getPort(),
    POSTGRES_USER: started.getUsername(),
  };
}

export async function startPostgresSetContainer() {
  if (container) {
    return container;
  }
  container = await new PostgreSqlContainer().start();

  return container;
}

export async function migrateContainer() {
  const toUseContainer = ensureContainerIsStarted();
  const startConfig = getConfigFromContainer(toUseContainer);
  await createDatabase(startConfig);
  await doMigration(startConfig);
}

export async function dropContainer(
  container: StartedPostgreSqlContainer,
  stopContainer: boolean,
) {
  const toUseContainer = ensureContainerIsStarted();
  const startConfig = getConfigFromContainer(toUseContainer);
  await dropDatabase(startConfig);

  if (stopContainer) {
    await container.stop();
  }
}

export async function getClientFromContainer() {
  if (pgClient) {
    return pgClient;
  }

  const toUseContainer = ensureContainerIsStarted();
  const config = getConfigFromContainer(toUseContainer);
  pgClient = new Client({
    port: config.POSTGRES_PORT,
    user: config.POSTGRES_USER,
    database: config.POSTGRES_DATABASE,
    password: config.POSTGRES_PASSWORD,
    host: config.POSTGRES_HOST,
  });
  await pgClient.connect();
  return pgClient;
}

export async function stopClient() {
  if (!pgClient) {
    return;
  }
  try {
    await pgClient.end();
  } catch (_e) {}
  pgClient = undefined;
}

function ensureContainerIsStarted() {
  if (!container) {
    throw new Error("Container not started");
  }

  return container;
}

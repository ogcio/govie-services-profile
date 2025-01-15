import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import {
  DATABASE_TEST_URL_KEY,
  dropContainer,
  migrateContainer,
  startPostgresContainer,
} from "./build-testcontainer-pg.js";

let postgresContainer: StartedPostgreSqlContainer | null = null;

export async function setup() {
  // Start PostgreSQL container
  postgresContainer = await startPostgresContainer();
  await migrateContainer(postgresContainer);
  // This line is used by the pg library to connect to the database when doing tests
  // https://github.com/fastify/fastify-postgres?tab=readme-ov-file#custom-postgres-approach
  process.env[DATABASE_TEST_URL_KEY] = postgresContainer.getConnectionUri();
}

export async function teardown() {
  // Stop container after all tests
  if (postgresContainer) {
    await dropContainer(postgresContainer);
  }

  delete process.env[DATABASE_TEST_URL_KEY];
}

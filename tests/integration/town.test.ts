import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { MySqlContainer, StartedMySqlContainer } from "@testcontainers/mysql";
import mysql, { Connection, Pool } from "mysql2/promise";
import * as path from "node:path";

import { Town } from "../../backend/src/Town";

/**
 * Integration tests for the Town class, which fetches random postal codes and town names from the database.
 *
 * These tests use Testcontainers to spin up a real MySQL instance, seed it with the provided SQL file,
 * and verify that Town.getRandomTown() returns valid data that matches the seeded entries.
 */

let poolQueryFn: Pool["query"];
let executedSql: string[] = [];

// mock DB module to redirect queries to our test container
vi.mock("../../backend/src/DB", () => ({
  pool: {
    query: (sql: string, values?: unknown[]) => poolQueryFn(sql, values),
  },
}));

describe("Town DB integration", () => {
  let container: StartedMySqlContainer;
  let connection: Connection;

  const SEED_FILE = path.join(__dirname, "../../backend/db/addresses.sql");

  beforeAll(async () => {
    container = await new MySqlContainer("mysql:latest")
      .withDatabase("addresses")
      .withUsername("test")
      .withRootPassword("test")
      .start();

      // copy seed file
    await container.copyFilesToContainer([
      {
        source: SEED_FILE,
        target: "/seed.sql",
      },
    ]);

      // seed database
    const result = await container.exec([
      "bash",
      "-c",
      `mysql -u${container.getUsername()} -p${container.getUserPassword()} ${container.getDatabase()} < /seed.sql`,
    ]);

    if (result.exitCode !== 0) {
      throw new Error(
        `Seeding failed with exit code ${result.exitCode}: ${result.output}`,
      );
    }

      // create connection for test queries
    connection = await mysql.createConnection({
      host: container.getHost(),
      port: container.getPort(),
      database: container.getDatabase(),
      user: container.getUsername(),
      password: container.getUserPassword(),
    });

      // redirect pool queries to our connection and track executed SQL
    poolQueryFn = ((sql: string, values?: unknown[]) => {
      executedSql.push(sql);
      return connection.query(sql, values);
    }) as Pool["query"];
  });

  beforeEach(() => {
    executedSql = [];
    (Town as unknown as { townCount: number }).townCount = 0;
  });

  afterAll(async () => {
    await connection?.end();
    await container?.stop();
  });

  // --- Tests ---

  it("fetches a town that exists in the postal_code table", async () => {
    const town = await Town.getRandomTown();

    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT COUNT(*) AS matches FROM postal_code WHERE cPostalCode = ? AND cTownName = ?",
      [town.postal_code, town.town_name],
    );

    expect(town).toEqual({
      postal_code: expect.any(String),
      town_name: expect.any(String),
    });
    expect(rows[0].matches).toBe(1);
  });

  it("returns correctly shaped data over repeated DB fetches", async () => {
    for (let i = 0; i < 25; i++) {
      const town = await Town.getRandomTown();

      expect(town.postal_code).toMatch(/^\d{4}$/);
      expect(town.town_name.trim().length).toBeGreaterThan(0);
    }
  });

  it("Returns a capitalized town name", async () => {
    const town = await Town.getRandomTown();
    expect(town.town_name).toMatch(
      /^[A-ZÆØÅ][a-zæøå]+(?: [A-ZÆØÅ][a-zæøå]+)*$/,
    );
  });
});

import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from "vitest";
import { MySqlContainer, StartedMySqlContainer } from "@testcontainers/mysql";
import mysql, { Connection, Pool } from "mysql2/promise";
import * as path from "node:path";

import { FakeInfo, Person } from "../../backend/src/FakeInfo";
import { Town } from "../../backend/src/Town";

// This mock redirects the DB pool to use the testcontainer
let poolQueryFn: Pool["query"];

vi.mock("../../backend/src/DB", () => ({
  pool: {
    query: (sql: string, values?: unknown[]) => poolQueryFn(sql, values),
  },
}));

describe("Testing creation of fake people and validation of connection for person-names.json and the database", () => {
  let container: StartedMySqlContainer;
  let connection: Connection;

  const SEED_FILE = path.join(__dirname, "../../backend/db/addresses.sql");

  beforeAll(async () => {
    container = await new MySqlContainer("mysql:latest")
      .withDatabase("addresses")
      .withUsername("test")
      .withRootPassword("test")
      .start();

    await container.copyFilesToContainer([{
      source: SEED_FILE,
      target: "/seed.sql",
    }]);

    const result = await container.exec([
      "bash", "-c",
      `mysql \
        -u${container.getUsername()} \
        -p${container.getUserPassword()} \
        ${container.getDatabase()} < /seed.sql`,
    ]);

    if (result.exitCode !== 0) {
      throw new Error(`Seeding failed with exit code ${result.exitCode}: ${result.output}`);
    }

    connection = await mysql.createConnection({
      host: container.getHost(),
      port: container.getPort(),
      database: container.getDatabase(),
      user: container.getUsername(),
      password: container.getUserPassword(),
    });

    poolQueryFn = connection.query.bind(connection) as Pool["query"];
  });

  beforeEach(() => {
    (Town as unknown as { townCount: number }).townCount = 0;
  });

  afterAll(async () => {
    await connection?.end();
    await container?.stop();
  });

  it("creates a single fake person object with all required fields", async () => {
    const info = await FakeInfo.create();
    const person: Person = info.getFakePerson();

    expectValidPerson(person);
  });

  it("creates 100 fake person objects with all required fields", async () => {
    const people: Person[] = await FakeInfo.getFakePersons(100);

    expect(people).toHaveLength(100);
    expectValidPerson(people[0]);
  });
});

//--------------------------------- helper function ---------------------------------
function expectValidPerson(person: Person): void {
  expect(person).toMatchObject({
    CPR: expect.any(String),
    firstName: expect.any(String),
    lastName: expect.any(String),
    gender: expect.any(String),
    birthDate: expect.any(String),
    address: expect.objectContaining({
      street: expect.any(String),
      number: expect.any(String),
      floor: expect.anything(),
      door: expect.anything(),
      postal_code: expect.any(String),
      town_name: expect.any(String),
    }),
    phoneNumber: expect.any(String),
  });
}
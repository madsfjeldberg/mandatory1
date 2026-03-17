import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { MySqlContainer, StartedMySqlContainer } from "@testcontainers/mysql";
import mysql, { Connection } from "mysql2/promise";

describe("MySQL testcontainer example", () => {
  let container: StartedMySqlContainer;
  let connection: Connection;

  beforeAll(async () => {
    container = await new MySqlContainer('mysql:latest').start();

    connection = await mysql.createConnection({
      host: container.getHost(),
      port: container.getPort(),
      database: container.getDatabase(),
      user: container.getUsername(),
      password: container.getUserPassword(),
    });

    await connection.execute(`
      CREATE TABLE users (
        id   INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      )
    `);
  });

  afterAll(async () => {
    await connection.end();
    await container.stop();
  });

  it("inserts and retrieves a row", async () => {
    await connection.execute("INSERT INTO users (name) VALUES (?)", ["Alice"]);

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      "SELECT name FROM users WHERE name = ?",
      ["Alice"],
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Alice");
  });

  it("returns empty result for unknown name", async () => {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      "SELECT name FROM users WHERE name = ?",
      ["Nobody"],
    );

    expect(rows).toHaveLength(0);
  });
});

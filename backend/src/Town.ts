/**
 * Generates random postal codes and town names from the database.
 * The total town count is cached statically so the COUNT query runs only once.
 *
 * @author  Arturo Mora-Rioja (original PHP)
 * @version 1.0.0 TypeScript port
 */
import { RowDataPacket } from "mysql2";
import { pool } from "./DB";

interface TownRow extends RowDataPacket {
  postal_code: string;
  town_name: string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

export class Town {
  private static townCount: number = 0;

  private static async init(): Promise<void> {
    if (this.townCount === 0) {
      const [rows] = await pool.query<CountRow[]>(
        "SELECT COUNT(*) AS total FROM postal_code",
      );
      this.townCount = rows[0].total;
    }
  }

  static async getRandomTown(): Promise<{
    postal_code: string;
    town_name: string;
  }> {
    await this.init();
    const randomOffset = Math.floor(Math.random() * this.townCount);
    const [rows] = await pool.query<TownRow[]>(
      "SELECT cPostalCode AS postal_code, cTownName AS town_name FROM postal_code LIMIT ?, 1",
      [randomOffset],
    );
    return rows[0];
  }
}

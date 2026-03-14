/**
 * Encapsulates a connection pool to the database.
 *
 * @author  Arturo Mora-Rioja (original PHP)
 * @version 1.0.0 TypeScript port
 */
import mysql from "mysql2/promise";
import { Info } from "./Info";

export const pool = mysql.createPool({
  host: Info.host(),
  database: Info.dbName(),
  user: Info.user(),
  password: Info.password(),
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
});

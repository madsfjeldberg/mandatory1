/**
 * Database connection configuration.
 * Values are read from environment variables with fallbacks to defaults.
 *
 * @author  Arturo Mora-Rioja (original PHP)
 * @version 1.0.0 TypeScript port
 */
export class Info {
  static readonly HOST = "localhost";
  static readonly DB_NAME = "addresses";
  static readonly USER = "root";
  static readonly PASSWORD = "";

  static host(): string {
    return process.env.DB_HOST || this.HOST;
  }

  static dbName(): string {
    return process.env.DB_NAME || this.DB_NAME;
  }

  static user(): string {
    return process.env.DB_USER || this.USER;
  }

  static password(): string {
    return process.env.DB_PASSWORD ?? this.PASSWORD;
  }
}

import "server-only";
import { readFileSync } from "node:fs";
import mysql, { type Pool } from "mysql2/promise";

// Connection pool. Never import from a client component;
// the credentials must never reach the browser.
//
// Built lazily (not at module scope) so importing this file doesn't require
// the env vars to be set — Next evaluates route modules while collecting build
// metadata, before runtime env vars are available.
let pool: Pool | null = null;

/** Server-side idle limit for our sessions (seconds). */
const IDLE_SERVER_SEC = 90;
const LOST = new Set(["PROTOCOL_CONNECTION_LOST", "ECONNRESET", "EPIPE", "ER_CON_COUNT_ERROR"]);

export function getPool(): Pool {
  if (pool) return pool;

  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;

  if (!host || !user || !database) {
    throw new Error("DB_HOST, DB_USER, and DB_NAME must be set");
  }

  pool = mysql.createPool({
    host,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user,
    password,
    database,
    // Low pool: on serverless (Netlify) every warm function instance keeps its
    // own pool, and managed hosts like Aiven's free tier cap total connections
    // (~20). A small limit + short idle timeout avoids "Too many connections".
    connectionLimit: Number(process.env.DB_POOL_LIMIT ?? 2),
    maxIdle: 1,
    idleTimeout: 15000,
    enableKeepAlive: true,
    // fail fast when the database is unreachable so pages show their error
    // state instead of a loading screen that never ends
    connectTimeout: 6000,
    // DECIMAL columns come back as strings, never JS numbers — money must
    // never round-trip through a float.
    decimalNumbers: false,
    // DATE/DATETIME come back as "YYYY-MM-DD(THH:MM:SS)" strings, not Date
    // objects — period dates go straight into the casino API query params,
    // which require that exact format.
    dateStrings: true,
    // Managed hosts requiring TLS (e.g. Aiven): base64 of the CA PEM collapses
    // it to one line so .env import UIs can't mangle a multi-line value.
    ssl: process.env.DB_SSL_CA_BASE64
      ? { ca: Buffer.from(process.env.DB_SSL_CA_BASE64, "base64").toString("utf8") }
      : process.env.DB_SSL_CA
        ? { ca: process.env.DB_SSL_CA }
        : process.env.DB_SSL_CA_PATH
          ? { ca: readFileSync(process.env.DB_SSL_CA_PATH, "utf8") }
          : undefined,
  });
  // TIMESTAMP columns are compared against UTC_TIMESTAMP() and admin inputs are
  // UTC, so pin every session to UTC regardless of the server default.
  // A frozen serverless instance can't run the pool's idle timer, so its open
  // connections would sit on the server for the default 8 h wait_timeout and
  // exhaust the connection cap; a short session wait_timeout makes MySQL close
  // them itself.
  // (`pool.pool` is the callback pool underneath; absent in test doubles.)
  (pool as Partial<Pool>).pool?.on("connection", (conn) => {
    conn.query(`SET time_zone = '+00:00', SESSION wait_timeout = ${IDLE_SERVER_SEC}, SESSION interactive_timeout = ${IDLE_SERVER_SEC}`);
  });

  // A connection the server closed while the instance was frozen fails on
  // first use: retry the query once on a fresh connection.
  const query = pool.query.bind(pool);
  pool.query = (async (...args: Parameters<Pool["query"]>) => {
    try {
      return await query(...args);
    } catch (err) {
      if (!LOST.has((err as { code?: string }).code ?? "")) throw err;
      return query(...args);
    }
  }) as Pool["query"];

  return pool;
}

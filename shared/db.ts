import pg from "pg";

const { Pool } = pg;

// Pool maintains reusable connections
//
// request ─┐
// request ─┼──→ Pool → PostgreSQL
// request ─┘
export const pool = new Pool({
  host: process.env.POSTGRES_HOST ?? "localhost",

  port: Number(process.env.POSTGRES_PORT ?? 5432),

  user: process.env.POSTGRES_USER ?? "postgres",

  password: process.env.POSTGRES_PASSWORD ?? "postgres",

  database: process.env.POSTGRES_DB ?? "pulsemetrics",

  max: 20,

  idleTimeoutMillis: 30_000,

  connectionTimeoutMillis: 2_000,
});

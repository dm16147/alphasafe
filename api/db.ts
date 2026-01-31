import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.ts";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let drizzleDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Serverless-safe database accessor.
 * Uses lazy initialization - connection is only created when first needed.
 * Reuses pool across warm invocations, creates new on cold starts.
 * Max pool size is set to 1 to prevent connection exhaustion in serverless.
 */
export function getDb() {
    if (!drizzleDb) {
        if (!process.env.DATABASE_URL) {
            throw new Error(
                "DATABASE_URL must be set. Did you forget to provision a database?",
            );
        }

        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 1,
        });

        drizzleDb = drizzle(pool, { schema });
    }

    return drizzleDb;
}

import { PrismaClient } from "@/generated/prisma";

/**
 * Prisma's default connect timeout is 5 SECONDS, and Neon suspends the compute
 * after 5 minutes of inactivity. A cold start that takes longer than five
 * seconds is therefore reported as "Can't reach database server" — the database
 * is fine, we simply stopped waiting. That is what killed cron runs repeatedly
 * on 2026-08-06 through 2026-08-08, including both attempts of a retry that was
 * itself too impatient.
 *
 * The timeout is applied HERE rather than in the environment variable because
 * `DATABASE_URL` is owned by the Neon–Vercel integration: the dashboard offers
 * no Edit for it, and anything typed there would be overwritten the next time
 * the integration syncs. Doing it in code also means it holds in local
 * development, preview deployments and production without three separate
 * places to keep in step.
 *
 * `pool_timeout` is the wait for a free connection from Prisma's own pool, a
 * different thing from `connect_timeout`, and it has the same too-short default
 * for a database that sleeps.
 */
const CONNECTION_PARAMS = "connect_timeout=15&pool_timeout=15";

function datasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  // Idempotent: the local .env carries these too, and appending twice would
  // produce a connection string Postgres refuses.
  if (url.includes("connect_timeout=")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${CONNECTION_PARAMS}`;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const url = datasourceUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(url ? { datasourceUrl: url } : undefined);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

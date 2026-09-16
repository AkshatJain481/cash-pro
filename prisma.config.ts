import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// Load .env / .env.local the same way Next.js does, so the Prisma CLI and the
// app always read the same DATABASE_URL.
loadEnvConfig(process.cwd());

/**
 * CockroachDB 26+ creates tables "schema locked", and a migration script can't
 * then add indexes or foreign keys to them. Prisma CLI sessions (migrate
 * dev/deploy) turn that default off; the app's own connections are unchanged.
 */
function withUnlockedTables(databaseUrl: string | undefined) {
  if (!databaseUrl) return databaseUrl;
  const url = new URL(databaseUrl);
  const options = [url.searchParams.get("options"), "-c create_table_with_schema_locked=false"];
  url.searchParams.set("options", options.filter(Boolean).join(" "));
  return url.toString();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: withUnlockedTables(process.env.DATABASE_URL),
  },
});

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

declare global {
  var prisma: PrismaClient | undefined;
}

const connectionString =
  process.env.NODE_ENV === "test"
    ? process.env.DIRECT_URL
    : process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Database connection string is not defined in .env");
}

const sslRootCert = process.env.PGSSLROOTCERT;
const sslMode = process.env.PGSSLMODE;

function readDatabaseCertificate(path: string): string {
  if (path === "certs/prod-ca-2021.crt" || path === "./certs/prod-ca-2021.crt") {
    // Proxy has a separate deployment bundle. Keep the standard CA path
    // statically traceable there, as well as in API route bundles.
    return readFileSync(
      resolve(process.cwd(), "certs", "prod-ca-2021.crt"),
      "utf8",
    );
  }

  // Custom CA paths must be explicitly packaged and verified separately.
  return readFileSync(
    resolve(/* turbopackIgnore: true */ process.cwd(), path),
    "utf8",
  );
}

const ssl =
  sslMode === "disable"
    ? false
    : sslRootCert
      ? {
          ca: readDatabaseCertificate(sslRootCert),
          rejectUnauthorized: true,
        }
      : {
          rejectUnauthorized: true,
        };

const adapter = new PrismaPg({
  connectionString,
  ssl,
});

export const prisma =
  global.prisma ||
  new PrismaClient({
    adapter,
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
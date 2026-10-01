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

const ssl =
  sslMode === "disable"
    ? false
    : sslRootCert
      ? {
          ca: readFileSync(resolve(process.cwd(), sslRootCert), "utf8"),
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
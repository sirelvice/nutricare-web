import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

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

// Create adapter with SSL options to accept self-signed certs
const adapter = new PrismaPg({
  connectionString,
  ssl: {
    rejectUnauthorized: false,   // ← This is the key line
  },
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
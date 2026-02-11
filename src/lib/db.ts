import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

declare global {
  var prisma: PrismaClient | undefined;
}

const dbPath = path.join(process.cwd(), "prisma/dev.db");

// Instead of opening Database yourself, pass the path via url
const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
  // optional: timeout, verbose, etc.
  // timeout: 5000,
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
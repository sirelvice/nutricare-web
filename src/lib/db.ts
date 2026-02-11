// src/lib/db.ts
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
// import Database from "better-sqlite3";
import path from "path";

declare global {
  var prisma: PrismaClient | undefined;
}

const dbPath = path.join(process.cwd(), "prisma/dev.db");

// temporarily commented out to test
// const sqlite = new Database(dbPath);

const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
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
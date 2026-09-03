import { describe, expect, it, vi } from "vitest";
import { PrismaWeightRepository } from "./prisma-weight-repository";

describe("PrismaWeightRepository", () => {
  it("creates and maps a weight entry", async () => {
    const db = {
      weightEntry: {
        create: vi.fn().mockResolvedValue({
          id: "entry-1",
          date: new Date("2026-09-02T00:00:00.000Z"),
          weightKg: 60.5,
          note: "Morning weight",
        }),
      },
    } as any;

    const repository = new PrismaWeightRepository(db);

    const result = await repository.create("user-1", {
      date: "2026-09-02",
      weightKg: 60.5,
      note: "Morning weight",
    });

    expect(db.weightEntry.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        date: new Date("2026-09-02T00:00:00.000Z"),
        weightKg: 60.5,
        note: "Morning weight",
      },
    });

    expect(result).toEqual({
      id: "entry-1",
      date: "2026-09-02",
      weightKg: 60.5,
      note: "Morning weight",
    });
  });

  it("lists only the authenticated user's entries", async () => {
    const db = {
      weightEntry: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "entry-1",
            date: new Date("2026-09-02T00:00:00.000Z"),
            weightKg: 60.5,
            note: null,
          },
        ]),
      },
    } as any;

    const repository = new PrismaWeightRepository(db);

    const result = await repository.findByUserId("user-1");

    expect(db.weightEntry.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { date: "desc" },
    });

    expect(result).toEqual([
      {
        id: "entry-1",
        date: "2026-09-02",
        weightKg: 60.5,
      },
    ]);
  });

  it("finds the latest entry for the authenticated user", async () => {
    const db = {
      weightEntry: {
        findFirst: vi.fn().mockResolvedValue({
          id: "entry-2",
          date: new Date("2026-09-03T00:00:00.000Z"),
          weightKg: 61.2,
          note: null,
        }),
      },
    } as any;

    const repository = new PrismaWeightRepository(db);

    const result = await repository.findLatestByUserId("user-1");

    expect(db.weightEntry.findFirst).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { date: "desc" },
    });

    expect(result).toEqual({
      id: "entry-2",
      date: "2026-09-03",
      weightKg: 61.2,
    });
  });

  it("returns null when the user has no weight entries", async () => {
    const db = {
      weightEntry: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as any;

    const repository = new PrismaWeightRepository(db);

    const result = await repository.findLatestByUserId("user-1");

    expect(result).toBeNull();
  });

  it("deletes only an entry belonging to the user", async () => {
    const db = {
      weightEntry: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    } as any;

    const repository = new PrismaWeightRepository(db);

    await repository.delete("user-1", "entry-1");

    expect(db.weightEntry.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "entry-1",
        userId: "user-1",
      },
    });
  });
});

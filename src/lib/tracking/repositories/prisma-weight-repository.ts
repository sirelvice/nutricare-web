import type { PrismaClient } from "@prisma/client";
import type { NewWeightEntry, WeightEntry } from "../domain";
import type { WeightRepository } from "./weight-repository";

function toDomain(entry: {
  id: string;
  date: Date;
  weightKg: number;
  note: string | null;
}): WeightEntry {
  return {
    id: entry.id,
    date: entry.date.toISOString().slice(0, 10),
    weightKg: entry.weightKg,
    ...(entry.note ? { note: entry.note } : {}),
  };
}

export class PrismaWeightRepository implements WeightRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(
    userId: string,
    entry: NewWeightEntry,
  ): Promise<WeightEntry> {
    const created = await this.db.weightEntry.create({
      data: {
        userId,
        date: new Date(`${entry.date}T00:00:00.000Z`),
        weightKg: entry.weightKg,
        note: entry.note ?? null,
      },
    });

    return toDomain(created);
  }

  async findByUserId(userId: string): Promise<WeightEntry[]> {
    const entries = await this.db.weightEntry.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    return entries.map(toDomain);
  }

  async delete(userId: string, entryId: string): Promise<void> {
    await this.db.weightEntry.deleteMany({
      where: {
        id: entryId,
        userId,
      },
    });
  }
}

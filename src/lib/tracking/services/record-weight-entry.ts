import {
  type NewWeightEntry,
  type WeightEntry,
  validateWeightEntry,
} from "../domain";
import type { WeightRepository } from "../repositories/weight-repository";

export class InvalidWeightEntryError extends Error {
  constructor() {
    super("Invalid weight entry");
    this.name = "InvalidWeightEntryError";
  }
}

export class RecordWeightEntryService {
  constructor(private readonly repository: WeightRepository) {}

  async execute(
    userId: string,
    entry: NewWeightEntry,
  ): Promise<WeightEntry> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!validateWeightEntry(entry)) {
      throw new InvalidWeightEntryError();
    }

    return this.repository.create(userId, entry);
  }
}

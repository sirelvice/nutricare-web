import type { NewWeightEntry, WeightEntry } from "../domain";

export interface WeightRepository {
  create(userId: string, entry: NewWeightEntry): Promise<WeightEntry>;
  findByUserId(userId: string): Promise<WeightEntry[]>;
  delete(userId: string, entryId: string): Promise<void>;
}

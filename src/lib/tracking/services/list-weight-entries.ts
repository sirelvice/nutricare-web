import type { WeightEntry } from "../domain";
import type { WeightRepository } from "../repositories/weight-repository";

export class ListWeightEntriesService {
  constructor(private readonly repository: WeightRepository) {}

  async execute(userId: string): Promise<WeightEntry[]> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    return this.repository.findByUserId(userId);
  }
}

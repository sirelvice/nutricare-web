import type { WeightRepository } from "../repositories/weight-repository";

export class DeleteWeightEntryService {
  constructor(private readonly repository: WeightRepository) {}

  async execute(userId: string, entryId: string): Promise<void> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!entryId) {
      throw new Error("Weight entry ID is required");
    }

    await this.repository.delete(userId, entryId);
  }
}

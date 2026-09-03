import { describe, expect, it, vi } from "vitest";
import { EvaluateProgressService } from "./service";
import type { UserProfile } from "@/lib/profile/domain";
import type { WeightEntry } from "@/lib/tracking/domain";
import type { ProfileRepository } from "@/lib/profile/repositories/profile-repository";
import type { WeightRepository } from "@/lib/tracking/repositories/weight-repository";

const profile = (goal: UserProfile["goal"]): UserProfile => ({
  heightCm: 176,
  gender: "male",
  age: 24,
  activity: "moderate",
  goal,
});

const entry = (id: string, date: string, weightKg: number): WeightEntry => ({
  id,
  date,
  weightKg,
});

describe("EvaluateProgressService", () => {
  it("rejects a missing user ID", async () => {
    const service = new EvaluateProgressService(
      {} as ProfileRepository,
      {} as WeightRepository,
    );

    await expect(service.execute("")).rejects.toThrow("User ID is required");
  });

  it("returns null when the profile does not exist", async () => {
    const profileRepository = {
      findByUserId: vi.fn().mockResolvedValue(null),
    } as unknown as ProfileRepository;

    const weightRepository = {
      findByUserId: vi.fn(),
    } as unknown as WeightRepository;

    const service = new EvaluateProgressService(
      profileRepository,
      weightRepository,
    );

    await expect(service.execute("user-1")).resolves.toBeNull();

    expect(profileRepository.findByUserId).toHaveBeenCalledWith("user-1");
    expect(weightRepository.findByUserId).not.toHaveBeenCalled();
  });

  it("evaluates progress using the user's goal and persisted weights", async () => {
    const profileRepository = {
      findByUserId: vi.fn().mockResolvedValue(profile("lose")),
    } as unknown as ProfileRepository;

    const weightRepository = {
      findByUserId: vi.fn().mockResolvedValue([
        entry("3", "2026-08-15", 69.4),
        entry("1", "2026-08-01", 70),
        entry("2", "2026-08-08", 69.7),
      ]),
    } as unknown as WeightRepository;

    const service = new EvaluateProgressService(
      profileRepository,
      weightRepository,
    );

    await expect(service.execute("user-1")).resolves.toEqual({
      state: "ON_TRACK",
      changeKg: -0.6,
      entriesCount: 3,
      evaluationDays: 14,
    });

    expect(profileRepository.findByUserId).toHaveBeenCalledWith("user-1");
    expect(weightRepository.findByUserId).toHaveBeenCalledWith("user-1");
  });

  it("uses the profile goal rather than a client-supplied goal", async () => {
    const profileRepository = {
      findByUserId: vi.fn().mockResolvedValue(profile("gain")),
    } as unknown as ProfileRepository;

    const weightRepository = {
      findByUserId: vi.fn().mockResolvedValue([
        entry("1", "2026-08-01", 60),
        entry("2", "2026-08-08", 60.3),
        entry("3", "2026-08-15", 60.6),
      ]),
    } as unknown as WeightRepository;

    const service = new EvaluateProgressService(
      profileRepository,
      weightRepository,
    );

    await expect(service.execute("user-1")).resolves.toEqual({
      state: "ON_TRACK",
      changeKg: 0.6,
      entriesCount: 3,
      evaluationDays: 14,
    });
  });

  it("returns insufficient data when persisted history is not enough", async () => {
    const profileRepository = {
      findByUserId: vi.fn().mockResolvedValue(profile("lose")),
    } as unknown as ProfileRepository;

    const weightRepository = {
      findByUserId: vi.fn().mockResolvedValue([
        entry("1", "2026-08-01", 70),
        entry("2", "2026-08-05", 69.8),
        entry("3", "2026-08-10", 69.5),
      ]),
    } as unknown as WeightRepository;

    const service = new EvaluateProgressService(
      profileRepository,
      weightRepository,
    );

    await expect(service.execute("user-1")).resolves.toEqual({
      state: "INSUFFICIENT_DATA",
      changeKg: null,
      entriesCount: 3,
      evaluationDays: 9,
    });
  });
});

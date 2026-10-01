import { describe, expect, it, vi } from "vitest";
import { PrismaProfileRepository } from "./prisma-profile-repository";
import type { UserProfile } from "../domain";

type ProfileDb = ConstructorParameters<typeof PrismaProfileRepository>[0];

const profile: UserProfile = {
  heightCm: 170,
  age: 30,
  gender: "male",
  activity: "moderate",
  goal: "gain",
};

describe("PrismaProfileRepository", () => {
  it("returns null when no profile exists", async () => {
    const db = {
      profile: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn(),
      },
    } satisfies ProfileDb;

    const repository = new PrismaProfileRepository(db);

    await expect(repository.findByUserId("user-1")).resolves.toBeNull();
    expect(db.profile.findUnique).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
  });

  it("maps a Prisma profile to the domain profile", async () => {
    const db = {
      profile: {
        findUnique: vi.fn().mockResolvedValue({
          heightCm: 170,
          age: 30,
          gender: "MALE",
          activity: "MODERATE",
          goal: "GAIN",
        }),
        upsert: vi.fn(),
      },
    } satisfies ProfileDb;

    const repository = new PrismaProfileRepository(db);

    await expect(repository.findByUserId("user-1")).resolves.toEqual(profile);
  });

  it("upserts and returns the saved domain profile", async () => {
    const db = {
      profile: {
        findUnique: vi.fn(),
        upsert: vi.fn().mockResolvedValue({
          heightCm: 170,
          age: 30,
          gender: "MALE",
          activity: "MODERATE",
          goal: "GAIN",
        }),
      },
    } satisfies ProfileDb;

    const repository = new PrismaProfileRepository(db);

    await expect(repository.save("user-1", profile)).resolves.toEqual(profile);
    expect(db.profile.upsert).toHaveBeenCalled();
  });
});

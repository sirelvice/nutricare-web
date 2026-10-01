import {
  ActivityLevel,
  Gender,
  Goal as PrismaGoal,
  type PrismaClient,
} from "@prisma/client";
import type { UserProfile } from "../domain";
import type { ProfileRepository } from "./profile-repository";

function toPrismaGender(value: UserProfile["gender"]): Gender {
  return value.toUpperCase() as Gender;
}

function toPrismaActivity(value: UserProfile["activity"]): ActivityLevel {
  return value.toUpperCase() as ActivityLevel;
}

function toPrismaGoal(value: UserProfile["goal"]): PrismaGoal {
  return value.toUpperCase() as PrismaGoal;
}

type ProfileDb = {
  profile: Pick<PrismaClient["profile"], "findUnique" | "upsert">;
};

export class PrismaProfileRepository implements ProfileRepository {
  constructor(private readonly db: ProfileDb) {}

  async findByUserId(userId: string): Promise<UserProfile | null> {
    const profile = await this.db.profile.findUnique({
      where: { userId },
    });

    if (!profile) return null;

    return {
      heightCm: profile.heightCm,
      age: profile.age,
      gender: profile.gender.toLowerCase() as UserProfile["gender"],
      activity: profile.activity.toLowerCase() as UserProfile["activity"],
      goal: profile.goal.toLowerCase() as UserProfile["goal"],
    };
  }

  async save(userId: string, profile: UserProfile): Promise<UserProfile> {
    const saved = await this.db.profile.upsert({
      where: { userId },
      create: {
        userId,
        heightCm: profile.heightCm,
        age: profile.age,
        gender: toPrismaGender(profile.gender),
        activity: toPrismaActivity(profile.activity),
        goal: toPrismaGoal(profile.goal),
      },
      update: {
        heightCm: profile.heightCm,
        age: profile.age,
        gender: toPrismaGender(profile.gender),
        activity: toPrismaActivity(profile.activity),
        goal: toPrismaGoal(profile.goal),
      },
    });

    return {
      heightCm: saved.heightCm,
      age: saved.age,
      gender: saved.gender.toLowerCase() as UserProfile["gender"],
      activity: saved.activity.toLowerCase() as UserProfile["activity"],
      goal: saved.goal.toLowerCase() as UserProfile["goal"],
    };
  }
}

import type { UserProfile } from "../domain";

export interface ProfileRepository {
  findByUserId(userId: string): Promise<UserProfile | null>;
  save(userId: string, profile: UserProfile): Promise<UserProfile>;
}

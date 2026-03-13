import "next-auth";
import "next-auth/jwt";
import { SubscriptionTier, Role } from "@prisma/client"; // ✅ import Prisma enums

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    subscriptionTier: SubscriptionTier;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: Role;
      subscriptionTier: SubscriptionTier;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    subscriptionTier?: SubscriptionTier;
  }
}
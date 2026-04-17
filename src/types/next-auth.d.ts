import "next-auth";
import "next-auth/jwt";
import { Role, SubscriptionTier } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string | null;
      name: string | null;
      role: Role;
      subscriptionTier: SubscriptionTier;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
    role: Role;
    subscriptionTier: SubscriptionTier;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    email?: string | null;
    name?: string | null;
    role?: Role;
    subscriptionTier?: SubscriptionTier;
  }
}
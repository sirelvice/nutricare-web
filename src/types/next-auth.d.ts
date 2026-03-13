import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: "USER" | "CLINICIAN" | "ADMIN"; // ✅ add role
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: "USER" | "CLINICIAN" | "ADMIN"; // ✅ add role
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "USER" | "CLINICIAN" | "ADMIN"; // ✅ add role
  }
}

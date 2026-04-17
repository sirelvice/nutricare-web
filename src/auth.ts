import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: process.env.NODE_ENV === "development", // Helpful logs in dev only

  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    Credentials({
      name: "Credentials",

      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString();

        if (!email || !password) {
          console.log("❌ Auth: Missing email or password");
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.log(`❌ Auth: User not found → ${email}`);
            return null;
          }

          const isValid = await bcrypt.compare(password, user.passwordHash);

          if (!isValid) {
            console.log(`❌ Auth: Invalid password for → ${email}`);
            return null;
          }

          console.log(`✅ Auth: Successful login → ${email} (${user.role})`);

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            role: user.role,
            subscriptionTier: user.subscriptionTier ?? "FREE",
          };
        } catch (error) {
          console.error("🚨 Auth error in authorize():", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role ?? "USER";
        token.subscriptionTier = user.subscriptionTier ?? "FREE";
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as any ?? "USER";
        session.user.subscriptionTier = token.subscriptionTier as any ?? "FREE";
      }
      return session;
    },
  },
});
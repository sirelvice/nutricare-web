import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { loginSchema } from "@/lib/security/auth-validation";
import { getAuthSecret } from "@/lib/security/runtime-config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: false,

  secret: getAuthSecret(),

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },

      async authorize(credentials) {
        const parsed = loginSchema.safeParse({
          email: credentials?.email?.toString(),
          password: credentials?.password?.toString(),
        });

        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          authVersion: user.authVersion,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.authVersion = user.authVersion;
      }

      if (token.sub) {
        const currentUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { authVersion: true },
        });

        if (!currentUser || currentUser.authVersion !== token.authVersion) {
          token.invalidated = true;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token.invalidated) {
        throw new Error("Session invalidated");
      }
      if (!session.user) return session;

      const userId = token.sub;
      if (!userId) throw new Error("Invalid session: missing user id");

      session.user.id = userId;
      if (token.email) {
        session.user.email = token.email;
      }
      session.user.name = token.name ?? null;
      session.user.role = token.role ?? Role.USER;
      return session;
    },
  },
});
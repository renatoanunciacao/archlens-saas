import { accounts, sessions, subscriptions, usageLimits, users, verificationTokens } from "../db/schema";

import { DrizzleAdapter } from "@auth/drizzle-adapter";
import GitHub from "next-auth/providers/github";
import NextAuth, { type AuthOptions, type Session } from "next-auth";
import { db } from "../db";

// Disable SSL verification for local development with GitHub OAuth
if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export const authOptions: AuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }: { session: Session; user: { id: string } }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }: { user: { id: string } }) {
      const { randomUUID } = await import("node:crypto");
      await db.insert(subscriptions).values({
        id: randomUUID(),
        userId: user.id!,
        plan: "free",
        status: "active",
      });

      await db.insert(usageLimits).values({
        id: randomUUID(),
        userId: user.id!,
        projectsCount: 0,
        analysesCountMonth: 0,
        maxProjects: 2,
        maxAnalysesPerMonth: 20,
      });
    },
  },
  pages: {
    signIn: "/login",
  },
};

export const { auth } = NextAuth(authOptions);
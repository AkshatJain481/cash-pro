import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/prisma";

// Reads BETTER_AUTH_SECRET and BETTER_AUTH_URL from the environment.
export const auth = betterAuth({
  appName: "Cash Pro",
  database: prismaAdapter(prisma, { provider: "cockroachdb" }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      prompt: "select_account",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    // Avoid a database round trip on every request for 5 minutes.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  advanced: {
    database: { generateId: "uuid" },
  },
  plugins: [nextCookies()], // must be the last plugin
});

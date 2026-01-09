// Better Auth configuration with Microsoft Entra ID
// Note: Better Auth requires Prisma adapter. For MongoDB, you would need:
// 1. Install Prisma and set up MongoDB provider, OR
// 2. Use a custom adapter for MongoDB, OR
// 3. Use a different auth library that supports MongoDB directly

// This is a placeholder implementation. To enable:
// 1. Install: npm install better-auth @better-auth/prisma prisma
// 2. Set up Prisma with MongoDB provider
// 3. Uncomment and configure below

/*
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
      tenantId: process.env.MICROSOFT_TENANT_ID || "",
    },
  },
  secret: process.env.BETTER_AUTH_SECRET || "change-me-in-production",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});

export const authHandler = auth.handler;
*/

// Placeholder for now
export const authHandler = (req: any, res: any) => {
  res.status(501).json({ message: "Auth not configured. See apps/api/src/config/auth.ts" });
};

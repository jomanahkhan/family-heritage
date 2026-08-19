import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Vercel's Node.js serverless runtime doesn't have a native WebSocket
// implementation for Neon's pooled driver, so we polyfill it. Using the Neon
// driver adapter (instead of Prisma's default native query-engine binary)
// sidesteps a Vercel/Next.js bundling bug where both Turbopack and webpack
// relocate the generated Prisma client's code into merged chunk files,
// breaking its __dirname-based lookup for the .so.node engine binary at
// runtime even when the file is verified present in the deployment.
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

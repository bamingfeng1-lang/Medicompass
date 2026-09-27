import { PrismaClient } from "@prisma/client";
import { fieldEncryption } from "./crypto-field";

// Reuse a single PrismaClient across hot reloads in dev to avoid exhausting
// connections / spawning duplicate clients. The client is extended with
// transparent field-level encryption (see lib/crypto-field.ts).
function makeClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  }).$extends(fieldEncryption);
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof makeClient>;
};

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

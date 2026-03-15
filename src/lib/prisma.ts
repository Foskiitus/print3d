import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// ✅ Em desenvolvimento, reutilizar a instância entre hot-reloads
// para não esgotar o connection pool do Supabase
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

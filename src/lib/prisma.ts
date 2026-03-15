import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

let prisma: PrismaClient;

if (typeof window === "undefined") {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
    prisma = new PrismaClient({ adapter });
  } else {
    prisma = new PrismaClient();
  }
}

export { prisma };

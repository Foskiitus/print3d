import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Criamos uma variável para o cliente
let prisma: PrismaClient;

if (typeof window === "undefined") {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Se estivermos no ambiente Node.js normal (API Routes, Server Actions)
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  } else {
    // Se estivermos no Edge (Middleware), instanciamos o Prisma sem o adapter nativo
    // ou usamos uma versão que não dependa de drivers TCP
    prisma = new PrismaClient();
  }
}

export { prisma };

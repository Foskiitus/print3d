import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

// 1. Carrega as variáveis do .env
dotenv.config();

// 2. Configura a ligação com o driver pg nativo
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 3. O Prisma agora recebe o adapter e fica feliz (o objeto já não está vazio!)
const prisma = new PrismaClient({ adapter });

const bcrypt = require("bcryptjs");

async function main() {
  const password = await bcrypt.hash("admin123", 12);
  const user = await prisma.user.upsert({
    where: { email: "admin@print3d.com" },
    update: { password },
    create: {
      email: "admin@print3d.com",
      name: "Admin",
      password,
      role: "admin",
    },
  });
  console.log("Utilizador criado/atualizado:", user.email);
}

main();

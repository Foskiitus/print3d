import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 A iniciar Seed...");

  // 1. Criar ou Atualizar Utilizador Admin
  const adminEmail = "admin@print3d.com";
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "admin" },
    create: {
      email: adminEmail,
      name: "Administrador Geral",
      password: hashedPassword,
      role: "admin",
    },
  });
  console.log(`✅ Admin configurado: ${admin.email}`);

  // 2. Printer Presets (Biblioteca Global)
  const presets = [
    {
      name: "Bambu Lab X1 Carbon",
      powerWatts: 350,
      hourlyCost: 0.5,
      imageUrl: "https://exemplo.com/x1c.png",
    },
    {
      name: "Bambu Lab P1S",
      powerWatts: 300,
      hourlyCost: 0.4,
      imageUrl: "https://exemplo.com/p1s.png",
    },
    {
      name: "Prusa MK4",
      powerWatts: 240,
      hourlyCost: 0.35,
      imageUrl: "https://exemplo.com/mk4.png",
    },
    {
      name: "Bambu Lab P2S",
      powerWatts: 200,
      hourlyCost: 0.26,
      imageUrl: "https://exemplo.com/p2s.png",
    },
  ];

  for (const preset of presets) {
    const presetId = preset.name.replace(/\s+/g, "-").toLowerCase();
    await prisma.printerPreset.upsert({
      where: { id: presetId },
      update: preset,
      create: {
        id: presetId,
        ...preset,
      },
    });
  }
  console.log("✅ Printer Presets atualizados.");

  // 3. Definição padrão do limite de upload
  await prisma.settings.upsert({
    where: { userId_key: { userId: admin.id, key: "uploadLimitMb" } },
    update: {},
    create: { userId: admin.id, key: "uploadLimitMb", value: "100" },
  });
  console.log("✅ Limite de upload padrão configurado: 100 MB.");

  console.log("🏁 Seed finalizado com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro no Seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

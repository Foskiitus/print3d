import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("A iniciar o seed...");

  // Limpar tudo
  await prisma.sale.deleteMany();
  await prisma.productionLog.deleteMany();
  await prisma.printProfile.deleteMany();
  await prisma.productExtra.deleteMany();
  await prisma.productFilamentUsage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.filamentSpool.deleteMany();
  await prisma.filamentType.deleteMany();
  await prisma.extra.deleteMany();
  await prisma.printer.deleteMany();
  await prisma.category.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();

  // Utilizadores
  const admin = await prisma.user.create({
    data: {
      name: "Administrador",
      email: "admin@print3d.com",
      password: await bcrypt.hash("admin123", 12),
      role: "admin",
    },
  });
  const user1 = await prisma.user.create({
    data: {
      name: "Ricardo Lopes",
      email: "ricardo@print3d.com",
      password: await bcrypt.hash("user123", 12),
      role: "user",
    },
  });

  console.log("✓ Utilizadores criados");

  // Dados para o user1
  const keychains = await prisma.category.create({
    data: { userId: user1.id, name: "Keychains" },
  });
  const decoration = await prisma.category.create({
    data: { userId: user1.id, name: "Decoration" },
  });

  const plaBlack = await prisma.filamentType.create({
    data: {
      userId: user1.id,
      brand: "Bambu Lab",
      material: "PLA",
      colorName: "Black",
      colorHex: "#000000",
    },
  });
  const plaWhite = await prisma.filamentType.create({
    data: {
      userId: user1.id,
      brand: "Bambu Lab",
      material: "PLA",
      colorName: "White",
      colorHex: "#ffffff",
    },
  });
  const plaRed = await prisma.filamentType.create({
    data: {
      userId: user1.id,
      brand: "Bambu Lab",
      material: "PLA",
      colorName: "Red",
      colorHex: "#ff0000",
    },
  });

  await prisma.filamentSpool.createMany({
    data: [
      {
        userId: user1.id,
        filamentTypeId: plaBlack.id,
        spoolWeight: 1000,
        remaining: 1000,
        price: 22,
        purchaseDate: new Date(),
      },
      {
        userId: user1.id,
        filamentTypeId: plaWhite.id,
        spoolWeight: 1000,
        remaining: 850,
        price: 22,
        purchaseDate: new Date(),
      },
      {
        userId: user1.id,
        filamentTypeId: plaRed.id,
        spoolWeight: 1000,
        remaining: 1000,
        price: 23,
        purchaseDate: new Date(),
      },
    ],
  });

  const keyring = await prisma.extra.create({
    data: {
      userId: user1.id,
      name: "Keychain Ring",
      price: 0.15,
      unit: "unit",
    },
  });

  const bambuX1 = await prisma.printer.create({
    data: {
      userId: user1.id,
      name: "Bambu X1C",
      hourlyCost: 0.5,
      powerWatts: 120,
    },
  });
  const bambuP1 = await prisma.printer.create({
    data: {
      userId: user1.id,
      name: "Bambu P1S",
      hourlyCost: 0.45,
      powerWatts: 110,
    },
  });

  const pokemon = await prisma.product.create({
    data: {
      userId: user1.id,
      name: "Pokemon Keychain",
      description: "Multicolor Pokemon keychain",
      categoryId: keychains.id,
      printerId: bambuX1.id,
      productionTime: 120,
      margin: 0.4,
    },
  });
  const benchy = await prisma.product.create({
    data: {
      userId: user1.id,
      name: "3D Benchy",
      description: "Benchmark test print",
      categoryId: decoration.id,
      printerId: bambuP1.id,
      productionTime: 60,
      margin: 0.3,
    },
  });

  await prisma.productFilamentUsage.createMany({
    data: [
      { productId: pokemon.id, filamentTypeId: plaBlack.id, weight: 10 },
      { productId: pokemon.id, filamentTypeId: plaWhite.id, weight: 4 },
      { productId: benchy.id, filamentTypeId: plaWhite.id, weight: 12 },
    ],
  });

  await prisma.productExtra.create({
    data: { productId: pokemon.id, extraId: keyring.id, quantity: 1 },
  });

  // Produções
  await prisma.productionLog.create({
    data: {
      userId: user1.id,
      productId: pokemon.id,
      printerId: bambuX1.id,
      quantity: 10,
      notes: "Primeira produção",
    },
  });
  await prisma.productionLog.create({
    data: {
      userId: user1.id,
      productId: benchy.id,
      printerId: bambuP1.id,
      quantity: 5,
    },
  });

  // Vendas
  await prisma.sale.create({
    data: {
      userId: user1.id,
      productId: pokemon.id,
      customerName: "Ana Silva",
      quantity: 2,
      salePrice: 8.5,
    },
  });
  await prisma.sale.create({
    data: {
      userId: user1.id,
      productId: benchy.id,
      customerName: "João Costa",
      quantity: 1,
      salePrice: 5.0,
    },
  });

  console.log("✓ Dados de exemplo criados");
  console.log("");
  console.log("Credenciais:");
  console.log("  admin@print3d.com / admin123  (Admin)");
  console.log("  ricardo@print3d.com / user123  (User)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

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

async function main() {
  console.log("A iniciar o seed da base de dados...");
  /////////////////////////////////////////////////////////
  // CATEGORIES
  /////////////////////////////////////////////////////////

  const keychains = await prisma.category.create({
    data: { name: "Keychains" },
  });

  const decoration = await prisma.category.create({
    data: { name: "Decoration" },
  });

  /////////////////////////////////////////////////////////
  // FILAMENT TYPES
  /////////////////////////////////////////////////////////

  const plaBlack = await prisma.filamentType.create({
    data: {
      brand: "Bambu Lab",
      material: "PLA",
      colorName: "Black",
      colorHex: "#000000",
    },
  });

  const plaWhite = await prisma.filamentType.create({
    data: {
      brand: "Bambu Lab",
      material: "PLA",
      colorName: "White",
      colorHex: "#ffffff",
    },
  });

  const plaRed = await prisma.filamentType.create({
    data: {
      brand: "Bambu Lab",
      material: "PLA",
      colorName: "Red",
      colorHex: "#ff000f",
    },
  });

  /////////////////////////////////////////////////////////
  // FILAMENT SPOOLS
  /////////////////////////////////////////////////////////

  await prisma.filamentSpool.createMany({
    data: [
      {
        filamentTypeId: plaBlack.id,
        spoolWeight: 1000,
        remaining: 1000,
        price: 22,
        purchaseDate: new Date(),
      },
      {
        filamentTypeId: plaBlack.id,
        spoolWeight: 1000,
        remaining: 850,
        price: 26,
        purchaseDate: new Date(),
      },
      {
        filamentTypeId: plaWhite.id,
        spoolWeight: 1000,
        remaining: 1000,
        price: 22,
        purchaseDate: new Date(),
      },
      {
        filamentTypeId: plaRed.id,
        spoolWeight: 1000,
        remaining: 1000,
        price: 23,
        purchaseDate: new Date(),
      },
    ],
  });

  /////////////////////////////////////////////////////////
  // EXTRAS
  /////////////////////////////////////////////////////////

  const keyring = await prisma.extra.create({
    data: {
      name: "Keychain Ring",
      price: 0.15,
      unit: "unit",
    },
  });

  const magnet = await prisma.extra.create({
    data: {
      name: "Magnet",
      price: 0.3,
      unit: "unit",
    },
  });

  const glue = await prisma.extra.create({
    data: {
      name: "Glue",
      price: 0.05,
      unit: "use",
    },
  });

  /////////////////////////////////////////////////////////
  // PRINTERS
  /////////////////////////////////////////////////////////

  const bambuX1 = await prisma.printer.create({
    data: {
      name: "Bambu X1C",
      hourlyCost: 0.5,
      powerWatts: 120,
    },
  });

  const bambuP1 = await prisma.printer.create({
    data: {
      name: "Bambu P1S",
      hourlyCost: 0.45,
      powerWatts: 110,
    },
  });

  /////////////////////////////////////////////////////////
  // PRODUCTS
  /////////////////////////////////////////////////////////

  const pokemonKeychain = await prisma.product.create({
    data: {
      name: "Pokemon Keychain",
      description: "Multicolor Pokemon themed keychain",
      categoryId: keychains.id,
      productionTime: 120,
      margin: 0.4,
    },
  });

  const benchy = await prisma.product.create({
    data: {
      name: "3D Benchy",
      description: "Benchmark test print",
      categoryId: decoration.id,
      productionTime: 60,
      margin: 0.3,
    },
  });

  /////////////////////////////////////////////////////////
  // FILAMENT USAGE
  /////////////////////////////////////////////////////////

  await prisma.productFilamentUsage.createMany({
    data: [
      {
        productId: pokemonKeychain.id,
        filamentTypeId: plaBlack.id,
        weight: 10,
      },
      {
        productId: pokemonKeychain.id,
        filamentTypeId: plaWhite.id,
        weight: 4,
      },
      {
        productId: pokemonKeychain.id,
        filamentTypeId: plaRed.id,
        weight: 3,
      },
      {
        productId: benchy.id,
        filamentTypeId: plaWhite.id,
        weight: 12,
      },
    ],
  });

  /////////////////////////////////////////////////////////
  // PRODUCT EXTRAS
  /////////////////////////////////////////////////////////

  await prisma.productExtra.create({
    data: {
      productId: pokemonKeychain.id,
      extraId: keyring.id,
      quantity: 1,
    },
  });

  /////////////////////////////////////////////////////////
  // PRINT PROFILES (.3mf)
  /////////////////////////////////////////////////////////

  await prisma.printProfile.create({
    data: {
      productId: pokemonKeychain.id,
      name: "Pokemon Keychain AMS",
      filePath: "/uploads/3mf/pokemon_keychain.3mf",
      slicer: "Bambu Studio",
      printTime: 120,
      filamentUsed: 17,
    },
  });

  await prisma.printProfile.create({
    data: {
      productId: benchy.id,
      name: "Benchy Fast",
      filePath: "/uploads/3mf/benchy_fast.3mf",
      slicer: "Bambu Studio",
      printTime: 60,
      filamentUsed: 12,
    },
  });

  console.log("🌱 Database seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

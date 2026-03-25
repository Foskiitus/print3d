import { getAuthUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProductionClient } from "./ProductionClient";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("production", locale);
  return { title: c.page.title };
}

export default async function ProductionPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("production", locale);

  const userId = await getAuthUserId();
  if (!userId) redirect("/sign-in");

  // --- DUMMY DATA ---
  const dummyPrinters = [
    { id: "p1", name: "Ender 3 V3", brand: "Creality", model: "V3" },
    { id: "p2", name: "Bambu Lab P1S", brand: "Bambu", model: "P1S" },
  ];

  const dummyProducts = [
    {
      id: "prod1",
      name: "Articulated Dragon",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      filamentUsage: [],
    },
    {
      id: "prod2",
      name: "Tool Organizer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      filamentUsage: [],
    },
  ];

  const dummyLogs = [
    {
      id: "log1",
      date: new Date().toISOString(),
      quantity: 2,
      status: "COMPLETED",
      userId,
      productId: "prod1",
      printerId: "p1",
      product: dummyProducts[0],
      printer: dummyPrinters[0],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {c.page.heading}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {c.page.description}
        </p>
      </div>
      <ProductionClient
        initialLogs={dummyLogs as any}
        products={dummyProducts as any}
        printers={dummyPrinters as any}
      />
    </div>
  );
}

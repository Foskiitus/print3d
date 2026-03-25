import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/settings/export
// Exporta todos os dados do utilizador em formato JSON (RGPD)
export async function GET() {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  try {
    const [
      user,
      settings,
      inventoryItems,
      purchases,
      printers,
      products,
      components,
      sales,
      orders,
      customers,
      extras,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          plan: true,
          createdAt: true,
        },
      }),
      prisma.settings.findMany({ where: { userId } }),
      prisma.inventoryItem.findMany({ where: { userId } }),
      prisma.inventoryPurchase.findMany({ where: { userId } }),
      prisma.printer.findMany({ where: { userId }, include: { preset: true } }),
      prisma.product.findMany({
        where: { userId },
        include: { bom: true, extras: true },
      }),
      prisma.component.findMany({
        where: { userId },
        include: { profiles: { include: { filaments: true } }, stock: true },
      }),
      prisma.sale.findMany({ where: { userId } }),
      prisma.productionOrder.findMany({
        where: { userId },
        include: { items: true, printJobs: true },
      }),
      prisma.customer.findMany({ where: { userId } }),
      prisma.extra.findMany({ where: { userId } }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      user,
      settings: Object.fromEntries(settings.map((s) => [s.key, s.value])),
      inventory: { items: inventoryItems, purchases },
      printers,
      catalog: { products, components },
      sales,
      production: orders,
      customers,
      extras,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="spooliq-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/settings/export]", err);
    return NextResponse.json(
      { error: "Falha ao exportar dados", details: err.message },
      { status: 500 },
    );
  }
}

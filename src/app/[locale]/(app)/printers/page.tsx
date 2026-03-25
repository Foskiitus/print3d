import { requirePageAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkshopClient } from "./WorkshopClient";
import { redirect } from "next/navigation";

export default async function PrintersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const userId = await requirePageAuth();
  if (!userId) redirect(`/${locale}/sign-in`);

  const [printers, printerPresets, unitPresets] = await Promise.all([
    prisma.printer.findMany({
      where: { userId },
      include: {
        preset: true,
        units: {
          include: {
            unitPreset: true,
            slots: {
              include: {
                currentSpool: {
                  include: { item: true },
                },
              },
              orderBy: { position: "asc" },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        maintenanceLogs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    }),

    // Presets de impressora (globais + do utilizador)
    prisma.printerPreset.findMany({
      where: { OR: [{ isGlobal: true }, { userId }] },
      orderBy: [{ brand: "asc" }, { name: "asc" }],
    }),

    // Presets de unidades AMS/acessórios (globais)
    prisma.unitPreset.findMany({
      where: { isGlobal: true },
      orderBy: [{ brand: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <WorkshopClient
      initialPrinters={printers as any}
      printerPresets={printerPresets}
      unitPresets={unitPresets}
    />
  );
}

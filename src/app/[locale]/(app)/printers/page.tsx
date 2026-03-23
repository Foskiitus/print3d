import { requirePageAuth, getAuthUserIsAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrintersClient } from "./PrintersClient";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("printers", locale);
  return { title: c.page.title };
}

export default async function PrintersPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("printers", locale);

  const userId = await requirePageAuth();
  const isAdmin = await getAuthUserIsAdmin();

  const [printers, globalPresets, privatePresets, unitPresets] =
    await Promise.all([
      // Impressoras do utilizador
      prisma.printer.findMany({
        where: { userId },
        include: {
          preset: {
            include: { maintenanceTasks: true },
          },
          units: {
            include: {
              slots: {
                include: {
                  currentSpool: {
                    include: { item: true },
                  },
                },
                orderBy: { position: "asc" },
              },
            },
          },
          // Necessário para calcular progresso por tarefa
          maintenanceLogs: {
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { name: "asc" },
      }),

      // Presets globais (admin)
      prisma.printerPreset.findMany({
        where: { isGlobal: true },
        include: { maintenanceTasks: true },
        orderBy: { name: "asc" },
      }),

      // Presets privados do utilizador
      prisma.printerPreset.findMany({
        where: { isGlobal: false, userId },
        include: { maintenanceTasks: true },
        orderBy: { name: "asc" },
      }),

      // Catálogo de unidades de expansão
      prisma.unitPreset.findMany({
        where: { isGlobal: true },
        orderBy: [{ brand: "asc" }, { name: "asc" }],
      }),
    ]);

  // Enriquecer impressoras com horas totais e resumo de slots
  const enrichedPrinters = printers.map((p) => {
    const totalHours = p.initialHours + Math.floor(p.totalPrintTime / 60);

    // Calcular progresso por tarefa individualmente — igual ao dashboard
    const maintenanceStatus = p.preset.maintenanceTasks.map((task) => {
      const lastLog = p.maintenanceLogs.find(
        (log) => log.taskName === task.taskName,
      );
      const lastDoneAtHours = lastLog ? lastLog.performedAtHours : 0;

      const hoursSinceLast = Math.max(0, totalHours - lastDoneAtHours);
      const progress = Math.min(
        Math.round((hoursSinceLast / task.intervalHours) * 100),
        100,
      );
      return { ...task, hoursSinceLast, progress, isDue: progress >= 100 };
    });

    // Resumo de slots: total e quantos estão carregados
    const allSlots = p.units.flatMap((u) => u.slots);
    const totalSlots = allSlots.length || 1;
    const loadedSlots = allSlots.filter((s) => s.currentSpool !== null).length;

    // Primeiro spool carregado (para mostrar no card)
    const firstLoadedSlot = allSlots.find((s) => s.currentSpool !== null);
    const currentSpool = firstLoadedSlot?.currentSpool ?? null;

    return {
      ...p,
      totalHours,
      maintenanceStatus,
      totalSlots,
      loadedSlots,
      currentSpool,
    };
  });

  const allPresets = [...globalPresets, ...privatePresets];

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

      <PrintersClient
        initialPrinters={enrichedPrinters as any}
        presets={allPresets as any}
        unitPresets={unitPresets as any}
        isAdmin={isAdmin}
      />

      <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-primary mb-1">
          {c.page.costsInfo.heading}
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {c.page.costsInfo.bodyPart1}{" "}
          <strong>{c.page.costsInfo.hourlyCost}</strong>{" "}
          {c.page.costsInfo.bodyPart2}{" "}
          <strong>{c.page.costsInfo.consumption}</strong>{" "}
          {c.page.costsInfo.bodyPart3}
        </p>
      </div>
    </div>
  );
}

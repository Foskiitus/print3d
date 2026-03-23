import { requirePageAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PrinterDashboardClient } from "./PrinterDashboardClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PrinterDashboardPage({ params }: Props) {
  const { id } = await params;
  const userId = await requirePageAuth();

  const printer = await prisma.printer.findFirst({
    where: { id, userId },
    include: {
      preset: {
        include: { maintenanceTasks: true },
      },
      units: {
        include: {
          slots: {
            include: {
              currentSpool: { include: { item: true } },
            },
            orderBy: { position: "asc" },
          },
        },
      },
      maintenanceLogs: {
        orderBy: { createdAt: "desc" },
        // Buscar todos os logs para poder calcular o último por tarefa
      },
      printJobs: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          items: {
            include: { component: true },
          },
        },
      },
    },
  });

  if (!printer) notFound();

  const totalHours =
    printer.initialHours + Math.floor(printer.totalPrintTime / 60);

  // ── Calcular progresso por tarefa individualmente ────────────────────────
  // Para cada tarefa, encontrar o log mais recente com esse nome.
  // Se nunca foi feita → lastDoneAtHours = 0, ou seja, todas as horas
  // acumuladas (incluindo initialHours) contam como tempo sem manutenção.
  const maintenanceStatus = printer.preset.maintenanceTasks.map((task) => {
    const lastLog = printer.maintenanceLogs.find(
      (log) => log.taskName === task.taskName,
    );

    // Se já foi feita alguma vez: usar as horas registadas no log
    // Se nunca foi feita: 0 — todas as horas da máquina contam
    const lastDoneAtHours = lastLog ? lastLog.performedAtHours : 0;

    const hoursSinceLast = Math.max(0, totalHours - lastDoneAtHours);
    const progress = Math.min(
      Math.round((hoursSinceLast / task.intervalHours) * 100),
      100,
    );

    return {
      ...task,
      hoursSinceLast,
      progress,
      isDue: progress >= 100,
    };
  });

  // Limitar os logs exibidos no histórico a 10 mais recentes
  const recentLogs = printer.maintenanceLogs.slice(0, 10);

  const allSlots = printer.units.flatMap((u) => u.slots);
  const totalSlots = allSlots.length || 1;
  const loadedSlots = allSlots.filter((s) => s.currentSpool !== null).length;

  const enrichedPrinter = {
    ...printer,
    totalHours,
    maintenanceStatus,
    maintenanceLogs: recentLogs,
    totalSlots,
    loadedSlots,
  };

  return <PrinterDashboardClient printer={enrichedPrinter as any} />;
}

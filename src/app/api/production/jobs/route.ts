import { requireApiAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/production/jobs
export async function POST(req: Request) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  try {
    const { orderId, printerId, componentId, profileId, quantity, recipe } =
      await req.json();

    if (!orderId || !printerId || !componentId) {
      return NextResponse.json(
        { error: "orderId, printerId e componentId são obrigatórios" },
        { status: 400 },
      );
    }

    // Validar que a OP pertence ao utilizador
    const order = await prisma.productionOrder.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) {
      return NextResponse.json(
        { error: "Ordem não encontrada" },
        { status: 404 },
      );
    }

    // Validar que a impressora pertence ao utilizador
    const printer = await prisma.printer.findFirst({
      where: { id: printerId, userId },
      include: { preset: true },
    });
    if (!printer) {
      return NextResponse.json(
        { error: "Impressora não encontrada" },
        { status: 404 },
      );
    }

    // Buscar perfil para calcular estimativas
    const profile = profileId
      ? await prisma.componentPrintProfile.findUnique({
          where: { id: profileId },
          include: { filaments: true },
        })
      : null;

    const batchSize = (profile as any)?.batchSize ?? 1;
    const actualQty = recipe === "full" ? batchSize : (quantity ?? 1);

    // Calcular custo estimado
    const printHours = (profile?.printTime ?? 0) / 60;
    const electricityCost = (printer.powerWatts / 1000) * printHours * 0.16;
    const printerCost = printHours * printer.hourlyCost;

    // Usar transação para garantir atomicidade
    const [job] = await prisma.$transaction([
      prisma.printJob.create({
        data: {
          userId,
          orderId,
          printerId,
          status: "printing",
          quantity: actualQty,
          estimatedMinutes: profile?.printTime
            ? Math.round(
                profile.printTime * (recipe === "full" ? 1 : 1 / batchSize),
              )
            : null,
          electricityCost,
          printerCost,
          startedAt: new Date(),
          items: {
            create: [
              {
                componentId,
                profileId: profileId ?? null,
                quantity: actualQty,
                status: "pending",
              },
            ],
          },
        },
        include: {
          printer: { include: { preset: true } },
          items: {
            include: {
              component: true,
              profile: { include: { filaments: true } },
            },
          },
          materials: true,
        },
      }),
      // Atualizar estado da OP para in_progress se estava pending
      ...(order.status === "pending"
        ? [
            prisma.productionOrder.update({
              where: { id: orderId },
              data: { status: "in_progress" },
            }),
          ]
        : []),
    ]);

    return NextResponse.json(job, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/production/jobs]", err);
    return NextResponse.json(
      { error: "Falha ao criar print job", details: err.message },
      { status: 500 },
    );
  }
}

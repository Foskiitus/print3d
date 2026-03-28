import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

// GET /api/inventory/[id]/history
// Devolve o histórico de jobs de impressão que usaram este spool específico.
// A ligação é directa: PrintJobMaterial.spoolId = purchase.id

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { id } = await params;

  // Verificar que o spool pertence ao utilizador
  const purchase = await prisma.inventoryPurchase.findUnique({
    where: { id },
    select: { userId: true, item: true },
  });

  if (!purchase || purchase.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Buscar todos os PrintJobMaterial que referenciam este spool
  const jobMaterials = await prisma.printJobMaterial.findMany({
    where: { spoolId: id },
    include: {
      job: {
        include: {
          printer: { select: { name: true } },
          // Componentes impressos neste job
          items: {
            include: {
              component: { select: { name: true } },
            },
          },
          // OP associada → para obter o nome do produto
          order: {
            include: {
              items: {
                include: {
                  product: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { job: { createdAt: "desc" } },
  });

  const productions = jobMaterials.map((mat) => {
    const job = mat.job;

    // Nome do produto: preferir produto da OP, senão componente do job
    const productName =
      job.order?.items?.[0]?.product?.name ??
      job.items?.[0]?.component?.name ??
      "Impressão direta";

    // Referência da OP para contexto
    const orderRef = job.order?.reference ?? null;

    return {
      id: mat.id,
      date: job.finishedAt ?? job.createdAt,
      productName,
      printerName: job.printer.name,
      quantity: job.quantity,
      filamentUsed: mat.actualG ?? mat.estimatedG,
      totalCost: job.totalCost ?? null,
      // Campos para o link à OP
      orderId: job.orderId ?? null,
      orderReference: orderRef,
    };
  });

  return NextResponse.json({
    item: purchase.item,
    productions,
  });
}

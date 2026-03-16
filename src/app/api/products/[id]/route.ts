import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/products/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      printer: true,
      filamentUsage: { include: { filamentType: true } },
      extras: { include: { extra: true } },
      printProfiles: true,
      productionLogs: {
        include: { printer: true },
        orderBy: { date: "desc" },
        take: 10,
      },
      _count: { select: { productionLogs: true, sales: true } },
    },
  });

  if (!product || product.userId !== session.user.id) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json(product);
}

// PATCH /api/products/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    const {
      name,
      description,
      categoryId,
      printerId,
      productionTime,
      margin,
      imageKey,
      fileKey,
      filamentUsages,
      extraUsages,
      unitsPerPrint,
      alertThreshold,
    } = await req.json();

    const product = await prisma.$transaction(async (tx) => {
      await tx.productFilamentUsage.deleteMany({ where: { productId: id } });
      await tx.productExtra.deleteMany({ where: { productId: id } });

      return tx.product.update({
        where: { id },
        data: {
          name: name.trim(),
          description: description || null,
          categoryId: categoryId || null,
          printerId: printerId || null,
          margin: margin ?? existing.margin,
          unitsPerPrint: unitsPerPrint ?? existing.unitsPerPrint,
          alertThreshold:
            alertThreshold !== undefined
              ? alertThreshold != null
                ? Number(alertThreshold)
                : null
              : existing.alertThreshold,
          imageKey: imageKey ?? null,
          fileKey: fileKey ?? null,
          filamentUsage: {
            create: filamentUsages.map((f: any) => ({
              filamentTypeId: f.filamentTypeId,
              weight: f.weight,
            })),
          },
          extras: {
            create: (extraUsages || []).map((e: any) => ({
              extraId: e.extraId,
              quantity: e.quantity,
            })),
          },
        },
        include: {
          category: true,
          printer: true,
          filamentUsage: { include: { filamentType: true } },
          extras: { include: { extra: true } },
          printProfiles: true,
          productionLogs: {
            include: { printer: true },
            orderBy: { date: "desc" },
            take: 10,
          },
          _count: { select: { productionLogs: true, sales: true } },
        },
      });
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("[PATCH /api/products/[id]]", error);
    return NextResponse.json(
      { error: "Erro ao atualizar produto", details: error.message },
      { status: 500 },
    );
  }
}

// DELETE /api/products/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: { select: { productionLogs: true, sales: true } },
      },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    if (existing._count.productionLogs > 0 || existing._count.sales > 0) {
      return NextResponse.json(
        {
          error: `Este produto tem ${existing._count.productionLogs} produção(ões) e ${existing._count.sales} venda(s) registadas e não pode ser eliminado.`,
        },
        { status: 409 },
      );
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/products/[id]]", error);
    return NextResponse.json(
      { error: "Erro ao eliminar", details: error.message },
      { status: 500 },
    );
  }
}

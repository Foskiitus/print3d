import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/products/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

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

  if (!product || product.userId !== userId) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json(product);
}

// PATCH /api/products/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();

    // 1. Garante que extrais o imageUrl e o fileUrl do body
    const {
      name,
      description,
      categoryId,
      printerId,
      productionTime,
      margin,
      unitsPerPrint,
      alertThreshold,
      imageUrl, // <-- ADICIONADO
      fileUrl, // <-- ADICIONADO
      filamentUsages,
      extraUsages,
    } = body;

    // Verificar se o produto existe e pertence ao utilizador
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct || existingProduct.userId !== userId) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    // 2. Garante que os campos são guardados na base de dados
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        categoryId,
        printerId,
        productionTime,
        margin,
        unitsPerPrint,
        alertThreshold,
        imageUrl, // <-- ADICIONADO AQUI
        fileUrl, // <-- ADICIONADO AQUI

        // (A tua lógica existente para atualizar os relacionamentos de filamentos e extras)
        filamentUsage: {
          deleteMany: {},
          create:
            filamentUsages?.map((f: any) => ({
              filamentTypeId: f.filamentTypeId,
              weight: f.weight,
            })) || [],
        },
        extras: {
          deleteMany: {},
          create:
            extraUsages?.map((e: any) => ({
              extraId: e.extraId,
              quantity: e.quantity,
            })) || [],
        },
      },
    });

    return NextResponse.json(updatedProduct);
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
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: { select: { productionLogs: true, sales: true } },
      },
    });

    if (!existing || existing.userId !== userId) {
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

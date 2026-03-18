import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/products
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { userId: userId },
    include: {
      category: true,
      filamentUsage: { include: { filamentType: true } },
      extras: { include: { extra: true } },
      _count: { select: { productionLogs: true, sales: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

// POST /api/products
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const {
      name,
      description,
      categoryId,
      printerId,
      productionTime,
      margin,
      imageUrl,
      fileUrl,
      filamentUsages,
      extraUsages,
      unitsPerPrint,
      alertThreshold,
    } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 },
      );
    }

    if (!filamentUsages || filamentUsages.length === 0) {
      return NextResponse.json(
        { error: "Pelo menos um filamento é obrigatório" },
        { status: 400 },
      );
    }

    const product = await prisma.product.create({
      data: {
        userId: userId,
        name: name.trim(),
        description: description || null,
        categoryId: categoryId || null,
        printerId: printerId || null,
        productionTime: productionTime || null,
        margin: margin ?? 0.3,
        unitsPerPrint: unitsPerPrint ?? 1,
        alertThreshold: alertThreshold != null ? Number(alertThreshold) : null,
        imageUrl: imageUrl || null,
        fileUrl: fileUrl || null,
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
        filamentUsage: { include: { filamentType: true } },
        extras: { include: { extra: true } },
        _count: { select: { productionLogs: true, sales: true } },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/products]", error);
    return NextResponse.json(
      { error: "Falha ao criar produto", details: error.message },
      { status: 500 },
    );
  }
}

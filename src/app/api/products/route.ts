import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/products
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { userId },
    include: {
      category: true,
      bom: {
        include: {
          component: {
            include: {
              stock: true,
              profiles: {
                include: { filaments: true },
                take: 1,
              },
            },
          },
        },
      },
      extras: { include: { extra: true } },
      _count: { select: { sales: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Enriquecer com campos calculados (igual ao page.tsx)
  const enriched = products.map((p) => {
    const componentCount = p.bom.length;
    const estimatedMinutes = p.bom.reduce((acc, entry) => {
      const t = entry.component.profiles[0]?.printTime ?? 0;
      return acc + t * entry.quantity;
    }, 0);
    const totalFilamentG = p.bom.reduce((acc, entry) => {
      const g = entry.component.profiles[0]?.filamentUsed ?? 0;
      return acc + g * entry.quantity;
    }, 0);
    const stockReady =
      componentCount > 0 &&
      p.bom.every(
        (entry) => (entry.component.stock?.quantity ?? 0) >= entry.quantity,
      );
    const materials = [
      ...new Set(
        p.bom.flatMap(
          (entry) =>
            entry.component.profiles[0]?.filaments.map((f) => f.material) ?? [],
        ),
      ),
    ];
    return {
      ...p,
      componentCount,
      estimatedMinutes,
      totalFilamentG,
      stockReady,
      materials,
    };
  });

  return NextResponse.json(enriched);
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
      margin,
      alertThreshold,
      imageUrl,
      imageKey,
    } = await req.json();

    if (!name?.trim())
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 },
      );

    const product = await prisma.product.create({
      data: {
        userId,
        name: name.trim(),
        description: description || null,
        categoryId: categoryId || null,
        margin: margin ?? 0.3,
        alertThreshold: alertThreshold != null ? Number(alertThreshold) : null,
        imageUrl: imageUrl || null,
        imageKey: imageKey || null,
      },
      include: {
        category: true,
        bom: true,
        _count: { select: { sales: true } },
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

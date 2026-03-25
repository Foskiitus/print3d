import { getAuthUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductsClient } from "./ProductsClient";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("products", locale);
  return { title: c.page.title };
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("products", locale);

  const userId = await getAuthUserId();
  if (!userId) redirect("/sign-in");

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { userId },
      include: {
        category: true,
        // BOM: componentes que constituem o produto
        bom: {
          include: {
            component: {
              include: {
                stock: true,
                profiles: {
                  include: { filaments: true },
                  take: 1, // só o perfil principal para o card
                },
              },
            },
          },
        },
        extras: { include: { extra: true } },
        _count: { select: { sales: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
  ]);

  // Enriquecer produtos com métricas calculadas
  const enriched = products.map((p) => {
    const componentCount = p.bom.length;

    // Tempo total estimado = soma dos printTime de todos os perfis principais
    const estimatedMinutes = p.bom.reduce((acc, entry) => {
      const t = entry.component.profiles[0]?.printTime ?? 0;
      return acc + t * entry.quantity;
    }, 0);

    // Peso total de filamento = soma do filamentUsed de todos os perfis
    const totalFilamentG = p.bom.reduce((acc, entry) => {
      const g = entry.component.profiles[0]?.filamentUsed ?? 0;
      return acc + g * entry.quantity;
    }, 0);

    // Stock: todos os componentes têm stock suficiente?
    const stockReady =
      componentCount > 0 &&
      p.bom.every(
        (entry) => (entry.component.stock?.quantity ?? 0) >= entry.quantity,
      );

    // Materiais únicos usados (para mostrar no card)
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
      <ProductsClient
        initialProducts={enriched as any}
        categories={categories}
      />
    </div>
  );
}

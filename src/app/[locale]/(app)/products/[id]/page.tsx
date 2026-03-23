import { getAuthUserId } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductDetailClient } from "./ProductDetailClient";
import type { LocalesValues } from "intlayer";

const FALLBACK_PRICE_PER_G = 0.025; // €/g quando não há rolos com preço real

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: LocalesValues }>;
}) {
  const { id, locale } = await params;

  const userId = await getAuthUserId();
  if (!userId) redirect("/sign-in");

  const [product, allComponents, categories] = await Promise.all([
    prisma.product.findFirst({
      where: { id, userId },
      include: {
        category: true,
        bom: {
          include: {
            component: {
              include: {
                stock: true,
                profiles: {
                  include: { filaments: true },
                },
              },
            },
          },
          orderBy: { component: { name: "asc" } },
        },
        extras: { include: { extra: true } },
        sales: {
          orderBy: { date: "desc" },
          take: 5,
        },
      },
    }),

    // Todos os componentes do utilizador (para o picker do BOM)
    prisma.component.findMany({
      where: { userId },
      include: {
        stock: true,
        profiles: { include: { filaments: true } },
      },
      orderBy: { name: "asc" },
    }),

    prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!product) notFound();

  // ── Calcular custo estimado via BOM ──────────────────────────────────────────
  // Para cada entrada da BOM:
  //   custo = qty × (soma de filamentUsed de todos os perfis) × preço/g
  // Tenta usar o preço real dos rolos em stock; fallback para FALLBACK_PRICE_PER_G

  // Buscar rolos disponíveis para calcular preço médio por material
  const spools = await prisma.inventoryPurchase.findMany({
    where: { userId, archivedAt: null },
    include: { item: true },
    orderBy: { boughtAt: "asc" },
  });

  // Preço médio por material (€/g) a partir dos rolos em stock
  const pricePerGByMaterial = new Map<string, number>();
  for (const spool of spools) {
    const material = spool.item.material;
    if (!pricePerGByMaterial.has(material)) {
      const price = spool.priceCents / 100 / spool.initialWeight;
      pricePerGByMaterial.set(material, price);
    }
  }

  const bomCost = product.bom.reduce((acc, entry) => {
    // Para cada componente na BOM, soma o custo de todos os perfis
    // Custo real por unidade = (filamentUsed × €/g) / batchSize
    const componentCostPerUnit = entry.component.profiles.reduce(
      (profileAcc, profile) => {
        const g = profile.filamentUsed ?? 0;
        const batch = (profile as any).batchSize ?? 1;
        const primaryMaterial = profile.filaments[0]?.material;
        const pricePerG = primaryMaterial
          ? (pricePerGByMaterial.get(primaryMaterial) ?? FALLBACK_PRICE_PER_G)
          : FALLBACK_PRICE_PER_G;
        // Custo por unidade produzida neste perfil
        return profileAcc + (g * pricePerG) / batch;
      },
      0,
    );
    // Usa o perfil mais barato se houver múltiplos (melhor receita disponível)
    // Para o custo do produto, usa o custo médio entre todos os perfis
    const profileCount = entry.component.profiles.length || 1;
    return acc + entry.quantity * (componentCostPerUnit / profileCount);
  }, 0);

  const extrasCost = product.extras.reduce(
    (sum, e) => sum + e.extra.price * e.quantity,
    0,
  );

  const estimatedCost = bomCost + extrasCost;
  const suggestedPrice = estimatedCost * (1 + product.margin);

  // Tempo total estimado (soma dos printTime dos perfis × quantidade)
  const estimatedMinutes = product.bom.reduce((acc, entry) => {
    const t = entry.component.profiles.reduce(
      (s, p) => s + (p.printTime ?? 0),
      0,
    );
    return acc + t * entry.quantity;
  }, 0);

  return (
    <ProductDetailClient
      product={product as any}
      allComponents={allComponents as any}
      categories={categories}
      estimatedCost={estimatedCost}
      suggestedPrice={suggestedPrice}
      estimatedMinutes={estimatedMinutes}
      backHref={`/${locale}/products`}
    />
  );
}

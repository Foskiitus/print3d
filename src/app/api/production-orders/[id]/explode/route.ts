// src/app/api/production-orders/[id]/explode/route.ts
//
// "Explosão de Necessidades" — a operação central da Ordem de Produção.
//
// Dado uma Ordem com N produtos × quantidades, este endpoint:
//   1. Calcula os componentes necessários (via BOM de cada produto)
//   2. Subtrai o stock existente de componentes semiacabados
//   3. Agrupa componentes por material (sugestão de nesting)
//   4. Cria os PrintJobs necessários na fila
//   5. Devolve um plano de produção com avisos consolidados

import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

interface ComponentNeed {
  componentId: string;
  componentName: string;
  quantityNeeded: number;
  quantityInStock: number;
  quantityToPrint: number;
  profiles: {
    id: string;
    name: string;
    printTime: number | null;
    filamentReqs: {
      material: string;
      colorHex: string | null;
      colorName: string | null;
      estimatedG: number;
    }[];
  }[];
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id: orderId } = await params;

  const order = await prisma.productionOrder.findFirst({
    where: { id: orderId, userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              bom: {
                include: {
                  component: {
                    include: {
                      profiles: {
                        include: { filaments: true },
                      },
                      stock: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order)
    return NextResponse.json(
      { error: "Ordem não encontrada" },
      { status: 404 },
    );

  if (order.status !== "draft" && order.status !== "pending")
    return NextResponse.json(
      { error: "Só é possível explodir ordens em estado 'draft' ou 'pending'" },
      { status: 409 },
    );

  const body = await req.json().catch(() => ({}));
  const createJobs: boolean = body.createJobs ?? false; // false = apenas simular

  // ── 1. Calcular necessidades de componentes ─────────────────────────────────
  const needsMap = new Map<string, ComponentNeed>();

  for (const orderItem of order.items) {
    const qty = orderItem.quantity;
    for (const bomEntry of orderItem.product.bom) {
      const comp = bomEntry.component;
      const needed = bomEntry.quantity * qty;
      const inStock = comp.stock?.quantity ?? 0;

      if (needsMap.has(comp.id)) {
        needsMap.get(comp.id)!.quantityNeeded += needed;
      } else {
        needsMap.set(comp.id, {
          componentId: comp.id,
          componentName: comp.name,
          quantityNeeded: needed,
          quantityInStock: inStock,
          quantityToPrint: 0,
          profiles: comp.profiles.map((p) => ({
            id: p.id,
            name: p.name,
            printTime: p.printTime,
            filamentReqs: p.filaments.map((f) => ({
              material: f.material,
              colorHex: f.colorHex,
              colorName: f.colorName,
              estimatedG: f.estimatedG,
            })),
          })),
        });
      }
    }
  }

  // Calcular quantidades a imprimir (necessário - stock)
  for (const need of needsMap.values()) {
    need.quantityToPrint = Math.max(
      0,
      need.quantityNeeded - need.quantityInStock,
    );
  }

  const needs = Array.from(needsMap.values());
  const totalComponentsToPrint = needs.reduce(
    (acc, n) => acc + n.quantityToPrint,
    0,
  );

  // ── 2. Gerar sugestão de agrupamento por material (nesting) ─────────────────
  // Agrupar componentes que partilham o mesmo material principal
  const materialGroups = new Map<string, ComponentNeed[]>();

  for (const need of needs.filter((n) => n.quantityToPrint > 0)) {
    const primaryMaterial =
      need.profiles[0]?.filamentReqs[0]?.material ?? "unknown";
    if (!materialGroups.has(primaryMaterial)) {
      materialGroups.set(primaryMaterial, []);
    }
    materialGroups.get(primaryMaterial)!.push(need);
  }

  // ── 3. Avisos consolidados de adaptador ─────────────────────────────────────
  const adapterWarnings: string[] = [];
  for (const need of needs) {
    for (const profile of need.profiles) {
      for (const req of profile.filamentReqs) {
        const isTechnical = /CF|GF|carbon|fiber/i.test(req.material);
        if (isTechnical) {
          adapterWarnings.push(
            `"${need.componentName}" usa ${req.material} — verifica se o slot do AMS suporta materiais abrasivos.`,
          );
        }
      }
    }
  }

  // ── 4. Criar PrintJobs se solicitado ─────────────────────────────────────────
  let createdJobs: { id: string; componentName: string; quantity: number }[] =
    [];

  if (createJobs) {
    const printer = await prisma.printer.findFirst({
      where: { userId, status: "idle" },
      orderBy: { name: "asc" },
    });

    if (!printer && totalComponentsToPrint > 0) {
      return NextResponse.json(
        { error: "Não há impressoras disponíveis (idle) para criar os jobs." },
        { status: 409 },
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const need of needs) {
        if (need.quantityToPrint <= 0) continue;

        // Usar o primeiro perfil disponível por omissão
        const defaultProfile = need.profiles[0] ?? null;

        const job = await tx.printJob.create({
          data: {
            userId,
            orderId,
            printerId: printer!.id,
            status: "pending",
            quantity: need.quantityToPrint,
            estimatedMinutes: defaultProfile?.printTime
              ? defaultProfile.printTime * need.quantityToPrint
              : null,
            items: {
              create: {
                componentId: need.componentId,
                profileId: defaultProfile?.id ?? null,
                quantity: need.quantityToPrint,
              },
            },
          },
        });

        createdJobs.push({
          id: job.id,
          componentName: need.componentName,
          quantity: need.quantityToPrint,
        });
      }

      // Atualizar estado da ordem
      await tx.productionOrder.update({
        where: { id: orderId },
        data: { status: "in_progress" },
      });

      // Deduzir stock de semiacabados para componentes que têm stock suficiente
      for (const need of needs) {
        if (need.quantityInStock <= 0) continue;
        const toDeduct = Math.min(need.quantityInStock, need.quantityNeeded);

        await tx.componentStock.updateMany({
          where: { componentId: need.componentId },
          data: { quantity: { decrement: toDeduct } },
        });
      }
    });
  }

  return NextResponse.json({
    orderId,
    simulated: !createJobs,
    summary: {
      totalProducts: order.items.reduce((acc, i) => acc + i.quantity, 0),
      totalComponentsNeeded: needs.reduce(
        (acc, n) => acc + n.quantityNeeded,
        0,
      ),
      totalFromStock: needs.reduce(
        (acc, n) => acc + Math.min(n.quantityInStock, n.quantityNeeded),
        0,
      ),
      totalToPrint: totalComponentsToPrint,
    },
    needs: needs.map((n) => ({
      componentId: n.componentId,
      componentName: n.componentName,
      quantityNeeded: n.quantityNeeded,
      quantityInStock: n.quantityInStock,
      quantityToPrint: n.quantityToPrint,
      hasProfiles: n.profiles.length > 0,
    })),
    nestingSuggestions: Array.from(materialGroups.entries()).map(
      ([material, comps]) => ({
        material,
        components: comps.map((c) => c.componentName),
        suggestion: `Podes agrupar ${comps.map((c) => `"${c.componentName}"`).join(" e ")} na mesma bandeja (mesmo material: ${material}).`,
      }),
    ),
    adapterWarnings,
    createdJobs,
  });
}

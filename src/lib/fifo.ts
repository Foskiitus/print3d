import { prisma } from "@/lib/prisma";

export interface FilamentUsageInput {
  filamentTypeId: string;
  weight: number;
}

export interface FIFOResult {
  filamentCost: number;
  missingSpools: string[];
  // Detalhes de consumo por bobine (usado na produção para descontar stock)
  spoolConsumptions: {
    spoolId: string;
    consumed: number;
  }[];
}

/**
 * Calcula o custo FIFO de um conjunto de filamentos.
 * Distribui o consumo pelas bobines mais antigas com stock suficiente.
 *
 * Exemplo:
 *   200g PLA Preto — spool A tem 120g, spool B tem 500g
 *   → consome 120g da spool A (esgota) + 80g da spool B
 *   → custo = 120g × (preçoA/pesoA) + 80g × (preçoB/pesoB)
 */
export async function calculateFIFOCost(
  userId: string,
  filamentUsages: FilamentUsageInput[],
): Promise<FIFOResult> {
  let filamentCost = 0;
  const missingSpools: string[] = [];
  const spoolConsumptions: { spoolId: string; consumed: number }[] = [];

  for (const usage of filamentUsages) {
    const { filamentTypeId, weight } = usage;
    let remaining = weight; // gramas ainda por consumir

    // Buscar todas as bobines deste tipo com stock, ordenadas por data (FIFO)
    const spools = await prisma.filamentSpool.findMany({
      where: {
        userId,
        filamentTypeId,
        remaining: { gt: 0 },
      },
      orderBy: { purchaseDate: "asc" }, // mais antiga primeiro
      include: { filamentType: true },
    });

    if (spools.length === 0) {
      const ft = await prisma.filamentType.findUnique({
        where: { id: filamentTypeId },
      });
      missingSpools.push(ft ? `${ft.brand} ${ft.colorName}` : filamentTypeId);
      continue;
    }

    for (const spool of spools) {
      if (remaining <= 0) break;

      const available = spool.remaining;
      const consumed = Math.min(available, remaining);
      const pricePerGram = spool.price / spool.spoolWeight;

      filamentCost += consumed * pricePerGram;
      remaining -= consumed;

      spoolConsumptions.push({ spoolId: spool.id, consumed });
    }

    // Se ainda falta consumir (stock insuficiente no total)
    if (remaining > 0) {
      const ft = await prisma.filamentType.findUnique({
        where: { id: filamentTypeId },
      });
      const name = ft ? `${ft.brand} ${ft.colorName}` : filamentTypeId;
      if (!missingSpools.includes(name)) {
        missingSpools.push(`${name} (faltam ${remaining.toFixed(1)}g)`);
      }
    }
  }

  return { filamentCost, missingSpools, spoolConsumptions };
}

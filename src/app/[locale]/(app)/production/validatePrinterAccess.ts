// src/app/[locale]/(app)/production/validatePrinterAccess.ts
//
// Função de servidor que valida se o utilizador autenticado é dono
// da impressora indicada pelo parâmetro ?printer=<id>.
//
// Uso na page.tsx (Server Component):
//
//   const filterPrinterId = await validatePrinterAccess(searchParams.printer);
//   // null se o parâmetro não existe, se a impressora não existe,
//   // ou se o utilizador não é o dono.
//
// O resultado é passado ao ProductionPageClient como prop — o cliente
// nunca lê o parâmetro bruto da URL, só recebe o valor já validado.

import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";

export async function validatePrinterAccess(
  printerId: string | undefined | null,
): Promise<string | null> {
  // Sem parâmetro — modo normal, sem filtro
  if (!printerId) return null;

  const userId = await getAuthUserId();

  // Utilizador não autenticado — ignorar parâmetro silenciosamente
  // (a page já redireciona para /sign-in antes de chegar aqui, mas por segurança)
  if (!userId) return null;

  // Verificar que a impressora existe E pertence ao utilizador autenticado
  const printer = await prisma.printer.findFirst({
    where: {
      id: printerId,
      userId, // ← a condição crítica de segurança
    },
    select: { id: true },
  });

  // Se não encontrou (não existe ou é de outro utilizador), retorna null
  // — sem revelar se a impressora existe ou não (evita enumeration)
  return printer?.id ?? null;
}

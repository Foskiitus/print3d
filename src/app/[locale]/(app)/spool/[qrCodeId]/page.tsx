import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SpoolPublicView } from "./SpoolPublicView";
import { SpoolOwnerPanel } from "./SpoolOwnerPanel";

export default async function SpoolPage({
  params,
}: {
  params: Promise<{ qrCodeId: string }>;
}) {
  const { qrCodeId } = await params;

  const purchase = await prisma.inventoryPurchase.findUnique({
    where: { qrCodeId },
    include: {
      item: true,
      supplier: true,
    },
  });

  if (!purchase) notFound();

  // Verifica se o utilizador autenticado é o dono
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === purchase.userId;

  if (isOwner) {
    // Busca impressoras do utilizador para o painel completo
    const printers = await prisma.printer.findMany({
      where: { userId: purchase.userId },
      orderBy: { name: "asc" },
    });

    return (
      <SpoolOwnerPanel purchase={purchase as any} printers={printers as any} />
    );
  }

  return <SpoolPublicView purchase={purchase as any} />;
}

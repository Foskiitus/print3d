// src/app/[locale]/(app)/components/page.tsx

import { getAuthUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ComponentsClient } from "./ComponentsClient";
import type { LocalesValues } from "intlayer";

export default async function ComponentsPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const userId = await getAuthUserId();
  if (!userId) redirect("/sign-in");

  const components = await prisma.component.findMany({
    where: { userId },
    include: {
      profiles: {
        include: { filaments: true },
        orderBy: { createdAt: "desc" },
      },
      stock: true,
      bom: { select: { productId: true } }, // quantos produtos usam este componente
    },
    orderBy: { name: "asc" },
  });

  return <ComponentsClient components={components as any} locale={locale} />;
}

import { requirePageAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminPageClient } from "./AdminPageClient";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("admin", locale);
  return { title: c.page.title };
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;

  // requirePageAdmin redireciona para /dashboard se não for admin
  const userId = await requirePageAdmin();

  const [users, printerPresets, unitPresets, globalFilaments] =
    await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          plan: true,
          createdAt: true,
        },
      }),

      prisma.printerPreset.findMany({
        where: { isGlobal: true },
        orderBy: [{ brand: "asc" }, { model: "asc" }],
      }),

      prisma.unitPreset.findMany({
        where: { isGlobal: true },
        orderBy: [{ brand: "asc" }, { name: "asc" }],
      }),

      prisma.globalFilament.findMany({
        orderBy: [{ brand: "asc" }, { material: "asc" }, { colorName: "asc" }],
      }),
    ]);

  const formattedUsers = users.map((u) => ({
    ...u,
    name: u.name || "Sem Nome",
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <AdminPageClient
      users={formattedUsers}
      printerPresets={printerPresets as any}
      unitPresets={unitPresets}
      globalFilaments={globalFilaments}
    />
  );
}

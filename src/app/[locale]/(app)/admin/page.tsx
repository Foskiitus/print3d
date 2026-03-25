import { requirePageAdmin } from "@/lib/auth";
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
  await requirePageAdmin();

  const [printerPresets, globalFilaments, users] = await Promise.all([
    prisma.printerPreset.findMany({
      where: { isGlobal: true },
      orderBy: [{ brand: "asc" }, { model: "asc" }],
    }),
    prisma.globalFilament.findMany({
      orderBy: [{ brand: "asc" }, { material: "asc" }, { colorName: "asc" }],
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        plan: true,
        avatar: true,
      },
    }),
  ]);

  return (
    <AdminPageClient
      initialPrinterPresets={printerPresets.map((p) => ({
        ...p,
        brand: p.brand ?? "",
        model: p.model ?? "",
      }))}
      initialFilaments={globalFilaments}
      initialUsers={users.map((u) => ({
        ...u,
        name: u.name ?? "Sem nome",
        createdAt: u.createdAt.toISOString(),
        avatar: u.avatar ?? null,
      }))}
    />
  );
}

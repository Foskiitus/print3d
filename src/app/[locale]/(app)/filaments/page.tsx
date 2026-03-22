import { getAuthUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FilamentsClient } from "./FilamentsClient";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("filaments", locale);
  return { title: c.page.title.value };
}

export default async function FilamentsPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("filaments", locale);

  const userId = await getAuthUserId();
  if (!userId) redirect("/sign-in");

  const [types, spools] = await Promise.all([
    prisma.filamentType.findMany({
      where: { userId },
      include: { _count: { select: { spools: true } } },
      orderBy: { brand: "asc" },
    }),
    prisma.filamentSpool.findMany({
      where: { userId },
      include: {
        filamentType: true,
        _count: { select: { adjustments: true } },
      },
      orderBy: { purchaseDate: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {c.page.heading.value}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {c.page.description.value}
        </p>
      </div>
      <FilamentsClient
        initialTypes={types as any}
        initialSpools={spools as any}
      />
    </div>
  );
}

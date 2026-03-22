import { getAuthUserId } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SpoolDetailClient } from "./SpoolDetailClient";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";

export default async function SpoolDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: LocalesValues }>;
}) {
  const { id, locale } = await params;
  const c = getIntlayer("filaments", locale);

  const userId = await getAuthUserId();
  if (!userId) redirect("/sign-in");

  const spool = await prisma.filamentSpool.findUnique({
    where: { id },
    include: {
      filamentType: true,
      adjustments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!spool || spool.userId !== userId) notFound();

  const productionUsage = await prisma.productionLog.findMany({
    where: {
      userId,
      product: {
        filamentUsage: {
          some: { filamentTypeId: spool.filamentTypeId },
        },
      },
    },
    include: {
      product: {
        include: {
          filamentUsage: {
            where: { filamentTypeId: spool.filamentTypeId },
          },
        },
      },
      printer: true,
    },
    orderBy: { date: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/filaments`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {spool.filamentType.brand} — {spool.filamentType.colorName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {spool.filamentType.material} · {c.spoolDetail.subtitle.value}
          </p>
        </div>
      </div>

      <SpoolDetailClient
        spool={spool as any}
        productionUsage={productionUsage as any}
      />
    </div>
  );
}

import { requirePageAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CustomersClient } from "./CustomersClient";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("customers", locale);
  return { title: c.title };
}

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("customers", locale);
  const userId = await requirePageAuth();
  if (!userId) redirect(`/${locale}/sign-in`);

  const customers = await prisma.customer.findMany({
    where: { userId },
    include: { _count: { select: { sales: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{c.title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{c.subtitle}</p>
      </div>
      <CustomersClient initialCustomers={customers as any} locale={locale} />
    </div>
  );
}

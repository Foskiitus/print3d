import { requirePageAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsPageClient } from "./SettingsPageClient";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("settings", locale);
  return { title: c.page.title };
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const userId = await requirePageAuth();
  if (!userId) redirect(`/${locale}/sign-in`);

  // Carregar todas as settings do utilizador
  const settings = await prisma.settings.findMany({
    where: { userId },
  });

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  // Carregar localizações de armazém
  // Guardadas como setting com key "warehouse_locations" em JSON
  const locationsRaw = settingsMap["warehouse_locations"] ?? "[]";
  const locations = JSON.parse(locationsRaw) as { id: string; name: string }[];

  // Plataformas de venda
  const platformsRaw = settingsMap["sale_platforms"] ?? "[]";
  const platforms = JSON.parse(platformsRaw) as {
    id: string;
    name: string;
    commission: number;
    fixedFee: number;
  }[];

  // Licenças
  const licensesRaw = settingsMap["licenses"] ?? "[]";
  const licenses = JSON.parse(licensesRaw) as {
    id: string;
    name: string;
    monthlyCost: number;
    royaltyPerUnit: number;
  }[];

  // Empresa
  const companyRaw = settingsMap["company"] ?? "{}";
  const company = JSON.parse(companyRaw) as {
    name?: string;
    address?: string;
    email?: string;
    phone?: string;
    website?: string;
    vatId?: string;
    logoUrl?: string;
  };

  return (
    <SettingsPageClient
      userId={userId}
      financial={{
        kwhPrice: Number(settingsMap["electricityPrice"] ?? "0.16"),
        fixedCostPerProduct: Number(settingsMap["fixedCostPerProduct"] ?? "0"),
        hourlyRate: Number(settingsMap["hourlyRate"] ?? "0"),
        shippingCost: Number(settingsMap["shippingCost"] ?? "0"),
        vatRate: Number(settingsMap["vatRate"] ?? "23"),
        currency: settingsMap["currency"] ?? "EUR",
      }}
      platforms={platforms}
      licenses={licenses}
      company={company}
      locations={locations}
    />
  );
}

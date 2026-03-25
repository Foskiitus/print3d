import { getAuthUserId, getAuthUserIsAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PrinterPresetsClient } from "./PrinterPresetsClient";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("printer-presets", locale);
  return { title: c.page.title };
}

export default async function PrinterPresetsPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("printer-presets", locale);

  const userId = await getAuthUserId();
  if (!userId) redirect("/sign-in");

  // Exatamente igual ao Users: expulsa não-admins
  const isAdmin = await getAuthUserIsAdmin();
  if (!isAdmin) redirect("/dashboard");

  // Ajusta 'printerPreset' consoante o teu modelo exato do Prisma
  const printers = await prisma.printerPreset.findMany({
    orderBy: [{ brand: "asc" }, { model: "asc" }],
  });

  const formattedPrinters = printers.map((printer) => ({
    ...printer,
    brand: printer.brand ?? "",
    model: printer.model ?? "Generic", // Handling model just in case it's also null
  }));
  return <PrinterPresetsClient printers={formattedPrinters} />;
}

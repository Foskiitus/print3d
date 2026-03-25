import { getAuthUserId, getAuthUserIsAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GlobalFilamentsClient } from "./GlobalFilamentsClient";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("global-filaments", locale);
  return { title: c.page.title };
}

export default async function GlobalFilamentsPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("global-filaments", locale);

  const userId = await getAuthUserId();
  if (!userId) redirect("/sign-in");

  // Exatamente igual ao Users: expulsa não-admins
  const isAdmin = await getAuthUserIsAdmin();
  if (!isAdmin) redirect("/dashboard");

  const filaments = await prisma.globalFilament.findMany({
    orderBy: [{ brand: "asc" }, { material: "asc" }, { colorName: "asc" }],
  });

  return <GlobalFilamentsClient filaments={filaments} />;
}

import { getAuthUserId, getAuthUserIsAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UsersClient } from "./UsersClient";
import { getIntlayer } from "intlayer";
import type { LocalesValues } from "intlayer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("users", locale);
  return { title: c.page.title };
}

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: LocalesValues }>;
}) {
  const { locale } = await params;
  const c = getIntlayer("users", locale);

  const userId = await getAuthUserId();
  if (!userId) redirect("/sign-in");
  const isAdmin = await getAuthUserIsAdmin();
  if (!isAdmin) redirect("/dashboard");

  const rawUsers = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const users = rawUsers.map((u) => ({
    ...u,
    name: u.name || c.noName,
  }));

  return <UsersClient users={users} />;
}

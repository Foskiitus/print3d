import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UsersClient } from "./UsersClient";

export const metadata = { title: "Utilizadores" };

export default async function UsersPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/dashboard");

  const rawUsers = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const users = rawUsers.map((u) => ({
    ...u,
    name: u.name || "Sem Nome",
  }));

  return <UsersClient users={users} />;
}

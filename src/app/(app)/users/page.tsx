import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UsersClient } from "./UsersClient";

export default async function UsersPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/dashboard");

  const rawUsers = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  // Mapeamos a lista para garantir que o nome nunca é null
  const users = rawUsers.map((u) => ({
    ...u,
    name: u.name || "Sem Nome", // Se for null, assume "Sem Nome" (ou podes pôr apenas "")
  }));

  return <UsersClient users={users} />;
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CustomersClient } from "./CustomersClient";

export const metadata = { title: "Clientes" };

export default async function CustomersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const customers = await prisma.customer.findMany({
    where: { userId },
    include: { _count: { select: { sales: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Clientes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gere a lista de clientes e consulta o histórico de compras.
        </p>
      </div>
      <CustomersClient initialCustomers={customers as any} />
    </div>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";

export const metadata = {
  title: "Configurações",
  description: "Gerencie categorias e extras para os seus produtos.",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const isAdmin = (session.user as any).role === "admin";

  const [categories, extras, electricitySetting, uploadLimitSetting] =
    await Promise.all([
      prisma.category.findMany({
        where: { userId },
        include: { _count: { select: { products: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.extra.findMany({
        where: { userId },
        include: { _count: { select: { usages: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.settings.findUnique({
        where: { userId_key: { userId, key: "electricityPrice" } },
      }),
      prisma.settings.findUnique({
        where: { userId_key: { userId, key: "uploadLimitMb" } },
      }),
    ]);

  const electricityPrice = electricitySetting
    ? Number(electricitySetting.value)
    : 0.2;
  const uploadLimitMb = uploadLimitSetting
    ? Number(uploadLimitSetting.value)
    : 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gerencie as categorias e extras disponíveis para os seus produtos.
        </p>
      </div>
      <SettingsClient
        initialCategories={categories as any}
        initialExtras={extras as any}
        initialElectricityPrice={electricityPrice}
        initialUploadLimitMb={uploadLimitMb}
        isAdmin={isAdmin}
      />
    </div>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExportClient } from "./ExportClient";

export const metadata = { title: "Exportação | Print3D" };

export default async function ExportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Exportação</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Exporta os teus dados para CSV ou PDF.
        </p>
      </div>
      <ExportClient />
    </div>
  );
}

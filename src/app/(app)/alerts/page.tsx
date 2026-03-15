import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Droplets,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export const metadata = { title: "Alertas | Print3D" };

export default async function AlertsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [products, spools, productionTotals, salesTotals] = await Promise.all([
    prisma.product.findMany({
      where: { userId, alertThreshold: { not: null } },
    }),
    prisma.filamentSpool.findMany({
      where: { userId, alertThreshold: { not: null } },
      include: { filamentType: true },
    }),
    prisma.productionLog.groupBy({
      by: ["productId"],
      where: { userId },
      _sum: { quantity: true },
    }),
    prisma.sale.groupBy({
      by: ["productId"],
      where: { userId },
      _sum: { quantity: true },
    }),
  ]);

  const productAlerts = products
    .map((p) => {
      const produced =
        productionTotals.find((t) => t.productId === p.id)?._sum.quantity ?? 0;
      const sold =
        salesTotals.find((t) => t.productId === p.id)?._sum.quantity ?? 0;
      const stock = produced - sold;
      return { id: p.id, name: p.name, stock, threshold: p.alertThreshold! };
    })
    .filter((p) => p.stock <= p.threshold);

  const spoolAlerts = spools
    .filter((s) => s.remaining <= s.alertThreshold!)
    .map((s) => ({
      id: s.id,
      name: `${s.filamentType.brand} ${s.filamentType.colorName}`,
      colorHex: s.filamentType.colorHex,
      remaining: s.remaining,
      threshold: s.alertThreshold!,
    }));

  const totalAlerts = productAlerts.length + spoolAlerts.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Alertas de Stock
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Produtos e bobines abaixo do limite definido.
          </p>
        </div>
        {totalAlerts > 0 && (
          <Badge variant="destructive" className="ml-auto">
            {totalAlerts} alerta(s) ativo(s)
          </Badge>
        )}
      </div>

      {totalAlerts === 0 && (
        <div className="border border-dashed rounded-lg py-16 text-center space-y-2">
          <CheckCircle size={32} className="text-emerald-400 mx-auto" />
          <p className="text-sm font-medium">Tudo em ordem!</p>
          <p className="text-xs text-muted-foreground">
            Nenhum produto ou bobine abaixo do limite de alerta.
          </p>
        </div>
      )}

      {/* ── Produtos ── */}
      {productAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Package size={14} className="text-muted-foreground" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Produtos
            </h2>
            <Badge variant="destructive" className="text-[10px]">
              {productAlerts.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {productAlerts.map((p) => (
              <Card
                key={p.id}
                className="border-destructive/30 bg-destructive/5"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle
                        size={16}
                        className="text-destructive flex-shrink-0"
                      />
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <span className="text-destructive font-medium">
                            {p.stock} unidades
                          </span>{" "}
                          em stock · alerta abaixo de {p.threshold} un.
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/products/${p.id}`}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors flex-shrink-0"
                    >
                      Ver produto <ArrowRight size={11} />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Bobines ── */}
      {spoolAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Droplets size={14} className="text-muted-foreground" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Bobines de filamento
            </h2>
            <Badge variant="destructive" className="text-[10px]">
              {spoolAlerts.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {spoolAlerts.map((s) => (
              <Card
                key={s.id}
                className="border-destructive/30 bg-destructive/5"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle
                        size={16}
                        className="text-destructive flex-shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: s.colorHex }}
                          />
                          <p className="font-medium text-sm">{s.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <span className="text-destructive font-medium">
                            {s.remaining.toFixed(0)}g
                          </span>{" "}
                          restantes · alerta abaixo de {s.threshold}g
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/filaments"
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors flex-shrink-0"
                    >
                      Ver filamentos <ArrowRight size={11} />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Info sobre como configurar ── */}
      <div className="rounded-lg border border-border bg-muted/20 p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground text-sm">
          Como configurar alertas
        </p>
        <p>
          Para produtos: abre o produto e define o campo "Alerta de stock
          mínimo" na edição.
        </p>
        <p>
          Para bobines: abre o filamento e define o campo "Alerta de stock
          mínimo" na bobine.
        </p>
      </div>
    </div>
  );
}

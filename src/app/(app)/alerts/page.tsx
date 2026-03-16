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
import { cn } from "@/lib/utils";

export const metadata = { title: "Alertas" };

export default async function AlertsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [products, filamentTypes, productionTotals, salesTotals] =
    await Promise.all([
      prisma.product.findMany({
        where: { userId, alertThreshold: { not: null } },
      }),
      prisma.filamentType.findMany({
        where: { userId },
        include: {
          spools: { where: { userId }, select: { remaining: true } },
        },
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

  const DEFAULT_THRESHOLD = 500;

  const productAlerts = products
    .map((p) => {
      const produced =
        productionTotals.find((t) => t.productId === p.id)?._sum.quantity ?? 0;
      const sold =
        salesTotals.find((t) => t.productId === p.id)?._sum.quantity ?? 0;
      const stock = produced - sold;
      if (produced === 0) return null;
      if (stock > p.alertThreshold!) return null;
      const severity = stock === 0 ? "critical" : "warning";
      return {
        id: p.id,
        name: p.name,
        stock,
        threshold: p.alertThreshold!,
        severity,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const spoolAlerts = filamentTypes
    .map((ft) => {
      if (ft.spools.length === 0) return null;
      const totalRemaining = ft.spools.reduce((s, sp) => s + sp.remaining, 0);
      const threshold = ft.alertThreshold ?? DEFAULT_THRESHOLD;
      if (totalRemaining > threshold) return null;
      const severity = totalRemaining < 100 ? "critical" : "warning";
      return {
        id: ft.id,
        name: `${ft.brand} ${ft.colorName}`,
        colorHex: ft.colorHex,
        remaining: totalRemaining,
        threshold,
        spoolCount: ft.spools.length,
        isDefault: ft.alertThreshold == null,
        severity,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

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

      {/* ── Tudo em ordem ── */}
      {totalAlerts === 0 && (
        <div className="border border-dashed rounded-lg py-16 text-center space-y-2">
          {/* ✅ text-success em vez de text-emerald-400 */}
          <CheckCircle size={32} className="text-success mx-auto" />
          <p className="text-sm font-medium text-foreground">Tudo em ordem!</p>
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
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
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
                className={cn(
                  p.severity === "critical"
                    ? "border-destructive/30 bg-destructive/5"
                    : /* ✅ border-warning/30 bg-warning/5 em vez de border-yellow-500 */
                      "border-warning/30 bg-warning/5",
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle
                        size={16}
                        className={cn(
                          "flex-shrink-0",
                          p.severity === "critical"
                            ? "text-destructive"
                            : "text-warning",
                        )}
                      />
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {p.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <span
                            className={cn(
                              "font-medium",
                              p.severity === "critical"
                                ? "text-destructive"
                                : "text-warning",
                            )}
                          >
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
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
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
                className={cn(
                  s.severity === "critical"
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-warning/30 bg-warning/5",
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle
                        size={16}
                        className={cn(
                          "flex-shrink-0",
                          s.severity === "critical"
                            ? "text-destructive"
                            : "text-warning",
                        )}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-border/30"
                            style={{ backgroundColor: s.colorHex }}
                          />
                          <p className="font-medium text-sm text-foreground">
                            {s.name}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <span
                            className={cn(
                              "font-medium",
                              s.severity === "critical"
                                ? "text-destructive"
                                : "text-warning",
                            )}
                          >
                            {s.remaining.toFixed(0)}g
                          </span>{" "}
                          no total
                          {s.spoolCount > 1
                            ? ` (${s.spoolCount} bobines)`
                            : ""}{" "}
                          · alerta abaixo de {s.threshold}g
                          {s.isDefault && (
                            <span className="text-muted-foreground">
                              {" "}
                              (padrão)
                            </span>
                          )}
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

      {/* ── Como configurar ── */}
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

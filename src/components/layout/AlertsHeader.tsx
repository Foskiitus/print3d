"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Package, Droplets, AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductAlert = {
  id: string;
  name: string;
  stock: number;
  threshold: number;
};
type SpoolAlert = {
  id: string;
  name: string;
  remaining: number;
  threshold: number;
};

function Badge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function AlertDropdown({
  title,
  icon: Icon,
  items,
  renderItem,
  emptyText,
  linkHref,
}: {
  title: string;
  icon: any;
  items: any[];
  renderItem: (item: any) => React.ReactNode;
  emptyText: string;
  linkHref: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative p-2 rounded-md transition-colors",
          items.length > 0
            ? "text-destructive hover:bg-destructive/10"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <Icon size={18} />
        <Badge count={items.length} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Icon size={13} className="text-muted-foreground" />
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {title}
              </p>
            </div>
            {items.length > 0 && (
              <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full font-medium">
                {items.length} alerta(s)
              </span>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-muted-foreground">{emptyText}</p>
              </div>
            ) : (
              <div className="py-1">
                {items.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-2.5 hover:bg-accent/50 transition-colors"
                  >
                    {renderItem(item)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border px-4 py-2.5">
            <Link
              href={linkHref}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <span>Ver todos os alertas</span>
              <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function AlertsHeader() {
  const [productAlerts, setProductAlerts] = useState<ProductAlert[]>([]);
  const [spoolAlerts, setSpoolAlerts] = useState<SpoolAlert[]>([]);

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((data) => {
        setProductAlerts(data.productAlerts ?? []);
        setSpoolAlerts(data.spoolAlerts ?? []);
      })
      .catch(() => {});

    // Refrescar a cada 5 minutos
    const interval = setInterval(
      () => {
        fetch("/api/alerts")
          .then((r) => r.json())
          .then((data) => {
            setProductAlerts(data.productAlerts ?? []);
            setSpoolAlerts(data.spoolAlerts ?? []);
          })
          .catch(() => {});
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1">
      {/* Alertas de produtos */}
      <AlertDropdown
        title="Stock de produtos"
        icon={Package}
        items={productAlerts}
        emptyText="Nenhum produto com stock baixo."
        linkHref="/alerts"
        renderItem={(item: ProductAlert) => (
          <Link href={`/products/${item.id}`} className="block">
            <p className="text-sm font-medium truncate">{item.name}</p>
            <p className="text-[10px] text-destructive mt-0.5">
              {item.stock} un. em stock · alerta abaixo de {item.threshold}
            </p>
          </Link>
        )}
      />

      {/* Alertas de bobines */}
      <AlertDropdown
        title="Filamentos"
        icon={Droplets}
        items={spoolAlerts}
        emptyText="Nenhuma bobine com stock baixo."
        linkHref="/alerts"
        renderItem={(item: SpoolAlert) => (
          <Link href="/filaments" className="block">
            <p className="text-sm font-medium truncate">{item.name}</p>
            <p className="text-[10px] text-destructive mt-0.5">
              {item.remaining.toFixed(0)}g restantes · alerta abaixo de{" "}
              {item.threshold}g
            </p>
          </Link>
        )}
      />
    </div>
  );
}

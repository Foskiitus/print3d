"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Package, Droplets, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function AlertBadge({ items }: { items: any[] }) {
  if (items.length === 0) return null;
  const hasCritical = items.some((i) => i.severity === "critical");
  return (
    <span
      className={cn(
        "absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center",
        hasCritical ? "bg-destructive" : "bg-yellow-500",
      )}
    >
      {items.length > 9 ? "9+" : items.length}
    </span>
  );
}

function severityClass(severity: string) {
  return severity === "critical" ? "text-destructive" : "text-yellow-500";
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
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasCritical = items.some((i) => i.severity === "critical");

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative p-2 rounded-md transition-colors",
          items.length > 0
            ? hasCritical
              ? "text-destructive hover:bg-destructive/10"
              : "text-yellow-500 hover:bg-yellow-500/10"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <Icon size={18} />
        <AlertBadge items={items} />
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
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                  hasCritical
                    ? "bg-destructive/10 text-destructive"
                    : "bg-yellow-500/10 text-yellow-500",
                )}
              >
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
  const [productAlerts, setProductAlerts] = useState<any[]>([]);
  const [spoolAlerts, setSpoolAlerts] = useState<any[]>([]);

  useEffect(() => {
    const CACHE_KEY = "alerts_cache";
    const CACHE_TTL = 60 * 1000; // 60 segundos

    const load = async () => {
      // Verificar cache em memória
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, ts } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL) {
            setProductAlerts(data.productAlerts ?? []);
            setSpoolAlerts(data.spoolAlerts ?? []);
            return;
          }
        }
      } catch {}

      // Buscar dados frescos
      try {
        const res = await fetch("/api/alerts");
        const data = await res.json();
        setProductAlerts(data.productAlerts ?? []);
        setSpoolAlerts(data.spoolAlerts ?? []);
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data, ts: Date.now() }),
        );
      } catch {}
    };

    load();

    // Refrescar a cada 5 minutos
    const interval = setInterval(
      () => {
        sessionStorage.removeItem("alerts_cache");
        load();
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1">
      <AlertDropdown
        title="Stock de produtos"
        icon={Package}
        items={productAlerts}
        emptyText="Nenhum produto com stock baixo."
        linkHref="/alerts"
        renderItem={(item) => (
          <Link href={`/products/${item.id}`} className="block">
            <p className="text-sm font-medium truncate">{item.name}</p>
            <p
              className={cn("text-[10px] mt-0.5", severityClass(item.severity))}
            >
              {item.stock} un. em stock · alerta abaixo de {item.threshold}
            </p>
          </Link>
        )}
      />
      <AlertDropdown
        title="Filamentos"
        icon={Droplets}
        items={spoolAlerts}
        emptyText="Nenhuma bobine com stock baixo."
        linkHref="/alerts"
        renderItem={(item) => (
          <Link href="/filaments" className="block">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.colorHex }}
              />
              <p className="text-sm font-medium truncate">{item.name}</p>
            </div>
            <p className={cn("text-[10px]", severityClass(item.severity))}>
              {item.remaining.toFixed(0)}g no total · alerta abaixo de{" "}
              {item.threshold}g
              {item.spoolCount > 1 && ` (${item.spoolCount} bobines)`}
            </p>
          </Link>
        )}
      />
    </div>
  );
}

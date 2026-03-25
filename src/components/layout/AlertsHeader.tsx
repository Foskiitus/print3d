"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Package, Droplets, ChevronRight } from "lucide-react";
import { useIntlayer, useLocale } from "next-intlayer";
import { cn } from "@/lib/utils";

function AlertBadge({ items }: { items: any[] }) {
  if (items.length === 0) return null;
  const hasCritical = items.some((i) => i.severity === "critical");
  return (
    <span
      className={cn(
        "absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center",
        hasCritical ? "bg-destructive" : "bg-warning",
      )}
    >
      {items.length > 9 ? "9+" : items.length}
    </span>
  );
}

function severityClass(severity: string) {
  return severity === "critical" ? "text-destructive" : "text-warning";
}

function AlertDropdown({
  title,
  icon: Icon,
  items,
  renderItem,
  emptyText,
  linkHref,
  alertCountLabel,
  viewAllLabel,
}: {
  title: string;
  icon: any;
  items: any[];
  renderItem: (item: any) => React.ReactNode;
  emptyText: string;
  linkHref: string;
  alertCountLabel: string;
  viewAllLabel: string;
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
          "relative p-2 rounded-lg transition-colors",
          items.length > 0
            ? hasCritical
              ? "text-destructive hover:bg-destructive/10"
              : "text-warning hover:bg-warning/10"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <Icon size={18} />
        <AlertBadge items={items} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Icon size={13} className="text-muted-foreground" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {title}
              </p>
            </div>
            {items.length > 0 && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                  hasCritical
                    ? "bg-destructive/10 text-destructive"
                    : "bg-warning/10 text-warning",
                )}
              >
                {items.length} {alertCountLabel}
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
                    className="px-4 py-2.5 hover:bg-muted/20 transition-colors"
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
              <span>{viewAllLabel}</span>
              <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function AlertsHeader() {
  const c = useIntlayer("alerts");
  const { locale } = useLocale();
  const [productAlerts, setProductAlerts] = useState<any[]>([]);
  const [spoolAlerts, setSpoolAlerts] = useState<any[]>([]);

  useEffect(() => {
    const CACHE_KEY = "alerts_cache";
    const CACHE_TTL = 60 * 1000;

    const load = async () => {
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

      try {
        const res = await fetch("/api/alerts", {
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
          },
        });
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
        title={c.products.title.value}
        icon={Package}
        items={productAlerts}
        emptyText={c.products.empty.value}
        linkHref={`/${locale}/alerts`}
        alertCountLabel={c.alertCount.value}
        viewAllLabel={c.viewAll.value}
        renderItem={(item) => (
          <Link href={`/${locale}/products/${item.id}`} className="block">
            <p className="text-sm font-medium truncate text-foreground">
              {item.name}
            </p>
            <p
              className={cn("text-[10px] mt-0.5", severityClass(item.severity))}
            >
              {item.stock} {c.products.stockInfo.value} {item.threshold}
            </p>
          </Link>
        )}
      />
      <AlertDropdown
        title={c.filaments.title.value}
        icon={Droplets}
        items={spoolAlerts}
        emptyText={c.filaments.empty.value}
        linkHref={`/${locale}/alerts`}
        alertCountLabel={c.alertCount.value}
        viewAllLabel={c.viewAll.value}
        renderItem={(item) => (
          <Link href={`/${locale}/filaments`} className="block">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.colorHex }}
              />
              <p className="text-sm font-medium truncate text-foreground">
                {item.name}
              </p>
            </div>
            <p className={cn("text-[10px]", severityClass(item.severity))}>
              {item.remaining.toFixed(0)}
              {c.filaments.remaining.value} {item.threshold}g
              {item.spoolCount > 1 &&
                ` (${item.spoolCount} ${c.filaments.spools.value})`}
            </p>
          </Link>
        )}
      />
    </div>
  );
}

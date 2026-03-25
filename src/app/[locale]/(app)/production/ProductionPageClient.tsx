"use client";

import { useState } from "react";
import { useIntlayer } from "next-intlayer";
import { ClipboardList, Map, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrdersTab } from "./tabs/OrdersTab";
import { HistoryTab } from "./tabs/HistoryTab";
import { PlannerTab } from "./tabs/PlannerTab";

// ─── Types (partilhados entre tabs) ──────────────────────────────────────────

export interface FilamentReq {
  id: string;
  material: string;
  colorHex: string | null;
  colorName: string | null;
  estimatedG: number;
}

export interface ComponentProfile {
  id: string;
  name: string;
  printTime: number | null;
  filamentUsed: number | null;
  batchSize: number;
  filaments: FilamentReq[];
}

export interface Component {
  id: string;
  name: string;
  requiresAdapter: boolean;
  specialHandling: string | null;
  defaultMaterial: string | null;
  defaultColorHex: string | null;
  profiles: ComponentProfile[];
  stock: { quantity: number } | null;
}

export interface BOMEntry {
  componentId: string;
  quantity: number;
  component: Component;
}

export interface Product {
  id: string;
  name: string;
  imageUrl: string | null;
  margin: number;
  bom: BOMEntry[];
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  completed: number;
  product: Product;
}

export interface PrintJobMaterial {
  id: string;
  material: string;
  colorHex: string | null;
  colorName: string | null;
  estimatedG: number;
  actualG: number | null;
  spool: {
    id: string;
    qrCodeId: string;
    item: { brand: string; material: string; colorName: string };
  } | null;
}

export interface PrintJobItem {
  id: string;
  componentId: string;
  quantity: number;
  status: string;
  failedUnits: number;
  component: { id: string; name: string };
  profile: ComponentProfile | null;
}

export interface PrintJob {
  id: string;
  status: string;
  estimatedMinutes: number | null;
  quantity: number;
  filamentCost: number | null;
  electricityCost: number | null;
  printerCost: number | null;
  totalCost: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  printer: {
    id: string;
    name: string;
    preset: { name: string; brand: string | null };
  };
  items: PrintJobItem[];
  materials: PrintJobMaterial[];
}

export interface ProductionOrder {
  id: string;
  reference: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  printJobs: PrintJob[];
}

export interface PrinterSlot {
  id: string;
  position: number;
  currentSpool: {
    id: string;
    qrCodeId: string;
    currentWeight: number;
    initialWeight: number;
    item: {
      brand: string;
      material: string;
      colorName: string;
      colorHex: string;
    };
  } | null;
}

export interface PrinterUnit {
  id: string;
  name: string;
  slotCount: number;
  supportsHighTemp: boolean;
  supportsAbrasive: boolean;
  unitPreset: { name: string; brand: string } | null;
  slots: PrinterSlot[];
}

export interface Printer {
  id: string;
  name: string;
  status: string;
  hourlyCost: number;
  powerWatts: number;
  preset: {
    id: string;
    name: string;
    brand: string | null;
    model: string | null;
  };
  units: PrinterUnit[];
}

interface ProductionPageClientProps {
  initialOrders: ProductionOrder[];
  products: Product[];
  printers: Printer[];
  materialPriceMap: Record<string, number>;
  locale: string;
}

type Tab = "orders" | "planner" | "history";

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductionPageClient({
  initialOrders,
  products,
  printers,
  materialPriceMap,
  locale,
}: ProductionPageClientProps) {
  const c = useIntlayer("production");
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<ProductionOrder[]>(initialOrders);

  const refreshOrders = async () => {
    const res = await fetch("/api/production/orders", {
      headers: { "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "" },
    });
    if (res.ok) setOrders(await res.json());
  };

  // Ordens ativas (não concluídas nem canceladas) para o planeador
  const activeOrders = orders.filter(
    (o) => !["done", "cancelled"].includes(o.status),
  );

  // Histórico (concluídas + canceladas)
  const historyOrders = orders.filter((o) =>
    ["done", "cancelled"].includes(o.status),
  );

  const tabs: {
    key: Tab;
    label: string;
    icon: React.ElementType;
    count?: number;
  }[] = [
    {
      key: "orders",
      label: c.tabs.orders.value,
      icon: ClipboardList,
      count: activeOrders.length,
    },
    {
      key: "planner",
      label: c.tabs.planner.value,
      icon: Map,
    },
    {
      key: "history",
      label: c.tabs.history.value,
      icon: History,
      count: historyOrders.length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {c.page.heading.value}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {c.page.description.value}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
            )}
          >
            <Icon size={14} />
            {label}
            {count !== undefined && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                  activeTab === key
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {activeTab === "orders" && (
        <OrdersTab
          orders={activeOrders}
          products={products}
          onRefresh={refreshOrders}
        />
      )}
      {activeTab === "planner" && (
        <PlannerTab
          orders={activeOrders}
          printers={printers}
          materialPriceMap={materialPriceMap}
          onRefresh={refreshOrders}
        />
      )}
      {activeTab === "history" && (
        <HistoryTab orders={historyOrders} locale={locale} />
      )}
    </div>
  );
}

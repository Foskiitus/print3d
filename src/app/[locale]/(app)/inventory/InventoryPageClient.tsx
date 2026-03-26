"use client";

import { useState } from "react";
import { useIntlayer } from "next-intlayer";
import { Droplets, Wrench, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { FilamentsTab } from "./tabs/FilamentsTab";
import { HardwareTab } from "./tabs/HardwareTab";
import { FinishedGoodsTab } from "./tabs/FinishedGoodsTab";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  brand: string;
  material: string;
  colorName: string;
  colorHex: string;
  colorCode: string | null;
  globalFilamentId: string | null;
  alertThreshold: number | null;
}

export interface Purchase {
  id: string;
  qrCodeId: string;
  initialWeight: number;
  currentWeight: number;
  tareWeight: number;
  priceCents: number;
  boughtAt: string;
  openedAt?: string | null;
  notes?: string | null;
  item: InventoryItem;
  supplier?: { id: string; name: string } | null;
  loadedInSlot?: {
    unit: {
      printer: { id: string; name: string };
    };
  } | null;
}

export interface Supplier {
  id: string;
  name: string;
}

export interface HardwareItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string | null;
  // Campos extra que vamos usar para hardware
  category?: string;
  quantity?: number;
  alertThreshold?: number | null;
}

export interface FinishedGood {
  id: string;
  name: string;
  imageUrl: string | null;
  category: { id: string; name: string } | null;
  margin: number;
  alertThreshold: number | null; // nível de stock para aviso de reposição
  stockQty: number; // ProductStock.quantity (0 se sem registo)
  reserved: number; // unidades reservadas para encomendas pendentes
  available: number; // calculado: stockQty - reserved (nunca negativo)
}

interface InventoryPageClientProps {
  initialPurchases: Purchase[];
  suppliers: Supplier[];
  hardwareItems: HardwareItem[];
  finishedGoods: FinishedGood[];
  locale: string;
}

type Tab = "filaments" | "hardware" | "finishedGoods";

// ─── Component ────────────────────────────────────────────────────────────────

export function InventoryPageClient({
  initialPurchases,
  suppliers,
  hardwareItems: initialHardware,
  finishedGoods: initialFinishedGoods,
  locale,
}: InventoryPageClientProps) {
  const c = useIntlayer("inventory");
  const [activeTab, setActiveTab] = useState<Tab>("filaments");
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases);
  const [hardware, setHardware] = useState<HardwareItem[]>(initialHardware);
  const [finishedGoods, setFinishedGoods] =
    useState<FinishedGood[]>(initialFinishedGoods);

  const refreshFilaments = async () => {
    const res = await fetch(`${SITE_URL}/api/inventory`, {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
    });
    if (res.ok) setPurchases(await res.json());
  };

  const refreshHardware = async () => {
    const res = await fetch(`${SITE_URL}/api/extras`, {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
    });
    if (res.ok) setHardware(await res.json());
  };

  const tabs: {
    key: Tab;
    label: string;
    icon: React.ElementType;
    count: number;
  }[] = [
    {
      key: "filaments",
      label: c.tabs.filaments.value,
      icon: Droplets,
      count: purchases.length,
    },
    {
      key: "hardware",
      label: c.tabs.hardware.value,
      icon: Wrench,
      count: hardware.length,
    },
    {
      key: "finishedGoods",
      label: c.tabs.finishedGoods.value,
      icon: Package,
      // Mostra unidades disponíveis (livres) em vez de número de produtos
      count: finishedGoods.reduce((sum, g) => sum + g.available, 0),
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
          </button>
        ))}
      </div>

      {/* Conteúdo da tab ativa */}
      {activeTab === "filaments" && (
        <FilamentsTab
          purchases={purchases}
          suppliers={suppliers}
          locale={locale}
          onRefresh={refreshFilaments}
        />
      )}
      {activeTab === "hardware" && (
        <HardwareTab items={hardware} onRefresh={refreshHardware} />
      )}
      {activeTab === "finishedGoods" && (
        <FinishedGoodsTab items={finishedGoods} locale={locale} />
      )}
    </div>
  );
}

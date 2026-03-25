"use client";

import { useState } from "react";
import { useIntlayer } from "next-intlayer";
import { Users, Cpu, FlaskConical, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { UsersTab } from "./tabs/UsersTab";
import { HardwarePresetsTab } from "./tabs/HardwarePresetsTab";
import { MaterialPresetsTab } from "./tabs/MaterialPresetsTab";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  createdAt: string;
}

export interface PrinterPreset {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  extrusionType: string | null;
  multiMaterialSlots: number;
  powerWatts: number;
  hourlyCost: number;
  imageUrl: string | null;
  isGlobal: boolean;
}

export interface UnitPreset {
  id: string;
  name: string;
  brand: string;
  slotCount: number;
  supportsHighTemp: boolean;
  supportsAbrasive: boolean;
  notes: string | null;
}

export interface GlobalFilament {
  id: string;
  brand: string;
  material: string;
  colorName: string;
  colorCode: string | null;
  colorHex: string;
  spoolWeight: number;
  density: number | null;
}

interface AdminPageClientProps {
  users: AdminUser[];
  printerPresets: PrinterPreset[];
  unitPresets: UnitPreset[];
  globalFilaments: GlobalFilament[];
}

type Tab = "users" | "hardware" | "materials";

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminPageClient({
  users: initialUsers,
  printerPresets: initialPrinterPresets,
  unitPresets: initialUnitPresets,
  globalFilaments: initialFilaments,
}: AdminPageClientProps) {
  const c = useIntlayer("admin");
  const [activeTab, setActiveTab] = useState<Tab>("users");

  const tabs: {
    key: Tab;
    label: string;
    icon: React.ElementType;
    count: number;
  }[] = [
    {
      key: "users",
      label: c.tabs.users.value,
      icon: Users,
      count: initialUsers.length,
    },
    {
      key: "hardware",
      label: c.tabs.hardware.value,
      icon: Cpu,
      count: initialPrinterPresets.length + initialUnitPresets.length,
    },
    {
      key: "materials",
      label: c.tabs.materials.value,
      icon: FlaskConical,
      count: initialFilaments.length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Shield size={18} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {c.page.heading.value}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {c.page.description.value}
          </p>
        </div>
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

      {/* Conteúdo */}
      {activeTab === "users" && <UsersTab initialUsers={initialUsers} />}
      {activeTab === "hardware" && (
        <HardwarePresetsTab
          initialPrinterPresets={initialPrinterPresets}
          initialUnitPresets={initialUnitPresets}
        />
      )}
      {activeTab === "materials" && (
        <MaterialPresetsTab initialFilaments={initialFilaments} />
      )}
    </div>
  );
}

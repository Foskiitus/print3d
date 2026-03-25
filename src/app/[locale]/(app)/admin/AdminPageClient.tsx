"use client";

import { useState } from "react";
import { useIntlayer } from "next-intlayer";
import { Cpu, FlaskConical, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { HardwarePresetsTab } from "./tabs/HardwarePresetsTab";
import { MaterialPresetsTab } from "./tabs/MaterialPresetsTab";
import { UsersTab } from "./tabs/UsersTab";

export interface PrinterPreset {
  id: string;
  brand: string;
  model: string;
  powerWatts: number;
  hourlyCost: number;
  imageUrl: string | null;
  isGlobal: boolean;
}

export interface GlobalFilament {
  id: string;
  brand: string;
  material: string;
  colorName: string;
  colorHex: string;
  spoolWeight: number;
  colorCode: string | null;
}

export interface AdminUser {
  avatar: string | null;
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  createdAt: string;
}

type Tab = "hardware" | "materials" | "users";

export function AdminPageClient({
  initialPrinterPresets,
  initialFilaments,
  initialUsers,
}: {
  initialPrinterPresets: PrinterPreset[];
  initialFilaments: GlobalFilament[];
  initialUsers: AdminUser[];
}) {
  const c = useIntlayer("admin");
  const [activeTab, setActiveTab] = useState<Tab>("hardware");
  const [printerPresets, setPrinterPresets] = useState(initialPrinterPresets);
  const [filaments, setFilaments] = useState(initialFilaments);
  const [users, setUsers] = useState(initialUsers);

  const tabs: {
    key: Tab;
    label: string;
    icon: React.ElementType;
    count: number;
  }[] = [
    {
      key: "hardware",
      label: c.tabs.hardware.value,
      icon: Cpu,
      count: printerPresets.length,
    },
    {
      key: "materials",
      label: c.tabs.materials.value,
      icon: FlaskConical,
      count: filaments.length,
    },
    {
      key: "users",
      label: c.tabs.users.value,
      icon: Users,
      count: users.length,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {c.page.heading.value}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {c.page.description.value}
        </p>
      </div>

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

      {activeTab === "hardware" && (
        <HardwarePresetsTab
          presets={printerPresets}
          onUpdate={setPrinterPresets}
        />
      )}
      {activeTab === "materials" && (
        <MaterialPresetsTab filaments={filaments} onUpdate={setFilaments} />
      )}
      {activeTab === "users" && <UsersTab users={users} onUpdate={setUsers} />}
    </div>
  );
}

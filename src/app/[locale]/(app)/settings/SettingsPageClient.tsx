"use client";

import { useState } from "react";
import { useIntlayer } from "next-intlayer";
import { cn } from "@/lib/utils";
import {
  Euro,
  Globe,
  FileKey,
  Building2,
  Warehouse,
  Shield,
} from "lucide-react";
import { FinancialSection } from "./sections/FinancialSection";
import { LicensingSection } from "./sections/LicensingSection";
import { CompanySection } from "./sections/CompanySection";
import { LocationsSection } from "./sections/LocationsSection";
import { PrivacySection } from "./sections/PrivacySection";
import { PlatformsSection } from "./sections/PlatformsSection";

type Section =
  | "financial"
  | "platforms"
  | "licensing"
  | "company"
  | "locations"
  | "privacy";

export interface FinancialSettings {
  kwhPrice: number;
  fixedCostPerProduct: number;
  hourlyRate: number;
  shippingCost: number;
  vatRate: number;
  currency: string;
}

export interface Platform {
  id: string;
  name: string;
  commission: number;
  fixedFee: number;
}

export interface License {
  id: string;
  name: string;
  monthlyCost: number;
  royaltyPerUnit: number;
}

export interface Company {
  name?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  vatId?: string;
  logoUrl?: string;
}

export interface Location {
  id: string;
  name: string;
}

interface SettingsPageClientProps {
  userId: string;
  financial: FinancialSettings;
  platforms: Platform[];
  licenses: License[];
  company: Company;
  locations: Location[];
}

export function SettingsPageClient({
  userId,
  financial: initialFinancial,
  platforms: initialPlatforms,
  licenses: initialLicenses,
  company: initialCompany,
  locations: initialLocations,
}: SettingsPageClientProps) {
  const c = useIntlayer("settings");
  const [activeSection, setActiveSection] = useState<Section>("financial");

  const navItems: { key: Section; label: string; icon: React.ElementType }[] = [
    { key: "financial", label: c.nav.financial.value, icon: Euro },
    { key: "platforms", label: c.nav.platforms.value, icon: Globe },
    { key: "licensing", label: c.nav.licensing.value, icon: FileKey },
    { key: "company", label: c.nav.company.value, icon: Building2 },
    { key: "locations", label: c.nav.locations.value, icon: Warehouse },
    { key: "privacy", label: c.nav.privacy.value, icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {c.page.heading.value}
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sub-sidebar */}
        <nav className="lg:w-48 flex-shrink-0">
          <div className="flex lg:flex-col gap-1 flex-wrap">
            {navItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left w-full",
                  activeSection === key
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                <Icon size={14} className="flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {activeSection === "financial" && (
            <FinancialSection userId={userId} initialData={initialFinancial} />
          )}
          {activeSection === "platforms" && (
            <PlatformsSection
              userId={userId}
              initialPlatforms={initialPlatforms}
            />
          )}
          {activeSection === "licensing" && (
            <LicensingSection
              userId={userId}
              initialLicenses={initialLicenses}
            />
          )}
          {activeSection === "company" && (
            <CompanySection userId={userId} initialData={initialCompany} />
          )}
          {activeSection === "locations" && (
            <LocationsSection
              userId={userId}
              initialLocations={initialLocations}
            />
          )}
          {activeSection === "privacy" && <PrivacySection userId={userId} />}
        </div>
      </div>
    </div>
  );
}

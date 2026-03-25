"use client";

import { useState } from "react";
import { getIntlayer } from "next-intlayer";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Tag,
  Package,
  Zap,
  Check,
  Lock,
  Sun,
  Moon,
  Droplets,
  Plus,
  Globe,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { NewCategoryDialog } from "@/components/forms/NewCategoryDialog";
import { NewExtraDialog } from "@/components/forms/NewExtraDialog";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { ColorPicker } from "@/components/ui/colorPicker";

const LOCALES = [
  { value: "pt", label: "Português" },
  { value: "en", label: "English" },
];

export function SettingsClient({
  initialCategories,
  initialExtras,
  initialElectricityPrice,
  initialUploadLimitMb,
  isAdmin,
}: {
  initialCategories: any[];
  initialExtras: any[];
  initialElectricityPrice: number;
  initialUploadLimitMb: number;
  isAdmin: boolean;
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [extras, setExtras] = useState(initialExtras);
  const [electricityPrice, setElectricityPrice] = useState(
    String(initialElectricityPrice),
  );
  const [savingElectricity, setSavingElectricity] = useState(false);
  const [uploadLimitMb, setUploadLimitMb] = useState(
    String(initialUploadLimitMb),
  );
  const [savingUploadLimit, setSavingUploadLimit] = useState(false);

  const { theme, setTheme } = useTheme();

  // ── Locale ────────────────────────────────────────────────────────────────
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = pathname.split("/")[1] ?? "pt";
  const c = getIntlayer("settings", currentLocale);

  const handleLocaleChange = (newLocale: string) => {
    const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPath);
  };

  // ── Presets de filamentos (admin) ──────────────────────────────────────────
  const [filamentPresets, setFilamentPresets] = useState<any[]>([]);
  const [newPreset, setNewPreset] = useState({
    brand: "",
    material: "",
    colorName: "",
    colorHex: "#3b82f6",
  });
  const [savingPreset, setSavingPreset] = useState(false);

  const loadPresets = async () => {
    const res = await fetch("/api/filaments/presets", {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
    });
    if (res.ok) setFilamentPresets(await res.json());
  };

  const [presetsInitialized, setPresetsInitialized] = useState(false);
  if (isAdmin && !presetsInitialized) {
    setPresetsInitialized(true);
    loadPresets();
  }

  const handleAddPreset = async () => {
    if (
      !newPreset.brand.trim() ||
      !newPreset.material.trim() ||
      !newPreset.colorName.trim()
    )
      return;
    setSavingPreset(true);
    try {
      const res = await fetch("/api/filaments/presets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify(newPreset),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: c.messages.presetAdded.value });
      setNewPreset({
        brand: "",
        material: "",
        colorName: "",
        colorHex: "#3b82f6",
      });
      loadPresets();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingPreset(false);
    }
  };

  const handleDeletePreset = async (id: string) => {
    if (!confirm(c.messages.confirmDelete.value)) return;
    try {
      const res = await fetch(`/api/filaments/presets/${id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      });
      if (!res.ok) throw new Error();
      toast({ title: c.messages.presetDeleted.value });
      loadPresets();
    } catch {
      toast({
        title: c.messages.presetDeleteError.value,
        variant: "destructive",
      });
    }
  };

  const refreshCategories = async () => {
    const res = await fetch("/api/categories", {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
    });
    if (res.ok) setCategories(await res.json());
  };

  const refreshExtras = async () => {
    const res = await fetch("/api/extras", {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
    });
    if (res.ok) setExtras(await res.json());
  };

  const handleSaveElectricity = async () => {
    const value = Number(electricityPrice);
    if (isNaN(value) || value < 0) {
      toast({ title: c.messages.invalidValue.value, variant: "destructive" });
      return;
    }
    setSavingElectricity(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({ key: "electricityPrice", value: String(value) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: c.electricity.saved.value });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingElectricity(false);
    }
  };

  const handleSaveUploadLimit = async () => {
    const value = Number(uploadLimitMb);
    if (isNaN(value) || value < 1 || value > 500) {
      toast({
        title: c.uploadLimit.invalidValue.value,
        variant: "destructive",
      });
      return;
    }
    setSavingUploadLimit(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({ key: "uploadLimitMb", value: String(value) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: c.uploadLimit.saved.value });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingUploadLimit(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm(c.categories.deleteConfirm.value)) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: c.categories.deleted.value });
      refreshCategories();
    } catch (error: any) {
      toast({
        title: c.categories.deleteError.value,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteExtra = async (id: string) => {
    if (!confirm(c.extras.deleteConfirm.value)) return;
    try {
      const res = await fetch(`/api/extras/${id}`, {
        method: "DELETE",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: c.extras.deleted.value });
      refreshExtras();
    } catch (error: any) {
      toast({
        title: c.extras.deleteError.value,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-10">
      {/* ── Preferências Pessoais ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-muted-foreground" />
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {c.preferences.title.value}
          </h2>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          {c.preferences.description.value}
        </p>

        <Card>
          <CardContent className="p-5 space-y-5">
            {/* Tema */}
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="space-y-1 flex-1 min-w-[200px]">
                <p className="text-sm font-medium text-foreground">
                  {c.theme.label.value}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.theme.description.value}
                </p>
              </div>
              <div className="flex gap-2">
                {(["dark", "light"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                      theme === t
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground",
                    )}
                  >
                    {t === "dark" ? (
                      <>
                        <Moon size={14} /> {c.theme.dark.value}
                      </>
                    ) : (
                      <>
                        <Sun size={14} /> {c.theme.light.value}
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Idioma */}
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="space-y-1 flex-1 min-w-[200px]">
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Globe size={13} className="text-muted-foreground" />{" "}
                  {c.locale.label.value}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.locale.description.value}
                </p>
              </div>
              <Select value={currentLocale} onValueChange={handleLocaleChange}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCALES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t border-border" />

            {/* Preço da eletricidade */}
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="space-y-1 flex-1 min-w-[200px]">
                <p className="text-sm font-medium text-foreground">
                  {c.electricity.label.value}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.electricity.description.value}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={electricityPrice}
                    onChange={(e) => setElectricityPrice(e.target.value)}
                    className="w-28 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    €/kWh
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveElectricity}
                  disabled={savingElectricity}
                >
                  {savingElectricity ? (
                    `${c.electricity.saving.value}`
                  ) : (
                    <>
                      <Check size={13} className="mr-1.5" />
                      {c.electricity.save.value}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Configurações da Plataforma (admin) ── */}
      {isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-muted-foreground" />
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {c.platform.title.value}
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              Admin
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            {c.platform.description.value}
          </p>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div className="space-y-1 flex-1 min-w-[200px]">
                  <p className="text-sm font-medium text-foreground">
                    {c.uploadLimit.label.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.uploadLimit.description.value}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      max="500"
                      value={uploadLimitMb}
                      onChange={(e) => setUploadLimitMb(e.target.value)}
                      className="w-28 pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                      MB
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSaveUploadLimit}
                    disabled={savingUploadLimit}
                  >
                    {savingUploadLimit ? (
                      `${c.uploadLimit.saving.value}`
                    ) : (
                      <>
                        <Check size={13} className="mr-1.5" />
                        {c.uploadLimit.save.value}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Categorias ── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-muted-foreground" />
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {c.categories.title.value}
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              {categories.length}
            </Badge>
          </div>
          <NewCategoryDialog onCreated={refreshCategories} />
        </div>

        {categories.length === 0 ? (
          <div className="border border-dashed rounded-lg py-10 text-center">
            <Tag size={24} className="text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {c.categories.empty.value}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {c.categories.emptyDescription.value}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <Card
                key={cat.id}
                className="group hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate text-foreground">
                        {cat.name}
                      </p>
                      {cat.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {cat.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => handleDeleteCategory(cat.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <Badge variant="secondary" className="text-[10px]">
                      {cat._count?.products || 0} produto(s)
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Extras ── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package size={14} className="text-muted-foreground" />
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {c.extras.title.value}
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              {extras.length}
            </Badge>
          </div>
          <NewExtraDialog onCreated={refreshExtras} />
        </div>

        {extras.length === 0 ? (
          <div className="border border-dashed rounded-lg py-10 text-center">
            <Package
              size={24}
              className="text-muted-foreground/40 mx-auto mb-2"
            />
            <p className="text-sm text-muted-foreground">
              {c.extras.empty.value}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {c.extras.emptyDescription.value}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {extras.map((extra) => (
              <Card
                key={extra.id}
                className="group hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate text-foreground">
                        {extra.name}
                      </p>
                      {extra.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {extra.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => handleDeleteExtra(extra.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(extra.price)}
                      {extra.unit && (
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          / {extra.unit}
                        </span>
                      )}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {extra._count?.usages || 0} produto(s)
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

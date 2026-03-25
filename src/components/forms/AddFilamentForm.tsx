"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Check, ChevronRight, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import { ColorPicker } from "@/components/ui/colorPicker";
import QRCode from "qrcode";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface GlobalFilament {
  id: string;
  brand: string;
  material: string;
  colorName: string;
  colorCode: string | null; // ex: "11101"
  colorHex: string;
  spoolWeight: number;
}

interface Supplier {
  id: string;
  name: string;
  url?: string;
}

interface CreatedPurchase {
  id: string;
  qrCodeId: string;
  initialWeight: number;
  priceCents: number;
  boughtAt: string;
  item: {
    brand: string;
    material: string;
    colorName: string;
    colorHex: string;
  };
}

const MATERIALS = [
  "PLA",
  "PETG",
  "ABS",
  "ASA",
  "TPU",
  "PA",
  "PC",
  "HIPS",
  "PVA",
  "Outro",
];

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// ─── Componente QR Label ──────────────────────────────────────────────────────

function QRLabel({ purchase }: { purchase: CreatedPurchase }) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    QRCode.toDataURL(`${SITE_URL}/spool/${purchase.qrCodeId}`, {
      width: 120,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    }).then(setQrDataUrl);
  }, [purchase.qrCodeId]);

  const date = new Date(purchase.boughtAt).toLocaleDateString("pt-PT");
  const price = (purchase.priceCents / 100).toFixed(2);

  return (
    <div
      id={`label-${purchase.qrCodeId}`}
      className="qr-label-container bg-white text-black border border-gray-300 rounded-lg p-3 flex gap-3 items-start w-64 print:border-black"
      style={{ fontFamily: "monospace" }}
    >
      {qrDataUrl && (
        <img src={qrDataUrl} alt="QR" className="w-24 h-24 flex-shrink-0" />
      )}
      <div className="space-y-0.5 text-xs min-w-0">
        <p className="font-bold text-sm">#{purchase.qrCodeId}</p>
        <p className="font-semibold">
          {purchase.item.material} · {purchase.item.colorName}
        </p>
        <p className="text-gray-600">{purchase.item.brand}</p>
        <p>{purchase.initialWeight}g</p>
        <p>€{price}</p>
        <p className="text-gray-500">{date}</p>
      </div>
    </div>
  );
}

// ─── Supplier inline create ───────────────────────────────────────────────────

function SupplierInlineCreate({
  onCreated,
}: {
  onCreated: (s: Supplier) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
      body: JSON.stringify({ name, url }),
    });
    if (res.ok) {
      const supplier = await res.json();
      onCreated(supplier);
      setName("");
      setUrl("");
      setOpen(false);
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors mt-1"
      >
        <Plus className="w-3 h-3" /> Novo fornecedor
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 p-3 rounded-lg border border-theme/40 bg-dark-surface space-y-2"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-theme">Novo fornecedor</span>
        <button type="button" onClick={() => setOpen(false)}>
          <X className="w-3.5 h-3.5 text-navy-400" />
        </button>
      </div>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome (ex: Amazon)"
        required
        className="w-full px-2.5 py-1.5 rounded-md border border-theme/40 bg-background text-sm text-theme placeholder:text-dark-subtle focus:outline-none focus:border-brand-500/60"
      />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Website (opcional)"
        className="w-full px-2.5 py-1.5 rounded-md border border-theme/40 bg-background text-sm text-theme placeholder:text-dark-subtle focus:outline-none focus:border-brand-500/60"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full py-1.5 rounded-md bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
      >
        {loading ? "A guardar..." : "Guardar"}
      </button>
    </form>
  );
}

// ─── Formulário principal ─────────────────────────────────────────────────────

export function AddFilamentForm({
  onSuccess,
  onDone,
}: {
  onSuccess: () => void;
  onDone?: () => void;
}) {
  const { locale } = useParams<{ locale: string }>();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Step 1 — Identificação
  const [query, setQuery] = useState("");
  const [catalogResults, setCatalogResults] = useState<GlobalFilament[]>([]);
  const [selectedGlobal, setSelectedGlobal] = useState<GlobalFilament | null>(
    null,
  );
  const [brand, setBrand] = useState("");
  const [material, setMaterial] = useState("PLA");
  const [colorName, setColorName] = useState("");
  const [colorCode, setColorCode] = useState<string | null>(null);
  const [colorHex, setColorHex] = useState("#3b82f6");

  // Step 2 — Compra
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [initialWeight, setInitialWeight] = useState("1000");
  const [tareWeight, setTareWeight] = useState("0");
  const [priceCents, setPriceCents] = useState("");
  const [boughtAt, setBoughtAt] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");

  // Step 3 — QR
  const [created, setCreated] = useState<CreatedPurchase[]>([]);

  // Pesquisa catálogo
  useEffect(() => {
    if (query.length < 2) {
      setCatalogResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(
        `${SITE_URL}/api/filaments/catalog?q=${encodeURIComponent(query)}`,
        {
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
          },
        },
      );
      if (res.ok) setCatalogResults(await res.json());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Carrega fornecedores
  useEffect(() => {
    fetch("/api/suppliers", {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
    })
      .then((r) => r.json())
      .then(setSuppliers)
      .catch(() => {});
  }, []);

  const selectFromCatalog = (item: GlobalFilament) => {
    setSelectedGlobal(item);
    setBrand(item.brand);
    setMaterial(item.material);
    setColorName(item.colorName);
    setColorCode(item.colorCode ?? null);
    setColorHex(item.colorHex);
    setInitialWeight(String(item.spoolWeight));
    setQuery(
      `${item.brand} ${item.material}${item.colorCode ? ` ${item.colorCode}` : ""} ${item.colorName}`,
    );
    setCatalogResults([]);
  };

  const clearCatalog = () => {
    setSelectedGlobal(null);
    setQuery("");
    setBrand("");
    setMaterial("PLA");
    setColorName("");
    setColorCode(null);
    setColorHex("#3b82f6");
  };

  const handleSubmit = async () => {
    setLoading(true);
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
      body: JSON.stringify({
        brand,
        material,
        colorName,
        colorHex,
        globalFilamentId: selectedGlobal?.id ?? null,
        supplierId: supplierId || null,
        initialWeight: Number(initialWeight),
        tareWeight: Number(tareWeight),
        priceCents: Math.round(Number(priceCents) * 100),
        boughtAt,
        quantity: Number(quantity),
        notes,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      toast({ title: "Erro", description: err.error, variant: "destructive" });
      return;
    }

    const data: CreatedPurchase[] = await res.json();
    setCreated(data);
    setStep(3);
    onSuccess();
  };

  const handlePrint = () => window.print();

  const t = {
    pt: {
      step1: "Identificação",
      step2: "Compra",
      step3: "Etiqueta",
      searchPlaceholder:
        "Pesquisa no catálogo (ex: Bambu PLA 11101 ou matte black)...",
      manualMode: "Introdução manual",
      brand: "Marca",
      material: "Material",
      colorName: "Nome da cor",
      color: "Cor",
      next: "Seguinte",
      back: "Anterior",
      save: "Guardar",
      saving: "A guardar...",
      supplier: "Fornecedor",
      noSupplier: "Sem fornecedor",
      weight: "Peso bruto (g)",
      tare: "Tara (g)",
      price: "Preço (€)",
      date: "Data de compra",
      qty: "Quantidade",
      notes: "Notas",
      print: "Imprimir etiquetas",
      done: "Concluído",
      labelsTitle: "Etiquetas geradas",
      confirmSpool: "rolo criado",
      confirmSpools: "rolos criados",
    },
    en: {
      step1: "Identification",
      step2: "Purchase",
      step3: "Label",
      searchPlaceholder:
        "Search catalog (e.g. Bambu PLA 11101 or matte black)...",
      manualMode: "Manual entry",
      brand: "Brand",
      material: "Material",
      colorName: "Color name",
      color: "Color",
      next: "Next",
      back: "Back",
      save: "Save",
      saving: "Saving...",
      supplier: "Supplier",
      noSupplier: "No supplier",
      weight: "Gross weight (g)",
      tare: "Tare (g)",
      price: "Price (€)",
      date: "Purchase date",
      qty: "Quantity",
      notes: "Notes",
      print: "Print labels",
      done: "Done",
      labelsTitle: "Generated labels",
      confirmSpool: "Spool created",
      confirmSpools: "spools created",
    },
  };
  const c = t[locale as keyof typeof t] ?? t.en;

  const steps = [c.step1, c.step2, c.step3];

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {steps.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const active = step === n;
          const done = step > n;
          return (
            <div key={i} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-500/10 text-brand-400 border border-brand-500/30"
                    : done
                      ? "text-green-400"
                      : "text-navy-400",
                )}
              >
                {done ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-4 text-center">{n}</span>
                )}
                {label}
              </div>
              {i < steps.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-navy-400 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Identificação ── */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Pesquisa catálogo */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-navy-300">
              Catálogo global
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (selectedGlobal) clearCatalog();
                }}
                placeholder={c.searchPlaceholder}
                className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-theme/40 bg-dark-surface text-sm text-theme placeholder:text-dark-subtle focus:outline-none focus:border-brand-500/60 transition-colors"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearCatalog}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5 text-navy-400 hover:text-theme" />
                </button>
              )}
            </div>
            {catalogResults.length > 0 && (
              <div className="rounded-lg border border-theme/40 bg-dark-surface overflow-hidden shadow-lg">
                {catalogResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectFromCatalog(item)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-theme/10 transition-colors text-left"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: item.colorHex,
                        boxShadow: `0 0 4px ${item.colorHex}88`,
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-theme">
                        {item.brand} {item.material}
                      </p>
                      <p className="text-xs text-navy-400">
                        {item.colorCode && (
                          <span className="font-mono mr-1">
                            {item.colorCode}
                          </span>
                        )}
                        {item.colorName} · {item.spoolWeight}g
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedGlobal && (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Preenchido a partir do catálogo
              </p>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-theme/20" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-dark-subtle">
                {c.manualMode}
              </span>
            </div>
          </div>

          {/* Campos manuais */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-navy-300">
                {c.brand}
              </label>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                disabled={!!selectedGlobal}
                placeholder="Bambu Lab"
                required
                className="w-full px-3 py-2 rounded-lg border border-theme/40 bg-dark-surface text-sm text-theme placeholder:text-dark-subtle focus:outline-none focus:border-brand-500/60 disabled:opacity-50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-navy-300">
                {c.material}
              </label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                disabled={!!selectedGlobal}
                className="w-full px-3 py-2 rounded-lg border border-theme/40 bg-dark-surface text-sm text-theme focus:outline-none focus:border-brand-500/60 disabled:opacity-50 transition-colors"
              >
                {MATERIALS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-navy-300">
                {c.colorName}
              </label>
              <input
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                disabled={!!selectedGlobal}
                placeholder="White"
                required
                className="w-full px-3 py-2 rounded-lg border border-theme/40 bg-dark-surface text-sm text-theme placeholder:text-dark-subtle focus:outline-none focus:border-brand-500/60 disabled:opacity-50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-navy-300">
                Código da cor{" "}
                <span className="text-dark-subtle font-normal">(opcional)</span>
              </label>
              <input
                value={colorCode ?? ""}
                onChange={(e) => setColorCode(e.target.value || null)}
                disabled={!!selectedGlobal}
                placeholder="ex: 11101"
                className="w-full px-3 py-2 rounded-lg border border-theme/40 bg-dark-surface text-sm text-theme placeholder:text-dark-subtle focus:outline-none focus:border-brand-500/60 disabled:opacity-50 transition-colors font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-navy-300">
                {c.color}
              </label>
              <div className="flex gap-2 items-center">
                <ColorPicker
                  value={colorHex}
                  onChange={setColorHex}
                  disabled={!!selectedGlobal}
                />
                <div
                  className="flex-1 rounded-lg border h-9 flex items-center justify-center text-[10px] font-mono"
                  style={{
                    backgroundColor: colorHex,
                    color: "#fff",
                    textShadow: "0 0 2px #000",
                    boxShadow: `0 0 8px ${colorHex}66`,
                  }}
                >
                  {colorHex}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!brand || !colorName) {
                toast({
                  title: "Preenche a marca e a cor",
                  variant: "destructive",
                });
                return;
              }
              setStep(2);
            }}
            className="btn-primary w-full justify-center py-2.5"
          >
            {c.next}
          </button>
        </div>
      )}

      {/* ── Step 2: Compra ── */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Fornecedor */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-navy-300">
              {c.supplier}
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-theme/40 bg-dark-surface text-sm text-theme focus:outline-none focus:border-brand-500/60 transition-colors"
            >
              <option value="">{c.noSupplier}</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <SupplierInlineCreate
              onCreated={(s) => {
                setSuppliers((prev) => [...prev, s]);
                setSupplierId(s.id);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-navy-300">
                {c.weight}
              </label>
              <input
                type="number"
                value={initialWeight}
                onChange={(e) => setInitialWeight(e.target.value)}
                min="1"
                required
                className="w-full px-3 py-2 rounded-lg border border-theme/40 bg-dark-surface text-sm text-theme focus:outline-none focus:border-brand-500/60 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-navy-300">
                {c.tare}
              </label>
              <input
                type="number"
                value={tareWeight}
                onChange={(e) => setTareWeight(e.target.value)}
                min="0"
                className="w-full px-3 py-2 rounded-lg border border-theme/40 bg-dark-surface text-sm text-theme focus:outline-none focus:border-brand-500/60 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-navy-300">
                {c.price}
              </label>
              <input
                type="number"
                step="0.01"
                value={priceCents}
                onChange={(e) => setPriceCents(e.target.value)}
                placeholder="19.99"
                required
                className="w-full px-3 py-2 rounded-lg border border-theme/40 bg-dark-surface text-sm text-theme placeholder:text-dark-subtle focus:outline-none focus:border-brand-500/60 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-navy-300">
                {c.qty}
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                max="100"
                className="w-full px-3 py-2 rounded-lg border border-theme/40 bg-dark-surface text-sm text-theme focus:outline-none focus:border-brand-500/60 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-navy-300">
              {c.date}
            </label>
            <input
              type="date"
              value={boughtAt}
              onChange={(e) => setBoughtAt(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 rounded-lg border border-theme/40 bg-dark-surface text-sm text-theme focus:outline-none focus:border-brand-500/60 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-navy-300">
              {c.notes}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-theme/40 bg-dark-surface text-sm text-theme placeholder:text-dark-subtle focus:outline-none focus:border-brand-500/60 resize-none transition-colors"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary flex-1 justify-center py-2.5"
            >
              {c.back}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!priceCents) {
                  toast({ title: "Introduz o preço", variant: "destructive" });
                  return;
                }
                handleSubmit();
              }}
              disabled={loading}
              className="btn-primary flex-1 justify-center py-2.5 disabled:opacity-50"
            >
              {loading ? c.saving : c.save}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Etiquetas ── */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h3
              className="font-display font-semibold text-theme"
              style={{ letterSpacing: "-0.02em" }}
            >
              {c.labelsTitle}
            </h3>
            <p className="text-sm text-navy-400 mt-1">
              {created.length}{" "}
              {created.length === 1 ? c.confirmSpool : c.confirmSpools}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 print:gap-4 print-section">
            {created.map((p) => (
              <QRLabel key={p.id} purchase={p} />
            ))}
          </div>

          <div className="flex gap-3 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-secondary flex-1 justify-center py-2.5"
            >
              {c.print}
            </button>
            <button
              type="button"
              onClick={() => {
                if (onDone) {
                  onDone();
                } else {
                  setStep(1);
                  setCreated([]);
                  setQuery("");
                  setBrand("");
                  setColorName("");
                  setPriceCents("");
                  setQuantity("1");
                  setNotes("");
                  setSupplierId("");
                  clearCatalog();
                }
              }}
              className="btn-primary flex-1 justify-center py-2.5"
            >
              {c.done}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

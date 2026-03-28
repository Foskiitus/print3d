"use client";

// src/components/forms/NewComponentModal.tsx
//
// Modal de criação de componente com suporte a múltiplas mesas (plates).
//
// Estrutura:
//   1. Dados gerais (nome, descrição)
//   2. Tabela de mesas — cada mesa tem: nome, gramas, tempo, yield (batchSize), impressora
//   3. Upload .3mf opcional — tenta preencher a tabela automaticamente
//      Se falhar ou dados incompletos, o utilizador edita as células directamente
//   4. Submit — cria componente + perfil com todas as placas

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Upload,
  Loader2,
  Check,
  AlertTriangle,
  Plus,
  Trash2,
  FileType,
  Layers,
  Clock,
  Printer,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlateFilament {
  material: string;
  colorHex: string;
  colorName: string;
  estimatedG: string; // string para input controlado
}

interface Plate {
  id: string; // local uuid para key
  name: string;
  printTimeH: string;
  printTimeM: string;
  batchSize: string;
  filamentUsed: string; // total de gramas (calculado ou manual)
  filaments: PlateFilament[];
  // .3mf file associado a esta placa (opcional)
  filePath: string;
  fileName: string;
  uploadState: "idle" | "uploading" | "done" | "error";
}

interface NewComponentModalProps {
  initialName?: string;
  productId?: string;
  // Lista de modelos de impressoras disponíveis (para o dropdown)
  printerPresets?: {
    id: string;
    brand: string | null;
    model: string | null;
    name: string;
  }[];
  onCreated: (bomEntry: any) => void;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let plateCounter = 0;
function newPlateId() {
  return `plate-${++plateCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

function emptyPlate(plateNumber: number): Plate {
  return {
    id: newPlateId(),
    name: plateNumber === 1 ? "" : `Mesa ${plateNumber}`,
    printTimeH: "",
    printTimeM: "",
    batchSize: "1",
    filamentUsed: "",
    filaments: [
      { material: "", colorHex: "#888888", colorName: "", estimatedG: "" },
    ],
    filePath: "",
    fileName: "",
    uploadState: "idle",
  };
}

function toMinutes(h: string, m: string): number | null {
  const hours = Number(h) || 0;
  const mins = Number(m) || 0;
  if (hours === 0 && mins === 0) return null;
  return hours * 60 + mins;
}

function fmtMinutes(m: number) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

function plateTotalG(plate: Plate): number {
  const fromFilaments = plate.filaments.reduce(
    (s, f) => s + (Number(f.estimatedG) || 0),
    0,
  );
  return fromFilaments > 0 ? fromFilaments : Number(plate.filamentUsed) || 0;
}

// ─── FilamentRow ──────────────────────────────────────────────────────────────

function FilamentRow({
  fil,
  onChange,
  onRemove,
  showRemove,
}: {
  fil: PlateFilament;
  onChange: (patch: Partial<PlateFilament>) => void;
  onRemove: () => void;
  showRemove: boolean;
}) {
  return (
    <div className="grid grid-cols-[28px_1fr_1fr_60px_auto] gap-1.5 items-center">
      <label className="relative cursor-pointer flex-shrink-0">
        <span
          className="block w-7 h-7 rounded-md border border-border shadow-sm"
          style={{ backgroundColor: fil.colorHex }}
        />
        <input
          type="color"
          value={fil.colorHex}
          onChange={(e) => onChange({ colorHex: e.target.value })}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        />
      </label>
      <Input
        placeholder="Material (PLA…)"
        value={fil.material}
        onChange={(e) => onChange({ material: e.target.value })}
        className="h-7 text-xs"
      />
      <Input
        placeholder="Nome cor"
        value={fil.colorName}
        onChange={(e) => onChange({ colorName: e.target.value })}
        className="h-7 text-xs"
      />
      <Input
        type="number"
        placeholder="g"
        min="0"
        value={fil.estimatedG}
        onChange={(e) => onChange({ estimatedG: e.target.value })}
        className="h-7 text-xs"
      />
      {showRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive"
        >
          <X size={12} />
        </button>
      ) : (
        <span className="w-4" />
      )}
    </div>
  );
}

// ─── PlateCard ────────────────────────────────────────────────────────────────

function PlateCard({
  plate,
  index,
  total,
  printerPresets,
  selectedPresetId,
  onChange,
  onRemove,
  onUpload,
}: {
  plate: Plate;
  index: number;
  total: number;
  printerPresets: NewComponentModalProps["printerPresets"];
  selectedPresetId: string;
  onChange: (patch: Partial<Plate>) => void;
  onRemove: () => void;
  onUpload: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(true);
  const totalG = plateTotalG(plate);
  const mins = toMinutes(plate.printTimeH, plate.printTimeM);

  function updateFilament(i: number, patch: Partial<PlateFilament>) {
    const next = plate.filaments.map((f, fi) =>
      fi === i ? { ...f, ...patch } : f,
    );
    onChange({ filaments: next });
  }

  function addFilament() {
    onChange({
      filaments: [
        ...plate.filaments,
        { material: "", colorHex: "#888888", colorName: "", estimatedG: "" },
      ],
    });
  }

  function removeFilament(i: number) {
    onChange({ filaments: plate.filaments.filter((_, fi) => fi !== i) });
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Cabeçalho da mesa */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
          Mesa {index + 1}
        </span>
        <input
          type="text"
          placeholder={`ex: Corpo, Tampa, Olhos…`}
          value={plate.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="flex-1 bg-transparent text-xs font-medium text-foreground placeholder:text-muted-foreground/50 outline-none min-w-0"
        />
        {/* Resumo colapsado */}
        {!expanded && (totalG > 0 || mins) && (
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-shrink-0">
            {totalG > 0 && (
              <span className="flex items-center gap-0.5">
                <Layers size={9} />
                {totalG}g
              </span>
            )}
            {mins && (
              <span className="flex items-center gap-0.5">
                <Clock size={9} />
                {fmtMinutes(mins)}
              </span>
            )}
            <span className="flex items-center gap-0.5">
              ×{plate.batchSize}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground hover:text-foreground p-0.5"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {total > 1 && (
            <button
              type="button"
              onClick={onRemove}
              className="text-muted-foreground hover:text-destructive p-0.5"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="p-3 space-y-3">
          {/* Linha 1: Tempo + Yield + Gramas totais */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Tempo</Label>
              <div className="flex gap-1">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={plate.printTimeH}
                    onChange={(e) => onChange({ printTimeH: e.target.value })}
                    className="h-7 text-xs pr-5"
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground pointer-events-none">
                    h
                  </span>
                </div>
                <div className="relative flex-1">
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="0"
                    value={plate.printTimeM}
                    onChange={(e) => onChange({ printTimeM: e.target.value })}
                    className="h-7 text-xs pr-5"
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground pointer-events-none">
                    m
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">
                Yield (peças/mesa)
              </Label>
              <Input
                type="number"
                min="1"
                placeholder="ex: 9"
                value={plate.batchSize}
                onChange={(e) => onChange({ batchSize: e.target.value })}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">
                Total (g)
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="auto"
                value={plateTotalG(plate) || plate.filamentUsed}
                onChange={(e) => onChange({ filamentUsed: e.target.value })}
                className="h-7 text-xs"
                readOnly={plate.filaments.some((f) => Number(f.estimatedG) > 0)}
                title={
                  plate.filaments.some((f) => Number(f.estimatedG) > 0)
                    ? "Calculado automaticamente pela soma dos filamentos"
                    : "Peso total desta mesa"
                }
              />
            </div>
          </div>

          {/* Filamentos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">
                Filamentos
                {totalG > 0 && (
                  <span className="ml-1 text-foreground font-medium">
                    ({totalG}g)
                  </span>
                )}
              </Label>
              <button
                type="button"
                onClick={addFilament}
                className="text-[10px] text-primary flex items-center gap-0.5 hover:underline"
              >
                <Plus size={9} /> Adicionar cor
              </button>
            </div>
            <div className="space-y-1.5">
              <div className="grid grid-cols-[28px_1fr_1fr_60px_auto] gap-1.5">
                <span />
                <span className="text-[9px] text-muted-foreground">
                  Material
                </span>
                <span className="text-[9px] text-muted-foreground">Cor</span>
                <span className="text-[9px] text-muted-foreground">g</span>
                <span />
              </div>
              {plate.filaments.map((fil, i) => (
                <FilamentRow
                  key={i}
                  fil={fil}
                  onChange={(patch) => updateFilament(i, patch)}
                  onRemove={() => removeFilament(i)}
                  showRemove={plate.filaments.length > 1}
                />
              ))}
            </div>
          </div>

          {/* Upload .3mf desta mesa (opcional) */}
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
              <FileType size={9} /> Ficheiro .3mf desta mesa{" "}
              <span className="font-normal">(opcional)</span>
            </Label>
            <input
              ref={fileRef}
              type="file"
              accept=".3mf,.gcode,.bgcode"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
              }}
            />
            {plate.fileName ? (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border bg-muted/20">
                {plate.uploadState === "uploading" && (
                  <Loader2
                    size={10}
                    className="animate-spin text-muted-foreground flex-shrink-0"
                  />
                )}
                {plate.uploadState === "done" && (
                  <Check size={10} className="text-emerald-500 flex-shrink-0" />
                )}
                {plate.uploadState === "error" && (
                  <AlertTriangle
                    size={10}
                    className="text-destructive flex-shrink-0"
                  />
                )}
                <span className="text-[10px] text-muted-foreground truncate flex-1">
                  {plate.fileName}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      fileName: "",
                      filePath: "",
                      uploadState: "idle",
                    })
                  }
                  className="text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  <X size={10} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={plate.uploadState === "uploading"}
                className="flex items-center gap-1.5 w-full px-2.5 py-1.5 rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-muted/20 transition-colors text-[10px] text-muted-foreground"
              >
                <Upload size={10} />
                Associar ficheiro .3mf a esta mesa
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function NewComponentModal({
  initialName = "",
  productId,
  printerPresets = [],
  onCreated,
  onClose,
}: NewComponentModalProps) {
  const globalFileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [globalUploading, setGlobalUploading] = useState(false);

  const [form, setForm] = useState({
    name: initialName,
    description: "",
  });

  // Perfil global (nome, ficheiro raiz, modelo de impressora)
  const [profileName, setProfileName] = useState("");
  const [profileFilePath, setProfileFilePath] = useState("");
  const [printerPresetId, setPrinterPresetId] = useState("");

  // Lista de mesas
  const [plates, setPlates] = useState<Plate[]>([emptyPlate(1)]);

  // ── Helpers de actualização de placas ──────────────────────────────────────

  function updatePlate(id: string, patch: Partial<Plate>) {
    setPlates((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );
  }

  function addPlate() {
    setPlates((prev) => [...prev, emptyPlate(prev.length + 1)]);
  }

  function removePlate(id: string) {
    setPlates((prev) => prev.filter((p) => p.id !== id));
  }

  // ── Upload de ficheiro por mesa ────────────────────────────────────────────

  async function uploadPlateFile(plateId: string, file: File) {
    updatePlate(plateId, { fileName: file.name, uploadState: "uploading" });
    try {
      const signRes = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          fileSize: file.size,
          bucket: "models",
        }),
      });
      if (!signRes.ok) throw new Error();
      const { url, key } = await signRes.json();

      await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });

      // Tentar extrair metadados e pré-preencher a placa
      try {
        const extractRes = await fetch("/api/components/extract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
          },
          body: JSON.stringify({ fileKey: key }),
        });
        const extracted = await extractRes.json();

        if (extractRes.ok && extracted.source !== "manual_required") {
          const patch: Partial<Plate> = {
            filePath: key,
            fileName: file.name,
            uploadState: "done",
          };

          if (extracted.printTime) {
            patch.printTimeH = String(Math.floor(extracted.printTime / 60));
            patch.printTimeM = String(extracted.printTime % 60);
          }
          if (extracted.filamentUsed) {
            patch.filamentUsed = String(extracted.filamentUsed);
          }
          if (extracted.filaments?.length > 0) {
            patch.filaments = extracted.filaments.map((f: any) => ({
              material: f.material ?? "",
              colorHex: f.colorHex ?? "#888888",
              colorName: f.colorName ?? "",
              estimatedG: f.estimatedG ? String(f.estimatedG) : "",
            }));
          }
          if (extracted.batchSize) {
            patch.batchSize = String(extracted.batchSize);
          }
          updatePlate(plateId, patch);
          toast({ title: `✓ Metadados extraídos de "${file.name}"` });
          return;
        }
      } catch {
        // extração falhou — continua sem preencher automaticamente
      }

      // Upload OK mas sem extração — guardar só o caminho
      updatePlate(plateId, {
        filePath: key,
        fileName: file.name,
        uploadState: "done",
      });
      toast({
        title: `"${file.name}" carregado`,
        description: "Preenche os campos manualmente.",
      });
    } catch {
      updatePlate(plateId, { uploadState: "error" });
      toast({ title: "Erro no upload", variant: "destructive" });
    }
  }

  // ── Upload global (assistente): tenta preencher TODAS as mesas ──────────────

  async function handleGlobalUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setGlobalUploading(true);
    try {
      const signRes = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          fileSize: file.size,
          bucket: "models",
        }),
      });
      if (!signRes.ok) throw new Error();
      const { url, key } = await signRes.json();
      await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      setProfileFilePath(key);
      if (!profileName) setProfileName(file.name.replace(/\.[^.]+$/, ""));

      const extractRes = await fetch("/api/components/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({ fileKey: key }),
      });
      const extracted = await extractRes.json();

      if (extractRes.ok && extracted.source !== "manual_required") {
        // Multi-placa: criar uma PlateCard por placa detectada
        if ((extracted.plates?.length ?? 0) > 1) {
          const newPlates: Plate[] = extracted.plates.map(
            (ep: any, i: number) => {
              const p = emptyPlate(i + 1);
              p.filePath = key;
              p.fileName = file.name;
              p.uploadState = "done";
              p.name = ep.name ?? (i === 0 ? "" : `Mesa ${i + 1}`);
              if (ep.printTime) {
                p.printTimeH = String(Math.floor(ep.printTime / 60));
                p.printTimeM = String(ep.printTime % 60);
              }
              if (ep.filamentUsed) p.filamentUsed = String(ep.filamentUsed);
              if (ep.filaments?.length > 0) {
                p.filaments = ep.filaments.map((f: any) => ({
                  material: f.material ?? "",
                  colorHex: f.colorHex ?? "#888888",
                  colorName: f.colorName ?? "",
                  estimatedG: f.estimatedG ? String(f.estimatedG) : "",
                }));
              }
              return p;
            },
          );
          setPlates(newPlates);
          toast({
            title: `✓ ${extracted.plates.length} mesas detectadas em "${file.name}"`,
            description:
              extracted.message ?? "Revê e edita os valores se necessário.",
          });
        } else {
          // Mesa única — preencher o primeiro PlateCard
          const ep = extracted.plates?.[0];
          setPlates((prev) => {
            const first = prev[0];
            const patch: Partial<Plate> = {
              filePath: key,
              fileName: file.name,
              uploadState: "done",
            };
            const pt = ep?.printTime ?? extracted.printTime;
            if (pt) {
              patch.printTimeH = String(Math.floor(pt / 60));
              patch.printTimeM = String(pt % 60);
            }
            const fg = ep?.filamentUsed ?? extracted.filamentUsed;
            if (fg) patch.filamentUsed = String(fg);
            if (extracted.batchSize)
              patch.batchSize = String(extracted.batchSize);
            const fils =
              (ep?.filaments?.length > 0
                ? ep.filaments
                : extracted.filaments) ?? [];
            if (fils.length > 0) {
              patch.filaments = fils.map((f: any) => ({
                material: f.material ?? "",
                colorHex: f.colorHex ?? "#888888",
                colorName: f.colorName ?? "",
                estimatedG: f.estimatedG ? String(f.estimatedG) : "",
              }));
            }
            return [{ ...first, ...patch }, ...prev.slice(1)];
          });
          toast({
            title: `✓ "${file.name}" extraído`,
            description:
              extracted.message ?? "Revê e edita os valores se necessário.",
          });
        }
      } else {
        toast({
          title: `"${file.name}" carregado`,
          description:
            extracted.message ??
            "Não foi possível extrair automaticamente. Preenche os campos.",
        });
      }
    } catch {
      toast({ title: "Erro no upload", variant: "destructive" });
    } finally {
      setGlobalUploading(false);
      if (globalFileRef.current) globalFileRef.current.value = "";
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  //
  // Cada mesa cria um componente independente:
  //   Mesa 1 → "Nome Base #1"
  //   Mesa 2 → "Nome Base #2"
  //   ...
  // Se houver apenas 1 mesa, o nome fica sem sufixo.
  // Todos os componentes são adicionados à BOM do produto.

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    if (plates.some((p) => p.uploadState === "uploading")) {
      toast({ title: "Aguarda o upload terminar", variant: "destructive" });
      return;
    }
    setSaving(true);
    const baseName = form.name.trim();
    const baseDescription = form.description.trim() || null;
    const createdEntries: any[] = [];

    try {
      for (let i = 0; i < plates.length; i++) {
        const plate = plates[i];
        const suffix = plates.length > 1 ? ` #${i + 1}` : "";
        const compName = `${baseName}${suffix}`;

        // 1. Criar componente para esta mesa
        const compRes = await fetch("/api/components", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
          },
          body: JSON.stringify({
            name: compName,
            description: baseDescription,
          }),
        });
        const comp = await compRes.json();
        if (!compRes.ok) throw new Error(comp.error);

        // 2. Criar perfil para esta mesa (se tiver algum dado)
        const hasData =
          plate.filePath ||
          plate.printTimeH ||
          plate.printTimeM ||
          plate.batchSize !== "1" ||
          plateTotalG(plate) > 0 ||
          plate.filaments.some((f) => f.material.trim());

        if (hasData) {
          const profileRes = await fetch(
            `${SITE_URL}/api/components/${comp.id}/profiles`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
              },
              body: JSON.stringify({
                name: plate.name.trim() || compName,
                filePath: plate.filePath || profileFilePath || "",
                printerPresetId: printerPresetId || null,
                batchSize: Number(plate.batchSize) || 1,
                printTime: toMinutes(plate.printTimeH, plate.printTimeM),
                filamentUsed: plateTotalG(plate) || null,
                filaments: plate.filaments
                  .filter((f) => f.material.trim())
                  .map((f) => ({
                    material: f.material.trim(),
                    colorHex: f.colorHex || null,
                    colorName: f.colorName.trim() || null,
                    estimatedG: Number(f.estimatedG) || 0,
                  })),
              }),
            },
          );
          const profileData = await profileRes.json();
          if (!profileRes.ok)
            throw new Error(
              profileData.error ?? `Erro ao criar perfil da mesa ${i + 1}`,
            );
        }

        // 3. Adicionar à BOM do produto
        if (productId) {
          const bomRes = await fetch(
            `${SITE_URL}/api/products/${productId}/bom`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
              },
              body: JSON.stringify({ componentId: comp.id, quantity: 1 }),
            },
          );
          const bomEntry = await bomRes.json();
          if (!bomRes.ok) throw new Error(bomEntry.error);
          createdEntries.push(bomEntry);
        } else {
          createdEntries.push(comp);
        }
      }

      // Notificar o pai com todas as entradas criadas
      if (productId) {
        const n = createdEntries.length;
        toast({
          title:
            n === 1
              ? `"${baseName}" criado e adicionado à BOM`
              : `${n} componentes criados e adicionados à BOM`,
        });
        // Chamar onCreated para cada entrada para actualizar a lista
        createdEntries.forEach((entry) => onCreated(entry));
      } else {
        toast({ title: `"${baseName}" criado com sucesso` });
        createdEntries.forEach((entry) => onCreated(entry));
      }

      onClose();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  // ── JSX ────────────────────────────────────────────────────────────────────

  const totalPlates = plates.length;
  const totalTime = plates.reduce(
    (s, p) => s + (toMinutes(p.printTimeH, p.printTimeM) ?? 0),
    0,
  );
  const totalGrams = plates.reduce((s, p) => s + plateTotalG(p), 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div>
            <p className="text-xs text-muted-foreground">
              {productId ? "Novo componente" : "Novo componente independente"}
            </p>
            <h2 className="text-sm font-semibold text-foreground">
              {productId ? "Criar e adicionar à BOM" : "Criar componente"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* ── Dados gerais ── */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="comp-name">Nome da peça</Label>
              <Input
                id="comp-name"
                placeholder='ex: "Leão Articulado"'
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="comp-desc">
                Descrição{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </Label>
              <Input
                id="comp-desc"
                placeholder="Breve descrição"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
          </div>

          {/* ── Upload global .3mf (assistente) ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs">
                <Upload size={11} className="text-muted-foreground" />
                Upload assistente .3mf{" "}
                <span className="text-muted-foreground font-normal">
                  (preenche automaticamente)
                </span>
                {/* Tooltip no label */}
                <span className="group relative inline-flex items-center">
                  <Info
                    size={11}
                    className="text-muted-foreground/60 cursor-help"
                  />
                  <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-56 rounded-lg bg-popover border border-border shadow-md px-2.5 py-2 text-[10px] text-muted-foreground leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    Para o preenchimento automático funcionar (tempo, gramas e
                    mesas), o ficheiro tem de estar{" "}
                    <span className="font-semibold text-foreground">
                      fatiado
                    </span>{" "}
                    no Bambu Studio. Exporta como{" "}
                    <span className="font-mono text-foreground">
                      .gcode.3mf
                    </span>{" "}
                    em vez de{" "}
                    <span className="font-mono text-foreground">.3mf</span>{" "}
                    normal.
                  </span>
                </span>
              </Label>
            </div>
            <input
              ref={globalFileRef}
              type="file"
              accept=".3mf,.gcode,.bgcode"
              className="hidden"
              onChange={handleGlobalUpload}
            />
            <button
              type="button"
              onClick={() => globalFileRef.current?.click()}
              disabled={globalUploading}
              title="Para preenchimento automático, exporta o ficheiro fatiado (.gcode.3mf) do Bambu Studio"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-muted/20 transition-colors text-xs text-muted-foreground"
            >
              {globalUploading ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> A extrair
                  metadados…
                </>
              ) : (
                <>
                  <Upload size={12} /> Arrasta ou clica para carregar o .3mf —
                  usa o ficheiro fatiado (.gcode.3mf) para preenchimento
                  automático
                </>
              )}
            </button>
            {profileFilePath && (
              <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                <Check size={9} /> Ficheiro associado ao perfil
              </p>
            )}
          </div>

          {/* ── Configurações do perfil (modelo de impressora) ── */}
          {printerPresets.length > 0 && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs">
                <Printer size={11} className="text-muted-foreground" />
                Modelo de impressora{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional — restringe no Planeador)
                </span>
              </Label>
              <select
                value={printerPresetId}
                onChange={(e) => setPrinterPresetId(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                <option value="">Qualquer impressora</option>
                {printerPresets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.brand ? `${p.brand} ` : ""}
                    {p.model ?? p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ── Mesas de impressão ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Mesas de Impressão</Label>
                {(totalGrams > 0 || totalTime > 0) && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {totalPlates} mesa{totalPlates > 1 ? "s" : ""}
                    {totalGrams > 0 && ` · ${totalGrams}g`}
                    {totalTime > 0 && ` · ${fmtMinutes(totalTime)} total`}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={addPlate}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus size={11} /> Adicionar mesa
              </button>
            </div>

            <div className="space-y-2">
              {plates.map((plate, i) => (
                <PlateCard
                  key={plate.id}
                  plate={plate}
                  index={i}
                  total={plates.length}
                  printerPresets={printerPresets}
                  selectedPresetId={printerPresetId}
                  onChange={(patch) => updatePlate(plate.id, patch)}
                  onRemove={() => removePlate(plate.id)}
                  onUpload={(file) => uploadPlateFile(plate.id, file)}
                />
              ))}
            </div>

            {plates.length === 1 && (
              <p className="text-[10px] text-muted-foreground text-center">
                Para componentes com múltiplas partes (ex: corpo + olhos),
                adiciona mais mesas.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border flex-shrink-0 bg-background">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={saving || globalUploading || !form.name.trim()}
            className="gap-1.5"
          >
            {saving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Check size={13} />
            )}
            {saving
              ? "A criar…"
              : productId
                ? "Criar e adicionar"
                : "Criar componente"}
          </Button>
        </div>
      </div>
    </div>
  );
}

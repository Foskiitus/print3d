"use client";

// src/components/forms/NewComponentModal.tsx
//
// Modal para criar um novo componente diretamente do editor de produto.
// Ao fazer upload de um .3mf, tenta extrair automaticamente:
//   - Peso estimado de filamento
//   - Tempo de impressão
//   - Materiais e cores necessários

import { useState, useRef } from "react";
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
  Layers,
  Clock,
  FileType,
  Wrench,
  Info,
} from "lucide-react";
import { toast } from "@/components/ui/toaster";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExtractedProfile {
  material: string;
  colorHex: string | null;
  colorName: string | null;
  estimatedG: number;
}

interface NewComponentModalProps {
  initialName?: string; // pré-preencher com o texto da pesquisa
  productId: string;
  onCreated: (bomEntry: any) => void;
  onClose: () => void;
}

// ─── Upload helper (Copiado do NewProductDialog) ──────────────────────────────
async function executeDirectUpload(file: File, bucket: "images" | "models") {
  const signRes = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
      bucket,
    }),
  });

  if (!signRes.ok) throw new Error("Falha ao gerar link de upload");

  const { url, key } = await signRes.json();
  const uploadRes = await fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!uploadRes.ok) throw new Error("Falha no upload para o bucket");

  return key;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NewComponentModal({
  initialName = "",
  productId,
  onCreated,
  onClose,
}: NewComponentModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [file, setFile] = useState<File | null>(null); // Estado para o ficheiro 3MF/STL

  const [form, setForm] = useState({
    name: initialName,
    description: "",
    defaultMaterial: "",
    defaultColorHex: "#000000",
    requiresAdapter: false,
    specialHandling: "",
  });

  const [profile, setProfile] = useState<{
    fileName: string;
    printTime: number;
    filamentUsed: number;
    filaments: ExtractedProfile[];
    filePath: string;
  } | null>(null);

  const [extractionFailed, setExtractionFailed] = useState(false);
  const [manualProfile, setManualProfile] = useState({
    printTime: "",
    filamentUsed: "",
    batchSize: "1",
    material: "",
    colorHex: "#000000",
    colorName: "",
  });

  // ── Upload e extração do .3mf ─────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    setExtractionFailed(false);
    setProfile(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/components/extract", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || data.source === "manual_required") {
        setExtractionFailed(true);
        toast({
          title: "Não foi possível extrair metadados",
          description: "Preenche manualmente o peso e o tempo de impressão.",
        });
        // Ainda guardar o caminho do ficheiro
        setProfile({
          fileName: file.name,
          printTime: 0,
          filamentUsed: 0,
          filaments: [],
          filePath: data.filePath ?? "",
        });
        return;
      }

      setProfile({
        fileName: file.name,
        printTime: data.printTime ?? 0,
        filamentUsed: data.filamentUsed ?? 0,
        filaments: data.filaments ?? [],
        filePath: data.filePath ?? "",
      });

      // Pré-preencher material principal
      if (data.filaments?.[0]) {
        setForm((f) => ({
          ...f,
          defaultMaterial: data.filaments[0].material ?? f.defaultMaterial,
          defaultColorHex: data.filaments[0].colorHex ?? f.defaultColorHex,
        }));
      }

      toast({ title: `Metadados extraídos de "${file.name}"` });
    } catch (err) {
      setExtractionFailed(true);
      toast({ title: "Erro ao processar o ficheiro", variant: "destructive" });
    } finally {
      setExtracting(false);
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!form.name.trim()) return;
    setSaving(true);

    try {
      let fileKey = null;
      if (file) {
        // Como é um componente 3D, usamos o bucket "models"
        fileKey = await executeDirectUpload(file, "models");
      }

      // 1. Criar o componente
      const compRes = await fetch("/api/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          defaultMaterial: form.defaultMaterial || null,
          defaultColorHex: form.defaultColorHex || null,
          requiresAdapter: form.requiresAdapter,
          specialHandling: form.specialHandling.trim() || null,
        }),
      });
      const comp = await compRes.json();
      if (!compRes.ok) throw new Error(comp.error);

      // 2. Se há perfil, criar o ComponentPrintProfile
      if (profile && (profile.filePath || profile.filamentUsed > 0)) {
        const hasManualData = extractionFailed && manualProfile.filamentUsed;
        const filaments = extractionFailed
          ? manualProfile.material
            ? [
                {
                  material: manualProfile.material,
                  colorHex: manualProfile.colorHex,
                  colorName: manualProfile.colorName || null,
                  estimatedG: Number(manualProfile.filamentUsed) || 0,
                },
              ]
            : []
          : profile.filaments;

        await fetch(`/api/components/${comp.id}/profiles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: profile.fileName.replace(/\.[^.]+$/, ""),
            filePath: profile.filePath,
            batchSize: extractionFailed
              ? Number(manualProfile.batchSize) || 1
              : ((profile as any).batchSize ?? 1),
            printTime: extractionFailed
              ? Number(manualProfile.printTime) || null
              : profile.printTime || null,
            filamentUsed: extractionFailed
              ? Number(manualProfile.filamentUsed) || null
              : profile.filamentUsed || null,
            filaments,
          }),
        });
      }

      // 3. Adicionar à BOM do produto
      const bomRes = await fetch(`/api/products/${productId}/bom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentId: comp.id, quantity: 1 }),
      });
      const bomEntry = await bomRes.json();
      if (!bomRes.ok) throw new Error(bomEntry.error);

      toast({ title: `"${comp.name}" criado e adicionado à BOM` });
      onCreated(bomEntry);
      onClose();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background">
          <div>
            <p className="text-xs text-muted-foreground">Novo componente</p>
            <h2 className="text-sm font-semibold text-foreground">
              Criar e adicionar à BOM
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

        <div className="p-4 space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="comp-name">Nome da peça</Label>
            <Input
              id="comp-name"
              placeholder='ex: "Base Redonda 10cm"'
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comp-desc">Descrição (opcional)</Label>
            <Input
              id="comp-desc"
              placeholder="Breve descrição da peça"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          {/* Upload .3mf */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <FileType size={11} className="text-muted-foreground" />
              Ficheiro de impressão (.3mf / .gcode)
            </Label>

            <input
              ref={fileRef}
              type="file"
              accept=".3mf,.gcode,.bgcode"
              onChange={handleFileChange}
              className="hidden"
            />

            {!profile ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={extracting}
                className="flex items-center gap-2 w-full p-3 rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-muted/40 transition-colors text-sm text-muted-foreground"
              >
                {extracting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />A extrair
                    metadados…
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    Clica para fazer upload
                  </>
                )}
              </button>
            ) : (
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground truncate">
                    {profile.fileName}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setProfile(null);
                      setExtractionFailed(false);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="text-muted-foreground hover:text-foreground flex-shrink-0 ml-2"
                  >
                    <X size={12} />
                  </button>
                </div>

                {!extractionFailed && profile.filamentUsed > 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Layers size={9} />
                      {profile.filamentUsed}g
                    </span>
                    {profile.printTime > 0 && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock size={9} />
                        {Math.round(profile.printTime / 60)}h
                        {profile.printTime % 60 > 0
                          ? ` ${profile.printTime % 60}m`
                          : ""}
                      </span>
                    )}
                    {profile.filaments.map((f, i) => (
                      <span
                        key={i}
                        className="text-[10px] flex items-center gap-1"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: f.colorHex ?? "#888" }}
                        />
                        <span className="text-muted-foreground">
                          {f.material}
                        </span>
                      </span>
                    ))}
                    <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 ml-auto">
                      <Check size={8} className="mr-0.5" />
                      extraído
                    </Badge>
                  </div>
                ) : (
                  // Extração falhou — input manual
                  <div className="space-y-2 pt-1">
                    <p className="text-[10px] text-amber-500 flex items-center gap-1">
                      <AlertTriangle size={9} />
                      Preenche manualmente:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Gramas de filamento
                        </Label>
                        <Input
                          type="number"
                          placeholder="ex: 225"
                          value={manualProfile.filamentUsed}
                          onChange={(e) =>
                            setManualProfile({
                              ...manualProfile,
                              filamentUsed: e.target.value,
                            })
                          }
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Unidades por lote
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="ex: 9"
                          value={manualProfile.batchSize}
                          onChange={(e) =>
                            setManualProfile({
                              ...manualProfile,
                              batchSize: e.target.value,
                            })
                          }
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Tempo (minutos)
                        </Label>
                        <Input
                          type="number"
                          placeholder="ex: 812"
                          value={manualProfile.printTime}
                          onChange={(e) =>
                            setManualProfile({
                              ...manualProfile,
                              printTime: e.target.value,
                            })
                          }
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Material
                        </Label>
                        <Input
                          placeholder="ex: PLA"
                          value={manualProfile.material}
                          onChange={(e) =>
                            setManualProfile({
                              ...manualProfile,
                              material: e.target.value,
                            })
                          }
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Cor
                        </Label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={manualProfile.colorHex}
                            onChange={(e) =>
                              setManualProfile({
                                ...manualProfile,
                                colorHex: e.target.value,
                              })
                            }
                            className="w-7 h-7 rounded border border-border cursor-pointer"
                          />
                          <Input
                            placeholder="Nome da cor"
                            value={manualProfile.colorName}
                            onChange={(e) =>
                              setManualProfile({
                                ...manualProfile,
                                colorName: e.target.value,
                              })
                            }
                            className="h-7 text-xs flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Flags de risco */}
          <div className="space-y-3 pt-1">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
              <Wrench size={10} />
              Flags de risco (para o Planeador)
            </Label>

            {/* Requer adaptador */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={form.requiresAdapter}
                  onChange={(e) =>
                    setForm({ ...form, requiresAdapter: e.target.checked })
                  }
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${form.requiresAdapter ? "bg-amber-500 border-amber-500" : "border-border group-hover:border-amber-400"}`}
                >
                  {form.requiresAdapter && (
                    <Check size={10} className="text-white" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  Requer adaptador físico
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Bobine não-standard ou de papel — o planeador vai avisar ao
                  adicionar à impressora.
                </p>
              </div>
            </label>

            {/* Handling especial */}
            <div className="space-y-1.5">
              <Label
                htmlFor="special-handling"
                className="text-xs text-muted-foreground flex items-center gap-1"
              >
                <Info size={10} />
                Nota de manuseamento (opcional)
              </Label>
              <Input
                id="special-handling"
                placeholder='ex: "TPU — desligar o AMS retractor"'
                value={form.specialHandling}
                onChange={(e) =>
                  setForm({ ...form, specialHandling: e.target.value })
                }
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border sticky bottom-0 bg-background">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={saving || !form.name.trim()}
            className="gap-1.5"
          >
            {saving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Check size={13} />
            )}
            {saving ? "A criar…" : "Criar e adicionar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

// src/components/forms/NewComponentModal.tsx

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
  Plus,
} from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { ColorPicker } from "@/components/ui/colorPicker";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExtractedProfile {
  material: string;
  colorHex: string | null;
  colorName: string | null;
  estimatedG: number;
}

interface ManualFilament {
  material: string;
  colorHex: string;
  colorName: string;
  estimatedG: string;
}

interface NewComponentModalProps {
  initialName?: string;
  // productId é opcional — se não for passado, cria componente sem adicionar à BOM
  productId?: string;
  onCreated: (bomEntry: any) => void;
  onClose: () => void;
}

const emptyFilament = (): ManualFilament => ({
  material: "",
  colorHex: "#000000",
  colorName: "",
  estimatedG: "",
});

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
  const [file, setFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: initialName,
    description: "",
    defaultMaterial: "",
    defaultColorHex: "#000000",
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
    printTimeH: "",
    printTimeM: "",
    batchSize: "1",
  });

  function toMinutes(h: string, m: string): number | null {
    const hours = Number(h) || 0;
    const mins = Number(m) || 0;
    if (hours === 0 && mins === 0) return null;
    return hours * 60 + mins;
  }

  const [manualFilaments, setManualFilaments] = useState<ManualFilament[]>([
    emptyFilament(),
  ]);

  function updateFilament(index: number, patch: Partial<ManualFilament>) {
    setManualFilaments((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    );
  }

  function addFilament() {
    setManualFilaments((prev) => [...prev, emptyFilament()]);
  }

  function removeFilament(index: number) {
    setManualFilaments((prev) => prev.filter((_, i) => i !== index));
  }

  const totalManualG = manualFilaments.reduce(
    (acc, f) => acc + (Number(f.estimatedG) || 0),
    0,
  );

  // ── Upload e extração do .3mf ─────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setExtracting(true);
    setExtractionFailed(false);
    setProfile(null);

    try {
      // 1. Obter presigned URL
      const signRes = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
          contentType: selectedFile.type || "application/octet-stream",
          fileSize: selectedFile.size,
          bucket: "models",
        }),
      });
      if (!signRes.ok) throw new Error("Falha ao gerar link de upload");
      const { url, key } = await signRes.json();

      // 2. Upload direto para o R2
      const uploadRes = await fetch(url, {
        method: "PUT",
        body: selectedFile,
        headers: {
          "Content-Type": selectedFile.type || "application/octet-stream",
        },
      });
      if (!uploadRes.ok) throw new Error("Falha no upload para o R2");

      // 3. Extrair metadados
      const res = await fetch("/api/components/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({ fileKey: key }),
      });
      const data = await res.json();

      if (!res.ok || data.source === "manual_required") {
        setExtractionFailed(true);
        toast({
          title: "Não foi possível extrair metadados",
          description: "Preenche manualmente o peso, tempo e materiais.",
        });
        setProfile({
          fileName: selectedFile.name,
          printTime: 0,
          filamentUsed: 0,
          filaments: [],
          filePath: data.filePath ?? "",
        });
        return;
      }

      if (data.source === "3mf_no_weight") {
        setExtractionFailed(true);
        const preFilled = (data.filaments ?? []).map((f: any) => ({
          material: f.material ?? "",
          colorHex: f.colorHex ?? "#000000",
          colorName: f.colorName ?? "",
          estimatedG: "",
        }));
        if (preFilled.length > 0) setManualFilaments(preFilled);
        setProfile({
          fileName: selectedFile.name,
          printTime: 0,
          filamentUsed: 0,
          filaments: data.filaments ?? [],
          filePath: data.filePath ?? "",
        });
        if (data.filaments?.[0]) {
          setForm((f) => ({
            ...f,
            defaultMaterial: data.filaments[0].material ?? f.defaultMaterial,
            defaultColorHex: data.filaments[0].colorHex ?? f.defaultColorHex,
          }));
        }
        toast({
          title: `${data.filaments?.length ?? 0} cor(es) extraída(s)`,
          description: data.message,
        });
        return;
      }

      // Extração completa
      setProfile({
        fileName: selectedFile.name,
        printTime: data.printTime ?? 0,
        filamentUsed: data.filamentUsed ?? 0,
        filaments: data.filaments ?? [],
        filePath: data.filePath ?? "",
      });

      if (data.filaments?.[0]) {
        setForm((f) => ({
          ...f,
          defaultMaterial: data.filaments[0].material ?? f.defaultMaterial,
          defaultColorHex: data.filaments[0].colorHex ?? f.defaultColorHex,
        }));
      }

      toast({ title: `Metadados extraídos de "${selectedFile.name}"` });
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
      // 1. Criar o componente
      const compRes = await fetch("/api/components", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          defaultMaterial: form.defaultMaterial || null,
          defaultColorHex: form.defaultColorHex || null,
        }),
      });
      const comp = await compRes.json();
      if (!compRes.ok) throw new Error(comp.error);

      // 2. Criar perfil de impressão (se houver ficheiro)
      if (profile) {
        const filaments: ExtractedProfile[] = extractionFailed
          ? manualFilaments
              .filter((f) => f.material.trim() && Number(f.estimatedG) > 0)
              .map((f) => ({
                material: f.material.trim(),
                colorHex: f.colorHex || null,
                colorName: f.colorName.trim() || null,
                estimatedG: Number(f.estimatedG),
              }))
          : profile.filaments;

        const profileRes = await fetch(
          `${SITE_URL}/api/components/${comp.id}/profiles`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
            },
            body: JSON.stringify({
              name: profile.fileName.replace(/\.[^.]+$/, ""),
              filePath: profile.filePath ?? "",
              batchSize: extractionFailed
                ? Number(manualProfile.batchSize) || 1
                : ((profile as any).batchSize ?? 1),
              printTime: extractionFailed
                ? toMinutes(manualProfile.printTimeH, manualProfile.printTimeM)
                : profile.printTime || null,
              filamentUsed: extractionFailed
                ? totalManualG > 0
                  ? totalManualG
                  : null
                : profile.filamentUsed || null,
              filaments,
            }),
          },
        );
        const profileData = await profileRes.json();
        if (!profileRes.ok)
          throw new Error(profileData.error ?? "Erro ao criar perfil");
      }

      // 3. Adicionar à BOM do produto — só se productId for fornecido
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
        toast({ title: `"${comp.name}" criado e adicionado à BOM` });
        onCreated(bomEntry);
      } else {
        toast({ title: `"${comp.name}" criado com sucesso` });
        onCreated(comp);
      }

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
            <Label htmlFor="comp-desc">
              Descrição{" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </Label>
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
              Ficheiro de impressão (.3mf / .gcode){" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
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
                      setManualFilaments([emptyFilament()]);
                      setManualProfile({
                        printTimeH: "",
                        printTimeM: "",
                        batchSize: "1",
                      });
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="text-muted-foreground hover:text-foreground flex-shrink-0 ml-2"
                  >
                    <X size={12} />
                  </button>
                </div>

                {!extractionFailed && profile.filamentUsed > 0 ? (
                  <div className="flex items-center gap-3 flex-wrap">
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
                  <div className="space-y-3 pt-1">
                    <p className="text-[10px] text-amber-500 flex items-center gap-1">
                      <AlertTriangle size={9} />
                      Preenche manualmente:
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Tempo de impressão
                        </Label>
                        <div className="flex items-center gap-1">
                          <div className="relative flex-1">
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={manualProfile.printTimeH}
                              onChange={(e) =>
                                setManualProfile({
                                  ...manualProfile,
                                  printTimeH: e.target.value,
                                })
                              }
                              className="h-7 text-xs pr-6"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
                              h
                            </span>
                          </div>
                          <div className="relative flex-1">
                            <Input
                              type="number"
                              min="0"
                              max="59"
                              placeholder="0"
                              value={manualProfile.printTimeM}
                              onChange={(e) =>
                                setManualProfile({
                                  ...manualProfile,
                                  printTimeM: e.target.value,
                                })
                              }
                              className="h-7 text-xs pr-6"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
                              m
                            </span>
                          </div>
                        </div>
                        {(manualProfile.printTimeH ||
                          manualProfile.printTimeM) && (
                          <p className="text-[10px] text-muted-foreground">
                            ={" "}
                            {toMinutes(
                              manualProfile.printTimeH,
                              manualProfile.printTimeM,
                            )}{" "}
                            min
                          </p>
                        )}
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
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] text-muted-foreground">
                          Filamentos{" "}
                          {totalManualG > 0 && (
                            <span className="text-foreground font-medium">
                              ({totalManualG}g total)
                            </span>
                          )}
                        </Label>
                        <button
                          type="button"
                          onClick={addFilament}
                          className="text-[10px] text-primary flex items-center gap-0.5 hover:underline"
                        >
                          <Plus size={9} />
                          Adicionar cor
                        </button>
                      </div>

                      {manualFilaments.map((fil, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-[auto_1fr_1fr_auto] gap-1.5 items-center"
                        >
                          <ColorPicker
                            value={fil.colorHex}
                            onChange={(color) =>
                              updateFilament(i, { colorHex: color })
                            }
                          />
                          <Input
                            placeholder="Material (ex: PLA)"
                            value={fil.material}
                            onChange={(e) =>
                              updateFilament(i, { material: e.target.value })
                            }
                            className="h-7 text-xs"
                          />
                          <Input
                            type="number"
                            placeholder="Gramas"
                            value={fil.estimatedG}
                            onChange={(e) =>
                              updateFilament(i, { estimatedG: e.target.value })
                            }
                            className="h-7 text-xs"
                          />
                          {manualFilaments.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => removeFilament(i)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X size={12} />
                            </button>
                          ) : (
                            <span className="w-3" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
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
            disabled={saving || extracting || !form.name.trim()}
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

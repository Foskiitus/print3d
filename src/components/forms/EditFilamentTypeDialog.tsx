"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { ColorPicker } from "@/components/ui/colorPicker";
import { numericInputProps } from "@/lib/numericInput";
import { Lock } from "lucide-react";
import { refreshAlerts } from "@/lib/refreshAlerts";
import { useIntlayer } from "next-intlayer";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type FilamentType = {
  id: string;
  brand: string;
  material: string;
  colorName: string;
  colorHex: string;
  alertThreshold: number | null;
  _count?: { spools: number };
};

export function EditFilamentTypeDialog({
  type,
  open,
  onOpenChange,
  onUpdated,
}: {
  type: FilamentType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}) {
  const c = useIntlayer("dialogs");
  const d = c.filamentType;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    brand: "",
    material: "",
    colorName: "",
    colorHex: "#3b82f6",
    alertThreshold: "",
  });

  const hasSpools = (type?._count?.spools ?? 0) > 0;

  useEffect(() => {
    if (type) {
      setForm({
        brand: type.brand,
        material: type.material,
        colorName: type.colorName,
        colorHex: type.colorHex,
        alertThreshold: type.alertThreshold?.toString() ?? "",
      });
    }
  }, [type]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!type) return;
    setLoading(true);
    try {
      const res = await fetch(`${SITE_URL}/api/filaments/types/${type.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          brand: form.brand,
          material: form.material,
          colorHex: form.colorHex,
          colorName: form.colorName,
          alertThreshold: form.alertThreshold
            ? Number(form.alertThreshold)
            : null,
        }),
      });
      if (!res.ok) throw new Error();
      toast({ title: d.editSuccess.value });
      onOpenChange(false);
      refreshAlerts();
      onUpdated();
    } catch {
      toast({
        title: c.common.error.value,
        description: d.editError.value,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{d.editTitle}</DialogTitle>
        </DialogHeader>

        {hasSpools && (
          <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/40 border border-border rounded-lg px-3 py-2">
            <Lock
              size={12}
              className="mt-0.5 flex-shrink-0 text-muted-foreground"
            />
            <span>{d.lockedWarning}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label className={hasSpools ? "text-muted-foreground" : ""}>
              {d.brand}
              {hasSpools && (
                <Lock size={11} className="inline ml-1.5 opacity-50" />
              )}
            </Label>
            <Input
              placeholder={d.brandPlaceholder.value}
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              disabled={hasSpools}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className={hasSpools ? "text-muted-foreground" : ""}>
              {d.material}
              {hasSpools && (
                <Lock size={11} className="inline ml-1.5 opacity-50" />
              )}
            </Label>
            <Input
              placeholder={d.materialPlaceholder.value}
              value={form.material}
              onChange={(e) => setForm({ ...form, material: e.target.value })}
              disabled={hasSpools}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{d.colorName}</Label>
              <Input
                placeholder={d.colorNamePlaceholder.value}
                value={form.colorName}
                onChange={(e) =>
                  setForm({ ...form, colorName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{d.colorVisual}</Label>
              <div className="flex gap-2">
                <ColorPicker
                  value={form.colorHex}
                  onChange={(color) => setForm({ ...form, colorHex: color })}
                />
                <div
                  className="flex-1 rounded-lg border flex items-center justify-center text-[10px] font-mono uppercase"
                  style={{
                    backgroundColor: form.colorHex,
                    boxShadow: `0 0 10px ${form.colorHex}`,
                    color: "#fff",
                    textShadow: "0 0 2px #000",
                  }}
                >
                  {form.colorHex}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              {d.alertThreshold}{" "}
              <span className="text-muted-foreground font-normal">
                ({c.common.optional})
              </span>
            </Label>
            <Input
              type="number"
              min="0"
              placeholder={d.alertThresholdPlaceholder.value}
              value={form.alertThreshold}
              onChange={(e) =>
                setForm({ ...form, alertThreshold: e.target.value })
              }
              {...numericInputProps()}
            />
            <p className="text-[10px] text-muted-foreground">
              {d.alertThresholdEditSub}
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {c.common.cancel}
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? c.common.saving : d.editSubmit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

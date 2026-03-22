"use client";

import { useState } from "react";
import { useIntlayer } from "next-intlayer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Monitor, Zap, Euro, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { NewPrinterDialog } from "@/components/forms/NewPrinterDialog";
import { NewPresetDialog } from "@/components/forms/NewPresetDialog";
import { toast } from "@/components/ui/toaster";

export function PrintersClient({
  initialPrinters,
  presets,
  isAdmin,
}: {
  initialPrinters: any[];
  presets: any[];
  isAdmin: boolean;
}) {
  const c = useIntlayer("printers");
  const [printers, setPrinters] = useState(initialPrinters);
  const [allPresets, setAllPresets] = useState(presets);

  const refreshPrinters = async () => {
    const res = await fetch("/api/printers");
    if (res.ok) setPrinters(await res.json());
  };

  const refreshPresets = async () => {
    const res = await fetch("/api/printers/presets");
    if (res.ok) setAllPresets(await res.json());
  };

  const handleDeletePrinter = async (id: string) => {
    if (!confirm(c.toast.confirmDeletePrinter.value)) return;
    try {
      const res = await fetch(`/api/printers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: c.toast.printerDeleted.value });
      refreshPrinters();
    } catch (error: any) {
      toast({
        title: c.toast.error.value,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeletePreset = async (id: string) => {
    if (!confirm(c.toast.confirmDeletePreset.value)) return;
    try {
      const res = await fetch(`/api/printers/presets/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: c.toast.presetDeleted.value });
      refreshPresets();
    } catch (error: any) {
      toast({
        title: c.toast.error.value,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-10">
      {/* ── Global presets (admin) ── */}
      {isAdmin && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-primary" />
              <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {c.presets.heading.value}
              </h2>
              <Badge
                variant="outline"
                className="text-[10px] text-primary border-primary/30"
              >
                {c.presets.adminBadge.value}
              </Badge>
            </div>
            <NewPresetDialog onCreated={refreshPresets} />
          </div>

          {allPresets.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 border border-dashed rounded-lg">
              {c.presets.empty.value}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPresets.map((preset) => (
                <Card
                  key={preset.id}
                  className="relative group border-primary/20 bg-primary/5 hover:border-primary/40 transition-colors"
                >
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                          <Monitor className="text-primary" size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">
                            {preset.name}
                          </h3>
                          <p className="text-[10px] text-primary/60 mt-0.5">
                            {c.presets.globalPreset.value}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-opacity h-8 w-8"
                        onClick={() => handleDeletePreset(preset.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-primary/10">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-md bg-warning/10 flex items-center justify-center">
                          <Zap size={11} className="text-warning" />
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {preset.powerWatts}W
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-md bg-success/10 flex items-center justify-center">
                          <Euro size={11} className="text-success" />
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {formatCurrency(preset.hourlyCost)}/h
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── My machines ── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {c.myMachines.heading.value}
          </h2>
          <NewPrinterDialog presets={allPresets} onCreated={refreshPrinters} />
        </div>

        {printers.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-12 border border-dashed rounded-lg">
            {c.myMachines.empty.value}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {printers.map((printer) => (
              <Card
                key={printer.id}
                className="relative group hover:border-primary/50 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Monitor className="text-primary" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground">
                          {printer.name}
                        </h3>
                        {printer.preset && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <ShieldCheck size={9} className="text-primary" />
                            {printer.preset.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-opacity"
                      onClick={() => handleDeletePrinter(printer.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
                        <Zap size={13} className="text-warning" />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {printer.powerWatts}W
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
                        <Euro size={13} className="text-success" />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(printer.hourlyCost)}/h
                      </span>
                    </div>
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

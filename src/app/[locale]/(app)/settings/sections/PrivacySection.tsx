"use client";

import { useState } from "react";
import { useIntlayer } from "next-intlayer";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Shield } from "lucide-react";
import { toast } from "@/components/ui/toaster";

export function PrivacySection({ userId }: { userId: string }) {
  const c = useIntlayer("settings");
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/settings/export", {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
        },
      });
      if (!res.ok) throw new Error("Falha ao exportar");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `spooliq-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({
        title: c.toast.error.value,
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-foreground">
        {c.privacy.heading.value}
      </h2>

      {/* Exportar dados */}
      <div className="rounded-xl border border-border p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Download size={15} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {c.privacy.exportTitle.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {c.privacy.exportDesc.value}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          disabled={exporting}
          className="gap-2"
        >
          <Download size={13} />
          {exporting ? c.privacy.exporting.value : c.privacy.exportButton.value}
        </Button>
      </div>

      {/* Links legais */}
      <div className="rounded-xl border border-border p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Shield size={15} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {c.privacy.linksTitle.value}
          </p>
        </div>
        <div className="flex flex-col gap-2 pl-12">
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink size={12} />
            {c.privacy.privacy.value}
          </a>
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink size={12} />
            {c.privacy.terms.value}
          </a>
        </div>
      </div>
    </div>
  );
}

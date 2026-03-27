"use client";

// src/app/scan/printer/[qrCodeId]/page.tsx
//
// Página pública acedida quando o utilizador lê o QR Code da impressora.
// O QR Code codifica:  <SITE_URL>/scan/printer/<qrCodeId>
//
// Fluxo:
//   1. Lê o qrCodeId da URL
//   2. Chama GET /api/printers/by-qr/[qrCodeId]  →  { printerId }
//   3. Redireciona para /printers/[printerId]
//
// Se a impressora não for encontrada mostra um ecrã de erro simples.
// Não requer autenticação aqui — o dashboard da impressora já a exige.

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Monitor, Loader2, AlertTriangle } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export default function ScanPrinterPage() {
  const { qrCodeId } = useParams<{ qrCodeId: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!qrCodeId) return;

    async function resolve() {
      try {
        const res = await fetch(
          `${SITE_URL}/api/printers/by-qr/${encodeURIComponent(qrCodeId)}`,
          {
            headers: {
              "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
            },
          },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Impressora não encontrada.");
          return;
        }
        const { printerId } = await res.json();
        // Redirect to the printer dashboard — Next.js locale prefix is
        // handled by the middleware so we use the root-relative path.
        router.replace(`/printers/${printerId}`);
      } catch {
        setError("Erro de rede. Verifica a tua ligação e tenta novamente.");
      }
    }

    resolve();
  }, [qrCodeId, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <div className="p-4 bg-destructive/10 rounded-full">
            <AlertTriangle size={32} className="text-destructive" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">
            Impressora não encontrada
          </h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
            {qrCodeId}
          </p>
          <button
            onClick={() => router.push("/printers")}
            className="text-sm text-primary hover:underline"
          >
            ← Ir para as impressoras
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="p-4 bg-primary/10 rounded-full">
          <Monitor size={32} className="text-primary" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={14} className="animate-spin" />A abrir impressora…
        </div>
        <p className="text-xs font-mono text-muted-foreground">{qrCodeId}</p>
      </div>
    </div>
  );
}

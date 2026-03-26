// src/hooks/useQrScanner.ts
//
// Hook que abstrai a leitura de QR Code via câmara.
//
// Estratégia de performance:
//   1. Tenta usar window.BarcodeDetector (API nativa — zero bundle cost)
//   2. Se não disponível, faz dynamic import() de html5-qrcode apenas nesse momento
//
// Extração do ID:
//   QR Codes no formato: https://spooliq.rlopes.pt/en/spool/SPL-XXXXXX
//   Extrai a última parte do URL (starts with "SPL-")
//   Se o QR contiver apenas o ID directamente (SPL-XXXXXX), também funciona.

"use client";

import { useRef, useCallback, useState } from "react";

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type ScannerStatus =
  | "idle"
  | "requesting" // a pedir permissão da câmara
  | "scanning" // câmara activa, à espera de leitura
  | "success" // leitura bem-sucedida
  | "error"; // erro de câmara ou permissão negada

export interface UseQrScannerOptions {
  /** Chamado com o ID extraído (ex: "SPL-BXFJMW") quando o scan é bem-sucedido */
  onScan: (spoolId: string, rawText: string) => void;
  /** Chamado se o QR não contiver um ID SPL- válido */
  onInvalidCode?: (rawText: string) => void;
  /** ID do elemento de vídeo onde renderizar o stream (criado pelo hook) */
  videoElementId?: string;
}

export function useQrScanner({
  onScan,
  onInvalidCode,
  videoElementId = "qr-scanner-video",
}: UseQrScannerOptions) {
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const html5ScannerRef = useRef<any | null>(null); // html5-qrcode instance

  // ── Extrai o ID do QR ────────────────────────────────────────────────────
  function extractSpoolId(raw: string): string | null {
    const trimmed = raw.trim();
    // Formato URL: .../spool/SPL-XXXXXX (pega na última parte)
    const fromUrl = trimmed.split("/").pop() ?? "";
    if (fromUrl.toUpperCase().startsWith("SPL-")) return fromUrl.toUpperCase();
    // Formato directo: SPL-XXXXXX
    if (trimmed.toUpperCase().startsWith("SPL-")) return trimmed.toUpperCase();
    // Formato parcial (últimos caracteres sem o prefixo) — tenta reconstruir
    const partial = trimmed.toUpperCase();
    if (/^[A-Z0-9]{4,8}$/.test(partial)) return `SPL-${partial}`;
    return null;
  }

  // ── Feedback háptico / sonoro ────────────────────────────────────────────
  function triggerFeedback(type: "success" | "error") {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(type === "success" ? [50, 30, 50] : [100]);
    }
    // Tom sintético leve via Web Audio API
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = type === "success" ? 880 : 300;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // AudioContext não disponível — ignorar
    }
  }

  function handleResult(rawText: string) {
    const spoolId = extractSpoolId(rawText);
    if (spoolId) {
      triggerFeedback("success");
      setStatus("success");
      stopScanner();
      onScan(spoolId, rawText);
    } else {
      triggerFeedback("error");
      onInvalidCode?.(rawText);
    }
  }

  // ── Paragem do scanner ───────────────────────────────────────────────────
  const stopScanner = useCallback(() => {
    // Parar stream nativo
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    // Parar html5-qrcode se estava activo
    if (html5ScannerRef.current) {
      try {
        html5ScannerRef.current.stop().catch(() => {});
      } catch {}
      html5ScannerRef.current = null;
    }
    setStatus("idle");
  }, []);

  // ── BarcodeDetector nativo ───────────────────────────────────────────────
  async function startNativeScanner(videoEl: HTMLVideoElement) {
    // @ts-ignore — BarcodeDetector não tem tipos no TypeScript standard lib
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

    async function tick() {
      if (!streamRef.current) return;
      try {
        const barcodes = await detector.detect(videoEl);
        if (barcodes.length > 0) {
          handleResult(barcodes[0].rawValue);
          return; // para o loop ao encontrar
        }
      } catch {
        // frame não processável — continuar
      }
      animFrameRef.current = requestAnimationFrame(tick);
    }
    animFrameRef.current = requestAnimationFrame(tick);
  }

  // ── html5-qrcode fallback ────────────────────────────────────────────────
  async function startHtml5Scanner() {
    // Dynamic import — só carrega se BarcodeDetector não disponível
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode(videoElementId);
    html5ScannerRef.current = scanner;

    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (decodedText: string) => {
        handleResult(decodedText);
      },
      () => {
        // frame sem leitura — normal, ignorar
      },
    );
  }

  // ── Início do scanner ────────────────────────────────────────────────────
  const startScanner = useCallback(
    async (videoEl?: HTMLVideoElement | null) => {
      setStatus("requesting");
      setErrorMsg(null);

      try {
        // Verificar suporte de câmara
        if (
          typeof navigator === "undefined" ||
          !navigator.mediaDevices?.getUserMedia
        ) {
          throw new Error(
            "Câmara não disponível neste browser. Usa HTTPS ou localhost.",
          );
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // câmara traseira preferida
        });
        streamRef.current = stream;
        setStatus("scanning");

        // Caminho 1: BarcodeDetector nativo
        if ("BarcodeDetector" in window && videoEl) {
          videoEl.srcObject = stream;
          await videoEl.play();
          await startNativeScanner(videoEl);
          return;
        }

        // Caminho 2: html5-qrcode (fallback dinâmico)
        // Parar o stream nativo — html5-qrcode gere o seu próprio
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        await startHtml5Scanner();
      } catch (err: any) {
        setStatus("error");
        const msg =
          err.name === "NotAllowedError"
            ? "Permissão da câmara negada. Permite o acesso nas definições do browser."
            : err.name === "NotFoundError"
              ? "Nenhuma câmara encontrada neste dispositivo."
              : (err.message ?? "Erro desconhecido ao aceder à câmara.");
        setErrorMsg(msg);
        stopScanner();
      }
    },
    [stopScanner],
  );

  return { status, errorMsg, startScanner, stopScanner };
}

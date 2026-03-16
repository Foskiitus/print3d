"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Dado um R2 object key, obtém uma URL assinada fresca via /api/signed-url.
 * Renova automaticamente antes de expirar (a cada 5 dias).
 */
export function useSignedUrl(
  key: string | null | undefined,
  bucket: string = "images",
) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const RENEW_AFTER_MS = 5 * 24 * 60 * 60 * 1000; // renovar ao fim de 5 dias

  const fetchUrl = useCallback(async () => {
    if (!key || key.startsWith("http")) return;
    setLoading(true);
    try {
      const r = await fetch(
        `/api/signed-url?key=${encodeURIComponent(key)}&bucket=${bucket}`,
      );
      const data = await r.json();
      if (data.url) {
        setSignedUrl(data.url);
        // Agendar renovação antes da expiração (6 dias → renovar ao fim de 5)
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(fetchUrl, RENEW_AFTER_MS);
      }
    } catch {
      setSignedUrl(null);
    } finally {
      setLoading(false);
    }
  }, [key, bucket]);

  useEffect(() => {
    if (!key) {
      setSignedUrl(null);
      return;
    }

    // URLs legadas (Supabase/Vercel) — usar diretamente sem renovação
    if (key.startsWith("http")) {
      setSignedUrl(key);
      return;
    }

    fetchUrl();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [key, bucket, fetchUrl]);

  return { signedUrl, loading };
}

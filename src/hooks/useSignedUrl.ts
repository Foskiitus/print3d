"use client";

import { useState, useEffect } from "react";

/**
 * Dado um R2 object key, obtém uma URL assinada fresca via /api/signed-url.
 * As URLs assinadas do R2 expiram em 6 dias — este hook gere isso automaticamente.
 */
export function useSignedUrl(
  key: string | null | undefined,
  bucket: string = "images",
) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!key) {
      setSignedUrl(null);
      return;
    }

    // Se for uma URL completa (legado Supabase/Vercel), usa diretamente
    if (key.startsWith("http")) {
      setSignedUrl(key);
      return;
    }

    setLoading(true);
    fetch(`/api/signed-url?key=${encodeURIComponent(key)}&bucket=${bucket}`)
      .then((r) => r.json())
      .then((data) => setSignedUrl(data.url ?? null))
      .catch(() => setSignedUrl(null))
      .finally(() => setLoading(false));
  }, [key, bucket]);

  return { signedUrl, loading };
}

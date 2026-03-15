"use client";

import { useState, useEffect } from "react";

/**
 * Hook que converte um URL privado do Vercel Blob num URL assinado
 * utilizável no browser (imagens, downloads, etc.)
 */
export function useSignedUrl(blobUrl: string | null | undefined) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!blobUrl) {
      setSignedUrl(null);
      return;
    }

    setLoading(true);
    fetch(`/api/blob-url?url=${encodeURIComponent(blobUrl)}`)
      .then((r) => r.json())
      .then((data) => setSignedUrl(data.signedUrl ?? null))
      .catch(() => setSignedUrl(null))
      .finally(() => setLoading(false));
  }, [blobUrl]);

  return { signedUrl, loading };
}

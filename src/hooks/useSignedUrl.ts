"use client";

import { useMemo } from "react";

/**
 * Converte um URL privado do Vercel Blob num URL proxy
 * que passa pelo servidor Next.js para servir o ficheiro.
 *
 * Não precisa de fetch — o URL proxy é calculado imediatamente.
 * O servidor faz a autenticação e serve o conteúdo.
 */
export function useSignedUrl(blobUrl: string | null | undefined) {
  const signedUrl = useMemo(() => {
    if (!blobUrl) return null;
    return `/api/blob-url?url=${encodeURIComponent(blobUrl)}`;
  }, [blobUrl]);

  return { signedUrl, loading: false };
}

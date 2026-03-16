"use client";

import { useSignedUrl } from "@/hooks/useSignedUrl";
import { Package } from "lucide-react";

interface StorageImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Componente de imagem que gera automaticamente URLs assinados
 * para ficheiros privados no Cloudflare R2.
 */
export function StorageImage({
  src,
  alt,
  className,
  fallback,
}: StorageImageProps) {
  const { signedUrl, loading } = useSignedUrl(src);

  if (!src) {
    return <>{fallback ?? null}</>;
  }

  if (loading || !signedUrl) {
    return <div className={`bg-muted animate-pulse ${className ?? ""}`} />;
  }

  return <img src={signedUrl} alt={alt} className={className} />;
}

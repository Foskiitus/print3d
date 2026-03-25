"use client";

import { useState, useEffect } from "react";

const DEFAULT_LIMIT_MB = 100;

/**
 * Lê o limite de upload configurado nas definições do utilizador.
 * Enquanto carrega, usa o valor padrão de 100 MB.
 */
export function useUploadLimit() {
  const [limitMb, setLimitMb] = useState(DEFAULT_LIMIT_MB);

  useEffect(() => {
    fetch("/api/settings?key=uploadLimitMb", {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_MY_API_SECRET_KEY || "",
      },
    })
      .then((r) => r.json())
      .then((data) => {
        const value = Number(data.value);
        if (!isNaN(value) && value > 0) setLimitMb(value);
      })
      .catch(() => {});
  }, []);

  return {
    limitMb,
    limitBytes: limitMb * 1024 * 1024,
  };
}

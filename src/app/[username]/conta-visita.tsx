"use client";

import { useEffect, useRef } from "react";

/**
 * Conta a visita depois que a página abriu num navegador de verdade. Robôs que
 * só leem o HTML (prévias de link em redes sociais) não rodam isto.
 */
export function ContaVisita({ perfil }: { perfil: string }) {
  const enviado = useRef(false);
  useEffect(() => {
    if (enviado.current) return;
    enviado.current = true;
    const corpo = JSON.stringify({ p: perfil, r: document.referrer || null });
    if (!navigator.sendBeacon?.("/api/e", new Blob([corpo], { type: "application/json" }))) {
      fetch("/api/e", { method: "POST", body: corpo, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
    }
  }, [perfil]);
  return null;
}

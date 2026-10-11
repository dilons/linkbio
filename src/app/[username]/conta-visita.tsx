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
    // veio pelo QR code (S19): conta a origem e tira o ?origem=qr do endereço,
    // para ele não ir junto quando a pessoa compartilhar o link
    const url = new URL(location.href);
    const qr = url.searchParams.get("origem") === "qr";
    if (qr) {
      url.searchParams.delete("origem");
      history.replaceState(history.state, "", url.pathname + url.search + url.hash);
    }
    const corpo = JSON.stringify({ p: perfil, r: document.referrer || null, ...(qr ? { o: "qr" } : {}) });
    if (!navigator.sendBeacon?.("/api/e", new Blob([corpo], { type: "application/json" }))) {
      fetch("/api/e", { method: "POST", body: corpo, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
    }
  }, [perfil]);
  return null;
}

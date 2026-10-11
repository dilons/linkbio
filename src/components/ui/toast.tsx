"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Aviso = { id: number; texto: string; tipo: "sucesso" | "erro" };
const Contexto = createContext<(texto: string, tipo?: Aviso["tipo"]) => void>(() => {});

/** Avisos curtos ("Link salvo"). Lidos por leitor de tela pela região aria-live. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const mostrar = useCallback((texto: string, tipo: Aviso["tipo"] = "sucesso") => {
    const id = Date.now() + Math.random();
    setAvisos((a) => [...a, { id, texto, tipo }]);
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <Contexto.Provider value={mostrar}>
      {children}
      <div aria-live="polite" role="status" className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
        {avisos.map((a) => (
          <div
            key={a.id}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-3 text-sm font-medium shadow-pop",
              a.tipo === "sucesso" ? "bg-fg text-bg" : "bg-danger text-on-danger",
            )}
          >
            {a.tipo === "sucesso" ? (
              <CheckCircle2 aria-hidden className="size-4" />
            ) : (
              <AlertTriangle aria-hidden className="size-4" />
            )}
            {a.texto}
          </div>
        ))}
      </div>
    </Contexto.Provider>
  );
}

export function useToast() {
  return useContext(Contexto);
}

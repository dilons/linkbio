import type { Metadata } from "next";
import { Vitrine } from "./vitrine";

export const metadata: Metadata = {
  title: "Design system · linkbio",
  robots: { index: false },
};

// Página interna: todos os componentes, em todos os estados, isolados.
// É a checagem do design system antes de qualquer tela (/replica-design, passo 4).
export default function DesignPage() {
  return <Vitrine />;
}

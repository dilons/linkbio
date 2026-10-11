import type { Metadata } from "next";
import { ConfirmeSeuEmail } from "../formularios";

export const metadata: Metadata = { title: "Confirme seu email" };

// S02, para quem volta depois: o email não vai na URL, então a pessoa digita
// de novo para receber outro link.
export default function Confirmar() {
  return <ConfirmeSeuEmail />;
}

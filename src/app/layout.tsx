import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { MARCA } from "@/lib/marca";

// Inter (SIL OFL), servida pelo próprio app: nenhum pedido a CDN de terceiros.
// O subconjunto latin já cobre os acentos do português (ã, ç, é, õ...).
const inter = localFont({
  src: "./fonts/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: MARCA.nome, template: `%s · ${MARCA.nome}` },
  description: "Seus links, seu WhatsApp e seus contatos numa página só, para pôr na bio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

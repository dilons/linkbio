"use client";

import { BarChart3, CircleUser, Link2, Palette, Settings, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const ITENS = [
  { href: "/admin", rotulo: "Links", Icone: Link2 },
  { href: "/admin/aparencia", rotulo: "Aparência", Icone: Palette },
  { href: "/admin/insights", rotulo: "Insights", Icone: BarChart3 },
  { href: "/admin/audiencia", rotulo: "Audiência", Icone: Users },
  { href: "/admin/configuracoes", rotulo: "Configurações", Icone: Settings },
  { href: "/admin/conta", rotulo: "Conta", Icone: CircleUser },
  { href: "/admin/plano", rotulo: "Plano", Icone: Sparkles },
];

/** Menu do painel: lateral no computador, fileira rolável no celular. */
export function NavAdmin() {
  const atual = usePathname();
  return (
    <nav aria-label="Painel">
      <ul className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible md:px-3 md:pb-0">
        {ITENS.map(({ href, rotulo, Icone }) => {
          const ativo = href === "/admin" ? atual === href : atual.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                  ativo ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface hover:text-fg",
                )}
              >
                <Icone aria-hidden className="size-4" />
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

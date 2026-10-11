import { LogOut } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { fazerLogout } from "@/app/acoes";
import { ToastProvider } from "@/components/ui/toast";
import { NavAdmin } from "./nav";

export default function LayoutAdmin({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex flex-1 flex-col md:flex-row">
        <aside
          className="flex w-full shrink-0 flex-col border-b border-border bg-bg md:min-h-screen md:w-[var(--layout-admin-sidebar)] md:border-r md:border-b-0"
        >
          <div className="flex items-center justify-between px-4" style={{ height: "var(--layout-admin-header)" }}>
            <Link href="/admin" className="text-lg font-bold text-fg">
              linkbio
            </Link>
            <form action={fazerLogout} className="md:hidden">
              <button type="submit" className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted hover:bg-surface">
                <LogOut aria-hidden className="size-4" />
                Sair
              </button>
            </form>
          </div>
          <NavAdmin />
          <form action={fazerLogout} className="mt-auto hidden p-3 md:block">
            <button type="submit" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted hover:bg-surface hover:text-fg">
              <LogOut aria-hidden className="size-4" />
              Sair
            </button>
          </form>
        </aside>
        <main className="min-w-0 flex-1 bg-surface px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </ToastProvider>
  );
}

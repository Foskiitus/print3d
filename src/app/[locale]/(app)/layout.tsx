import { Sidebar } from "@/components/layout/Sidebar";
import { AlertsHeader } from "@/components/layout/AlertsHeader";
import { MobileMenuButton } from "@/components/layout/MobileMenuButton";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar — altura total, do topo ao fundo ── */}
      <Sidebar />

      {/* ── Área direita: header + conteúdo ── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center gap-2 px-4 md:px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm h-14 flex-shrink-0">
          <MobileMenuButton />
          <div className="flex-1" />
          <AlertsHeader />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

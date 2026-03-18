import { Sidebar } from "@/components/layout/Sidebar";
import { AlertsHeader } from "@/components/layout/AlertsHeader";
import { MobileMenuButton } from "@/components/layout/MobileMenuButton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* ── Header — fixo no topo, sempre visível ── */}
      <header className="fixed top-0 left-0 right-0 z-20 flex items-center gap-2 px-4 md:px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm h-14">
        <MobileMenuButton />
        <div className="flex-1" />
        <AlertsHeader />
      </header>

      {/* ── Conteúdo abaixo do header ── */}
      <div className="flex flex-1 overflow-hidden pt-14">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

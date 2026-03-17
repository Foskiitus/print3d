import { Sidebar } from "@/components/layout/Sidebar";
import { AlertsHeader } from "@/components/layout/AlertsHeader";
import { MobileMenuButton } from "@/components/layout/MobileMenuButton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-10 flex items-center gap-2 px-4 md:px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
          {/* Botão hamburger — só visível em mobile, dentro do header */}
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

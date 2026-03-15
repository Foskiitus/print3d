import { Sidebar } from "@/components/layout/Sidebar";
import { AlertsHeader } from "@/components/layout/AlertsHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header com alertas */}
        <header className="flex items-center justify-end gap-2 px-6 py-3 border-b border-border bg-card/50 flex-shrink-0">
          <AlertsHeader />
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

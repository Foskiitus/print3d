import { Sidebar } from "@/components/layout/Sidebar";
import { AlertsHeader } from "@/components/layout/AlertsHeader";

// ─── App shell layout (authenticated area) ───────────────────────────────────
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header — sticky so it stays visible while content scrolls */}
        <header className="sticky top-0 z-10 flex items-center justify-end gap-2 px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
          <AlertsHeader />
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

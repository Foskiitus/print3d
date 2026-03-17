"use client";

import { Menu, X } from "lucide-react";
import { useSidebar } from "@/components/layout/SidebarContext";

export function MobileMenuButton() {
  const { open, setOpen } = useSidebar();

  return (
    <button
      className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
      onClick={() => setOpen(!open)}
      aria-label="Toggle menu"
    >
      {open ? <X size={18} /> : <Menu size={18} />}
    </button>
  );
}

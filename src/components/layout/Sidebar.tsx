"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Factory,
  Menu,
  X,
  Layers,
  LogOut,
  Users,
  Droplets,
  Settings,
  Printer,
} from "lucide-react";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Inventário", icon: Package, href: "/inventory" },
  { label: "Filamentos", icon: Droplets, href: "/filaments" },
  { label: "Produção", icon: Factory, href: "/production" },
  { label: "Vendas", icon: ShoppingCart, href: "/sales-ledger" },
  { label: "Impressoras", icon: Printer, href: "/printers" },
  { label: "Configurações", icon: Settings, href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-card border border-border"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-40 w-56 flex flex-col bg-card border-r border-border transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Layers size={16} className="text-primary" />
          </div>
          <span className="font-semibold text-sm text-foreground tracking-wide">
            Print3D
          </span>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all",
                  active
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}

          {role === "admin" && (
            <Link
              href="/users"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all",
                pathname.startsWith("/users")
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              <Users size={16} />
              Utilizadores
            </Link>
          )}
        </nav>

        <div className="px-4 py-4 border-t border-border space-y-3">
          {session?.user && (
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-foreground truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session.user.email}
              </p>
              <span
                className={cn(
                  "inline-block text-xs px-1.5 py-0.5 rounded font-medium mt-1",
                  role === "admin"
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {role === "admin" ? "Admin" : "Viewer"}
              </span>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <LogOut size={13} />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}

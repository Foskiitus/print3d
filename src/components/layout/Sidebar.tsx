"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Factory,
  LogOut,
  Users,
  Droplets,
  Settings,
  Printer,
  FileDown,
  AlertTriangle,
  Boxes,
} from "lucide-react";
import { useSidebar } from "@/components/layout/SidebarContext";
import { useClerk, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: null,
    items: [{ label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" }],
  },
  {
    label: "Gestão",
    items: [
      { label: "Filamentos", icon: Droplets, href: "/filaments" },
      { label: "Produtos", icon: Package, href: "/products" },
      { label: "Stock", icon: Boxes, href: "/stock" },
      { label: "Produção", icon: Factory, href: "/production" },
      { label: "Vendas", icon: ShoppingCart, href: "/sales-ledger" },
      { label: "Impressoras", icon: Printer, href: "/printers" },
    ],
  },
  {
    label: "Outros",
    items: [
      { label: "Clientes", icon: Users, href: "/customers" },
      { label: "Exportação", icon: FileDown, href: "/export" },
      { label: "Alertas", icon: AlertTriangle, href: "/alerts" },
    ],
  },
];

const adminItems = [
  { label: "Utilizadores", icon: Users, href: "/users" },
  { label: "Configurações", icon: Settings, href: "/settings" },
];

function SpoolIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" />
      <circle
        cx="16"
        cy="16"
        r="5.5"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="16" cy="16" r="2.5" fill="currentColor" />
      <line
        x1="16"
        y1="10.5"
        x2="16"
        y2="2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="21.2"
        y1="13"
        x2="26.4"
        y2="6.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="21.2"
        y1="19"
        x2="26.4"
        y2="25.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="21.5"
        x2="16"
        y2="30"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="10.8"
        y1="19"
        x2="5.6"
        y2="25.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="10.8"
        y1="13"
        x2="5.6"
        y2="6.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 16 2 A 14 14 0 0 1 30 16"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
        active
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-accent",
      )}
    >
      <Icon
        size={15}
        className={cn(active ? "text-primary" : "text-muted-foreground")}
      />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { open, setOpen } = useSidebar();
  const { user } = useUser();
  const { signOut } = useClerk();
  const role = user?.publicMetadata?.role as string | undefined;
  const isAdmin = role === "admin" || role === "superadmin";
  const close = () => setOpen(false);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-40 w-56 flex flex-col bg-card border-r border-border transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary flex-shrink-0">
            <SpoolIcon className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-base tracking-tight text-foreground">
            Spool<span className="text-primary">IQ</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
          {navGroups.map((group) => (
            <div key={group.label ?? "main"}>
              {group.label && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon }) => (
                  <NavLink
                    key={href}
                    href={href}
                    label={label}
                    icon={icon}
                    active={pathname.startsWith(href)}
                    onClick={close}
                  />
                ))}
              </div>
            </div>
          ))}

          {!isAdmin && (
            <div className="space-y-0.5">
              <NavLink
                href="/settings"
                label="Configurações"
                icon={Settings}
                active={pathname.startsWith("/settings")}
                onClick={close}
              />
            </div>
          )}

          {isAdmin && (
            <div>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                Administração
              </p>
              <div className="space-y-0.5">
                {adminItems.map(({ href, label, icon }) => (
                  <NavLink
                    key={href}
                    href={href}
                    label={label}
                    icon={icon}
                    active={pathname.startsWith(href)}
                    onClick={close}
                  />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* User / logout */}
        <div className="px-4 py-4 border-t border-border space-y-3">
          {user && (
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.emailAddresses[0]?.emailAddress}
              </p>
              <span
                className={cn(
                  "inline-block text-xs px-1.5 py-0.5 rounded-md font-medium mt-1",
                  isAdmin
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {isAdmin ? "Admin" : "Viewer"}
              </span>
            </div>
          )}
          <button
            onClick={() => signOut({ redirectUrl: "/sign-in" })}
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

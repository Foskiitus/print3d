"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  CreditCard,
  Layers,
} from "lucide-react";
import { useSidebar } from "@/components/layout/SidebarContext";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useIntlayer } from "next-intlayer";
import { cn } from "@/lib/utils";

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
  const router = useRouter();
  const { open, setOpen } = useSidebar();
  const [role, setRole] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const supabase = createClient();
  const c = useIntlayer("sidebar");

  // Extrai o locale do pathname: /pt/dashboard → "pt"
  const locale = pathname.split("/")[1] ?? "pt";

  // Helper: prefixo de locale nos links
  const l = (path: string) => `/${locale}${path}`;

  const navGroups = [
    {
      label: null,
      items: [
        {
          label: c.nav.dashboard.value,
          icon: LayoutDashboard,
          href: "/dashboard",
        },
      ],
    },
    {
      label: c.groups.management.value,
      items: [
        { label: c.nav.filaments.value, icon: Droplets, href: "/filaments" },
        { label: c.nav.products.value, icon: Package, href: "/products" },
        { label: c.nav.components.value, icon: Layers, href: "/components" },
        { label: c.nav.stock.value, icon: Boxes, href: "/stock" },
        { label: c.nav.production.value, icon: Factory, href: "/production" },
        { label: c.nav.sales.value, icon: ShoppingCart, href: "/sales-ledger" },
        { label: c.nav.printers.value, icon: Printer, href: "/printers" },
      ],
    },
    {
      label: c.groups.others.value,
      items: [
        { label: c.nav.customers.value, icon: Users, href: "/customers" },
        { label: c.nav.export.value, icon: FileDown, href: "/export" },
        { label: c.nav.alerts.value, icon: AlertTriangle, href: "/alerts" },
      ],
    },
  ];

  const adminItems = [
    { label: c.nav.users.value, icon: Users, href: "/users" },
    { label: c.nav.settings.value, icon: Settings, href: "/settings" },
  ];

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const name =
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email?.split("@")[0] ??
        "";
      setUserInfo({ name, email: user.email ?? "" });
    });

    fetch("/api/auth/role")
      .then((r) => r.json())
      .then((d) => setRole(d.role ?? "user"))
      .catch(() => setRole("user"));
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(`/${locale}/sign-in`);
    router.refresh();
  };

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
          "fixed md:relative inset-y-0 left-0 z-40",
          "w-56 flex-shrink-0 flex flex-col h-full",
          "bg-card border-r border-border transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
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
                    href={l(href)}
                    label={label}
                    icon={icon}
                    active={pathname.startsWith(`/${locale}${href}`)}
                    onClick={close}
                  />
                ))}
              </div>
            </div>
          ))}

          {!isAdmin && (
            <div className="space-y-0.5">
              <NavLink
                href={l("/settings")}
                label={c.nav.settings.value}
                icon={Settings}
                active={pathname.startsWith(`/${locale}/settings`)}
                onClick={close}
              />
              {/* <NavLink
                href={l("/billing")}
                label={c.nav.billing.value}
                icon={CreditCard}
                active={pathname.startsWith(`/${locale}/billing`)}
                onClick={close}
              /> */}
            </div>
          )}

          {isAdmin && (
            <div>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {c.groups.admin.value}
              </p>
              <div className="space-y-0.5">
                {adminItems.map(({ href, label, icon }) => (
                  <NavLink
                    key={href}
                    href={l(href)}
                    label={label}
                    icon={icon}
                    active={pathname.startsWith(`/${locale}${href}`)}
                    onClick={close}
                  />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* User / logout */}
        <div className="px-4 py-4 border-t border-border space-y-3">
          {userInfo && (
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground truncate">
                {userInfo.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {userInfo.email}
              </p>
              <span
                className={cn(
                  "inline-block text-xs px-1.5 py-0.5 rounded-md font-medium mt-1",
                  isAdmin
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {isAdmin ? c.roles.admin.value : c.roles.viewer.value}
              </span>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <LogOut size={13} />
            {c.signOut.value}
          </button>
        </div>
      </aside>
    </>
  );
}

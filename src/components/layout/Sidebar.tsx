"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Factory,
  LogOut,
  Users,
  Printer,
  Warehouse,
  BookOpen,
  Layers,
  UserCircle,
  Shield,
} from "lucide-react";
import { useSidebar } from "@/components/layout/SidebarContext";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useIntlayer } from "next-intlayer";
import { cn } from "@/lib/utils";
import UserAvatar from "../ui/userAvatar";

// ─── Spool Icon ───────────────────────────────────────────────────────────────

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

// ─── NavLink ──────────────────────────────────────────────────────────────────

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
  indent = false,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
  indent?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 py-2 rounded-lg text-sm transition-all duration-150",
        indent ? "px-3 pl-8" : "px-3",
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

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { open, setOpen } = useSidebar();
  const [role, setRole] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>("hobby");
  const [userInfo, setUserInfo] = useState<{
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null>(null);
  const supabase = createClient();
  const c = useIntlayer("sidebar");

  const locale = pathname.split("/")[1] ?? "pt";
  const l = (path: string) => `/${locale}${path}`;
  const close = () => setOpen(false);
  const isActive = (href: string) => pathname.startsWith(`/${locale}${href}`);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const name =
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email?.split("@")[0] ??
        "";

      // Google OAuth guarda o avatar em avatar_url ou picture
      const avatarUrl =
        user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null;
      setUserInfo({ name, email: user.email ?? "", avatarUrl });
    });

    fetch("/api/auth/role")
      .then((r) => r.json())
      .then((d) => {
        setRole(d.role ?? "user");
        setPlan(d.plan ?? "hobby");
      })
      .catch(() => setRole("user"));
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(`/${locale}/sign-in`);
    router.refresh();
  };

  const isAdmin = role === "admin" || role === "superadmin";
  const isPro = ["pro", "team", "enterprise"].includes(plan);

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

        {/* Nav principal */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
          <NavLink
            href={l("/dashboard")}
            label={c.nav.dashboard.value}
            icon={LayoutDashboard}
            active={isActive("/dashboard")}
            onClick={close}
          />

          <NavLink
            href={l("/inventory")}
            label={c.nav.inventory.value}
            icon={Warehouse}
            active={isActive("/inventory")}
            onClick={close}
          />

          <NavLink
            href={l("/catalog")}
            label={c.nav.catalog.value}
            icon={BookOpen}
            active={isActive("/catalog") && !isActive("/catalog/components")}
            onClick={close}
          />

          <NavLink
            href={l("/catalog/components")}
            label={c.nav.components.value}
            icon={Layers}
            active={isActive("/catalog/components")}
            onClick={close}
            indent
          />

          <NavLink
            href={l("/production")}
            label={c.nav.production.value}
            icon={Factory}
            active={isActive("/production")}
            onClick={close}
          />

          <NavLink
            href={l("/printers")}
            label={c.nav.workshop.value}
            icon={Printer}
            active={isActive("/printers")}
            onClick={close}
          />

          <NavLink
            href={l("/sales")}
            label={c.nav.sales.value}
            icon={ShoppingCart}
            active={isActive("/sales")}
            onClick={close}
          />

          <NavLink
            href={l("/customers")}
            label={c.nav.customers.value}
            icon={Users}
            active={isActive("/customers")}
            onClick={close}
          />
        </nav>

        {/* Rodapé */}
        <div className="px-2 pb-3 border-t border-border pt-3 space-y-0.5">
          <NavLink
            href={l("/settings")}
            label={c.nav.profile.value}
            icon={UserCircle}
            active={isActive("/settings")}
            onClick={close}
          />

          {isAdmin && (
            <NavLink
              href={l("/admin")}
              label={c.nav.admin.value}
              icon={Shield}
              active={isActive("/admin")}
              onClick={close}
            />
          )}

          {/* User info + logout */}
          <div className="pt-3 mt-1 border-t border-border space-y-2">
            {userInfo && (
              <Link
                href={l("/settings")}
                onClick={close}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors group"
              >
                <UserAvatar
                  name={userInfo.name}
                  avatarUrl={userInfo.avatarUrl}
                  isPro={isPro}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate leading-tight">
                    {userInfo.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate leading-tight">
                    {userInfo.email}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {isPro ? (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "#F59E0B22",
                          color: "#F59E0B",
                        }}
                      >
                        PRO
                      </span>
                    ) : isAdmin ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                        {c.roles.admin.value}
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {c.roles.user.value}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 text-xs text-muted-foreground hover:text-foreground transition-colors w-full py-1.5 rounded-lg hover:bg-accent"
            >
              <LogOut size={13} />
              {c.signOut.value}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

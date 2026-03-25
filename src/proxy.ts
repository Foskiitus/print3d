import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["pt", "en"] as const;
const DEFAULT_LOCALE = "pt";
const PUBLIC_PATHS = ["/sign-in", "/sign-up", "/auth/callback", "/auth/error"];

// ── LISTA BRANCA DA API ──────────────────────────────────────────────────
// Rotas isentas de x-api-key (públicas ou autenticadas por outro meio)
const EXEMPT_API_PATHS = [
  "/api/auth/role",
  "/api/signed-url",
  "/api/global-filaments",
  "/api/printer-presets",
];

type Locale = (typeof LOCALES)[number];

function getLocaleFromPathname(pathname: string): Locale | null {
  const segment = pathname.split("/")[1];
  return LOCALES.includes(segment as Locale) ? (segment as Locale) : null;
}

function getPreferredLocale(request: NextRequest): Locale {
  const acceptLanguage = request.headers.get("accept-language") ?? "";
  const preferred = acceptLanguage.split(",")[0].split("-")[0].toLowerCase();
  return LOCALES.includes(preferred as Locale)
    ? (preferred as Locale)
    : DEFAULT_LOCALE;
}

// ── Helper: cria cliente Supabase e renova sessão ────────────────────────
async function refreshSupabaseSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: não adicionar lógica entre createServerClient e getUser
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Proteção de Rotas da API (Default Deny) ───────────────────────
  if (pathname.startsWith("/api/")) {
    const isExempt = EXEMPT_API_PATHS.some((path) => pathname.startsWith(path));

    if (!isExempt) {
      const apiKey = request.headers.get("x-api-key");
      if (apiKey !== process.env.NEXT_PUBLIC_MY_API_SECRET_KEY) {
        return NextResponse.json(
          { error: "Acesso não autorizado à API." },
          { status: 401 },
        );
      }
    }

    // Passa pelo Supabase para garantir que a sessão é renovada e os
    // cookies sb-* são escritos — necessário para requireApiAuth() funcionar
    const { supabaseResponse } = await refreshSupabaseSession(request);
    return supabaseResponse;
  }

  // ── 2. Passa diretamente: ficheiros estáticos, OAuth ─────────────────
  if (pathname.startsWith("/_next") || pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  // ── 3. Locale routing: redireciona /dashboard → /pt/dashboard ────────
  const localeInPath = getLocaleFromPathname(pathname);

  if (!localeInPath) {
    const locale = getPreferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // ── 4. Supabase Auth (páginas) ────────────────────────────────────────
  const { supabaseResponse, user } = await refreshSupabaseSession(request);

  const pathnameWithoutLocale = pathname.replace(`/${localeInPath}`, "") || "/";

  const isPublic =
    PUBLIC_PATHS.some((p) => pathnameWithoutLocale.startsWith(p)) ||
    pathnameWithoutLocale === "/";

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = `/${localeInPath}/sign-in`;
    return NextResponse.redirect(url);
  }

  if (
    user &&
    (pathnameWithoutLocale.startsWith("/sign-in") ||
      pathnameWithoutLocale.startsWith("/sign-up"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${localeInPath}/dashboard`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};

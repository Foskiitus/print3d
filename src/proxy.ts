import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["pt", "en"] as const;
const DEFAULT_LOCALE = "pt";
const PUBLIC_PATHS = ["/sign-in", "/sign-up", "/auth/callback", "/auth/error"];

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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Passa diretamente: API routes, ficheiros estáticos, OAuth ─────────
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/auth/")
  ) {
    return NextResponse.next();
  }

  // ── 2. Locale routing: redireciona /dashboard → /pt/dashboard ───────────
  const localeInPath = getLocaleFromPathname(pathname);

  if (!localeInPath) {
    const locale = getPreferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // ── 3. Supabase Auth ─────────────────────────────────────────────────────
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

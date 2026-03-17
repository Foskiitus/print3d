import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/login", "/api/auth"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Deixar passar assets e rotas públicas
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  // Em produção (HTTPS) o NextAuth v5 usa __Secure- como prefixo
  // Em desenvolvimento (HTTP) usa o nome sem prefixo
  const isSecure = req.nextUrl.protocol === "https:";
  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName,
  });

  if (!token) {
    const response = NextResponse.redirect(new URL("/login", req.url));

    // Apagar todos os cookies de auth independentemente do nome
    req.cookies.getAll().forEach((cookie) => {
      if (
        cookie.name.startsWith("authjs.") ||
        cookie.name.startsWith("__Secure-authjs.") ||
        cookie.name.startsWith("__Host-authjs.") ||
        cookie.name.startsWith("next-auth.")
      ) {
        response.cookies.delete(cookie.name);
      }
    });

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

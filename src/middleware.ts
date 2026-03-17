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

  // Verificar o JWT diretamente — sem Prisma, compatível com Edge Runtime
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    // NextAuth v5 usa este nome de cookie por defeito
    cookieName: "authjs.session-token",
  });

  console.log("[middleware] pathname:", pathname, "| token:", !!token);

  if (!token) {
    // Sessão inválida — apagar todos os cookies de auth e redirecionar
    const response = NextResponse.redirect(new URL("/login", req.url));

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

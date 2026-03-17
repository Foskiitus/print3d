import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ApiAuthResult =
  | { userId: string; error: null }
  | { userId: null; error: NextResponse };

// ─── API Routes ───────────────────────────────────────────────────────────────

/**
 * Uso em API routes:
 *
 *   const { userId, error } = await requireApiAuth();
 *   if (error) return error;
 *   // userId garantidamente string aqui
 */
export async function requireApiAuth(): Promise<ApiAuthResult> {
  const { userId } = await auth();
  if (!userId) {
    return {
      userId: null,
      error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }
  return { userId, error: null };
}

/**
 * Uso em API routes que requerem admin:
 *
 *   const { userId, error } = await requireApiAdmin();
 *   if (error) return error;
 */
export async function requireApiAdmin(): Promise<ApiAuthResult> {
  const { userId } = await auth();
  if (!userId) {
    return {
      userId: null,
      error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "admin" && user?.role !== "superadmin") {
    return {
      userId: null,
      error: NextResponse.json({ error: "Acesso negado" }, { status: 403 }),
    };
  }

  return { userId, error: null };
}

// ─── Server Components / Pages ────────────────────────────────────────────────

/**
 * Uso em Server Components (pages):
 *
 *   const userId = await requirePageAuth();
 *   // redireciona para /sign-in se não autenticado
 */
export async function requirePageAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}

/**
 * Uso em páginas de admin:
 *
 *   const userId = await requirePageAdmin();
 */
export async function requirePageAdmin(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "admin" && user?.role !== "superadmin") {
    redirect("/dashboard");
  }

  return userId;
}

// ─── Helpers individuais (compatibilidade) ────────────────────────────────────

export async function getAuthUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

export async function getAuthUserIsAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "admin" || user?.role === "superadmin";
}

export async function getAuthUserRole(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role ?? null;
}

export async function getOrCreateDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  return await prisma.user.create({
    data: {
      id: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      name:
        `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
        null,
      role: "user",
    },
  });
}

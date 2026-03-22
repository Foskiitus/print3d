import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ApiAuthResult =
  | { userId: string; error: null }
  | { userId: null; error: NextResponse };

// ─── Helpers internos ─────────────────────────────────────────────────────────

async function ensureUserInDb(
  userId: string,
  email: string,
  name: string | null,
) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    await prisma.user.create({
      data: { id: userId, email, name, role: "user" },
    });
  }
}

// ─── API Routes ───────────────────────────────────────────────────────────────

/**
 * Uso em API routes:
 *
 *   const { userId, error } = await requireApiAuth();
 *   if (error) return error;
 */
export async function requireApiAuth(): Promise<ApiAuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      userId: null,
      error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }

  const email = user.email ?? "";
  const name =
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? null;
  await ensureUserInDb(user.id, email, name);

  return { userId: user.id, error: null };
}

/**
 * Uso em API routes que requerem admin:
 *
 *   const { userId, error } = await requireApiAdmin();
 *   if (error) return error;
 */
export async function requireApiAdmin(): Promise<ApiAuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      userId: null,
      error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (dbUser?.role !== "admin" && dbUser?.role !== "superadmin") {
    return {
      userId: null,
      error: NextResponse.json({ error: "Acesso negado" }, { status: 403 }),
    };
  }

  return { userId: user.id, error: null };
}

// ─── Server Components / Pages ────────────────────────────────────────────────

/**
 * Uso em Server Components (pages):
 *
 *   const userId = await requirePageAuth();
 *   // redireciona para /sign-in se não autenticado
 */
export async function requirePageAuth(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const email = user.email ?? "";
  const name =
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? null;
  await ensureUserInDb(user.id, email, name);

  return user.id;
}

/**
 * Uso em páginas de admin:
 *
 *   const userId = await requirePageAdmin();
 */
export async function requirePageAdmin(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!dbUser) {
    const email = user.email ?? "";
    const name =
      user.user_metadata?.full_name ?? user.user_metadata?.name ?? null;
    dbUser = await prisma.user.create({
      data: { id: user.id, email, name, role: "user" },
      select: { role: true },
    });
  }

  if (dbUser?.role !== "admin" && dbUser?.role !== "superadmin") {
    redirect("/dashboard");
  }

  return user.id;
}

// ─── Helpers individuais ──────────────────────────────────────────────────────

export async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getAuthUserIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  return dbUser?.role === "admin" || dbUser?.role === "superadmin";
}

export async function getAuthUserRole(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  return dbUser?.role ?? null;
}

export async function getOrCreateDbUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const existing = await prisma.user.findUnique({ where: { id: user.id } });
  if (existing) return existing;

  const email = user.email ?? "";
  const name =
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? null;

  return await prisma.user.create({
    data: { id: user.id, email, name, role: "user" },
  });
}
// ─── Sign Up com locale (formulário) ─────────────────────────────────────────

/**
 * Chama a partir de um Server Action — recebe o locale do Client Component.
 *
 *   const { userId, error } = await signUpWithLocale(email, password, locale)
 */
export async function signUpWithLocale(
  email: string,
  password: string,
  locale: string,
  name: string | null = null,
  plan?: string,
) {
  const supabase = await createClient();

  let data, error;
  try {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, locale, plan },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?locale=${locale}`,
      },
    });
    data = result.data;
    error = result.error;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { userId: null, needsConfirmation: false, error: message };
  }

  if (error)
    return { userId: null, needsConfirmation: false, error: error.message };
  if (!data.user)
    return {
      userId: null,
      needsConfirmation: false,
      error: "Erro desconhecido",
    };

  // Usa o 'name' passado como argumento directamente, não o do user_metadata
  await ensureUserInDb(data.user.id, email, name);

  return {
    userId: data.user.id,
    needsConfirmation: !data.session,
    error: null,
  };
}

// ─── OAuth com locale (Google, GitHub, etc.) ──────────────────────────────────

/**
 * Para OAuth, o locale é passado como parâmetro na URL de redirect.
 * O Supabase guarda o `user_metadata` automaticamente depois do callback.
 * Aqui usamos o `queryString` para saber o locale e actualizamos o perfil.
 */
export async function handleOAuthCallback(locale: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Só actualiza se ainda não tiver locale guardado
  if (!user.user_metadata?.locale) {
    await supabase.auth.updateUser({
      data: { locale },
    });
  }

  const email = user.email ?? "";
  const name =
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? null;
  await ensureUserInDb(user.id, email, name);

  return user.id;
}

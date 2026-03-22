"use server";

import { signUpWithLocale } from "@/lib/auth";

export async function signUpAction(
  email: string,
  password: string,
  name: string,
  locale: string,
  plan?: string,
) {
  try {
    return await signUpWithLocale(email, password, locale, name);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { userId: null, needsConfirmation: false, error: message };
  }
}

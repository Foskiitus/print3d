import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const locale = searchParams.get("locale") ?? "en";
  const plan = searchParams.get("plan");
  const next = searchParams.get("next") ?? `/${locale}/dashboard`;

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type: type as "signup" | "recovery" | "invite" | "email_change",
      token_hash,
    });

    if (!error) {
      // Recovery redireciona para reset-password
      if (type === "recovery") {
        return NextResponse.redirect(
          new URL(`/${locale}/reset-password`, request.url),
        );
      }

      // Signup com plano pro redireciona para billing
      if (type === "signup" && plan === "pro") {
        return NextResponse.redirect(
          new URL(`/${locale}/billing?upgrade=pro`, request.url),
        );
      }

      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(
    new URL(`/${locale}/auth-error?error=confirm`, request.url),
  );
}

import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret não configurado" },
      { status: 500 },
    );
  }

  // Verificar assinatura do Clerk
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Headers svix em falta" },
      { status: 400 },
    );
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  const { type, data } = evt;

  // ── user.created ──────────────────────────────────────────────
  if (type === "user.created") {
    const email = (data as any).email_addresses?.[0]?.email_address ?? "";
    const name =
      [(data as any).first_name, (data as any).last_name]
        .filter(Boolean)
        .join(" ") || null;

    await prisma.user.upsert({
      where: { id: data.id },
      update: { email, name },
      create: { id: data.id, email, name, role: "user" },
    });
  }

  // ── user.updated ──────────────────────────────────────────────
  if (type === "user.updated") {
    const email = (data as any).email_addresses?.[0]?.email_address ?? "";
    const name =
      [(data as any).first_name, (data as any).last_name]
        .filter(Boolean)
        .join(" ") || null;

    await prisma.user
      .update({
        where: { id: data.id },
        data: { email, name },
      })
      .catch(() => {
        // Ignorar se o utilizador não existir ainda
      });
  }

  // ── user.deleted ──────────────────────────────────────────────
  if (type === "user.deleted") {
    await prisma.user
      .delete({
        where: { id: data.id },
      })
      .catch(() => {
        // Ignorar se já não existir
      });
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const config = { api: { bodyParser: false } };

function toDate(ts: number | null | undefined): Date {
  if (!ts || isNaN(ts)) return new Date();
  return new Date(ts * 1000);
}

// Extrai datas do período — a localização varia com a versão da API Stripe
function getPeriodDates(sub: Stripe.Subscription) {
  // Versões recentes: datas no item
  const item = sub.items?.data?.[0];
  const startTs =
    (sub as unknown as Record<string, number>).current_period_start ??
    (item as unknown as Record<string, number>)?.current_period_start;
  const endTs =
    (sub as unknown as Record<string, number>).current_period_end ??
    (item as unknown as Record<string, number>)?.current_period_end;

  // Fallback: busca a subscrição completa ao Stripe se ainda undefined
  return { startTs, endTs };
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subFromEvent = event.data.object as Stripe.Subscription;
        const customerId = subFromEvent.customer as string;

        // Busca a subscrição completa para garantir todos os campos
        const sub = await stripe.subscriptions.retrieve(subFromEvent.id, {
          expand: ["items.data.price"],
        });

        console.log("Subscription fetched:", {
          id: sub.id,
          status: sub.status,
          current_period_start: (sub as unknown as Record<string, number>)
            .current_period_start,
          current_period_end: (sub as unknown as Record<string, number>)
            .current_period_end,
        });

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (!user) break;

        const { startTs, endTs } = getPeriodDates(sub);
        const periodStart = toDate(startTs);
        const periodEnd = toDate(endTs);

        await prisma.subscription.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            stripeSubscriptionId: sub.id,
            stripePriceId: sub.items.data[0]?.price?.id ?? "",
            status: sub.status,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
          update: {
            status: sub.status,
            stripeSubscriptionId: sub.id,
            stripePriceId: sub.items.data[0]?.price?.id ?? "",
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        });

        const plan =
          sub.status === "active" || sub.status === "trialing"
            ? "pro"
            : "hobby";

        await prisma.user.update({
          where: { id: user.id },
          data: { plan },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (!user) break;

        await prisma.subscription.updateMany({
          where: { userId: user.id },
          data: { status: "canceled" },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: { plan: "hobby" },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (!user) break;

        await prisma.subscription.updateMany({
          where: { userId: user.id },
          data: { status: "past_due" },
        });
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

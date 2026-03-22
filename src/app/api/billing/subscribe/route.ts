import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import Stripe from "stripe";

function toDate(ts: number | null | undefined): Date {
  if (!ts || isNaN(ts)) return new Date();
  return new Date(ts * 1000);
}

export async function POST(req: Request) {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const { paymentMethodId } = await req.json();
  if (!paymentMethodId) {
    return NextResponse.json(
      { error: "Missing paymentMethodId" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true, name: true },
  });

  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  // Associa o método de pagamento ao customer
  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  // Cria a subscrição com payment_settings para confirmar automaticamente
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: process.env.STRIPE_PRO_PRICE_ID! }],
    default_payment_method: paymentMethodId,
    payment_settings: {
      payment_method_types: ["card"],
      save_default_payment_method: "on_subscription",
    },
    expand: ["latest_invoice"],
  });

  const invoice = subscription.latest_invoice as Stripe.Invoice;

  // Verifica se a factura precisa de confirmação (3D Secure)
  if (invoice.status === "open") {
    // Tenta pagar a factura manualmente
    const paidInvoice = await stripe.invoices.pay(invoice.id, {
      payment_method: paymentMethodId,
    });

    if (paidInvoice.status !== "paid") {
      return NextResponse.json(
        { error: "Payment requires additional action" },
        { status: 402 },
      );
    }
  }

  // Busca a subscrição actualizada para ter os dados correctos
  const updatedSub = await stripe.subscriptions.retrieve(subscription.id);

  if (updatedSub.status === "active" || updatedSub.status === "trialing") {
    const rawSub = updatedSub as unknown as Record<string, number>;

    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeSubscriptionId: updatedSub.id,
        stripePriceId: process.env.STRIPE_PRO_PRICE_ID!,
        status: updatedSub.status,
        currentPeriodStart: toDate(rawSub.current_period_start),
        currentPeriodEnd: toDate(rawSub.current_period_end),
        cancelAtPeriodEnd: updatedSub.cancel_at_period_end,
      },
      update: {
        stripeSubscriptionId: updatedSub.id,
        status: updatedSub.status,
        currentPeriodStart: toDate(rawSub.current_period_start),
        currentPeriodEnd: toDate(rawSub.current_period_end),
        cancelAtPeriodEnd: updatedSub.cancel_at_period_end,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { plan: "pro" },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Payment failed" }, { status: 400 });
}

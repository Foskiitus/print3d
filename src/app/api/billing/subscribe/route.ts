import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

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

  // Garante que o customer existe
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

  // Define como método de pagamento por defeito
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  // Cria a subscrição
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: process.env.STRIPE_PRO_PRICE_ID! }],
    default_payment_method: paymentMethodId,
    expand: ["latest_invoice.payment_intent"],
  });

  const invoice = subscription.latest_invoice as Stripe.Invoice;
  const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent | null;

  // Se precisar de confirmação 3D Secure
  if (paymentIntent?.status === "requires_action") {
    return NextResponse.json({
      requiresAction: true,
      clientSecret: paymentIntent.client_secret,
    });
  }

  if (subscription.status === "active" || subscription.status === "trialing") {
    // Actualiza a DB
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: process.env.STRIPE_PRO_PRICE_ID!,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      update: {
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
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

// necessário para o tipo Stripe
import Stripe from "stripe";

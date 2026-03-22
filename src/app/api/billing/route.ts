import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

export async function GET() {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      stripeCustomerId: true,
      subscription: true,
    },
  });

  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Busca facturas no Stripe se tiver customer
  let invoices: {
    id: string;
    date: string;
    amount: number;
    currency: string;
    status: string;
    url: string | null;
  }[] = [];

  if (user.stripeCustomerId) {
    const stripeInvoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 12,
    });

    invoices = stripeInvoices.data.map((inv) => ({
      id: inv.id,
      date: new Date(inv.created * 1000).toISOString(),
      amount: inv.amount_paid,
      currency: inv.currency,
      status: inv.status ?? "unknown",
      url: inv.hosted_invoice_url ?? null,
    }));
  }

  return NextResponse.json({
    plan: user.plan,
    subscription: user.subscription
      ? {
          status: user.subscription.status,
          currentPeriodEnd: user.subscription.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
        }
      : null,
    invoices,
  });
}

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

export async function POST() {
  const { userId, error } = await requireApiAuth();
  if (error) return error;

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return NextResponse.json(
      { error: "No active subscription" },
      { status: 404 },
    );
  }

  // Cancela no fim do período (não imediatamente)
  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await prisma.subscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: true },
  });

  return NextResponse.json({ success: true });
}

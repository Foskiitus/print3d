"use client";

import { useEffect, useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useParams, useRouter } from "next/navigation";
import { Check, X, Zap } from "lucide-react";
import { redirect } from "next/navigation";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface BillingData {
  plan: string;
  subscription: {
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  invoices: {
    id: string;
    date: string;
    amount: number;
    currency: string;
    status: string;
    url: string | null;
  }[];
}

// ─── Perks ────────────────────────────────────────────────────────────────────

const PERKS = {
  pt: [
    {
      category: "Impressoras",
      hobby: "1–2 impressoras",
      pro: "Ilimitadas",
      hobbyOk: true,
      proOk: true,
    },
    {
      category: "Inventário",
      hobby: "Apenas filamentos",
      pro: "Filamentos + extras + expedição",
      hobbyOk: true,
      proOk: true,
    },
    {
      category: "Manutenção",
      hobby: "Alertas básicos",
      pro: "Histórico detalhado e relatórios",
      hobbyOk: true,
      proOk: true,
    },
    {
      category: "QR / NFC",
      hobby: "QR codes simples",
      pro: "QR de lote + NFC de impressora",
      hobbyOk: true,
      proOk: true,
    },
    {
      category: "Analytics",
      hobby: "Básico (gasto total)",
      pro: "Avançado (ROI, desperdício, margens)",
      hobbyOk: true,
      proOk: true,
    },
  ],
  en: [
    {
      category: "Printers",
      hobby: "1–2 printers",
      pro: "Unlimited",
      hobbyOk: true,
      proOk: true,
    },
    {
      category: "Inventory",
      hobby: "Filaments only",
      pro: "Filaments + extras + shipping",
      hobbyOk: true,
      proOk: true,
    },
    {
      category: "Maintenance",
      hobby: "Basic alerts",
      pro: "Detailed history & reports",
      hobbyOk: true,
      proOk: true,
    },
    {
      category: "QR / NFC",
      hobby: "Simple QR codes",
      pro: "Batch QR + printer NFC",
      hobbyOk: true,
      proOk: true,
    },
    {
      category: "Analytics",
      hobby: "Basic (total spend)",
      pro: "Advanced (ROI, waste, margins)",
      hobbyOk: true,
      proOk: true,
    },
  ],
};

// ─── Card form ────────────────────────────────────────────────────────────────

function CardForm({
  onSuccess,
  locale,
}: {
  onSuccess: () => void;
  locale: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = {
    pt: {
      cardNumber: "Número do cartão",
      expiry: "Validade",
      cvc: "CVC",
      submit: "Subscrever Pro — €5/mês",
      submitting: "A processar...",
      errorGeneric: "Ocorreu um erro. Tenta novamente.",
      secureNote:
        "Pagamento seguro via Stripe. Não armazenamos dados do cartão.",
    },
    en: {
      cardNumber: "Card number",
      expiry: "Expiry",
      cvc: "CVC",
      submit: "Subscribe to Pro — €5/month",
      submitting: "Processing...",
      errorGeneric: "Something went wrong. Please try again.",
      secureNote: "Secure payment via Stripe. We don't store card details.",
    },
  };

  const c = t[locale as keyof typeof t] ?? t.en;

  const elementStyle = {
    style: {
      base: {
        fontSize: "14px",
        color: "#e4e4e7",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        "::placeholder": { color: "#52525b" },
      },
      invalid: { color: "#f87171" },
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) return;

    const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardNumber,
    });

    if (pmError) {
      setError(pmError.message ?? c.errorGeneric);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/billing/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethodId: paymentMethod.id }),
    });

    const data = await res.json();

    if (data.requiresAction) {
      const { error: confirmError } = await stripe.confirmCardPayment(
        data.clientSecret,
      );
      if (confirmError) {
        setError(confirmError.message ?? c.errorGeneric);
        setLoading(false);
        return;
      }
    }

    if (!res.ok && !data.requiresAction) {
      setError(c.errorGeneric);
      setLoading(false);
      return;
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-navy-300">
          {c.cardNumber}
        </label>
        <div className="px-3 py-2.5 rounded-lg border border-theme/40 bg-dark-surface focus-within:border-brand-500/60 transition-colors">
          <CardNumberElement options={elementStyle} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-navy-300">
            {c.expiry}
          </label>
          <div className="px-3 py-2.5 rounded-lg border border-theme/40 bg-dark-surface focus-within:border-brand-500/60 transition-colors">
            <CardExpiryElement options={elementStyle} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-navy-300">{c.cvc}</label>
          <div className="px-3 py-2.5 rounded-lg border border-theme/40 bg-dark-surface focus-within:border-brand-500/60 transition-colors">
            <CardCvcElement options={elementStyle} />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading || !stripe}
        className="btn-primary w-full justify-center py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? c.submitting : c.submit}
      </button>

      <p className="text-xs text-dark-subtle text-center flex items-center justify-center gap-1.5">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        {c.secureNote}
      </p>
    </form>
  );
}

// ─── Tabela de comparação ─────────────────────────────────────────────────────

function ComparisonTable({
  locale,
  isPro,
}: {
  locale: string;
  isPro: boolean;
}) {
  const perks = PERKS[locale as keyof typeof PERKS] ?? PERKS.en;

  const t = {
    pt: {
      feature: "Funcionalidade",
      hobby: "Hobby",
      pro: "Pro",
      current: "actual",
    },
    en: { feature: "Feature", hobby: "Hobby", pro: "Pro", current: "current" },
  };
  const c = t[locale as keyof typeof t] ?? t.en;

  return (
    <div className="overflow-hidden rounded-xl border border-theme/40">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-theme/40">
            <th className="text-left px-4 py-3 text-navy-400 font-medium">
              {c.feature}
            </th>
            <th className="text-center px-4 py-3 text-navy-400 font-medium w-32">
              {c.hobby}
              {!isPro && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-theme/20 text-navy-300">
                  {c.current}
                </span>
              )}
            </th>
            <th className="text-center px-4 py-3 w-32">
              <span className="text-brand-400 font-semibold">{c.pro}</span>
              {isPro && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400">
                  {c.current}
                </span>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {perks.map((perk, i) => (
            <tr
              key={i}
              className="border-b border-theme/20 last:border-0 hover:bg-theme/5 transition-colors"
            >
              <td className="px-4 py-3 text-theme font-medium">
                {perk.category}
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-navy-400 text-xs">{perk.hobby}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex flex-col items-center gap-1">
                  <Check className="w-4 h-4 text-brand-400 mx-auto" />
                  <span className="text-brand-300 text-xs font-medium">
                    {perk.pro}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function BillingPage() {
  const { locale } = useParams<{ locale: string }>();
  redirect(`/${locale}/dashboard`);
  return null;
  // const router = useRouter();
  // const [billing, setBilling] = useState<BillingData | null>(null);
  // const [clientSecret, setClientSecret] = useState<string | null>(null);
  // const [loading, setLoading] = useState(true);
  // const [canceling, setCanceling] = useState(false);
  // const [upgraded, setUpgraded] = useState(false);

  // const t = {
  //   pt: {
  //     title: "Subscrição",
  //     currentPlan: "Plano actual",
  //     hobby: "Hobby",
  //     pro: "Pro",
  //     free: "Gratuito",
  //     perMonth: "/ mês",
  //     renewsOn: "Renova a",
  //     cancelsOn: "Cancela a",
  //     canceledPlan: "A subscrição termina no fim do período actual.",
  //     upgradeTitle: "Upgrade para Pro",
  //     upgradeDesc: "Desbloqueia todas as funcionalidades por €5/mês.",
  //     compareTitle: "Comparação de planos",
  //     invoices: "Histórico de facturas",
  //     noInvoices: "Nenhuma factura ainda.",
  //     paid: "Pago",
  //     open: "Pendente",
  //     download: "Ver",
  //     cancelSub: "Cancelar subscrição",
  //     canceling: "A cancelar...",
  //     cancelConfirm:
  //       "Tens a certeza? A subscrição termina no fim do período actual.",
  //     successTitle: "Upgrade concluído!",
  //     successBody: "O teu plano Pro está activo. Bem-vindo!",
  //     backToDashboard: "Ir para o dashboard",
  //   },
  //   en: {
  //     title: "Subscription",
  //     currentPlan: "Current plan",
  //     hobby: "Hobby",
  //     pro: "Pro",
  //     free: "Free",
  //     perMonth: "/ month",
  //     renewsOn: "Renews on",
  //     cancelsOn: "Cancels on",
  //     canceledPlan: "Your subscription ends at the end of the current period.",
  //     upgradeTitle: "Upgrade to Pro",
  //     upgradeDesc: "Unlock all features for €5/month.",
  //     compareTitle: "Plan comparison",
  //     invoices: "Invoice history",
  //     noInvoices: "No invoices yet.",
  //     paid: "Paid",
  //     open: "Pending",
  //     download: "View",
  //     cancelSub: "Cancel subscription",
  //     canceling: "Canceling...",
  //     cancelConfirm:
  //       "Are you sure? Your subscription ends at the end of the current period.",
  //     successTitle: "Upgrade complete!",
  //     successBody: "Your Pro plan is now active. Welcome!",
  //     backToDashboard: "Go to dashboard",
  //   },
  // };

  // const c = t[locale as keyof typeof t] ?? t.en;

  // const loadBilling = useCallback(async () => {
  //   const res = await fetch("/api/billing");
  //   if (res.ok) setBilling(await res.json());
  //   setLoading(false);
  // }, []);

  // useEffect(() => {
  //   loadBilling();
  // }, [loadBilling]);

  // useEffect(() => {
  //   if (billing?.plan === "hobby") {
  //     fetch("/api/billing/setup-intent", { method: "POST" })
  //       .then((r) => r.json())
  //       .then((d) => setClientSecret(d.clientSecret));
  //   }
  // }, [billing?.plan]);

  // const handleCancel = async () => {
  //   if (!confirm(c.cancelConfirm)) return;
  //   setCanceling(true);
  //   await fetch("/api/billing/cancel", { method: "POST" });
  //   await loadBilling();
  //   setCanceling(false);
  // };

  // const handleUpgradeSuccess = async () => {
  //   setUpgraded(true);
  //   await loadBilling();
  // };

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-[400px]">
  //       <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
  //     </div>
  //   );
  // }

  // if (upgraded) {
  //   return (
  //     <div className="max-w-md mx-auto py-16 text-center space-y-4">
  //       <div className="flex justify-center">
  //         <div className="w-14 h-14 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
  //           <Check className="w-6 h-6 text-brand-400" />
  //         </div>
  //       </div>
  //       <h2
  //         className="font-display font-bold text-theme text-xl"
  //         style={{ letterSpacing: "-0.02em" }}
  //       >
  //         {c.successTitle}
  //       </h2>
  //       <p className="text-navy-400 text-sm">{c.successBody}</p>
  //       <button
  //         onClick={() => router.push(`/${locale}/dashboard`)}
  //         className="btn-primary mt-2"
  //       >
  //         {c.backToDashboard}
  //       </button>
  //     </div>
  //   );
  // }

  // const sub = billing?.subscription;
  // const isPro = billing?.plan === "pro";

  // return (
  //   <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
  //     <div className="card space-y-4">
  //       <h2
  //         className="font-display font-semibold text-theme text-lg"
  //         style={{ letterSpacing: "-0.02em" }}
  //       >
  //         {c.currentPlan}
  //       </h2>

  //       <div className="flex items-center justify-between">
  //         <div>
  //           <div className="flex items-center gap-2">
  //             <span
  //               className="text-2xl font-display font-bold text-theme"
  //               style={{ letterSpacing: "-0.03em" }}
  //             >
  //               {isPro ? c.pro : c.hobby}
  //             </span>
  //             {isPro && (
  //               <span className="badge-brand text-xs px-2 py-0.5 flex items-center gap-1">
  //                 <Zap className="w-3 h-3" /> Pro
  //               </span>
  //             )}
  //           </div>
  //           {isPro ? (
  //             <p className="text-sm text-navy-400">€5 {c.perMonth}</p>
  //           ) : (
  //             <p className="text-sm text-navy-400">{c.free}</p>
  //           )}
  //         </div>

  //         {sub && (
  //           <div className="text-right text-sm text-navy-400">
  //             {sub?.cancelAtPeriodEnd ? (
  //               <>
  //                 <p className="text-red-400 text-xs mb-0.5">
  //                   {c.canceledPlan}
  //                 </p>
  //                 <p>
  //                   {c.cancelsOn}{" "}
  //                   {new Date(sub.currentPeriodEnd).toLocaleDateString(locale)}
  //                 </p>
  //               </>
  //             ) : (
  //               <p>
  //                 {c.renewsOn}{" "}
  //                 {new Date(sub.currentPeriodEnd).toLocaleDateString(locale)}
  //               </p>
  //             )}
  //           </div>
  //         )}
  //       </div>

  //       {isPro && !sub?.cancelAtPeriodEnd && (
  //         <button
  //           onClick={handleCancel}
  //           disabled={canceling}
  //           className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
  //         >
  //           {canceling ? c.canceling : c.cancelSub}
  //         </button>
  //       )}
  //     </div>

  //     <div className="space-y-3">
  //       <h2
  //         className="font-display font-semibold text-theme text-lg"
  //         style={{ letterSpacing: "-0.02em" }}
  //       >
  //         {c.compareTitle}
  //       </h2>
  //       <ComparisonTable locale={locale} isPro={isPro} />
  //     </div>

  //     {!isPro && clientSecret && (
  //       <div className="card space-y-4 border-brand-500/20">
  //         <div>
  //           <div className="flex items-center gap-2 mb-1">
  //             <Zap className="w-4 h-4 text-brand-400" />
  //             <h2
  //               className="font-display font-semibold text-theme text-lg"
  //               style={{ letterSpacing: "-0.02em" }}
  //             >
  //               {c.upgradeTitle}
  //             </h2>
  //           </div>
  //           <p className="text-sm text-navy-400">{c.upgradeDesc}</p>
  //         </div>
  //         <Elements stripe={stripePromise} options={{ clientSecret }}>
  //           <CardForm onSuccess={handleUpgradeSuccess} locale={locale} />
  //         </Elements>
  //       </div>
  //     )}

  //     <div className="card space-y-4">
  //       <h2
  //         className="font-display font-semibold text-theme text-lg"
  //         style={{ letterSpacing: "-0.02em" }}
  //       >
  //         {c.invoices}
  //       </h2>

  //       {!billing?.invoices?.length ? (
  //         <p className="text-sm text-navy-400">{c.noInvoices}</p>
  //       ) : (
  //         <div className="space-y-2">
  //           {billing.invoices.map((inv) => (
  //             <div
  //               key={inv.id}
  //               className="flex items-center justify-between py-2 border-b border-theme/20 last:border-0"
  //             >
  //               <div>
  //                 <p className="text-sm text-theme">
  //                   {new Date(inv.date).toLocaleDateString(locale)}
  //                 </p>
  //                 <p className="text-xs text-navy-400">
  //                   {(inv.amount / 100).toFixed(2)} {inv.currency.toUpperCase()}
  //                 </p>
  //               </div>
  //               <div className="flex items-center gap-3">
  //                 <span
  //                   className={`text-xs font-medium ${inv.status === "paid" ? "text-green-400" : "text-yellow-400"}`}
  //                 >
  //                   {inv.status === "paid" ? c.paid : c.open}
  //                 </span>
  //                 {inv.url && (
  //                   <a
  //                     href={inv.url}
  //                     target="_blank"
  //                     rel="noopener noreferrer"
  //                     className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
  //                   >
  //                     {c.download}
  //                   </a>
  //                 )}
  //               </div>
  //             </div>
  //           ))}
  //         </div>
  //       )}
  //     </div>
  //   </div>
  // );
}

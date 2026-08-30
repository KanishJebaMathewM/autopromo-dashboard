import React, { useState } from "react";
import { toast } from "sonner";
import { CreditCard, Check, ShieldCheck, X, Loader2, Sparkles, Zap, Lock } from "lucide-react";
import { PLANS, setStoredSandboxPlan, type PlanTier } from "@/lib/sandboxPlan";

interface PaymentSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PlanTier;
  onPlanChanged: (newPlan: PlanTier) => void;
}

export function PaymentSandboxModal({
  isOpen,
  onClose,
  currentPlan,
  onPlanChanged,
}: PaymentSandboxModalProps) {
  const [selectedTier, setSelectedTier] = useState<PlanTier>(
    currentPlan === "free" ? "builder" : currentPlan
  );
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const plan = PLANS[selectedTier];

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTier === currentPlan) {
      toast.info(`You are already subscribed to the ${plan.name} plan.`);
      onClose();
      return;
    }

    setIsProcessing(true);

    // Simulate Sandbox Payment Gateway API processing
    setTimeout(() => {
      setIsProcessing(false);
      setStoredSandboxPlan(selectedTier);
      onPlanChanged(selectedTier);
      toast.success(`🎉 Sandbox Subscription Activated!`, {
        description: `Upgraded to ${plan.name}. All features unlocked in test mode.`,
      });
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-emerald-500/30 bg-background p-6 shadow-2xl dark:bg-zinc-950"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold tracking-tight">Payment Sandbox</h2>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
                  TEST ENVIRONMENT
                </span>
              </div>
              <p className="text-xs text-muted-fg">Simulate subscription upgrades and unlock platform features</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-fg hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Plan Selector */}
        <div className="mt-6">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-fg">
            Select Subscription Plan
          </label>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(["free", "impact", "builder", "agency"] as PlanTier[]).map((tier) => {
              const item = PLANS[tier];
              const isCurrent = currentPlan === tier;
              const isSelected = selectedTier === tier;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setSelectedTier(tier)}
                  className={`relative flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                      : "border-border bg-surface hover:border-muted-fg"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate">{item.name.split(" ")[0]}</span>
                      {isCurrent && (
                        <span className="rounded bg-emerald-500/20 px-1 py-0.5 text-[8px] font-bold text-emerald-500">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 font-display text-base font-bold">
                      {item.price}
                      <span className="text-[10px] font-normal text-muted-fg ml-1">{item.period}</span>
                    </div>
                  </div>
                  <ul className="mt-2.5 space-y-1 border-t pt-2 text-[9px] text-muted-fg">
                    {item.features.slice(0, 2).map((f) => (
                      <li key={f} className="flex items-center gap-1 truncate">
                        <Check className="h-2.5 w-2.5 shrink-0 text-emerald-500" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>

        {/* Test Card Checkout Section */}
        <form onSubmit={handleCheckout} className="mt-6 rounded-xl border bg-surface p-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-bold">Sandbox Card Checkout</span>
            </div>
            <span className="flex items-center gap-1 text-[11px] text-muted-fg">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              No real charge will occur
            </span>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-medium text-muted-fg">Test Card Number</label>
              <div className="mt-1 flex items-center rounded-lg border bg-background px-3 py-1.5 font-mono text-xs">
                <span>4242 •••• •••• 4242</span>
                <span className="ml-auto font-sans text-[10px] font-semibold text-emerald-500">VISA</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-muted-fg">Expires</label>
                <div className="mt-1 rounded-lg border bg-background px-3 py-1.5 font-mono text-xs">
                  12/28
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-fg">CVC</label>
                <div className="mt-1 rounded-lg border bg-background px-3 py-1.5 font-mono text-xs">
                  123
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="ap-press mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing Test Payment...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Complete Sandbox Payment ({plan.price}{plan.period})
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

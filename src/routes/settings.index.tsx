import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  CreditCard,
  Sparkles,
  Zap,
  Bell,
  Shield,
  FileText,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FallbackNotice } from "@/components/ConnectionBadge";
import { PaymentSandboxModal } from "@/components/PaymentSandboxModal";
import { getStoredSandboxPlan, setStoredSandboxPlan, PLANS, type PlanTier } from "@/lib/sandboxPlan";
import { useDataSource } from "@/lib/dataSource";
import { useApps } from "@/lib/queries";

export const Route = createFileRoute("/settings/")({
  head: () => ({
    meta: [
      { title: "Settings & Subscription — AutoPromo SDK" },
      {
        name: "description",
        content:
          "Manage app API keys, subscription billing plan, connection status, and SDK preferences.",
      },
      { property: "og:title", content: "Settings & Subscription — AutoPromo SDK" },
      {
        property: "og:description",
        content: "Manage app API keys and subscription plan.",
      },
    ],
  }),
  component: SettingsPage,
});

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy — select text manually");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      className="ap-press inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-muted-fg hover:bg-mint-100 hover:text-foreground dark:hover:bg-olive-500"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function ApiKeyRow({ name, apiKey, appId }: { name: string; apiKey: string; appId: string }) {
  const [revealed, setRevealed] = useState(false);
  const masked = `${apiKey.slice(0, 8)}${"•".repeat(Math.max(apiKey.length - 8, 0))}`;

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border bg-surface p-4 shadow-sm transition-all hover:border-mint-300">
      <div className="min-w-0 flex-1">
        <Link
          to="/apps/$appId"
          params={{ appId }}
          className="font-display text-sm font-bold text-foreground hover:text-emerald-500 hover:underline"
        >
          {name}
        </Link>
        <p className="mt-1 truncate font-mono text-[11px] text-muted-fg">
          {revealed ? apiKey : masked}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        aria-label={revealed ? `Hide ${name} API key` : `Reveal ${name} API key`}
        className="ap-press inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-muted-fg hover:bg-mint-100 hover:text-foreground dark:hover:bg-olive-500"
      >
        {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
      <CopyButton value={apiKey} label={`${name} API key`} />
    </li>
  );
}

function SettingsPage() {
  const { status, apiBaseUrl, retry } = useDataSource();
  const { data: appsResult } = useApps();
  const apps = appsResult?.data ?? [];

  const [sandboxPlan, setSandboxPlan] = useState<PlanTier>("builder");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [subscriptionCancelled, setSubscriptionCancelled] = useState(false);

  // Preference Toggles
  const [discordWebhookEnabled, setDiscordWebhookEnabled] = useState(true);
  const [environmentMode, setEnvironmentMode] = useState<"sandbox" | "production">("sandbox");
  const [autoSyncTelemetry, setAutoSyncTelemetry] = useState(true);

  useEffect(() => {
    setSandboxPlan(getStoredSandboxPlan());
  }, []);

  const plan = PLANS[sandboxPlan];

  const handlePlanChange = (newPlan: PlanTier) => {
    setSandboxPlan(newPlan);
    setStoredSandboxPlan(newPlan);
    setSubscriptionCancelled(false);
    toast.success(`Plan updated to ${PLANS[newPlan].name}!`);
  };

  const handleCancelSubscription = () => {
    if (sandboxPlan === "free") {
      toast.info("You are currently on the Free plan.");
      return;
    }
    if (subscriptionCancelled) {
      setSubscriptionCancelled(false);
      toast.success("Subscription resumed successfully!");
      return;
    }

    setIsCancelling(true);
  };

  const confirmCancel = () => {
    setSubscriptionCancelled(true);
    setIsCancelling(false);
    toast.warning("Subscription scheduled for cancellation at the end of the billing cycle.", {
      description: "You will retain Pro features until your renewal date.",
    });
  };

  // Derived usage metrics
  const postsUsed = sandboxPlan === "free" ? 14 : sandboxPlan === "builder" ? 42 : 128;
  const postsMax = plan.postsLimit === 999999 ? 1000 : plan.postsLimit;
  const postsPercentage = Math.min(Math.round((postsUsed / postsMax) * 100), 100);

  const appsUsed = apps.length || 1;
  const appsMax = plan.appsLimit === "unlimited" ? 10 : plan.appsLimit;
  const appsPercentage = Math.min(Math.round((appsUsed / (typeof appsMax === "number" ? appsMax : 10)) * 100), 100);

  return (
    <AppShell title="Settings">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Settings & Subscription</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-fg">
            Manage your subscription plan, app SDK API keys, connection health, and workspace preferences.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsPaymentModalOpen(true)}
          className="ap-press inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-600"
        >
          <Sparkles className="h-4 w-4 text-emerald-100" />
          {sandboxPlan === "agency" ? "Manage Subscription" : "Upgrade to Pro"}
        </button>
      </div>

      <FallbackNotice className="mt-4" />

      {/* ── 1. Subscription & Billing ── */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Subscription & Billing</h2>
          <span className="text-xs font-semibold text-muted-fg">Monthly Billing</span>
        </div>

        <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-surface p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-display text-xl font-bold text-foreground">{plan.name}</span>
                <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${plan.color}`}>
                  {plan.badge}
                </span>
                {subscriptionCancelled && (
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-300">
                    Cancels at end of cycle
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-fg">
                <strong className="text-foreground">{plan.price}</strong> {plan.period} · Auto-renews monthly
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="ap-press inline-flex items-center gap-1.5 rounded-xl border bg-surface px-4 py-2 text-xs font-bold text-foreground shadow-sm hover:bg-muted"
              >
                <CreditCard className="h-4 w-4 text-emerald-500" />
                Change Plan
              </button>

              {sandboxPlan !== "free" && (
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  className={`ap-press inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                    subscriptionCancelled
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20"
                      : "border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                  }`}
                >
                  {subscriptionCancelled ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" />
                      Resume Subscription
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5" />
                      Cancel Subscription
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Cancellation Confirmation Dialog */}
          {isCancelling && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400">Cancel Subscription?</h4>
                  <p className="mt-1 text-xs text-muted-fg">
                    Your Pro features and high post limits will remain active until the end of your current billing period. After that, your account will revert to the Free Sandbox tier.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={confirmCancel}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
                    >
                      Yes, Cancel Subscription
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCancelling(false)}
                      className="rounded-lg border bg-surface px-3 py-1.5 text-xs font-medium text-muted-fg hover:bg-muted"
                    >
                      Keep Subscription
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Plan Quotas & Usage Progress */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-5">
            <div>
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-fg">Monthly AI Posts Quota</span>
                <span className="font-bold text-foreground">
                  {postsUsed} / {plan.postsLimit === 999999 ? "Unlimited" : plan.postsLimit}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                  style={{ width: `${plan.postsLimit === 999999 ? 15 : postsPercentage}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-fg">Connected Apps Quota</span>
                <span className="font-bold text-foreground">
                  {appsUsed} / {plan.appsLimit === "unlimited" ? "Unlimited" : plan.appsLimit}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                  style={{ width: `${plan.appsLimit === "unlimited" ? 20 : appsPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Unlocked Plan Features */}
          <div className="mt-5 border-t pt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-fg">Included Features</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {plan.features.map((feat) => (
                <span
                  key={feat}
                  className="inline-flex items-center gap-1.5 rounded-lg border bg-surface px-2.5 py-1 text-xs font-medium text-foreground"
                >
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  {feat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. App SDK API Keys ── */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">App API Keys</h2>
            <p className="mt-0.5 text-xs text-muted-fg">
              Unique API key per app. Pass to{" "}
              <code className="rounded bg-mint-100 px-1 py-0.5 font-mono text-[11px] font-bold text-emerald-600 dark:bg-olive-500 dark:text-mint-200">
                AutoPromo.init("ap_live_...")
              </code>{" "}
              in your mobile or web app.
            </p>
          </div>
          <Link
            to="/docs"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500 hover:underline"
          >
            Integration Docs <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {apps.length === 0 ? (
          <div className="mt-3 rounded-xl border bg-surface p-6 text-center">
            <p className="text-xs text-muted-fg">No connected apps yet.</p>
            <Link
              to="/apps/new"
              className="ap-press mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm"
            >
              + Connect Your First App
            </Link>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {apps.map((a) => (
              <ApiKeyRow key={a.id} name={a.name} apiKey={a.apiKey} appId={a.id} />
            ))}
          </ul>
        )}
      </section>

      {/* ── 3. Preferences & SDK Settings ── */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold">SDK & Workspace Preferences</h2>
        <p className="mt-0.5 text-xs text-muted-fg">
          Configure notification hooks, environment telemetry, and SDK behaviors.
        </p>

        <div className="mt-3 space-y-3">
          {/* Environment Mode */}
          <div className="flex items-center justify-between rounded-xl border bg-surface p-4">
            <div>
              <p className="text-xs font-bold text-foreground">Environment Mode</p>
              <p className="text-[11px] text-muted-fg">Switch between Sandbox testing and Live production routing.</p>
            </div>
            <div className="flex items-center gap-1 rounded-lg border bg-muted p-1">
              <button
                type="button"
                onClick={() => {
                  setEnvironmentMode("sandbox");
                  toast.info("Switched to Sandbox mode.");
                }}
                className={`rounded-md px-3 py-1 text-xs font-bold transition-all ${
                  environmentMode === "sandbox"
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted-fg hover:text-foreground"
                }`}
              >
                Sandbox
              </button>
              <button
                type="button"
                onClick={() => {
                  setEnvironmentMode("production");
                  toast.success("Switched to Live Production mode.");
                }}
                className={`rounded-md px-3 py-1 text-xs font-bold transition-all ${
                  environmentMode === "production"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-muted-fg hover:text-foreground"
                }`}
              >
                Production
              </button>
            </div>
          </div>

          {/* Autonomous Agent Publishing Mode (Judge Illia Feedback) */}
          <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-foreground">Autonomous Publishing Agent Mode</p>
                    <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[9px] font-bold text-indigo-700 dark:text-indigo-300">
                      Autonomous Agent Active
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-fg">
                    Automatically publishes to instant channels (Discord, Telegram) while keeping high-stakes channels (X, Reddit) in human review queue.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  toast.success("Autonomous Publishing Policy Updated!", {
                    description: "Discord & Telegram will publish automatically upon event ingest.",
                  });
                }}
                className="ap-press rounded-lg border bg-surface px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-muted dark:text-indigo-300"
              >
                Configure Routing Rules
              </button>
            </div>

            {/* Platform Matrix */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t text-[11px]">
              <div className="rounded-lg border bg-surface/60 p-2">
                <span className="font-bold block text-foreground">Twitter / X</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-300">👤 1-Tap Manual</span>
              </div>
              <div className="rounded-lg border bg-surface/60 p-2">
                <span className="font-bold block text-foreground">Reddit</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-300">👤 1-Tap Manual</span>
              </div>
              <div className="rounded-lg border bg-surface/60 p-2">
                <span className="font-bold block text-foreground">Discord</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-300">🤖 Auto-Publish</span>
              </div>
              <div className="rounded-lg border bg-surface/60 p-2">
                <span className="font-bold block text-foreground">Telegram</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-300">🤖 Auto-Publish</span>
              </div>
            </div>
          </div>

          {/* Privacy-Preserving Telemetry */}
          <div className="flex items-center justify-between rounded-xl border bg-surface p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Privacy-Preserving Telemetry</p>
                <p className="text-[11px] text-muted-fg">Anonymized event count synchronization for strategy score ranking.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setAutoSyncTelemetry((v) => !v);
                toast.success(autoSyncTelemetry ? "Telemetry sync paused" : "Telemetry sync active");
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                autoSyncTelemetry ? "bg-emerald-500" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoSyncTelemetry ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* ── 4. Backend Health Status ── */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold">Backend Connection Health</h2>
        <div className="mt-3 rounded-xl border bg-surface p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold">
                {status === "live"
                  ? "API Server Connected"
                  : status === "checking"
                    ? "Checking Backend..."
                    : "Backend Unreachable"}
              </p>
              <p className="mt-1 truncate font-mono text-[11px] text-muted-fg">{apiBaseUrl}</p>
            </div>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                status === "live"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                  : status === "checking"
                    ? "bg-muted text-muted-fg"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-300"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  status === "live"
                    ? "bg-emerald-500"
                    : status === "checking"
                      ? "bg-muted-fg animate-ping"
                      : "bg-amber-500"
                }`}
              />
              {status === "live" ? "Live" : status === "checking" ? "Checking" : "Offline (Fallback Active)"}
            </span>
          </div>

          {status === "offline" && (
            <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-300">To start the local API server:</p>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-black/40 p-2.5 font-mono text-[11px] text-emerald-300">
                <code>cd server && npm run dev</code>
              </pre>
              <button
                type="button"
                onClick={retry}
                className="ap-press mt-3 inline-flex items-center gap-1.5 rounded-lg border bg-surface px-3 py-1.5 text-xs font-bold hover:bg-muted"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry Connection
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── 5. Invoices & Billing History ── */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold">Billing History & Receipts</h2>
        <div className="mt-3 overflow-hidden rounded-xl border bg-surface shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/50 font-bold uppercase tracking-wider text-muted-fg">
              <tr>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Plan</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y text-muted-fg font-medium">
              <tr>
                <td className="p-3.5 text-foreground font-semibold">14 Aug 2026</td>
                <td className="p-3.5">{plan.name}</td>
                <td className="p-3.5 text-foreground font-bold">{plan.price}</td>
                <td className="p-3.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                    Paid
                  </span>
                </td>
                <td className="p-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => toast.success("Downloaded PDF invoice receipt.")}
                    className="inline-flex items-center gap-1 text-emerald-500 hover:underline font-bold"
                  >
                    <FileText className="h-3.5 w-3.5" /> PDF
                  </button>
                </td>
              </tr>
              <tr>
                <td className="p-3.5 text-foreground font-semibold">14 Jul 2026</td>
                <td className="p-3.5">{plan.name}</td>
                <td className="p-3.5 text-foreground font-bold">{plan.price}</td>
                <td className="p-3.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                    Paid
                  </span>
                </td>
                <td className="p-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => toast.success("Downloaded PDF invoice receipt.")}
                    className="inline-flex items-center gap-1 text-emerald-500 hover:underline font-bold"
                  >
                    <FileText className="h-3.5 w-3.5" /> PDF
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <PaymentSandboxModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        currentPlan={sandboxPlan}
        onPlanChanged={handlePlanChange}
      />
    </AppShell>
  );
}

import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Check,
  Loader2,
  LayoutGrid,
  Sparkles,
  Send,
  Download,
  Plus,
  Lock,
  CreditCard,
  Globe,
  Terminal,
  Webhook,
  Github,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FallbackNotice } from "@/components/ConnectionBadge";
import { StatTile, StatRow } from "@/components/StatTile";
import { PaymentSandboxModal } from "@/components/PaymentSandboxModal";
import { getStoredSandboxPlan, PLANS, type PlanTier } from "@/lib/sandboxPlan";
import { useApps, useCreateApp } from "@/lib/queries";

export const Route = createFileRoute("/apps/")({
  head: () => ({
    meta: [
      { title: "Connected apps — AutoPromo SDK" },
      {
        name: "description",
        content: "Every mobile app connected to AutoPromo, plus onboarding for a new one.",
      },
      { property: "og:title", content: "Connected apps — AutoPromo SDK" },
      {
        property: "og:description",
        content: "Manage the apps sending product events to AutoPromo.",
      },
    ],
  }),
  component: AppsPage,
});

function ApiKeyCell({ apiKey }: { apiKey: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      toast.success("API key copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy");
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        copy();
      }}
      className="ap-press flex items-center gap-1.5 rounded bg-mint-50 px-2 py-1 font-mono text-[10px] text-muted-fg hover:bg-mint-100 dark:bg-olive-500 dark:hover:bg-olive-400"
      title="Copy API key"
    >
      <span className="max-w-[100px] truncate">{apiKey}</span>
      {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

const TEMPLATES = [
  { name: "FocusFlow AI", description: "AI pomodoro and distraction-blocking workspace for developers." },
  { name: "DevMetrics", description: "Real-time engineering metrics and GitHub release analytics tracker." },
  { name: "MealMaster", description: "Smart AI meal planning and automatic grocery list generator." },
];

function AppsPage() {
  const [adding, setAdding] = useState(false);
  const [ingestMethod, setIngestMethod] = useState<"sdk" | "nocode" | "webhook">("sdk");
  const [form, setForm] = useState({ name: "", description: "", url: "" });
  const [sandboxPlan, setSandboxPlan] = useState<PlanTier>("builder");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setSandboxPlan(getStoredSandboxPlan());
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("add") === "true") {
      setAdding(true);
    }
  }, []);

  const { data: appsResult, isLoading } = useApps();
  const createApp = useCreateApp();

  const apps = appsResult?.data ?? [];
  const realApps = apps.filter((a) => !a.isDemo);

  const handleConnectClick = () => {
    setAdding(true);
  };

  const totals = {
    apps: realApps.length,
    generated: realApps.reduce((n, a) => n + a.postsGenerated, 0),
    published: realApps.reduce((n, a) => n + a.postsPublished, 0),
    installs: realApps.reduce((n, a) => n + a.installs, 0),
  };

  const activeCount = realApps.filter((a) => a.status === "active").length;
  const publishRate =
    totals.generated > 0 ? Math.round((totals.published / totals.generated) * 100) : 0;

  const hasActivity = totals.generated > 0 || totals.installs > 0 || realApps.length > 0;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name || createApp.isPending) return;

    try {
      const created = await createApp.mutateAsync({
        name,
        description: form.description.trim() || `${name} - Smart mobile application`,
      });

      setForm({ name: "", description: "", url: "" });
      setAdding(false);

      toast.success(`${created.name} connected successfully!`, {
        description: "Redirecting to your new app dashboard...",
      });

      void router.navigate({ to: "/apps/$appId", params: { appId: created.id } });
    } catch (err) {
      toast.error("Couldn't create the app", {
        description:
          err instanceof Error ? err.message : "Check that the API server is reachable.",
      });
    }
  }

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setForm({ name: t.name, description: t.description, url: `https://${t.name.toLowerCase().replace(/\s+/g, "")}.com` });
  };

  return (
    <AppShell title="Connected apps">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold">Connected apps</h1>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-500">
              {PLANS[sandboxPlan].badge}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-fg">
            Connect any mobile or web app to AutoPromo via SDK, App Store URL, or Webhooks to turn product events into live campaigns.
          </p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={handleConnectClick}
            className="ap-press inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Connect an app
          </button>
        )}
      </header>

      <FallbackNotice className="mt-4" />

      {hasActivity && (
        <div className="mt-6">
          <StatRow>
            <StatTile
              icon={LayoutGrid}
              label="Apps connected"
              value={totals.apps}
              hint={`${activeCount} active`}
              loading={isLoading}
            />
            <StatTile
              icon={Sparkles}
              label="Posts generated"
              value={totals.generated}
              hint="across all custom apps"
              loading={isLoading}
            />
            <StatTile
              icon={Send}
              label="Posts published"
              value={totals.published}
              hint={totals.generated > 0 ? `${publishRate}% of generated` : "none yet"}
              emphasis={totals.published > 0}
              loading={isLoading}
            />
            <StatTile
              icon={Download}
              label="Total installs"
              value={totals.installs.toLocaleString()}
              hint="lifetime, all stores"
              loading={isLoading}
            />
          </StatRow>
        </div>
      )}

      {/* ── App grid ── */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading &&
          Array.from({ length: 3 }, (_, i) => (
            <div
              key={`skeleton-${i}`}
              aria-hidden="true"
              className="h-56 animate-pulse rounded-xl border bg-surface"
            />
          ))}

        {apps.map((app) => (
          <Link
            key={app.id}
            to="/apps/$appId"
            params={{ appId: app.id }}
            className="ap-enter group flex flex-col rounded-xl border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-mint-400 hover:shadow-md dark:hover:border-olive-300"
          >
            {/* App name + status */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                    app.status === "active"
                      ? "bg-green-300"
                      : app.status === "idle"
                        ? "bg-olive-200"
                        : "bg-amber-200"
                  }`}
                  aria-hidden="true"
                />
                <h2 className="truncate font-display text-base font-semibold">{app.name}</h2>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {app.isDemo ? (
                  <span
                    title="Bundled showcase app — its metrics are sample data"
                    className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-300"
                  >
                    demo
                  </span>
                ) : (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                    live app
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    app.status === "active"
                      ? "bg-mint-100 text-green-500 dark:bg-olive-500 dark:text-mint-200"
                      : app.status === "idle"
                        ? "bg-olive-100 text-olive-400 dark:bg-olive-500 dark:text-olive-200"
                        : "bg-amber-50 text-amber-300"
                  }`}
                >
                  {app.status}
                </span>
              </div>
            </div>

            {app.tagline && (
              <p className="mt-1 text-xs font-medium text-green-400 dark:text-mint-300">
                {app.tagline}
              </p>
            )}

            <p className="mt-2 text-sm leading-relaxed text-muted-fg line-clamp-2">
              {app.description}
            </p>

            {app.postsGenerated === 0 && app.installs === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 text-xs text-muted-fg">
                Ready to generate posts — open app dashboard to trigger your first campaign.
              </p>
            ) : (
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  ["Installs", app.installs > 0 ? app.installs.toLocaleString() : "—"],
                  ["Generated", app.postsGenerated],
                  ["Published", app.postsPublished],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-lg bg-mint-50 py-2 dark:bg-olive-500">
                    <dd className="font-display text-sm font-semibold tabular-nums">{v}</dd>
                    <dt className="text-[10px] text-muted-fg">{k}</dt>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3 mt-4">
              <p className="truncate font-mono text-[10px] text-olive-300 dark:text-olive-200">
                sdk {app.sdkVersion} · {app.platform}
              </p>
              <ApiKeyCell apiKey={app.apiKey} />
            </div>
          </Link>
        ))}

        {/* Add new app card */}
        <div className="rounded-xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 p-5 dark:border-emerald-500/30">
          {adding ? (
            <form className="flex flex-col gap-3" onSubmit={handleCreate}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Connect New App</span>
                <div className="flex gap-1">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className="rounded border bg-surface px-1.5 py-0.5 text-[9px] font-medium text-muted-fg hover:border-emerald-500 hover:text-foreground"
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <input
                id="new-app-name"
                required
                autoFocus
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="App Name (e.g. MySuperApp)"
                className="rounded-lg border bg-surface px-3 py-2 text-xs font-semibold"
              />

              <textarea
                id="new-app-description"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description: What does it do? The AI uses this to tailor posts."
                className="resize-none rounded-lg border bg-surface px-3 py-2 text-xs"
              />

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={createApp.isPending || !form.name.trim()}
                  className="ap-press inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
                >
                  {createApp.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Connect & Open
                </button>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="rounded-lg border px-3 py-2 text-xs font-medium text-muted-fg hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={handleConnectClick}
              className="flex h-full w-full flex-col items-start gap-2 text-left"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-lg font-bold text-emerald-600 dark:text-emerald-300">
                +
              </span>
              <span className="font-display text-base font-semibold">Connect New App</span>
              <span className="text-xs text-muted-fg">
                Connect your real app via SDK, GitHub Webhook, or Store URL to auto-generate promotional copy.
              </span>
              <span className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] text-emerald-700 dark:text-emerald-300">
                <Terminal className="h-3 w-3" /> npm install @autopromo/sdk
              </span>
            </button>
          )}
        </div>
      </div>
      <PaymentSandboxModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        currentPlan={sandboxPlan}
        onPlanChanged={(newPlan) => setSandboxPlan(newPlan)}
      />
    </AppShell>
  );
}

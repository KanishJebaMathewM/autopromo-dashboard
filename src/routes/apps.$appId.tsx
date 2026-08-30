import { createFileRoute, Link, notFound, Outlet, useChildMatches } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Zap,
  Copy,
  Check,
  Inbox,
  Loader2,
  Download,
  Sparkles,
  Send,
  Star,
  Wand2,
  CreditCard,
  Lock,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { PostCardSkeletonGrid } from "@/components/PostCardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { StatTile, StatRow } from "@/components/StatTile";
import { EventTimeline, type TimelineItem } from "@/components/EventTimeline";
import { StatsChart } from "@/components/StatsChart";
import { FallbackNotice } from "@/components/ConnectionBadge";
import { CreateAdModal } from "@/components/CreateAdModal";
import { CreatePostModal } from "@/components/CreatePostModal";
import { GrowthCopilot } from "@/components/GrowthCopilot";
import { PaymentSandboxModal } from "@/components/PaymentSandboxModal";
import { getStoredSandboxPlan, PLANS, isPostLimitReached, type PlanTier } from "@/lib/sandboxPlan";
import { useDarkMode } from "@/hooks/useDarkMode";
import { isSeedApp, useApp, useMarkChosen, usePosts, useTrackEvent } from "@/lib/queries";
import { toWireEvent } from "@/lib/adapters";
import {
  EVENTS,
  PLATFORMS,
  activity,
  getApp,
  getReviews,
  platformStats,
  toneStats,
  type EventType,
  type Platform,
  type Post,
} from "@/lib/mockData";

export const Route = createFileRoute("/apps/$appId")({
  loader: ({ params }) => {
    // Seed apps resolve here for instant meta tags; live apps load in the
    // component and may legitimately not be in the seed set.
    return { seedApp: getApp(params.appId) ?? null };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.seedApp?.name ?? "App";
    return {
      meta: [
        { title: `${name} — AutoPromo dashboard` },
        {
          name: "description",
          content: `Ranked, AI-generated promo posts for ${name}, ready to publish to Twitter, Reddit, WhatsApp, LinkedIn, Telegram and Facebook.`,
        },
        { property: "og:title", content: `${name} — AutoPromo dashboard` },
        {
          property: "og:description",
          content: `Ranked promo posts and strategy-engine stats for ${name}.`,
        },
      ],
    };
  },
  component: Dashboard,
});

/** Returns payloads sent to POST /api/event customized for each specific app. */
function getAppEventPayload(app: App | undefined, eventType: EventType): Record<string, unknown> {
  const appId = app?.id;
  const name = app?.name ?? "App";

  if (appId === "demo-app") {
    switch (eventType) {
      case "Launch": return { stores: ["ios", "android"], category: "Food & Drink" };
      case "Milestone": return { label: "1,000 fridge scans", count: 1000 };
      case "New version": return { build: "1.2.0", notes: "Offline CRDT pantry sync & MobileNetV3 ingredient detection" };
      case "New review": return { rating: 5, text: "Used it four nights in a row and didn't order takeaway once!" };
    }
  } else if (appId === "focus-timer") {
    switch (eventType) {
      case "Launch": return { stores: ["android", "ios"], platform: "React Native" };
      case "Milestone": return { label: "5,000 completed sessions", count: 5000 };
      case "New version": return { build: "2.0.0", notes: "Custom app blocklists & weekly focus analytics report" };
      case "New review": return { rating: 5, text: "First timer app I haven't uninstalled by Wednesday." };
    }
  } else if (appId === "habit-tracker") {
    switch (eventType) {
      case "Launch": return { stores: ["ios", "android"], platform: "Flutter" };
      case "Milestone": return { label: "250 active squad teams", count: 250 };
      case "New version": return { build: "1.4.0", notes: "Monthly cover days & shareable squad invite links" };
      case "New review": return { rating: 5, text: "My squad noticed I had stopped before I did!" };
    }
  } else if (appId === "splitbill") {
    switch (eventType) {
      case "Launch": return { stores: ["ios"], platform: "Swift" };
      case "Milestone": return { label: "500 restaurant bills split", count: 500 };
      case "New version": return { build: "1.1.0", notes: "On-device receipt OCR update & tip splitting algorithm" };
      case "New review": return { rating: 5, text: "Paid off the whole table before the waiter came back!" };
    }
  } else if (appId === "nightsky") {
    switch (eventType) {
      case "Launch": return { stores: ["android", "ios"], platform: "Unity" };
      case "Milestone": return { label: "10,000 stars plate-solved", count: 10000 };
      case "New version": return { build: "1.0.4", notes: "Offline 12MB star catalogue update & Starlink TLE refresh" };
      case "New review": return { rating: 5, text: "Took it camping with zero signal and my kids identified 6 constellations!" };
    }
  }

  // Generic fallback for custom created apps
  switch (eventType) {
    case "Launch": return { stores: ["ios", "android"], appName: name };
    case "Milestone": return { label: "1,000 active users", count: 1000 };
    case "New version": return { build: "2.0.0", notes: `Major update for ${name}` };
    case "New review": return { rating: 5, text: `Loving using ${name} every day!` };
  }
}

/** Views available in the sidebar's strategy-engine card. */
const SIDEBAR_TABS = ["platform", "tone", "week"] as const;
type SidebarTab = (typeof SIDEBAR_TABS)[number];

/* -------------------------------------------------------------------------- */

function ScoreBar({
  label,
  pct,
  chosen,
  shown,
}: {
  label: string;
  pct: number;
  chosen: number;
  shown: number;
}) {
  return (
    <li>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span
          className="cursor-help font-mono text-olive-300 dark:text-mint-200"
          title={`base_weight + 0.5 × (${chosen}/${shown} chosen)`}
        >
          {chosen}/{shown}
        </span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-mint-200 dark:bg-olive-400">
        <div
          className="h-2 rounded-full bg-green-300 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}

function SuggestedReplyCard({ replyText }: { replyText: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(replyText);
      setCopied(true);
      toast.success("Reply copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy — select the text instead");
    }
  }

  return (
    <article className="ap-enter col-span-full flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-200/30 dark:bg-olive-500">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs text-amber-300">
          ★
        </span>
        <span className="font-display text-sm font-semibold">Suggested reply to reviewer</span>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
          review response
        </span>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-line text-muted-fg">{replyText}</p>
      <div className="mt-auto pt-1">
        <button
          type="button"
          onClick={copy}
          className="ap-press inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-mint-100 dark:hover:bg-olive-400"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied ✓" : "Copy reply"}
        </button>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */

function Dashboard() {
  const { appId } = Route.useParams();
  const childMatches = useChildMatches();
  const dark = useDarkMode();

  const { data: appResult, isLoading: appLoading } = useApp(appId);
  const { data: postsResult, isLoading: postsLoading } = usePosts(appId);
  const trackEvent = useTrackEvent(appId);
  const markChosen = useMarkChosen(appId);

  const [filterEvent, setFilterEvent] = useState<EventType | "All">("All");
  const [filterPlatform, setFilterPlatform] = useState<Platform | "All">("All");
  const [lastTriggered, setLastTriggered] = useState<EventType | null>(null);
  const [replyDraft, setReplyDraft] = useState<string | null>(null);
  const [sideTab, setSideTab] = useState<SidebarTab>("platform");
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [sandboxPlan, setSandboxPlan] = useState<PlanTier>("builder");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    setSandboxPlan(getStoredSandboxPlan());
  }, []);

  if (childMatches.length > 0) {
    return <Outlet />;
  }

  const app = appResult?.data;
  const allPosts = useMemo(() => postsResult?.data ?? [], [postsResult]);

  const posts = useMemo(
    () =>
      allPosts
        .filter(
          (p) =>
            (filterEvent === "All" || p.event === filterEvent) &&
            (filterPlatform === "All" || p.platform === filterPlatform),
        )
        .sort((a, b) => b.score - a.score),
    [allPosts, filterEvent, filterPlatform],
  );

  /** Groups posts by their originating event to build the timeline. */
  const timeline = useMemo<TimelineItem[]>(() => {
    const groups = new Map<string, Post[]>();
    for (const p of allPosts) {
      const key = p.eventId ?? `seed-${p.event}`;
      const list = groups.get(key);
      if (list) list.push(p);
      else groups.set(key, [p]);
    }

    return [...groups.entries()]
      .map(([id, group]) => ({
        id,
        event: group[0]!.event,
        time: group[0]!.createdAt,
        variants: group.length,
        published: group.filter((p) => p.chosen).length,
      }))
      .sort((a, b) => b.time.localeCompare(a.time))
      .slice(0, 8);
  }, [allPosts]);

  // Prefer counts derived from the posts actually loaded; fall back to the
  // app record's totals when there are none (e.g. a brand-new live app).
  const generated = allPosts.length || app?.postsGenerated || 0;
  const published = allPosts.filter((p) => p.chosen).length || app?.postsPublished || 0;
  const publishRate = generated > 0 ? Math.round((published / generated) * 100) : 0;

  async function handleTrigger(eventType: EventType) {
    setLastTriggered(eventType);
    setReplyDraft(null);

    try {
      const result = await trackEvent.mutateAsync({
        type: toWireEvent(eventType),
        payload: getAppEventPayload(app, eventType),
      });

      if (result.replyDraft) setReplyDraft(result.replyDraft);

      toast.success(`${result.generated ?? 0} posts generated for "${eventType}"`, {
        description: "Strategy engine ranked them — top pick shown first.",
      });
    } catch (err) {
      toast.error("Event failed", {
        description:
          err instanceof Error ? err.message : "Check that the API server in server/ is running.",
      });
    }
  }

  function handlePublish(post: Post) {
    markChosen.mutate(post, {
      onError: () => {
        // The compose window already opened, so this is informational only.
        toast.error("Couldn't record the choice", {
          description: "The post still opened — only the strategy stats are affected.",
        });
      },
    });
  }

  /**
   * platformStats / toneStats / activity / reviews only exist in the bundled
   * demo dataset. For a real app they are simply absent — showing another
   * app's numbers would present fabricated metrics as real telemetry.
   */
  const isDemo = app?.isDemo ?? isSeedApp(appId);
  const stats = isDemo ? (platformStats[appId] ?? []) : [];
  const tones = isDemo ? (toneStats[appId] ?? []) : [];
  const week = isDemo ? (activity[appId] ?? []) : [];
  const reviews = isDemo ? getReviews(appId) : [];

  const showReplyCard =
    replyDraft !== null ||
    ((lastTriggered === "New review" || filterEvent === "New review") && posts.length > 0);

  const replyText =
    replyDraft ??
    "Thanks so much for the kind words — hearing this from real users is what keeps us going. If you ever run into anything or have a feature request, drop us a line at support@autopromo.app 🙏";

  if (appLoading) {
    return (
      <AppShell title="Loading">
        <div className="h-8 w-56 animate-pulse rounded bg-mint-200 dark:bg-olive-400" />
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border bg-surface" />
          ))}
        </div>
        <div className="mt-6">
          <PostCardSkeletonGrid />
        </div>
      </AppShell>
    );
  }

  if (!app) throw notFound();

  return (
    <AppShell title={app.name} liveAppId={app.id}>
      {/* ── Header ── */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-2xl font-bold">{app.name}</h1>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                app.status === "active"
                  ? "bg-mint-100 text-green-500 dark:bg-olive-500 dark:text-mint-200"
                  : app.status === "idle"
                    ? "bg-olive-100 text-olive-400 dark:bg-olive-500 dark:text-olive-200"
                    : "bg-amber-50 text-amber-300"
              }`}
            >
              {app.status}
            </span>
            {isDemo && (
              <span
                title="Bundled showcase app — its installs, rating and reviews are sample data"
                className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-300"
              >
                demo
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-fg">{app.description}</p>
          <p className="mt-1 font-mono text-[11px] text-olive-300 dark:text-olive-200">
            sdk {app.sdkVersion} · {app.platform} · connected {app.connectedAt}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAdModalOpen(true)}
            className="ap-press inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover shadow-sm"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Create ad
          </button>
          <Link
            to="/docs"
            className="ap-press rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-mint-100 dark:hover:bg-olive-500"
          >
            Integration guide
          </Link>
        </div>
      </header>

      <FallbackNotice className="mt-4" />

      {/* ── Monthly Post Allowance Progress Bar ── */}
      <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-300">
              {PLANS[sandboxPlan].badge}
            </span>
            <span className="text-xs font-semibold">
              Monthly Post Allowance: {app.postsGenerated} / {PLANS[sandboxPlan].postsLimit === 999999 ? "∞ Unlimited" : PLANS[sandboxPlan].postsLimit}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="ap-press inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Manage Sandbox Plan ({PLANS[sandboxPlan].name})
          </button>
        </div>
        {PLANS[sandboxPlan].postsLimit !== 999999 && (
          <div className="mt-2 h-1.5 w-full rounded-full bg-emerald-500/10">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
              style={{
                width: `${Math.min(100, (app.postsGenerated / PLANS[sandboxPlan].postsLimit) * 100)}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="mt-6">
        <StatRow>
          <StatTile
            icon={Download}
            label="Installs"
            value={app.installs > 0 ? app.installs.toLocaleString() : "—"}
            hint={
              app.installs > 0
                ? "lifetime, all stores"
                : "connect a store to report installs"
            }
          />
          <StatTile
            icon={Sparkles}
            label="Posts generated"
            value={generated}
            hint={`across ${timeline.length || 0} ${timeline.length === 1 ? "event" : "events"}`}
          />
          <StatTile
            icon={Send}
            label="Posts published"
            value={published}
            hint={generated > 0 ? `${publishRate}% of generated` : "none yet"}
            emphasis={published > 0}
          />
          <StatTile
            icon={Star}
            label="Store rating"
            value={app.rating ? app.rating.toFixed(1) : "—"}
            unit={app.rating ? "/ 5" : undefined}
            hint={reviews.length > 0 ? `${reviews.length} recent reviews` : "no reviews synced"}
          />
        </StatRow>
      </div>

      {/* A live app has no store telemetry wired up — say so once, plainly,
          instead of leaving dashes unexplained. */}
      {!isDemo && (
        <p className="mt-2 text-xs text-muted-fg">
          Installs and store rating need an App Store / Play Store connection — AutoPromo only
          receives the product events your SDK sends.
        </p>
      )}

      {/* ── Proactive Growth Copilot & Anti-Spam Guard ── */}
      <GrowthCopilot
        app={app}
        onTriggerEvent={(evt) => void handleTrigger(evt)}
        onOpenCreateModal={() => setIsCreatePostModalOpen(true)}
      />

      {/* ── Trigger event bar ── */}
      <section
        aria-label="Generate AI posts and threads"
        className="mt-6 rounded-xl border border-mint-300 bg-mint-50/60 p-4.5 dark:border-olive-400 dark:bg-olive-500 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-mint-100 text-green-500 dark:bg-olive-400 dark:text-mint-200">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="font-display text-sm font-semibold">Generate AI Posts & Threads</h2>
            </div>
            <p className="mt-1 text-xs text-muted-fg">
              Type custom release notes, pick target platforms (Twitter/X, LinkedIn, Reddit, WhatsApp, Telegram, Facebook), and let AI generate tailored threads.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreatePostModalOpen(true)}
            className="ap-press inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            <Sparkles className="h-3.5 w-3.5 text-mint-300" />
            Create Custom Post / Thread
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-fg">Quick SDK Triggers:</span>
          {EVENTS.map((e) => {
            const pending = trackEvent.isPending && lastTriggered === e;
            return (
              <button
                key={e}
                type="button"
                disabled={trackEvent.isPending}
                onClick={() => handleTrigger(e)}
                className={`ap-press inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 ${
                  lastTriggered === e
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 shadow-sm"
                    : "border-border bg-surface text-muted-fg hover:border-emerald-500/50 hover:bg-muted"
                }`}
              >
                {pending ? (
                  <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />
                ) : (
                  <Zap className="h-3 w-3 text-emerald-500" />
                )}
                {e}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Filter bar ── */}
      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-b pb-3">
        <span className="text-xs font-medium text-muted-fg">Filter</span>

        <label className="sr-only" htmlFor="filter-event">
          Filter by event
        </label>
        <select
          id="filter-event"
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value as EventType | "All")}
          className="cursor-pointer rounded-lg border bg-surface px-3 py-1.5 text-sm transition-colors hover:border-mint-400 dark:hover:border-olive-300"
        >
          <option value="All">All events</option>
          {EVENTS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="filter-platform">
          Filter by platform
        </label>
        <select
          id="filter-platform"
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value as Platform | "All")}
          className="cursor-pointer rounded-lg border bg-surface px-3 py-1.5 text-sm transition-colors hover:border-mint-400 dark:hover:border-olive-300"
        >
          <option value="All">All platforms</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {(filterEvent !== "All" || filterPlatform !== "All") && (
          <button
            type="button"
            onClick={() => {
              setFilterEvent("All");
              setFilterPlatform("All");
            }}
            className="ap-press rounded-lg px-2 py-1 text-xs font-medium text-green-500 transition-colors hover:bg-mint-100 dark:text-mint-200 dark:hover:bg-olive-500"
          >
            Clear
          </button>
        )}

        <span aria-live="polite" className="ml-auto text-xs tabular-nums text-muted-fg">
          {posts.length}
          {posts.length !== allPosts.length && ` of ${allPosts.length}`} ranked{" "}
          {posts.length === 1 ? "post" : "posts"}
        </span>
      </div>

      {/* ── Main content ── */}
      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
          {postsLoading ? (
            <PostCardSkeletonGrid />
          ) : posts.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={
                allPosts.length === 0 ? "No posts generated yet" : "No posts match this filter"
              }
              body={
                allPosts.length === 0
                  ? "Fire an event above and the AI-generated variants will appear here, ranked best first."
                  : "Try a different event or platform, or clear the filters."
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {showReplyCard && <SuggestedReplyCard replyText={replyText} />}
              {posts.map((p, i) => (
                <PostCard
                  key={p.id}
                  post={p}
                  appUrl={app.url}
                  topPick={!showReplyCard && i === 0}
                  stats={stats}
                  onPublish={handlePublish}
                />
              ))}
            </div>
          )}

          {/* ── Event history ── */}
          {timeline.length > 0 && (
            <>
              <h2 className="mt-10 font-display text-lg font-semibold">Event history</h2>
              <p className="mt-1 mb-4 text-sm text-muted-fg">
                Each product moment and what it produced.
              </p>
              <EventTimeline items={timeline} appId={app.id} />
            </>
          )}

          {/* ── Reviews ── */}
          {reviews.length > 0 && (
            <>
              <h2 className="mt-10 font-display text-lg font-semibold">Recent store reviews</h2>
              <ul className="mt-3 grid gap-3 md:grid-cols-2">
                {reviews.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border bg-surface p-4 transition-colors hover:border-mint-400 dark:hover:border-olive-300"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">@{r.author}</span>
                      <span className="text-amber-300">{"★".repeat(r.rating)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-fg">{r.body}</p>
                    <p className="mt-2 font-mono text-[11px] text-olive-300 dark:text-olive-200">
                      {r.store} · {r.date}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* ── Sidebar ── */}
        <aside className="min-w-0 space-y-4 xl:sticky xl:top-20">
          {/* Strategy engine — tabbed so platform / tone / week share one card
              instead of three stacked boxes repeating the same numbers. */}
          <div className="overflow-hidden rounded-xl border bg-surface">
            <div className="border-b bg-mint-50 px-4 py-3 dark:bg-olive-500">
              <h2 className="font-display text-sm font-semibold">Strategy engine</h2>
              <p className="mt-0.5 text-xs text-muted-fg">
                What your team publishes gets ranked higher.
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Strategy engine views"
              className="flex border-b text-xs"
            >
              {SIDEBAR_TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={sideTab === t}
                  onClick={() => setSideTab(t)}
                  className={`flex-1 px-2 py-2 font-medium capitalize transition-colors ${
                    sideTab === t
                      ? "border-b-2 border-green-400 text-green-500 dark:border-mint-300 dark:text-mint-200"
                      : "text-muted-fg hover:bg-mint-50 dark:hover:bg-olive-500"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="p-4">
              {sideTab === "platform" &&
                (stats.length === 0 ? (
                  <p className="text-xs text-muted-fg">
                    No signal yet — publish a post to start teaching it.
                  </p>
                ) : (
                  <>
                    <ul className="space-y-3">
                      {stats.map((s) => (
                        <ScoreBar
                          key={s.platform}
                          label={s.platform}
                          pct={Math.round((s.chosen / Math.max(s.shown, 1)) * 100)}
                          chosen={s.chosen}
                          shown={s.shown}
                        />
                      ))}
                    </ul>
                    <p className="mt-4 border-t pt-3 font-mono text-[10px] leading-relaxed text-muted-fg">
                      score = base_weight(event, platform)
                      <br />
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.5 × (chosen / shown)
                    </p>
                  </>
                ))}

              {sideTab === "tone" &&
                (tones.length === 0 ? (
                  <p className="text-xs text-muted-fg">No tone data yet.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {tones.map((t) => {
                      const pct = Math.round((t.chosen / Math.max(t.shown, 1)) * 100);
                      return (
                        <li key={t.tone}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="capitalize">{t.tone}</span>
                            <span
                              className="cursor-help font-mono text-olive-300 dark:text-olive-200"
                              title={`${t.chosen} published of ${t.shown} shown`}
                            >
                              {pct}%
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 w-full rounded-full bg-mint-200 dark:bg-olive-400">
                            <div
                              className="h-1.5 rounded-full bg-green-200 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ))}

              {sideTab === "week" &&
                (week.length === 0 ? (
                  <p className="text-xs text-muted-fg">No activity recorded this week.</p>
                ) : (
                  <>
                    <ul className="space-y-2">
                      {week.map((d) => {
                        const max = Math.max(...week.map((w) => w.generated), 1);
                        return (
                          <li key={d.day} className="flex items-center gap-2 text-xs">
                            <span className="w-8 shrink-0 text-muted-fg">{d.day}</span>
                            <span className="flex h-4 flex-1 overflow-hidden rounded-sm bg-mint-100 dark:bg-olive-400">
                              <span
                                className="bg-mint-300 transition-all duration-500"
                                style={{ width: `${(d.generated / max) * 100}%` }}
                                title={`${d.generated} generated`}
                              />
                              <span
                                className="bg-green-300 transition-all duration-500"
                                style={{ width: `${(d.published / max) * 100}%` }}
                                title={`${d.published} published`}
                              />
                            </span>
                            <span className="w-11 shrink-0 text-right font-mono text-[11px] text-muted-fg">
                              {d.published}/{d.generated}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-3 border-t pt-3 text-[11px] text-muted-fg">
                      <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-mint-300" />
                      Generated
                      <span className="mr-1 ml-3 inline-block h-2 w-2 rounded-sm bg-green-300" />
                      Published
                    </p>
                  </>
                ))}
            </div>

            <Link
              to="/analytics"
              className="block border-t px-4 py-2.5 text-xs font-medium text-green-500 transition-colors hover:bg-mint-50 dark:text-mint-200 dark:hover:bg-olive-500"
            >
              Full analytics →
            </Link>
          </div>

          {/* Learning signal chart */}
          {stats.length > 0 && (
            <div className="rounded-xl border bg-surface p-4">
              <h2 className="mb-3 font-display text-sm font-semibold">Learning signal</h2>
              <StatsChart stats={stats} dark={dark} />
            </div>
          )}
        </aside>
      </div>
      <CreateAdModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        defaultAppId={app.id}
      />
      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        appId={app.id}
        appName={app.name}
      />
      <PaymentSandboxModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        currentPlan={sandboxPlan}
        onPlanChanged={(newPlan) => setSandboxPlan(newPlan)}
      />
    </AppShell>
  );
}

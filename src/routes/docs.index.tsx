import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Terminal, Sparkles, Copy, Download, Code, CheckCircle2, Rocket, Star, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { snippets } from "@/lib/mockData";
import { AutoPromo, type EventType, type GeneratedPost } from "@/lib/sdk";

export const Route = createFileRoute("/docs/")({
  head: () => ({
    meta: [
      { title: "SDK Integration & Playground — AutoPromo SDK" },
      {
        name: "description",
        content:
          "Install @autopromo/sdk, test product events live in the interactive playground, and copy production snippets.",
      },
    ],
  }),
  component: DocsPage,
});

function DocsPage() {
  const [active, setActive] = useState(snippets[0]?.id ?? "");
  const [sdkInitialized, setSdkInitialized] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedPosts, setSimulatedPosts] = useState<GeneratedPost[]>([]);
  const [lastEventFired, setLastEventFired] = useState<string | null>(null);

  const handleDownloadSdk = async () => {
    try {
      // Fetch the SDK source file content at build time via dynamic import
      const sdkModule = await import("@/lib/sdk?raw");
      const content: string = (sdkModule as { default: string }).default;
      const blob = new Blob([content], { type: "text/typescript" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "sdk.ts";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("SDK downloaded as sdk.ts!");
    } catch {
      toast.error("Download failed — copy the file from src/lib/sdk.ts manually.");
    }
  };

  const snippet = snippets.find((s) => s.id === active) ?? snippets[0];

  const handleInitSdk = () => {
    AutoPromo.init({ appId: "pocket-recipe", apiUrl: "http://localhost:3001" });
    setSdkInitialized(true);
    toast.success("SDK Initialized!", {
      description: "App ID: pocket-recipe · Connected to http://localhost:3001",
    });
  };

  const handleSimulateEvent = async (type: EventType, payload: Record<string, unknown>, label: string) => {
    if (!sdkInitialized) {
      handleInitSdk();
    }

    setIsSimulating(true);
    setLastEventFired(label);

    try {
      const res = await AutoPromo.trackEvent(type, payload);
      setIsSimulating(false);

      if (res.posts && res.posts.length > 0) {
        setSimulatedPosts(res.posts);
        toast.success(`🎉 Event Fired: ${label}`, {
          description: `Generated ${res.posts.length} promotional post variants for ${res.posts[0].platform}!`,
        });
      } else {
        toast.success(`Event Fired: ${label}`);
      }
    } catch {
      setIsSimulating(false);
      toast.error("SDK Simulation Failed — Backend Offline");
    }
  };

  return (
    <AppShell title="SDK Integration & Playground">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">SDK Integration & Playground</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-fg">
            Install <code className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-300">@autopromo/sdk</code> in your mobile or web app, emit product events, and test live in the interactive playground below.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadSdk}
          className="ap-press inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20"
        >
          <Download className="h-4 w-4" />
          Download SDK Package (sdk.ts)
        </button>
      </div>

      {/* ── Interactive SDK Test Playground ── */}
      <section className="mt-8 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-background p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold">SDK Live Test Playground</h2>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  sdkInitialized ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300" : "bg-muted text-muted-fg"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${sdkInitialized ? "bg-emerald-500 animate-pulse" : "bg-muted-fg"}`} />
                  {sdkInitialized ? "SDK ACTIVE (pocket-recipe)" : "NOT INITIALIZED"}
                </span>
              </div>
              <p className="text-xs text-muted-fg">Click an event button below to simulate your host application firing SDK events</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInitSdk}
            className="ap-press inline-flex items-center gap-1.5 rounded-lg border bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-muted"
          >
            <RefreshCw className="h-3.5 w-3.5 text-emerald-500" />
            AutoPromo.init()
          </button>
        </div>

        {/* Live Simulator Buttons */}
        <div className="mt-6">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-fg">
            Simulate SDK Event Calls:
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              disabled={isSimulating}
              onClick={() => handleSimulateEvent("launch", { tag: "V1 Launch" }, "App Launch")}
              className="ap-press flex flex-col items-start rounded-xl border border-emerald-500/20 bg-surface p-3.5 text-left transition-all hover:border-emerald-500 hover:bg-emerald-500/10"
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <Rocket className="h-4 w-4 text-emerald-500" />
                App Launch Event
              </div>
              <p className="mt-1 font-mono text-[10px] text-muted-fg">AutoPromo.trackEvent('launch')</p>
            </button>

            <button
              type="button"
              disabled={isSimulating}
              onClick={() => handleSimulateEvent("milestone", { downloads: 1000 }, "1K Downloads Milestone")}
              className="ap-press flex flex-col items-start rounded-xl border border-emerald-500/20 bg-surface p-3.5 text-left transition-all hover:border-emerald-500 hover:bg-emerald-500/10"
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Milestone (1K Downloads)
              </div>
              <p className="mt-1 font-mono text-[10px] text-muted-fg">AutoPromo.trackEvent('milestone')</p>
            </button>

            <button
              type="button"
              disabled={isSimulating}
              onClick={() => handleSimulateEvent("new_version", { version: "2.0.0" }, "Version 2.0 Released")}
              className="ap-press flex flex-col items-start rounded-xl border border-emerald-500/20 bg-surface p-3.5 text-left transition-all hover:border-emerald-500 hover:bg-emerald-500/10"
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <Code className="h-4 w-4 text-blue-500" />
                New Version 2.0
              </div>
              <p className="mt-1 font-mono text-[10px] text-muted-fg">AutoPromo.trackEvent('new_version')</p>
            </button>

            <button
              type="button"
              disabled={isSimulating}
              onClick={() => handleSimulateEvent("new_review", { rating: 5, author: "Alex K." }, "5★ Review Recieved")}
              className="ap-press flex flex-col items-start rounded-xl border border-emerald-500/20 bg-surface p-3.5 text-left transition-all hover:border-emerald-500 hover:bg-emerald-500/10"
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                5★ Review Event
              </div>
              <p className="mt-1 font-mono text-[10px] text-muted-fg">AutoPromo.trackEvent('new_review')</p>
            </button>
          </div>
        </div>

        {/* Live Event Output Feed */}
        {lastEventFired && (
          <div className="mt-6 rounded-xl border bg-surface p-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Latest Fired Event Output ({lastEventFired})
              </span>
              <span className="font-mono text-[10px] text-muted-fg">Status: 200 OK</span>
            </div>

            <div className="mt-3 space-y-3">
              {simulatedPosts.map((post, idx) => (
                <div key={post.id || idx} className="rounded-lg border bg-background p-3 text-xs">
                  <div className="flex items-center justify-between font-mono text-[10px] text-muted-fg border-b pb-1.5 mb-2">
                    <span className="font-bold text-emerald-600 dark:text-emerald-300 uppercase">{post.platform} · {post.tone}</span>
                    <span>Rank Score: {post.rankScore}</span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed text-foreground font-sans">{post.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Integration Steps ── */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">Integration Methods (SDK & No-Code Webhooks)</h2>
            <p className="mt-1 text-sm text-muted-fg">
              Connect your app via TypeScript SDK or standard HTTP Webhooks (Zapier, GitHub Releases, Make, cURL).
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {snippets.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              className={`ap-press rounded-lg border px-3 py-2 text-sm font-medium ${
                s.id === active
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-bold"
                  : "hover:bg-muted"
              }`}
            >
              {i + 1}. {s.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setActive("webhook-curl")}
            className={`ap-press rounded-lg border px-3 py-2 text-sm font-medium ${
              active === "webhook-curl"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-bold"
                : "hover:bg-muted"
            }`}
          >
            ⚡ No-Code Webhook (cURL / Zapier)
          </button>
          <button
            type="button"
            onClick={() => setActive("github-action")}
            className={`ap-press rounded-lg border px-3 py-2 text-sm font-medium ${
              active === "github-action"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-bold"
                : "hover:bg-muted"
            }`}
          >
            🤖 GitHub Actions Release Auto-Trigger
          </button>
        </div>

        {active === "webhook-curl" ? (
          <div className="mt-4 overflow-hidden rounded-xl border bg-surface">
            <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/20">
              <span className="font-mono text-[11px] text-muted-fg">bash / curl</span>
              <button
                type="button"
                onClick={async () => {
                  const cmd = `curl -X POST https://autopromo.link/api/event \\
  -H "Content-Type: application/json" \\
  -d '{
    "appId": "your-app-id",
    "type": "new_version",
    "payload": { "version": "2.0.0", "notes": "Major update released!" }
  }'`;
                  await navigator.clipboard.writeText(cmd);
                  toast.success("cURL webhook copied to clipboard!");
                }}
                className="ap-press inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs hover:bg-muted font-medium"
              >
                <Copy className="h-3 w-3" />
                Copy Webhook cURL
              </button>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-foreground">
              <code>{`# ⚡ Trigger AutoPromo without any SDK code (Zapier, n8n, Make, or backend script)
curl -X POST https://autopromo.link/api/event \\
  -H "Content-Type: application/json" \\
  -d '{
    "appId": "your-app-id",
    "type": "new_version",
    "payload": {
      "version": "2.0.0",
      "notes": "Redesigned UI with 2x performance speedups and offline sync!",
      "targetPlatforms": ["twitter", "reddit", "linkedin", "telegram"]
    }
  }'`}</code>
            </pre>
          </div>
        ) : active === "github-action" ? (
          <div className="mt-4 overflow-hidden rounded-xl border bg-surface">
            <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/20">
              <span className="font-mono text-[11px] text-muted-fg">.github/workflows/autopromo.yml</span>
              <button
                type="button"
                onClick={async () => {
                  const yml = `name: AutoPromo on GitHub Release
on:
  release:
    types: [published]

jobs:
  promote:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger AutoPromo Campaign
        run: |
          curl -X POST https://autopromo.link/api/event \\
            -H "Content-Type: application/json" \\
            -d '{
              "appId": "\${{ secrets.AUTOPROMO_APP_ID }}",
              "type": "new_version",
              "payload": {
                "version": "\${{ github.event.release.tag_name }}",
                "notes": "\${{ github.event.release.name }}"
              }
            }'`;
                  await navigator.clipboard.writeText(yml);
                  toast.success("GitHub Actions YAML copied!");
                }}
                className="ap-press inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs hover:bg-muted font-medium"
              >
                <Copy className="h-3 w-3" />
                Copy Workflow YAML
              </button>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-foreground">
              <code>{`# 🤖 Automatically generate promo campaigns on every GitHub release
name: AutoPromo on GitHub Release
on:
  release:
    types: [published]

jobs:
  promote:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger AutoPromo Campaign
        run: |
          curl -X POST https://autopromo.link/api/event \\
            -H "Content-Type: application/json" \\
            -d '{
              "appId": "\${{ secrets.AUTOPROMO_APP_ID }}",
              "type": "new_version",
              "payload": {
                "version": "\${{ github.event.release.tag_name }}",
                "notes": "\${{ github.event.release.name }}"
              }
            }'`}</code>
            </pre>
          </div>
        ) : (
          snippet && (
            <div className="mt-4 overflow-hidden rounded-xl border bg-surface">
              <div className="flex items-center justify-between border-b px-4 py-2">
                <span className="font-mono text-[11px] text-muted-fg">
                  {snippet.language}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(snippet.code);
                    toast.success("Snippet copied to clipboard!");
                  }}
                  className="ap-press inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs hover:bg-muted font-medium"
                >
                  <Copy className="h-3 w-3" />
                  Copy Snippet
                </button>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed">
                <code>{snippet.code}</code>
              </pre>
            </div>
          )
        )}
      </section>
    </AppShell>
  );
}

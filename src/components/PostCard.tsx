import { useState } from "react";
import { Copy, Check, ExternalLink, Info, Link2 } from "lucide-react";
import { toast } from "sonner";
import { PlatformIcon } from "@/components/PlatformIcon";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buildShareUrl, platformLabel } from "@/lib/share";
import { AutoPromo } from "@/lib/sdk";
import type { PlatformStat, Post } from "@/lib/mockData";

export function PostCard({
  post,
  appUrl,
  topPick,
  stats = [],
  onPublish,
}: {
  post: Post;
  appUrl: string;
  topPick?: boolean;
  /** Platform stats for this app, used to explain the score. */
  stats?: PlatformStat[];
  /** Records the choice with the backend so the Strategy Engine learns. */
  onPublish?: (post: Post) => void;
}) {
  // `chosen` comes from the backend for live posts; seed posts start unposted.
  const [posted, setPosted] = useState(post.chosen ?? false);
  const [copied, setCopied] = useState(false);
  const [copiedAttribution, setCopiedAttribution] = useState(false);

  const attributionUrl = AutoPromo.generateAttributionUrl(
    appUrl || "https://autopromo.link",
    post.id || `cmp_${post.platform.toLowerCase()}`,
    post.platform.toLowerCase() as any,
    post.event
  );

  const text = `${post.content}${post.hashtags.length ? `\n\n${post.hashtags.join(" ")}` : ""}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy — select the text instead");
    }
  }

  async function copyAttribution() {
    try {
      await navigator.clipboard.writeText(attributionUrl);
      setCopiedAttribution(true);
      toast.success("Attribution shortlink copied!", {
        description: "Includes UTM tracking tags to measure real installs & clicks.",
      });
      // Also simulate tracking a click for analytics demonstration
      void AutoPromo.trackConversion({
        campaignId: post.id || "demo-campaign",
        type: "click",
        platform: post.platform.toLowerCase() as any,
      });
      setTimeout(() => setCopiedAttribution(false), 1600);
    } catch {
      toast.error("Couldn't copy link");
    }
  }

  function share() {
    window.open(buildShareUrl(post.platform, post, appUrl), "_blank", "noopener,noreferrer");
    setPosted(true);
    onPublish?.(post);
    toast.success(`Compose screen opened for ${post.platform}`, {
      description: "Publishing it teaches the strategy engine your preference.",
    });
  }

  return (
    <article
      className={`ap-enter group flex flex-col gap-3 rounded-xl border bg-surface p-4 transition-all duration-200 hover:border-mint-400 hover:shadow-sm dark:hover:border-olive-300 ${
        topPick ? "border-l-2 border-l-amber-200 hover:border-l-amber-200" : ""
      } ${posted ? "opacity-70 hover:opacity-100" : ""}`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="shrink-0 text-green-400 dark:text-mint-300">
            <PlatformIcon platform={post.platform} />
          </span>
          <span className="font-display text-sm font-semibold">{post.platform}</span>
          <span className="rounded-full bg-mint-100 px-2 py-0.5 text-[11px] font-medium text-green-500 dark:bg-olive-500 dark:text-mint-200">
            {post.tone}
          </span>
          <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-fg">
            {post.event}
          </span>
          {topPick && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
              Top pick
            </span>
          )}
        </div>

        {/* Score — click to see exactly how the strategy engine produced it */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Score ${post.score.toFixed(2)} — explain this ranking`}
              className="ap-press inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 font-mono text-[11px] text-olive-300 hover:bg-mint-100 dark:text-olive-200 dark:hover:bg-olive-500"
            >
              {post.score.toFixed(2)}
              <Info className="h-3 w-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-3">
            <ScoreBreakdown
              event={post.event}
              platform={post.platform}
              stats={stats}
              displayScore={post.score}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Reddit / OG title, when the backend supplied one */}
      {post.linkTitle && <p className="font-display text-sm font-semibold">{post.linkTitle}</p>}

      <p className="text-sm leading-relaxed whitespace-pre-line text-muted-fg">{post.content}</p>

      {post.hashtags.length > 0 && (
        <p className="font-mono text-[11px] text-green-400 dark:text-mint-300">
          {post.hashtags.join(" ")}
        </p>
      )}

      {/* Attribution Tracking Link Badge */}
      <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-xs text-muted-fg">
        <div className="flex items-center gap-1.5 truncate">
          <Link2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
          <span className="truncate font-mono text-[10px] text-emerald-700 dark:text-emerald-300" title={attributionUrl}>
            {attributionUrl}
          </span>
        </div>
        <button
          type="button"
          onClick={copyAttribution}
          className="ap-press shrink-0 ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline dark:text-emerald-300"
        >
          {copiedAttribution ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copiedAttribution ? "Copied" : "Copy UTM Link"}
        </button>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        {posted ? (
          <>
            <button
              type="button"
              onClick={share}
              className="ap-press inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-500 dark:border-green-300/30 dark:bg-olive-400 dark:text-mint-200"
            >
              ✓ Compose opened
            </button>
            <button
              type="button"
              onClick={() => setPosted(false)}
              className="text-xs text-muted-fg hover:underline"
            >
              reset
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={share}
            className="ap-press inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {platformLabel[post.platform]}
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          aria-label="Copy post text"
          className="ap-press inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-mint-100 dark:hover:bg-olive-500"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </article>
  );
}

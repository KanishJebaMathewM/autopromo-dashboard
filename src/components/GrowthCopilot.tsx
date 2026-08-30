import { useState } from "react";
import { Sparkles, Clock, Zap } from "lucide-react";
import type { App, EventType } from "@/lib/mockData";

interface GrowthCopilotProps {
  app: App;
  onTriggerEvent: (eventType: EventType) => void;
  onOpenCreateModal: () => void;
}

export function GrowthCopilot({ app, onTriggerEvent, onOpenCreateModal }: GrowthCopilotProps) {
  const [dismissed] = useState(false);

  if (dismissed) return null;

  const isHighVelocity = app.postsPublished > 10;

  return (
    <div className="mt-6 rounded-2xl border border-mint-300 bg-mint-50/60 p-5 shadow-xs dark:border-olive-400 dark:bg-olive-500">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint-100 text-green-500 shadow-sm dark:bg-olive-400 dark:text-mint-200">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold text-foreground">
                Proactive Growth Copilot & Anti-Spam Guard
              </h2>
              <span className="rounded-full bg-mint-100 px-2 py-0.5 text-[10px] font-bold text-green-500 dark:bg-olive-400 dark:text-mint-200">
                AI Active
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-fg">
              Continuous performance monitoring, milestone prioritization, and anti-burnout frequency capping.
            </p>
          </div>
        </div>

        {/* Fatigue Status Pill */}
        <div className="flex items-center gap-2 rounded-xl border bg-surface/80 px-3 py-1.5 text-xs shadow-xs dark:bg-surface">
          <Clock className="h-3.5 w-3.5 text-green-400 dark:text-mint-300" />
          <span className="font-semibold text-foreground">Optimal Posting Window:</span>
          <span className="font-mono font-bold text-green-500 dark:text-mint-200">
            {isHighVelocity ? "Healthy Pace (1 post/day)" : "Ready to Publish"}
          </span>
        </div>
      </div>

      {/* Proactive Recommendations Grid */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {/* Recommendation 1: Milestone Opportunity */}
        <div className="flex flex-col justify-between rounded-xl border bg-surface p-3.5 transition-all hover:border-mint-400 hover:shadow-xs dark:hover:border-olive-300">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-mint-100 px-2 py-0.5 text-[10px] font-bold text-green-500 dark:bg-olive-400 dark:text-mint-200">
                🔥 High-Impact Opportunity
              </span>
              <span className="text-[10px] text-muted-fg">Audience Reach: High</span>
            </div>
            <h3 className="mt-2 text-xs font-bold text-foreground">
              Celebrate {app.name} 1,000 Milestone
            </h3>
            <p className="mt-1 text-[11px] text-muted-fg leading-relaxed">
              Social proof posts celebrating user goals generate up to 2.4x higher organic repost rates on Twitter and LinkedIn.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t flex items-center justify-between">
            <span className="text-[10px] text-muted-fg">Suggested: <strong>X / LinkedIn</strong></span>
            <button
              type="button"
              onClick={() => onTriggerEvent("Milestone")}
              className="ap-press inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground shadow-xs transition-colors hover:bg-primary-hover"
            >
              <Sparkles className="h-3 w-3 text-mint-300" />
              Draft Milestone
            </button>
          </div>
        </div>

        {/* Recommendation 2: Anti-Spam Guard & Review Social Proof */}
        <div className="flex flex-col justify-between rounded-xl border bg-surface p-3.5 transition-all hover:border-mint-400 hover:shadow-xs dark:hover:border-olive-300">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-mint-100 px-2 py-0.5 text-[10px] font-bold text-green-500 dark:bg-olive-400 dark:text-mint-200">
                🛡️ Anti-Fatigue Safeguard Active
              </span>
              <span className="text-[10px] text-muted-fg">Cadence Guard: Passed</span>
            </div>
            <h3 className="mt-2 text-xs font-bold text-foreground">
              Convert 5★ Review into Viral Spotlight
            </h3>
            <p className="mt-1 text-[11px] text-muted-fg leading-relaxed">
              AutoPromo ranked your user reviews. Spacing authentic quotes mid-week prevents promotional fatigue and reinforces trust.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t flex items-center justify-between">
            <span className="text-[10px] text-muted-fg">Suggested: <strong>Reddit / Telegram</strong></span>
            <button
              type="button"
              onClick={() => onTriggerEvent("New review")}
              className="ap-press inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground shadow-xs transition-colors hover:bg-primary-hover"
            >
              <Sparkles className="h-3 w-3 text-mint-300" />
              Draft Review Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

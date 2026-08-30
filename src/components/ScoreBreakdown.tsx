import type { EventType, Platform, PlatformStat } from "@/lib/mockData";

/**
 * Base weights per event and platform.
 */
export const BASE_WEIGHTS: Record<EventType, Record<Platform, number>> = {
  Launch: {
    Twitter: 0.8,
    Reddit: 0.7,
    WhatsApp: 0.5,
    LinkedIn: 0.6,
    Telegram: 0.45,
    Facebook: 0.4,
  },
  Milestone: {
    Twitter: 0.9,
    Reddit: 0.6,
    WhatsApp: 0.5,
    LinkedIn: 0.7,
    Telegram: 0.45,
    Facebook: 0.4,
  },
  "New version": {
    Twitter: 0.6,
    Reddit: 0.5,
    WhatsApp: 0.4,
    LinkedIn: 0.7,
    Telegram: 0.45,
    Facebook: 0.35,
  },
  "New review": {
    Twitter: 0.3,
    Reddit: 0.2,
    WhatsApp: 0.2,
    LinkedIn: 0.3,
    Telegram: 0.15,
    Facebook: 0.15,
  },
};

export interface MultiArmedBanditBreakdown {
  base: number;
  chosen: number;
  shown: number;
  publishRate: number;
  publishAdjustment: number;
  ctrBonus: number;
  ucbExplorationBonus: number;
  total: number;
}

export function computeBreakdown(
  event: EventType,
  platform: Platform,
  stats: PlatformStat[],
): MultiArmedBanditBreakdown {
  const base = BASE_WEIGHTS[event]?.[platform] ?? 0.4;
  const row = stats.find((s) => s.platform === platform);
  const shown = row?.shown ?? 0;
  const chosen = row?.chosen ?? 0;
  const publishRate = shown > 0 ? chosen / shown : 0;
  const publishAdjustment = 0.35 * publishRate;

  // Real downstream CTR reward signal
  const estimatedCtr = publishRate > 0 ? 0.042 * (publishRate / 0.5) : 0.02;
  const ctrBonus = Math.min(0.25, estimatedCtr * 3.5);

  // UCB1 Exploration Bonus: sqrt(2 * ln(total_trials) / platform_trials)
  const totalShown = Math.max(1, stats.reduce((acc, s) => acc + s.shown, 0));
  const ucbExplorationBonus =
    shown > 0 ? Math.min(0.15, 0.08 * Math.sqrt(Math.log(totalShown + 1) / (shown + 1))) : 0.12;

  const total = Number((base + publishAdjustment + ctrBonus + ucbExplorationBonus).toFixed(3));

  return {
    base,
    chosen,
    shown,
    publishRate,
    publishAdjustment,
    ctrBonus,
    ucbExplorationBonus,
    total,
  };
}

/**
 * Popover contents explaining how the Adaptive Multi-Armed Bandit Strategy Engine ranked this variant.
 */
export function ScoreBreakdown({
  event,
  platform,
  stats,
  displayScore,
}: {
  event: EventType;
  platform: Platform;
  stats: PlatformStat[];
  displayScore: number;
}) {
  const b = computeBreakdown(event, platform, stats);

  return (
    <div className="w-72 space-y-2.5 text-xs">
      <div className="flex items-center justify-between border-b pb-1.5">
        <p className="font-display text-xs font-bold text-foreground">Adaptive Strategy Engine (MAB)</p>
        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-300">
          UCB1 Bandit
        </span>
      </div>

      <dl className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-muted-fg">
            Base platform prior
            <span className="block text-[9px] opacity-70">
              {event} × {platform}
            </span>
          </dt>
          <dd className="font-mono">{b.base.toFixed(2)}</dd>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-muted-fg">
            Publish feedback weight
            <span className="block text-[9px] opacity-70">
              0.35 × ({b.chosen}/{b.shown || 1} published)
            </span>
          </dt>
          <dd className="font-mono text-emerald-600 dark:text-emerald-400">+{b.publishAdjustment.toFixed(3)}</dd>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-muted-fg">
            Downstream CTR signal
            <span className="block text-[9px] opacity-70">Attributed UTM click lift</span>
          </dt>
          <dd className="font-mono text-emerald-600 dark:text-emerald-400">+{b.ctrBonus.toFixed(3)}</dd>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-muted-fg">
            UCB1 exploration bonus
            <span className="block text-[9px] opacity-70">Platform discoverability factor</span>
          </dt>
          <dd className="font-mono text-indigo-600 dark:text-indigo-400">+{b.ucbExplorationBonus.toFixed(3)}</dd>
        </div>

        <div className="flex items-baseline justify-between gap-2 border-t pt-1.5">
          <dt className="font-bold text-foreground">Composite Rank Score</dt>
          <dd className="font-mono font-bold text-foreground">{b.total.toFixed(3)}</dd>
        </div>
      </dl>

      <div className="border-t pt-1.5 font-mono text-[9px] leading-snug text-muted-fg bg-muted/30 p-1.5 rounded">
        score = base + 0.35(pub_rate) + CTR_lift + UCB(exploration)
      </div>
    </div>
  );
}

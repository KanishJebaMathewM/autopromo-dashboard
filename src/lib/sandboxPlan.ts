export type PlanTier = "free" | "impact" | "builder" | "agency";

export interface PlanDetails {
  id: PlanTier;
  name: string;
  price: string;
  period: string;
  postsLimit: number;
  appsLimit: number | "unlimited";
  features: string[];
  badge: string;
  color: string;
}

export const PLANS: Record<PlanTier, PlanDetails> = {
  free: {
    id: "free",
    name: "Free Tier",
    price: "$0",
    period: "forever",
    postsLimit: 20,
    appsLimit: 1,
    features: ["20 AI promo posts / month", "1 connected app", "Standard Strategy Engine", "All 6 social platforms"],
    badge: "FREE",
    color: "bg-muted text-muted-fg",
  },
  impact: {
    id: "impact",
    name: "Open Source & Emerging Markets Impact Tier",
    price: "$0",
    period: "sponsored",
    postsLimit: 200,
    appsLimit: 3,
    features: [
      "200 AI promo posts / month",
      "3 connected apps",
      "Free for Open-Source maintainers & non-profits",
      "Free for developers in emerging markets",
      "Full Strategy Engine & Attribution tracking",
      "Poster & Ad Studio generation",
    ],
    badge: "WORLD IMPACT (FREE)",
    color: "bg-teal-600 text-white",
  },
  builder: {
    id: "builder",
    name: "Builder",
    price: "$12",
    period: "/ month",
    postsLimit: 200,
    appsLimit: 3,
    features: [
      "200 AI promo posts / month",
      "3 connected apps",
      "Strategy Engine insights dashboard",
      "Priority generation queue",
      "Ad & Poster Studio artwork generation",
    ],
    badge: "PRO BUILDER",
    color: "bg-emerald-500 text-white",
  },
  agency: {
    id: "agency",
    name: "Agency",
    price: "$39",
    period: "/ month",
    postsLimit: 999999,
    appsLimit: "unlimited",
    features: [
      "Unlimited AI posts",
      "Unlimited connected apps",
      "White-label PDF & Analytics export",
      "Client management view",
      "Dedicated priority queue",
      "Custom branding & poster themes",
    ],
    badge: "AGENCY PRO",
    color: "bg-purple-600 text-white",
  },
};

const PLAN_STORAGE_KEY = "autopromo-sandbox-plan";

export function getStoredSandboxPlan(): PlanTier {
  if (typeof window === "undefined") return "builder";
  const stored = localStorage.getItem(PLAN_STORAGE_KEY) as PlanTier | null;
  if (stored && PLANS[stored]) return stored;
  return "builder";
}

export function setStoredSandboxPlan(plan: PlanTier): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(PLAN_STORAGE_KEY, plan);
  }
}

/** Check if current plan permits adding another app. */
export function canAddApp(plan: PlanTier, currentAppCount: number): boolean {
  const limit = PLANS[plan].appsLimit;
  if (limit === "unlimited") return true;
  return currentAppCount < limit;
}

/** Check if current plan permits using Ad & Poster Studio. */
export function canUseAdStudio(plan: PlanTier): boolean {
  return plan === "builder" || plan === "agency" || plan === "impact";
}

/** Check if current plan permits White-Label Analytics export. */
export function canExportWhiteLabelReport(plan: PlanTier): boolean {
  return plan === "agency";
}

/** Check if monthly post generation limit is reached. */
export function isPostLimitReached(plan: PlanTier, generatedCount: number): boolean {
  const limit = PLANS[plan].postsLimit;
  return generatedCount >= limit;
}

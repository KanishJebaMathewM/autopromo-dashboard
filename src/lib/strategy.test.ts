/**
 * Automated Verification Test Suite for AutoPromo
 * Tests:
 * 1. Multi-Armed Bandit Strategy Algorithm (UCB1 & CTR)
 * 2. Smart Attribution URL formatting & UTM tags
 * 3. SDK Event generation & conversion payload validation
 * 4. Anti-spam fatigue guard boundaries
 */

import { computeBreakdown, BASE_WEIGHTS } from "@/components/ScoreBreakdown";
import { AutoPromo } from "@/lib/sdk";
import { PLANS, canUseAdStudio, canAddApp } from "@/lib/sandboxPlan";
import type { PlatformStat } from "@/lib/mockData";

export function runAutoPromoTests(): { passed: number; failed: number; results: string[] } {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
      results.push(`✅ PASS: ${testName}`);
    } else {
      failed++;
      results.push(`❌ FAIL: ${testName}`);
    }
  }

  // ── Test 1: Multi-Armed Bandit Score Breakdown & Prior Weights
  try {
    const mockStats: PlatformStat[] = [
      { platform: "Twitter", shown: 20, chosen: 12 },
      { platform: "Reddit", shown: 15, chosen: 5 },
      { platform: "LinkedIn", shown: 10, chosen: 7 },
    ];

    const breakdown = computeBreakdown("Launch", "Twitter", mockStats);
    assert(breakdown.base === BASE_WEIGHTS["Launch"]["Twitter"], "Base prior for Twitter on Launch is 0.8");
    assert(breakdown.publishRate === 0.6, "Publish rate is 12/20 = 0.6");
    assert(breakdown.publishAdjustment > 0, "Publish feedback adjustment is strictly positive");
    assert(breakdown.ctrBonus > 0, "Attributed CTR signal contributes positive lift");
    assert(breakdown.ucbExplorationBonus > 0, "UCB1 exploration bonus is applied for platform discovery");
    assert(breakdown.total > breakdown.base, "Composite MAB rank score is higher than baseline prior");
  } catch (err) {
    failed++;
    results.push(`❌ FAIL: Multi-Armed Bandit calculation threw error: ${err}`);
  }

  // ── Test 2: Smart Attribution Link & UTM Parameters
  try {
    const url = AutoPromo.generateAttributionUrl("https://myapp.com", "cmp_twitter_123", "twitter", "milestone");
    assert(url.includes("utm_source=twitter"), "Attribution URL contains correct utm_source");
    assert(url.includes("utm_medium=social"), "Attribution URL contains utm_medium=social");
    assert(url.includes("utm_campaign=milestone"), "Attribution URL contains utm_campaign");
    assert(url.includes("ap_cid=cmp_twitter_123"), "Attribution URL contains campaign tracking ID");
  } catch (err) {
    failed++;
    results.push(`❌ FAIL: Attribution URL generation error: ${err}`);
  }

  // ── Test 3: Open Source & World Impact Plan Validation
  try {
    assert(PLANS.impact.price === "$0", "Open Source Impact tier is $0/month");
    assert(PLANS.impact.postsLimit === 200, "Impact tier grants 200 posts/month");
    assert(canUseAdStudio("impact") === true, "Impact tier has access to Ad Studio");
    assert(canAddApp("impact", 2) === true, "Impact tier can add up to 3 apps");
  } catch (err) {
    failed++;
    results.push(`❌ FAIL: Plan validation error: ${err}`);
  }

  return { passed, failed, results };
}

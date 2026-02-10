// ============================================================================
// Opportunity Analyzer - Find the best niches to launch tokens in
// ============================================================================

import { AnalyzedToken } from './types';
import { NicheStats, NicheCategory } from './niche-analyzer';

// ---- Opportunity Score per Niche ----

export interface NicheOpportunity {
  niche: NicheCategory;
  // Core metrics
  tokenCount: number;
  totalVolume: number;
  totalMarketCap: number;
  avgMarketCap: number;
  avgVolume: number;
  avgPriceChange: number;
  pumpFunCount: number;
  // Opportunity-specific
  opportunityScore: number; // 0-100 composite score
  demandScore: number; // volume per token (high = lots of money chasing few tokens)
  momentumScore: number; // price momentum
  competitionLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  successRate: number;
  avgGain: number;
  avgLoss: number;
  topPerformer: { name: string; symbol: string; change: number; mcap: number } | null;
  recentLaunches: number; // tokens created recently (proxy from data freshness)
  avgLiquidity: number;
  liquidityHealth: string;
  recommendation: string;
  // For display
  topTokens: AnalyzedToken[];
}

export function analyzeOpportunities(
  niches: NicheStats[]
): NicheOpportunity[] {
  if (niches.length === 0) return [];

  const opportunities: NicheOpportunity[] = [];

  for (const ns of niches) {
    if (ns.tokenCount === 0) continue;

    const tokens = ns.topTokens;
    const withPrice = tokens.filter((t) => t.price24hChangePercent != null);
    const gainers = withPrice.filter((t) => (t.price24hChangePercent || 0) > 0);
    const losers = withPrice.filter((t) => (t.price24hChangePercent || 0) < 0);

    const avgVolume = ns.tokenCount > 0 ? ns.totalVolume / ns.tokenCount : 0;
    const avgMcap = ns.tokenCount > 0 ? ns.totalMarketCap / ns.tokenCount : 0;

    const avgGain = gainers.length > 0
      ? gainers.reduce((s, t) => s + (t.price24hChangePercent || 0), 0) / gainers.length
      : 0;
    const avgLoss = losers.length > 0
      ? losers.reduce((s, t) => s + (t.price24hChangePercent || 0), 0) / losers.length
      : 0;

    const successRate = withPrice.length > 0
      ? (gainers.length / withPrice.length) * 100 : 0;

    // Liquidity
    const withLiq = tokens.filter((t) => (t.liquidity || 0) > 0);
    const avgLiq = withLiq.length > 0
      ? withLiq.reduce((s, t) => s + (t.liquidity || 0), 0) / withLiq.length : 0;
    const avgLiqRatio = withLiq.length > 0
      ? withLiq.reduce((s, t) => s + ((t.liquidity || 0) / Math.max(t.usd_market_cap || 1, 1)), 0) / withLiq.length
      : 0;

    let liquidityHealth = 'Very Low';
    if (avgLiqRatio >= 0.1) liquidityHealth = 'Healthy';
    else if (avgLiqRatio >= 0.05) liquidityHealth = 'Moderate';
    else if (avgLiqRatio >= 0.01) liquidityHealth = 'Low';

    // Competition
    let competitionLevel: NicheOpportunity['competitionLevel'] = 'Low';
    if (ns.tokenCount >= 30) competitionLevel = 'Very High';
    else if (ns.tokenCount >= 15) competitionLevel = 'High';
    else if (ns.tokenCount >= 7) competitionLevel = 'Medium';

    // Top performer
    const sorted = [...withPrice].sort(
      (a, b) => (b.price24hChangePercent || 0) - (a.price24hChangePercent || 0)
    );
    const best = sorted[0];
    const topPerformer = best
      ? { name: best.name, symbol: best.symbol, change: best.price24hChangePercent || 0, mcap: best.usd_market_cap || 0 }
      : null;

    opportunities.push({
      niche: ns.niche,
      tokenCount: ns.tokenCount,
      totalVolume: ns.totalVolume,
      totalMarketCap: ns.totalMarketCap,
      avgMarketCap: avgMcap,
      avgVolume: avgVolume,
      avgPriceChange: ns.avgPriceChange,
      pumpFunCount: ns.pumpFunCount,
      opportunityScore: 0, // computed below
      demandScore: 0,
      momentumScore: 0,
      competitionLevel,
      successRate,
      avgGain,
      avgLoss,
      topPerformer,
      recentLaunches: ns.pumpFunCount,
      avgLiquidity: avgLiq,
      liquidityHealth,
      recommendation: '',
      topTokens: tokens.slice(0, 5),
    });
  }

  // Compute normalized scores
  if (opportunities.length > 0) {
    const maxVolPerToken = Math.max(...opportunities.map((o) => o.avgVolume), 1);
    const maxMomentum = Math.max(
      ...opportunities.map((o) => Math.max(0, o.avgPriceChange)), 1
    );
    const maxSuccessRate = Math.max(...opportunities.map((o) => o.successRate), 1);

    for (const opp of opportunities) {
      // Demand: high volume per token = lots of money chasing this niche
      opp.demandScore = Math.round((opp.avgVolume / maxVolPerToken) * 100);

      // Momentum: positive price change = niche is trending up
      opp.momentumScore = Math.round(
        (Math.max(0, opp.avgPriceChange) / maxMomentum) * 100
      );

      // Opportunity = weighted combo of demand, momentum, success rate, inverse competition
      const demandWeight = 0.30;
      const momentumWeight = 0.25;
      const successWeight = 0.25;
      const competitionWeight = 0.20;

      const competitionBonus =
        opp.competitionLevel === 'Low' ? 100
          : opp.competitionLevel === 'Medium' ? 70
            : opp.competitionLevel === 'High' ? 40 : 20;

      opp.opportunityScore = Math.min(100, Math.round(
        (opp.demandScore * demandWeight) +
        (opp.momentumScore * momentumWeight) +
        ((opp.successRate / maxSuccessRate) * 100 * successWeight) +
        (competitionBonus * competitionWeight)
      ));

      // Generate recommendation
      opp.recommendation = generateRecommendation(opp);
    }
  }

  // Sort by opportunity score
  opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);

  return opportunities;
}

function generateRecommendation(opp: NicheOpportunity): string {
  const parts: string[] = [];

  if (opp.opportunityScore >= 70) {
    parts.push('Strong opportunity.');
  } else if (opp.opportunityScore >= 50) {
    parts.push('Moderate opportunity.');
  } else {
    parts.push('Lower opportunity.');
  }

  if (opp.demandScore >= 70) {
    parts.push('High demand with strong volume per token.');
  } else if (opp.demandScore >= 40) {
    parts.push('Decent demand levels.');
  }

  if (opp.momentumScore >= 60) {
    parts.push('Strong upward momentum right now.');
  }

  if (opp.successRate >= 60) {
    parts.push(`${Math.round(opp.successRate)}% of tokens are gaining.`);
  } else if (opp.successRate <= 30) {
    parts.push('Most tokens are losing - risky.');
  }

  if (opp.competitionLevel === 'Low') {
    parts.push('Low competition - good entry point.');
  } else if (opp.competitionLevel === 'Very High') {
    parts.push('Very crowded niche - need strong differentiation.');
  }

  return parts.join(' ');
}

// ---- Gap Analysis: Demand vs Supply ----

export interface NicheGap {
  nicheName: string;
  nicheEmoji: string;
  nicheColor: string;
  demandPerToken: number; // volume / token count
  tokenCount: number;
  totalVolume: number;
  gapScore: number; // high = underserved (high demand, low supply)
  insight: string;
}

export function findNicheGaps(niches: NicheStats[]): NicheGap[] {
  const gaps: NicheGap[] = niches
    .filter((ns) => ns.tokenCount > 0)
    .map((ns) => {
      const demandPerToken = ns.totalVolume / ns.tokenCount;
      return {
        nicheName: ns.niche.name,
        nicheEmoji: ns.niche.emoji,
        nicheColor: ns.niche.color,
        demandPerToken,
        tokenCount: ns.tokenCount,
        totalVolume: ns.totalVolume,
        gapScore: 0,
        insight: '',
      };
    });

  if (gaps.length === 0) return [];

  const maxDemand = Math.max(...gaps.map((g) => g.demandPerToken), 1);
  const maxCount = Math.max(...gaps.map((g) => g.tokenCount), 1);

  for (const gap of gaps) {
    // High demand per token + low token count = big gap (underserved)
    const demandNorm = gap.demandPerToken / maxDemand;
    const supplyInverse = 1 - (gap.tokenCount / maxCount);
    gap.gapScore = Math.round((demandNorm * 60 + supplyInverse * 40));

    if (gap.gapScore >= 70) {
      gap.insight = 'Underserved niche with high demand - strong launch opportunity';
    } else if (gap.gapScore >= 50) {
      gap.insight = 'Moderate gap - decent opportunity with right positioning';
    } else if (gap.gapScore >= 30) {
      gap.insight = 'Well-served niche - needs differentiation to stand out';
    } else {
      gap.insight = 'Saturated niche - consider a unique angle or sub-niche';
    }
  }

  gaps.sort((a, b) => b.gapScore - a.gapScore);
  return gaps;
}

// ---- Winning Formula ----

export interface WinningFormula {
  label: string;
  description: string;
  metrics: { key: string; value: string }[];
}

export function computeWinningFormulas(
  opportunities: NicheOpportunity[],
  allTokens: AnalyzedToken[]
): WinningFormula[] {
  const formulas: WinningFormula[] = [];

  // Best niche to launch in
  const bestNiche = opportunities[0];
  if (bestNiche) {
    formulas.push({
      label: 'Best Niche Right Now',
      description: `${bestNiche.niche.emoji} ${bestNiche.niche.name} has the highest opportunity score with ${bestNiche.successRate.toFixed(0)}% success rate and ${bestNiche.competitionLevel.toLowerCase()} competition.`,
      metrics: [
        { key: 'Score', value: `${bestNiche.opportunityScore}/100` },
        { key: 'Avg Volume', value: formatCompact(bestNiche.avgVolume) },
        { key: 'Success Rate', value: `${bestNiche.successRate.toFixed(0)}%` },
      ],
    });
  }

  // Highest momentum niche
  const highestMomentum = [...opportunities].sort((a, b) => b.momentumScore - a.momentumScore)[0];
  if (highestMomentum && highestMomentum !== bestNiche) {
    formulas.push({
      label: 'Hottest Momentum',
      description: `${highestMomentum.niche.emoji} ${highestMomentum.niche.name} has the strongest upward price momentum right now.`,
      metrics: [
        { key: 'Avg Change', value: `${highestMomentum.avgPriceChange >= 0 ? '+' : ''}${highestMomentum.avgPriceChange.toFixed(1)}%` },
        { key: 'Tokens', value: String(highestMomentum.tokenCount) },
        { key: 'Avg Gain', value: `+${highestMomentum.avgGain.toFixed(1)}%` },
      ],
    });
  }

  // Social presence analysis
  const withSocials = allTokens.filter(
    (t) => t.analysis.hasWebsite || t.analysis.hasTwitter
  );
  const noSocials = allTokens.filter(
    (t) => !t.analysis.hasWebsite && !t.analysis.hasTwitter
  );
  const socialAvgMcap = withSocials.length > 0
    ? withSocials.reduce((s, t) => s + (t.usd_market_cap || 0), 0) / withSocials.length : 0;
  const noSocialAvgMcap = noSocials.length > 0
    ? noSocials.reduce((s, t) => s + (t.usd_market_cap || 0), 0) / noSocials.length : 0;

  if (socialAvgMcap > 0 && noSocialAvgMcap > 0) {
    const multiplier = socialAvgMcap / noSocialAvgMcap;
    formulas.push({
      label: 'Social Presence Impact',
      description: `Tokens with website/Twitter have ${multiplier.toFixed(1)}x higher avg market cap than those without.`,
      metrics: [
        { key: 'With Socials', value: formatCompact(socialAvgMcap) },
        { key: 'Without', value: formatCompact(noSocialAvgMcap) },
        { key: 'Multiplier', value: `${multiplier.toFixed(1)}x` },
      ],
    });
  }

  // PumpFun vs others
  const pumpFunTokens = allTokens.filter((t) => t.isPumpFun);
  const otherTokens = allTokens.filter((t) => !t.isPumpFun);
  if (pumpFunTokens.length > 0 && otherTokens.length > 0) {
    const pfSuccessRate = pumpFunTokens.filter((t) => (t.price24hChangePercent || 0) > 0).length / pumpFunTokens.length * 100;
    const otherSuccessRate = otherTokens.filter((t) => (t.price24hChangePercent || 0) > 0).length / otherTokens.length * 100;

    formulas.push({
      label: 'Pump.fun Performance',
      description: `Pump.fun tokens have a ${pfSuccessRate.toFixed(0)}% success rate vs ${otherSuccessRate.toFixed(0)}% for other tokens.`,
      metrics: [
        { key: 'PF Tokens', value: String(pumpFunTokens.length) },
        { key: 'PF Success', value: `${pfSuccessRate.toFixed(0)}%` },
        { key: 'Other Success', value: `${otherSuccessRate.toFixed(0)}%` },
      ],
    });
  }

  return formulas;
}

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

// ============================================================================
// Launch Intelligence - Deep analysis for token launch opportunities
// ============================================================================

import { AnalyzedToken } from './types';
import { NicheStats } from './niche-analyzer';

// ---- Name Pattern Analysis ----

export interface NamePattern {
  pattern: string;
  count: number;
  avgMarketCap: number;
  avgPriceChange: number;
  avgVolume: number;
  successRate: number; // % with positive price change
  pumpFunCount: number;
  examples: string[];
}

export function analyzeNamePatterns(tokens: AnalyzedToken[]): NamePattern[] {
  // Extract meaningful words from token names (3+ chars, not common words)
  const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'with', 'this', 'that', 'from', 'they', 'been', 'said', 'each', 'which', 'their', 'will', 'other', 'about', 'token', 'coin', 'crypto']);

  const wordMap = new Map<string, AnalyzedToken[]>();

  for (const token of tokens) {
    const words = `${token.name} ${token.symbol}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !stopWords.has(w));

    const unique = Array.from(new Set(words));
    for (const word of unique) {
      if (!wordMap.has(word)) wordMap.set(word, []);
      wordMap.get(word)!.push(token);
    }
  }

  // Only keep patterns with 2+ tokens
  const patterns: NamePattern[] = [];
  for (const [pattern, patTokens] of Array.from(wordMap.entries())) {
    if (patTokens.length < 2) continue;

    const withPrice = patTokens.filter((t) => t.price24hChangePercent != null);
    const positive = withPrice.filter((t) => (t.price24hChangePercent || 0) > 0);

    patterns.push({
      pattern,
      count: patTokens.length,
      avgMarketCap: patTokens.reduce((s, t) => s + (t.usd_market_cap || 0), 0) / patTokens.length,
      avgPriceChange: withPrice.length > 0
        ? withPrice.reduce((s, t) => s + (t.price24hChangePercent || 0), 0) / withPrice.length
        : 0,
      avgVolume: patTokens.reduce((s, t) => s + (t.volume24hUSD || 0), 0) / patTokens.length,
      successRate: withPrice.length > 0 ? (positive.length / withPrice.length) * 100 : 0,
      pumpFunCount: patTokens.filter((t) => t.isPumpFun).length,
      examples: patTokens.slice(0, 3).map((t) => t.symbol),
    });
  }

  // Sort by count * avgVolume (popularity weighted by money)
  patterns.sort((a, b) => (b.count * b.avgVolume) - (a.count * a.avgVolume));
  return patterns.slice(0, 20);
}

// ---- Success Rate by Niche ----

export interface NicheSuccessRate {
  nicheName: string;
  nicheEmoji: string;
  nicheColor: string;
  totalTokens: number;
  gainers: number;
  losers: number;
  neutral: number;
  successRate: number;
  avgGain: number;
  avgLoss: number;
  bestToken: { name: string; symbol: string; change: number } | null;
  worstToken: { name: string; symbol: string; change: number } | null;
}

export function computeNicheSuccessRates(niches: NicheStats[]): NicheSuccessRate[] {
  return niches.map((ns) => {
    const withPrice = ns.topTokens.filter((t) => t.price24hChangePercent != null);
    const gainers = withPrice.filter((t) => (t.price24hChangePercent || 0) > 0);
    const losers = withPrice.filter((t) => (t.price24hChangePercent || 0) < 0);
    const neutral = withPrice.filter((t) => (t.price24hChangePercent || 0) === 0);

    const avgGain = gainers.length > 0
      ? gainers.reduce((s, t) => s + (t.price24hChangePercent || 0), 0) / gainers.length
      : 0;
    const avgLoss = losers.length > 0
      ? losers.reduce((s, t) => s + (t.price24hChangePercent || 0), 0) / losers.length
      : 0;

    const sorted = [...withPrice].sort((a, b) => (b.price24hChangePercent || 0) - (a.price24hChangePercent || 0));
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    return {
      nicheName: ns.niche.name,
      nicheEmoji: ns.niche.emoji,
      nicheColor: ns.niche.color,
      totalTokens: ns.tokenCount,
      gainers: gainers.length,
      losers: losers.length,
      neutral: neutral.length,
      successRate: withPrice.length > 0 ? (gainers.length / withPrice.length) * 100 : 0,
      avgGain,
      avgLoss,
      bestToken: best ? { name: best.name, symbol: best.symbol, change: best.price24hChangePercent || 0 } : null,
      worstToken: worst && (worst.price24hChangePercent || 0) < 0
        ? { name: worst.name, symbol: worst.symbol, change: worst.price24hChangePercent || 0 }
        : null,
    };
  }).sort((a, b) => b.successRate - a.successRate);
}

// ---- Liquidity Analysis ----

export interface LiquidityInsight {
  nicheName: string;
  nicheEmoji: string;
  avgLiquidity: number;
  avgLiquidityRatio: number; // liquidity / market cap
  totalLiquidity: number;
  tokensWithLiquidity: number;
  healthRating: 'Healthy' | 'Moderate' | 'Low' | 'Very Low';
}

export function analyzeLiquidity(niches: NicheStats[]): LiquidityInsight[] {
  return niches.map((ns) => {
    const withLiq = ns.topTokens.filter((t) => t.liquidity != null && (t.liquidity || 0) > 0);
    const totalLiq = withLiq.reduce((s, t) => s + (t.liquidity || 0), 0);
    const avgLiq = withLiq.length > 0 ? totalLiq / withLiq.length : 0;

    const ratios = withLiq
      .filter((t) => (t.usd_market_cap || 0) > 0)
      .map((t) => (t.liquidity || 0) / (t.usd_market_cap || 1));
    const avgRatio = ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 0;

    let healthRating: LiquidityInsight['healthRating'] = 'Very Low';
    if (avgRatio >= 0.1) healthRating = 'Healthy';
    else if (avgRatio >= 0.05) healthRating = 'Moderate';
    else if (avgRatio >= 0.01) healthRating = 'Low';

    return {
      nicheName: ns.niche.name,
      nicheEmoji: ns.niche.emoji,
      avgLiquidity: avgLiq,
      avgLiquidityRatio: avgRatio,
      totalLiquidity: totalLiq,
      tokensWithLiquidity: withLiq.length,
      healthRating,
    };
  }).filter((l) => l.tokensWithLiquidity > 0)
    .sort((a, b) => b.avgLiquidityRatio - a.avgLiquidityRatio);
}

// ---- Social Correlation ----

export interface SocialCorrelation {
  category: string;
  count: number;
  avgMarketCap: number;
  avgPriceChange: number;
  avgVolume: number;
  successRate: number;
}

export function analyzeSocialCorrelation(tokens: AnalyzedToken[]): SocialCorrelation[] {
  const categories = [
    {
      name: 'Has Website + Twitter',
      filter: (t: AnalyzedToken) => t.analysis.hasWebsite && t.analysis.hasTwitter,
    },
    {
      name: 'Has Twitter Only',
      filter: (t: AnalyzedToken) => !t.analysis.hasWebsite && t.analysis.hasTwitter,
    },
    {
      name: 'Has Website Only',
      filter: (t: AnalyzedToken) => t.analysis.hasWebsite && !t.analysis.hasTwitter,
    },
    {
      name: 'Has Telegram',
      filter: (t: AnalyzedToken) => t.analysis.hasTelegram,
    },
    {
      name: 'No Socials',
      filter: (t: AnalyzedToken) => !t.analysis.hasWebsite && !t.analysis.hasTwitter && !t.analysis.hasTelegram,
    },
  ];

  return categories.map(({ name, filter }) => {
    const matched = tokens.filter(filter);
    const withPrice = matched.filter((t) => t.price24hChangePercent != null);
    const positive = withPrice.filter((t) => (t.price24hChangePercent || 0) > 0);

    return {
      category: name,
      count: matched.length,
      avgMarketCap: matched.length > 0
        ? matched.reduce((s, t) => s + (t.usd_market_cap || 0), 0) / matched.length
        : 0,
      avgPriceChange: withPrice.length > 0
        ? withPrice.reduce((s, t) => s + (t.price24hChangePercent || 0), 0) / withPrice.length
        : 0,
      avgVolume: matched.length > 0
        ? matched.reduce((s, t) => s + (t.volume24hUSD || 0), 0) / matched.length
        : 0,
      successRate: withPrice.length > 0 ? (positive.length / withPrice.length) * 100 : 0,
    };
  }).filter((c) => c.count > 0);
}

// ---- Market Overview Stats ----

export interface MarketOverview {
  totalTokens: number;
  pumpFunTokens: number;
  totalVolume24h: number;
  totalMarketCap: number;
  totalLiquidity: number;
  avgPriceChange: number;
  gainersCount: number;
  losersCount: number;
  overallSuccessRate: number;
  avgMarketCap: number;
  medianMarketCap: number;
  avgVolume: number;
  avgLiquidity: number;
  avgHolders: number;
}

export function computeMarketOverview(tokens: AnalyzedToken[]): MarketOverview {
  const withPrice = tokens.filter((t) => t.price24hChangePercent != null);
  const gainers = withPrice.filter((t) => (t.price24hChangePercent || 0) > 0);
  const losers = withPrice.filter((t) => (t.price24hChangePercent || 0) < 0);

  const mcaps = tokens.map((t) => t.usd_market_cap || 0).sort((a, b) => a - b);
  const medianMcap = mcaps.length > 0 ? mcaps[Math.floor(mcaps.length / 2)] : 0;

  const withHolders = tokens.filter((t) => t.holder != null && (t.holder || 0) > 0);

  return {
    totalTokens: tokens.length,
    pumpFunTokens: tokens.filter((t) => t.isPumpFun).length,
    totalVolume24h: tokens.reduce((s, t) => s + (t.volume24hUSD || 0), 0),
    totalMarketCap: tokens.reduce((s, t) => s + (t.usd_market_cap || 0), 0),
    totalLiquidity: tokens.reduce((s, t) => s + (t.liquidity || 0), 0),
    avgPriceChange: withPrice.length > 0
      ? withPrice.reduce((s, t) => s + (t.price24hChangePercent || 0), 0) / withPrice.length
      : 0,
    gainersCount: gainers.length,
    losersCount: losers.length,
    overallSuccessRate: withPrice.length > 0 ? (gainers.length / withPrice.length) * 100 : 0,
    avgMarketCap: tokens.length > 0
      ? tokens.reduce((s, t) => s + (t.usd_market_cap || 0), 0) / tokens.length
      : 0,
    medianMarketCap: medianMcap,
    avgVolume: tokens.length > 0
      ? tokens.reduce((s, t) => s + (t.volume24hUSD || 0), 0) / tokens.length
      : 0,
    avgLiquidity: tokens.length > 0
      ? tokens.reduce((s, t) => s + (t.liquidity || 0), 0) / tokens.length
      : 0,
    avgHolders: withHolders.length > 0
      ? withHolders.reduce((s, t) => s + (t.holder || 0), 0) / withHolders.length
      : 0,
  };
}

// ============================================================================
// Pump.fun API Client
// Handles all communication with the pump.fun frontend API
// ============================================================================

import { PumpFunToken, AnalyzedToken, TokenStats, Classification } from './types';
import { analyzeTokenUtility } from './utility-analyzer';

const PUMPFUN_API_URL = process.env.PUMPFUN_API_URL || 'https://frontend-api.pump.fun';

export async function fetchTrendingTokens(
  limit: number = 50,
  offset: number = 0,
  sort: string = 'market_cap',
  order: string = 'DESC',
  includeNsfw: boolean = false
): Promise<PumpFunToken[]> {
  const url = `${PUMPFUN_API_URL}/coins?offset=${offset}&limit=${limit}&sort=${sort}&order=${order}&includeNsfw=${includeNsfw}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'PumpFun-Analytics-Dashboard/1.0',
    },
    next: { revalidate: 15 },
  });

  if (!response.ok) {
    throw new Error(`Pump.fun API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchTokenByMint(mint: string): Promise<PumpFunToken> {
  const url = `${PUMPFUN_API_URL}/coins/${mint}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'PumpFun-Analytics-Dashboard/1.0',
    },
    next: { revalidate: 15 },
  });

  if (!response.ok) {
    throw new Error(`Token not found: ${response.status}`);
  }

  return response.json();
}

export function analyzeTokens(tokens: PumpFunToken[]): AnalyzedToken[] {
  return tokens.map((token) => ({
    ...token,
    analysis: analyzeTokenUtility(token),
  }));
}

export function computeStats(tokens: AnalyzedToken[]): TokenStats {
  const distributionByClassification: Record<Classification, number> = {
    'Likely Utility Token': 0,
    'Possible Utility/Hybrid': 0,
    'Likely Meme Token': 0,
    'Unknown/Speculative': 0,
  };

  const marketCapByClassification: Record<Classification, number> = {
    'Likely Utility Token': 0,
    'Possible Utility/Hybrid': 0,
    'Likely Meme Token': 0,
    'Unknown/Speculative': 0,
  };

  let totalUtilityScore = 0;
  let totalMemeScore = 0;
  let totalMarketCap = 0;

  tokens.forEach((token) => {
    const cls = token.analysis.classification;
    distributionByClassification[cls]++;
    marketCapByClassification[cls] += token.usd_market_cap || 0;
    totalUtilityScore += token.analysis.utilityScore;
    totalMemeScore += token.analysis.memeScore;
    totalMarketCap += token.usd_market_cap || 0;
  });

  const topUtilityTokens = [...tokens]
    .sort((a, b) => b.analysis.utilityScore - a.analysis.utilityScore)
    .slice(0, 3);

  return {
    totalAnalyzed: tokens.length,
    utilityCount: distributionByClassification['Likely Utility Token'],
    memeCount: distributionByClassification['Likely Meme Token'],
    hybridCount: distributionByClassification['Possible Utility/Hybrid'],
    unknownCount: distributionByClassification['Unknown/Speculative'],
    totalMarketCap,
    averageUtilityScore: tokens.length > 0 ? totalUtilityScore / tokens.length : 0,
    averageMemeScore: tokens.length > 0 ? totalMemeScore / tokens.length : 0,
    topUtilityTokens,
    distributionByClassification,
    marketCapByClassification,
  };
}

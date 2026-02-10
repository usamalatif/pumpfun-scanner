// ============================================================================
// Token Utility Analysis Engine
// Scores and classifies tokens based on utility vs meme indicators
// ============================================================================

import { PumpFunToken, UtilityAnalysis, Classification, ScoreBreakdown } from './types';

const UTILITY_KEYWORDS = [
  'platform', 'protocol', 'defi', 'gaming', 'nft', 'marketplace',
  'staking', 'governance', 'payment', 'service', 'ai', 'data',
  'oracle', 'bridge', 'swap', 'lending', 'dao', 'treasury',
  'analytics', 'aggregator', 'launchpad', 'infrastructure',
  'sdk', 'api', 'tool', 'wallet', 'exchange', 'yield',
  'liquidity', 'cross-chain', 'layer', 'rollup', 'zk',
  'privacy', 'security', 'audit', 'insurance', 'real-world',
  'tokenization', 'supply chain', 'identity', 'credential',
];

const MEME_KEYWORDS = [
  'meme', 'moon', 'gem', 'community', 'based', 'degen', 'ape',
  'hodl', 'fud', 'chad', 'wojak', 'pepe', 'pump', 'lambo',
  'diamond hands', 'to the moon', 'wen moon', 'dog', 'cat',
  'shib', 'doge', 'elon', 'rocket', 'wagmi', 'ngmi',
  '100x', '1000x', 'moonshot', 'safu', 'rug',
  'yolo', 'tendies', 'stonks', 'bruh', 'ser',
];

export function analyzeTokenUtility(token: PumpFunToken): UtilityAnalysis {
  const text = `${token.name} ${token.symbol} ${token.description}`.toLowerCase();

  // Check social presence
  const hasWebsite = Boolean(token.website && token.website.trim().length > 0);
  const hasTelegram = Boolean(token.telegram && token.telegram.trim().length > 0);
  const hasTwitter = Boolean(token.twitter && token.twitter.trim().length > 0);

  // Find utility keywords in text
  const foundUtilityKeywords = UTILITY_KEYWORDS.filter((kw) =>
    text.includes(kw.toLowerCase())
  );

  // Find meme keywords in text
  const foundMemeKeywords = MEME_KEYWORDS.filter((kw) =>
    text.includes(kw.toLowerCase())
  );

  // Calculate score breakdown
  const websitePoints = hasWebsite ? 2 : 0;
  const utilityKeywordPoints = Math.min(foundUtilityKeywords.length * 2, 10); // cap at 10
  const telegramPoints = hasTelegram ? 1 : 0;
  const twitterPoints = hasTwitter ? 1 : 0;
  const descriptionPoints = token.description && token.description.length > 100 ? 1 : 0;

  const totalUtility = websitePoints + utilityKeywordPoints + telegramPoints + twitterPoints + descriptionPoints;
  const totalMeme = foundMemeKeywords.length;

  const scoreBreakdown: ScoreBreakdown = {
    websitePoints,
    utilityKeywordPoints,
    telegramPoints,
    twitterPoints,
    descriptionPoints,
    totalUtility,
    totalMeme,
  };

  // Determine classification
  const classification = classifyToken(totalUtility, totalMeme, foundMemeKeywords.length, token.isPumpFun);

  return {
    classification,
    utilityScore: totalUtility,
    memeScore: totalMeme,
    hasWebsite,
    hasTelegram,
    hasTwitter,
    utilityKeywords: foundUtilityKeywords,
    memeKeywords: foundMemeKeywords,
    descriptionLength: token.description?.length || 0,
    scoreBreakdown,
  };
}

function classifyToken(
  utilityScore: number,
  memeScore: number,
  memeKeywordCount: number,
  isPumpFun?: boolean
): Classification {
  if (utilityScore >= 6 && memeKeywordCount <= 1) {
    return 'Likely Utility Token';
  }
  if (utilityScore >= 3) {
    return 'Possible Utility/Hybrid';
  }
  if (memeKeywordCount >= 2 || memeScore >= 3) {
    return 'Likely Meme Token';
  }
  if (isPumpFun) {
    return 'Pump.fun Token';
  }
  return 'Unknown/Speculative';
}

export function getScorePercentage(score: number, maxScore: number = 15): number {
  return Math.min(Math.round((score / maxScore) * 100), 100);
}

export { UTILITY_KEYWORDS, MEME_KEYWORDS };

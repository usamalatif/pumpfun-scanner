// ============================================================================
// Niche Analyzer - Categorize tokens into trending niches
// ============================================================================

import { AnalyzedToken } from './types';
import { formatMarketCap } from './utils';

export interface NicheCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
  keywords: string[];
}

export interface NicheStats {
  niche: NicheCategory;
  tokenCount: number;
  totalVolume: number;
  totalMarketCap: number;
  avgPriceChange: number;
  pumpFunCount: number;
  topTokens: AnalyzedToken[];
  heat: number; // 0-100 score based on volume + token count + price change
}

// Niche definitions - ordered by typical relevance in crypto/pump.fun
const NICHES: NicheCategory[] = [
  {
    id: 'ai',
    name: 'AI & Tech',
    emoji: '🤖',
    color: '#3B82F6',
    keywords: ['ai', 'gpt', 'bot', 'neural', 'llm', 'agent', 'compute', 'gpu', 'cpu', 'deep', 'learn', 'openai', 'claude', 'gemini', 'copilot', 'machine', 'algo', 'quantum', 'cyber', 'synth', 'matrix', 'data', 'byte', 'code', 'dev', 'hack', 'tech', 'robot', 'android', 'silicon', 'chip'],
  },
  {
    id: 'animals',
    name: 'Animals & Pets',
    emoji: '🐶',
    color: '#F59E0B',
    keywords: ['dog', 'cat', 'pepe', 'frog', 'bear', 'bull', 'shib', 'doge', 'inu', 'puppy', 'kitten', 'bird', 'fish', 'whale', 'monkey', 'ape', 'lion', 'tiger', 'eagle', 'wolf', 'fox', 'dragon', 'snake', 'panda', 'bunny', 'hamster', 'penguin', 'owl', 'duck', 'goat', 'cow', 'pig', 'deer', 'bat', 'shark', 'crab', 'bee'],
  },
  {
    id: 'politics',
    name: 'Politics',
    emoji: '🏛️',
    color: '#EF4444',
    keywords: ['trump', 'biden', 'maga', 'vote', 'election', 'president', 'congress', 'political', 'democrat', 'republican', 'liberal', 'freedom', 'patriot', 'america', 'usa', 'gov', 'policy', 'potus', 'kamala', 'elon', 'musk', 'barron', 'melania', 'javier', 'milei'],
  },
  {
    id: 'defi',
    name: 'DeFi',
    emoji: '💰',
    color: '#10B981',
    keywords: ['swap', 'yield', 'stake', 'farm', 'pool', 'lend', 'borrow', 'vault', 'defi', 'dex', 'amm', 'liquidity', 'bridge', 'dao', 'protocol', 'finance', 'bank', 'pay', 'cash', 'money', 'gold', 'dollar', 'coin', 'token', 'sol', 'eth', 'btc', 'chain'],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    emoji: '🎮',
    color: '#8B5CF6',
    keywords: ['game', 'play', 'quest', 'pixel', 'arcade', 'rpg', 'nft', 'metaverse', 'virtual', 'world', 'land', 'craft', 'battle', 'war', 'fight', 'hero', 'knight', 'sword', 'dungeon', 'level', 'score', 'esport', 'gamer', 'xbox', 'steam'],
  },
  {
    id: 'culture',
    name: 'Culture & Meme',
    emoji: '🎭',
    color: '#EC4899',
    keywords: ['moon', 'rug', 'pump', 'based', 'chad', 'wojak', 'npc', 'gigachad', 'sigma', 'alpha', 'beta', 'wagmi', 'ngmi', 'hodl', 'wen', 'gm', 'ser', 'fren', 'vibe', 'yolo', 'cope', 'seethe', 'ratio', 'cringe', 'kek', 'lol', 'meme', 'degen', 'ape', 'bro', 'king', 'queen', 'lord'],
  },
  {
    id: 'celebrities',
    name: 'Celebrities',
    emoji: '⭐',
    color: '#F97316',
    keywords: ['elon', 'musk', 'drake', 'kanye', 'taylor', 'swift', 'rihanna', 'beyonce', 'snoop', 'eminem', 'lebron', 'ronaldo', 'messi', 'kardashian', 'oprah', 'bezos', 'zuck', 'mark', 'bill', 'gates', 'warren', 'buffett', 'celebrity', 'famous', 'star', 'vitalik', 'satoshi', 'cz'],
  },
  {
    id: 'food',
    name: 'Food & Lifestyle',
    emoji: '🍕',
    color: '#84CC16',
    keywords: ['pizza', 'sushi', 'burger', 'taco', 'coffee', 'beer', 'wine', 'food', 'eat', 'cook', 'chef', 'cake', 'candy', 'chocolate', 'ice', 'cream', 'fruit', 'banana', 'apple', 'weed', 'smoke', '420', 'green', 'herb'],
  },
];

function matchNiche(token: AnalyzedToken): NicheCategory | null {
  const text = `${token.name} ${token.symbol} ${token.description}`.toLowerCase();

  let bestMatch: NicheCategory | null = null;
  let bestScore = 0;

  for (const niche of NICHES) {
    let score = 0;
    for (const keyword of niche.keywords) {
      if (text.includes(keyword)) {
        // Exact word match scores higher
        const wordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
        score += wordRegex.test(text) ? 2 : 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = niche;
    }
  }

  return bestScore >= 1 ? bestMatch : null;
}

export function analyzeNiches(tokens: AnalyzedToken[]): NicheStats[] {
  const nicheMap = new Map<string, {
    niche: NicheCategory;
    tokens: AnalyzedToken[];
  }>();

  // Initialize all niches
  for (const niche of NICHES) {
    nicheMap.set(niche.id, { niche, tokens: [] });
  }

  // Categorize tokens
  for (const token of tokens) {
    const niche = matchNiche(token);
    if (niche) {
      nicheMap.get(niche.id)!.tokens.push(token);
    }
  }

  // Compute stats for each niche
  const results: NicheStats[] = [];
  let maxVolume = 0;

  for (const { niche, tokens: nicheTokens } of Array.from(nicheMap.values())) {
    if (nicheTokens.length === 0) continue;

    const totalVolume = nicheTokens.reduce((s, t) => s + (t.volume24hUSD || 0), 0);
    const totalMarketCap = nicheTokens.reduce((s, t) => s + (t.usd_market_cap || 0), 0);
    const priceChanges = nicheTokens.filter((t) => t.price24hChangePercent != null);
    const avgPriceChange = priceChanges.length > 0
      ? priceChanges.reduce((s, t) => s + (t.price24hChangePercent || 0), 0) / priceChanges.length
      : 0;
    const pumpFunCount = nicheTokens.filter((t) => t.isPumpFun).length;

    // Sort by volume for top tokens
    const topTokens = [...nicheTokens]
      .sort((a, b) => (b.volume24hUSD || 0) - (a.volume24hUSD || 0))
      .slice(0, 5);

    if (totalVolume > maxVolume) maxVolume = totalVolume;

    results.push({
      niche,
      tokenCount: nicheTokens.length,
      totalVolume,
      totalMarketCap,
      avgPriceChange,
      pumpFunCount,
      topTokens,
      heat: 0, // computed below
    });
  }

  // Compute heat scores (normalized 0-100)
  if (results.length > 0) {
    const maxTokenCount = Math.max(...results.map((r) => r.tokenCount));
    const maxPriceChange = Math.max(...results.map((r) => Math.abs(r.avgPriceChange)));

    for (const r of results) {
      const volumeScore = maxVolume > 0 ? (r.totalVolume / maxVolume) * 40 : 0;
      const countScore = maxTokenCount > 0 ? (r.tokenCount / maxTokenCount) * 30 : 0;
      const priceScore = maxPriceChange > 0
        ? (Math.max(0, r.avgPriceChange) / maxPriceChange) * 30
        : 0;
      r.heat = Math.min(100, Math.round(volumeScore + countScore + priceScore));
    }
  }

  // Sort by heat score descending
  results.sort((a, b) => b.heat - a.heat);

  return results;
}

export function getTopGainers(tokens: AnalyzedToken[], limit: number = 5): AnalyzedToken[] {
  return [...tokens]
    .filter((t) => t.price24hChangePercent != null && t.price24hChangePercent > 0)
    .sort((a, b) => (b.price24hChangePercent || 0) - (a.price24hChangePercent || 0))
    .slice(0, limit);
}

export function getTopLosers(tokens: AnalyzedToken[], limit: number = 5): AnalyzedToken[] {
  return [...tokens]
    .filter((t) => t.price24hChangePercent != null && t.price24hChangePercent < 0)
    .sort((a, b) => (a.price24hChangePercent || 0) - (b.price24hChangePercent || 0))
    .slice(0, limit);
}

export function getTopVolume(tokens: AnalyzedToken[], limit: number = 5): AnalyzedToken[] {
  return [...tokens]
    .filter((t) => t.volume24hUSD != null && t.volume24hUSD > 0)
    .sort((a, b) => (b.volume24hUSD || 0) - (a.volume24hUSD || 0))
    .slice(0, limit);
}

export function getPumpFunLeaders(tokens: AnalyzedToken[], limit: number = 5): AnalyzedToken[] {
  return [...tokens]
    .filter((t) => t.isPumpFun)
    .sort((a, b) => (b.usd_market_cap || 0) - (a.usd_market_cap || 0))
    .slice(0, limit);
}

export function formatVolume(value: number): string {
  return formatMarketCap(value);
}

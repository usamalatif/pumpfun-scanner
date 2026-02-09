// ============================================================================
// Pump.fun API Client
// Tries pump.fun first, falls back to DexScreener for real Solana token data
// ============================================================================

import { PumpFunToken, AnalyzedToken, TokenStats, Classification } from './types';
import { analyzeTokenUtility } from './utility-analyzer';

// ============================================================================
// Pump.fun API (primary source)
// ============================================================================

const PUMPFUN_ENDPOINTS = [
  process.env.PUMPFUN_API_URL || 'https://frontend-api.pump.fun',
  'https://client-api-2-74b1891ee9f9.herokuapp.com',
];

const BROWSER_HEADERS: Record<string, string> = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Origin': 'https://pump.fun',
  'Referer': 'https://pump.fun/',
};

async function fetchFromPumpFun(path: string): Promise<Response> {
  let lastError: Error | null = null;

  for (const baseUrl of PUMPFUN_ENDPOINTS) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: BROWSER_HEADERS,
        cache: 'no-store',
      });
      if (response.ok) return response;
      lastError = new Error(`${baseUrl}: ${response.status}`);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastError || new Error('All pump.fun endpoints failed');
}

// ============================================================================
// DexScreener API (fallback - real Solana token data)
// ============================================================================

const DEXSCREENER_API = 'https://api.dexscreener.com';

interface DexScreenerProfile {
  chainId: string;
  tokenAddress: string;
  icon?: string;
  description?: string;
  links?: Array<{ type: string; label: string; url: string }>;
}

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceUsd?: string;
  txns?: {
    h24?: { buys: number; sells: number };
  };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    websites?: Array<{ label: string; url: string }>;
    socials?: Array<{ type: string; url: string }>;
  };
}

function extractSocial(
  profile: DexScreenerProfile | undefined,
  pair: DexScreenerPair,
  type: 'twitter' | 'telegram' | 'website'
): string | null {
  // Check profile links first (more complete)
  if (profile?.links) {
    const link = profile.links.find((l) => l.type === type);
    if (link?.url) {
      if (type === 'website') return link.url;
      return link.url.split('/').pop() || null;
    }
  }
  // Fall back to pair info
  if (type === 'website') {
    return pair.info?.websites?.[0]?.url || null;
  }
  const social = pair.info?.socials?.find((s) => s.type === type);
  if (social?.url) {
    return social.url.split('/').pop() || null;
  }
  return null;
}

function mapDexScreenerToToken(
  pair: DexScreenerPair,
  profile?: DexScreenerProfile
): PumpFunToken {
  const mcap = pair.marketCap || pair.fdv || 0;

  return {
    mint: pair.baseToken.address,
    name: pair.baseToken.name,
    symbol: pair.baseToken.symbol,
    description: profile?.description || '',
    image_uri: profile?.icon || pair.info?.imageUrl || '',
    metadata_uri: '',
    twitter: extractSocial(profile, pair, 'twitter'),
    telegram: extractSocial(profile, pair, 'telegram'),
    bonding_curve: '',
    associated_bonding_curve: '',
    creator: '',
    created_timestamp: pair.pairCreatedAt || Date.now(),
    raydium_pool: pair.dexId === 'raydium' ? pair.pairAddress : null,
    complete: true,
    virtual_sol_reserves: 0,
    virtual_token_reserves: 0,
    total_supply: 1_000_000_000,
    website: extractSocial(profile, pair, 'website'),
    show_name: true,
    king_of_the_hill_timestamp: null,
    market_cap: mcap / 150,
    reply_count: pair.txns?.h24
      ? pair.txns.h24.buys + pair.txns.h24.sells
      : 0,
    last_reply: Date.now(),
    nsfw: false,
    market_id: null,
    inverted: null,
    usd_market_cap: mcap,
    username: null,
    profile_image: null,
  };
}

async function fetchTrendingFromDexScreener(
  limit: number
): Promise<PumpFunToken[]> {
  // Step 1: Get latest Solana token profiles (descriptions + social links)
  const profilesRes = await fetch(
    `${DEXSCREENER_API}/token-profiles/latest/v1`,
    { cache: 'no-store' }
  );
  if (!profilesRes.ok)
    throw new Error(`DexScreener profiles: ${profilesRes.status}`);

  const allProfiles: DexScreenerProfile[] = await profilesRes.json();
  const solanaProfiles = allProfiles
    .filter((p) => p.chainId === 'solana')
    .slice(0, limit);

  if (solanaProfiles.length === 0) {
    throw new Error('No Solana token profiles on DexScreener');
  }

  // Step 2: Batch-fetch pair data for market caps (max 30 per request)
  const addresses = solanaProfiles.map((p) => p.tokenAddress);
  const allPairs: DexScreenerPair[] = [];
  const batchSize = 30;

  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize).join(',');
    try {
      const pairsRes = await fetch(
        `${DEXSCREENER_API}/latest/dex/tokens/${batch}`,
        { cache: 'no-store' }
      );
      if (pairsRes.ok) {
        const pairsData = await pairsRes.json();
        if (pairsData.pairs) allPairs.push(...pairsData.pairs);
      }
    } catch {
      // continue with remaining batches
    }
  }

  // Step 3: Map each address to its best pair (highest liquidity)
  const pairMap = new Map<string, DexScreenerPair>();
  for (const pair of allPairs) {
    if (pair.chainId !== 'solana') continue;
    const addr = pair.baseToken.address;
    const existing = pairMap.get(addr);
    if (
      !existing ||
      (pair.liquidity?.usd || 0) > (existing.liquidity?.usd || 0)
    ) {
      pairMap.set(addr, pair);
    }
  }

  // Step 4: Combine profiles + pairs → PumpFunToken[]
  const tokens: PumpFunToken[] = [];

  for (const profile of solanaProfiles) {
    const pair = pairMap.get(profile.tokenAddress);
    if (pair) {
      tokens.push(mapDexScreenerToToken(pair, profile));
    }
  }

  // Sort by market cap descending
  tokens.sort((a, b) => (b.usd_market_cap || 0) - (a.usd_market_cap || 0));

  return tokens;
}

async function fetchTokenFromDexScreener(
  mint: string
): Promise<PumpFunToken> {
  const res = await fetch(`${DEXSCREENER_API}/latest/dex/tokens/${mint}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`DexScreener: ${res.status}`);

  const data = await res.json();
  if (!data.pairs || data.pairs.length === 0) {
    throw new Error('Token not found on DexScreener');
  }

  // Find best Solana pair by liquidity
  const solanaPairs = data.pairs
    .filter((p: DexScreenerPair) => p.chainId === 'solana')
    .sort(
      (a: DexScreenerPair, b: DexScreenerPair) =>
        (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    );

  if (solanaPairs.length === 0) {
    throw new Error('No Solana pairs found for this token');
  }

  return mapDexScreenerToToken(solanaPairs[0]);
}

// ============================================================================
// Public API
// ============================================================================

export async function fetchTrendingTokens(
  limit: number = 50,
  offset: number = 0,
  sort: string = 'market_cap',
  order: string = 'DESC',
  includeNsfw: boolean = false
): Promise<PumpFunToken[]> {
  // Strategy 1: Try pump.fun API directly
  try {
    const response = await fetchFromPumpFun(
      `/coins?offset=${offset}&limit=${limit}&sort=${sort}&order=${order}&includeNsfw=${includeNsfw}`
    );
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) return data;
  } catch {
    console.warn('pump.fun API blocked, falling back to DexScreener...');
  }

  // Strategy 2: DexScreener (real Solana token data)
  try {
    const tokens = await fetchTrendingFromDexScreener(limit);
    if (tokens.length > 0) {
      console.log(`Loaded ${tokens.length} real tokens from DexScreener`);
      return tokens;
    }
  } catch (e) {
    console.warn('DexScreener fallback also failed:', e);
  }

  return [];
}

export async function fetchTokenByMint(mint: string): Promise<PumpFunToken> {
  // Strategy 1: Try pump.fun API
  try {
    const response = await fetchFromPumpFun(`/coins/${mint}`);
    const data = await response.json();
    if (data && data.mint) return data;
  } catch {
    console.warn(
      'pump.fun API failed for token lookup, trying DexScreener...'
    );
  }

  // Strategy 2: DexScreener token lookup
  return fetchTokenFromDexScreener(mint);
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
    averageUtilityScore:
      tokens.length > 0 ? totalUtilityScore / tokens.length : 0,
    averageMemeScore:
      tokens.length > 0 ? totalMemeScore / tokens.length : 0,
    topUtilityTokens,
    distributionByClassification,
    marketCapByClassification,
  };
}

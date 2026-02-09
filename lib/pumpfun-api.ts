// ============================================================================
// Pump.fun API Client
// Primary: pump.fun API
// Fallback: GeckoTerminal (pump.fun DEX pools) + DexScreener (metadata)
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
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Origin: 'https://pump.fun',
  Referer: 'https://pump.fun/',
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
// GeckoTerminal API (fallback - pump.fun specific pools on Solana)
// Free, no API key, has pump.fun as a registered DEX (id: "pump-fun")
// ============================================================================

const GECKO_API = 'https://api.geckoterminal.com/api/v2';
const DEXSCREENER_API = 'https://api.dexscreener.com';

interface GeckoPoolAttributes {
  address: string;
  name: string;
  pool_created_at: string;
  fdv_usd: string | null;
  market_cap_usd: string | null;
  base_token_price_usd: string | null;
  price_change_percentage: Record<string, string | null>;
  transactions: Record<
    string,
    { buys: number; sells: number; buyers: number; sellers: number }
  >;
  volume_usd: Record<string, string | null>;
  reserve_in_usd: string | null;
}

interface GeckoPool {
  id: string;
  type: 'pool';
  attributes: GeckoPoolAttributes;
  relationships: {
    base_token: { data: { id: string; type: string } };
    quote_token: { data: { id: string; type: string } };
    dex: { data: { id: string; type: string } };
  };
}

interface GeckoToken {
  id: string;
  type: 'token';
  attributes: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    image_url: string | null;
  };
}

interface GeckoResponse {
  data: GeckoPool[];
  included?: GeckoToken[];
}

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  info?: {
    imageUrl?: string;
    websites?: Array<{ label: string; url: string }>;
    socials?: Array<{ type: string; url: string }>;
  };
}

async function fetchPumpFunFromGeckoTerminal(
  limit: number
): Promise<PumpFunToken[]> {
  const pages = Math.ceil(Math.min(limit, 120) / 20);

  // Step 1: Fetch pump.fun pools sorted by 24h activity (concurrent)
  const pagePromises = Array.from({ length: pages }, (_, i) =>
    fetch(
      `${GECKO_API}/networks/solana/dexes/pump-fun/pools?page=${i + 1}&sort=h24_tx_count_desc&include=base_token`,
      { cache: 'no-store' }
    )
      .then((r) => (r.ok ? (r.json() as Promise<GeckoResponse>) : null))
      .catch(() => null)
  );

  const results = await Promise.all(pagePromises);

  const pools: GeckoPool[] = [];
  const geckoTokenMap = new Map<string, GeckoToken>();

  for (const result of results) {
    if (!result) continue;
    if (result.data) pools.push(...result.data);
    if (result.included) {
      for (const item of result.included) {
        if (item.type === 'token') {
          geckoTokenMap.set(item.id, item);
        }
      }
    }
  }

  if (pools.length === 0) {
    throw new Error('No pump.fun pools found on GeckoTerminal');
  }

  // Step 2: Deduplicate by token address, keep highest-activity pool
  const uniqueTokens: Array<{ pool: GeckoPool; token: GeckoToken }> = [];
  const seen = new Set<string>();

  for (const pool of pools) {
    const tokenId = pool.relationships?.base_token?.data?.id;
    const geckoToken = geckoTokenMap.get(tokenId);
    if (!geckoToken) continue;

    const address = geckoToken.attributes.address;
    if (seen.has(address)) continue;
    seen.add(address);
    uniqueTokens.push({ pool, token: geckoToken });
  }

  // Step 3: Enrich with DexScreener metadata (websites, socials) in batches
  const addresses = uniqueTokens.map((t) => t.token.attributes.address);
  const dexMetadata = new Map<string, DexScreenerPair>();
  const batchSize = 30;

  const batchPromises = [];
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize).join(',');
    batchPromises.push(
      fetch(`${DEXSCREENER_API}/latest/dex/tokens/${batch}`, {
        cache: 'no-store',
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    );
  }

  const dexResults = await Promise.all(batchPromises);
  for (const result of dexResults) {
    if (!result?.pairs) continue;
    for (const pair of result.pairs as DexScreenerPair[]) {
      if (pair.chainId !== 'solana') continue;
      const addr = pair.baseToken.address;
      // Keep the pair with the most metadata
      const existing = dexMetadata.get(addr);
      if (!existing || (pair.info && !existing.info)) {
        dexMetadata.set(addr, pair);
      }
    }
  }

  // Step 4: Build PumpFunToken array
  const tokens: PumpFunToken[] = uniqueTokens.map(({ pool, token }) => {
    const addr = token.attributes.address;
    const dex = dexMetadata.get(addr);
    const mcap = parseFloat(
      pool.attributes.market_cap_usd || pool.attributes.fdv_usd || '0'
    );
    const h24Txns = pool.attributes.transactions?.h24;

    const website = dex?.info?.websites?.[0]?.url || null;
    const twitterUrl = dex?.info?.socials?.find(
      (s) => s.type === 'twitter'
    )?.url;
    const telegramUrl = dex?.info?.socials?.find(
      (s) => s.type === 'telegram'
    )?.url;

    return {
      mint: addr,
      name: token.attributes.name,
      symbol: token.attributes.symbol,
      description: '',
      image_uri: token.attributes.image_url || dex?.info?.imageUrl || '',
      metadata_uri: '',
      twitter: twitterUrl ? twitterUrl.split('/').pop() || null : null,
      telegram: telegramUrl ? telegramUrl.split('/').pop() || null : null,
      bonding_curve: '',
      associated_bonding_curve: '',
      creator: '',
      created_timestamp: new Date(
        pool.attributes.pool_created_at
      ).getTime(),
      raydium_pool: null,
      complete: true,
      virtual_sol_reserves: 0,
      virtual_token_reserves: 0,
      total_supply: 1_000_000_000,
      website,
      show_name: true,
      king_of_the_hill_timestamp: null,
      market_cap: mcap / 150,
      reply_count: h24Txns ? h24Txns.buys + h24Txns.sells : 0,
      last_reply: Date.now(),
      nsfw: false,
      market_id: null,
      inverted: null,
      usd_market_cap: mcap,
      username: null,
      profile_image: null,
    };
  });

  // Sort by market cap descending
  tokens.sort((a, b) => (b.usd_market_cap || 0) - (a.usd_market_cap || 0));

  return tokens.slice(0, limit);
}

async function fetchTokenFromGeckoTerminal(
  mint: string
): Promise<PumpFunToken | null> {
  try {
    const res = await fetch(
      `${GECKO_API}/networks/solana/tokens/${mint}/pools?page=1&include=base_token`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;

    const data: GeckoResponse = await res.json();
    if (!data.data || data.data.length === 0) return null;

    const pool = data.data[0];
    const tokenId = pool.relationships?.base_token?.data?.id;
    const geckoToken = data.included?.find(
      (t) => t.type === 'token' && t.id === tokenId
    );
    if (!geckoToken) return null;

    const mcap = parseFloat(
      pool.attributes.market_cap_usd || pool.attributes.fdv_usd || '0'
    );
    const h24Txns = pool.attributes.transactions?.h24;

    // Try DexScreener for social metadata
    let website: string | null = null;
    let twitter: string | null = null;
    let telegram: string | null = null;
    let imageUrl = geckoToken.attributes.image_url || '';

    try {
      const dexRes = await fetch(
        `${DEXSCREENER_API}/latest/dex/tokens/${mint}`,
        { cache: 'no-store' }
      );
      if (dexRes.ok) {
        const dexData = await dexRes.json();
        const pair = dexData.pairs?.find(
          (p: DexScreenerPair) => p.chainId === 'solana'
        );
        if (pair?.info) {
          website = pair.info.websites?.[0]?.url || null;
          const tw = pair.info.socials?.find(
            (s: { type: string; url: string }) => s.type === 'twitter'
          )?.url;
          const tg = pair.info.socials?.find(
            (s: { type: string; url: string }) => s.type === 'telegram'
          )?.url;
          twitter = tw ? tw.split('/').pop() || null : null;
          telegram = tg ? tg.split('/').pop() || null : null;
          imageUrl = imageUrl || pair.info.imageUrl || '';
        }
      }
    } catch {
      // DexScreener enrichment is optional
    }

    return {
      mint,
      name: geckoToken.attributes.name,
      symbol: geckoToken.attributes.symbol,
      description: '',
      image_uri: imageUrl,
      metadata_uri: '',
      twitter,
      telegram,
      bonding_curve: '',
      associated_bonding_curve: '',
      creator: '',
      created_timestamp: new Date(
        pool.attributes.pool_created_at
      ).getTime(),
      raydium_pool: null,
      complete: true,
      virtual_sol_reserves: 0,
      virtual_token_reserves: 0,
      total_supply: 1_000_000_000,
      website,
      show_name: true,
      king_of_the_hill_timestamp: null,
      market_cap: mcap / 150,
      reply_count: h24Txns ? h24Txns.buys + h24Txns.sells : 0,
      last_reply: Date.now(),
      nsfw: false,
      market_id: null,
      inverted: null,
      usd_market_cap: mcap,
      username: null,
      profile_image: null,
    };
  } catch {
    return null;
  }
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
    console.warn('pump.fun API blocked, falling back to GeckoTerminal...');
  }

  // Strategy 2: GeckoTerminal pump.fun pools + DexScreener metadata
  try {
    const tokens = await fetchPumpFunFromGeckoTerminal(limit);
    if (tokens.length > 0) {
      console.log(
        `Loaded ${tokens.length} pump.fun tokens from GeckoTerminal`
      );
      return tokens;
    }
  } catch (e) {
    console.warn('GeckoTerminal fallback failed:', e);
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
    console.warn('pump.fun API failed, trying GeckoTerminal...');
  }

  // Strategy 2: GeckoTerminal + DexScreener
  const token = await fetchTokenFromGeckoTerminal(mint);
  if (token) return token;

  throw new Error('Token not found - all API sources failed');
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

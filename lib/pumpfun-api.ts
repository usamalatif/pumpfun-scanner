// ============================================================================
// Solana Token Analytics API Client
// Primary: Birdeye API (trending tokens + token details)
// Fallback: GeckoTerminal (pump.fun pools) + DexScreener (metadata)
// ============================================================================

import { PumpFunToken, AnalyzedToken, TokenStats, Classification } from './types';
import { analyzeTokenUtility } from './utility-analyzer';

// ============================================================================
// Birdeye API (primary - requires API key)
// Docs: https://docs.birdeye.so
// ============================================================================

const BIRDEYE_API = 'https://public-api.birdeye.so';
const BIRDEYE_KEY = process.env.BIRDEYE_API_KEY || '';

function birdeyeHeaders(): Record<string, string> {
  return {
    'X-API-KEY': BIRDEYE_KEY,
    'x-chain': 'solana',
    Accept: 'application/json',
  };
}

function isPumpFunAddress(address: string): boolean {
  return address.endsWith('pump');
}

function extractHandle(url: string): string | null {
  if (!url) return null;
  // Handle full URLs like https://x.com/handle or https://t.me/handle
  const parts = url.replace(/\/$/, '').split('/');
  return parts[parts.length - 1] || null;
}

// -- Birdeye trending tokens --------------------------------------------------

interface BirdeyeTrending {
  address: string;
  decimals: number;
  fdv: number;
  liquidity: number;
  logoURI: string;
  marketcap: number;
  name: string;
  price: number;
  rank: number;
  symbol: string;
  volume24hUSD: number;
  volume24hChangePercent: number;
  price24hChangePercent: number;
}

function mapBirdeyeTrending(t: BirdeyeTrending): PumpFunToken {
  return {
    mint: t.address,
    name: t.name,
    symbol: t.symbol,
    description: '',
    image_uri: t.logoURI || '',
    metadata_uri: '',
    twitter: null,
    telegram: null,
    bonding_curve: '',
    associated_bonding_curve: '',
    creator: '',
    created_timestamp: Date.now(),
    raydium_pool: null,
    complete: true,
    virtual_sol_reserves: 0,
    virtual_token_reserves: 0,
    total_supply: 0,
    website: null,
    show_name: true,
    king_of_the_hill_timestamp: null,
    market_cap: t.marketcap || 0,
    reply_count: 0,
    last_reply: null,
    nsfw: false,
    market_id: null,
    inverted: null,
    usd_market_cap: t.marketcap || t.fdv || 0,
    username: null,
    profile_image: null,
    // Birdeye fields
    isPumpFun: isPumpFunAddress(t.address),
    price: t.price,
    liquidity: t.liquidity,
    volume24hUSD: t.volume24hUSD,
    price24hChangePercent: t.price24hChangePercent,
    volume24hChangePercent: t.volume24hChangePercent,
    rank: t.rank,
  };
}

async function fetchTrendingFromBirdeye(
  limit: number
): Promise<PumpFunToken[]> {
  // Birdeye trending API caps at ~100 per sort strategy.
  // To get more tokens, we fetch with multiple sort strategies and deduplicate.
  const pageSize = 20;
  const pagesPerStrategy = Math.ceil(Math.min(limit, 100) / pageSize); // max 5 pages per strategy

  // Different sort strategies to get diverse token sets
  const strategies = [
    { sort_by: 'rank', sort_type: 'asc' },
    { sort_by: 'volume24hUSD', sort_type: 'desc' },
    { sort_by: 'price24hChangePercent', sort_type: 'desc' },
  ];

  // Only use as many strategies as needed
  const neededStrategies = limit <= 100 ? 1 : limit <= 200 ? 2 : 3;
  const activeStrategies = strategies.slice(0, neededStrategies);

  const allPromises: Promise<Response | null>[] = [];
  for (const strategy of activeStrategies) {
    for (let i = 0; i < pagesPerStrategy; i++) {
      allPromises.push(
        fetch(
          `${BIRDEYE_API}/defi/token_trending?sort_by=${strategy.sort_by}&sort_type=${strategy.sort_type}&offset=${i * pageSize}&limit=${pageSize}`,
          { headers: birdeyeHeaders(), cache: 'no-store' }
        ).catch(() => null)
      );
    }
  }

  const responses = await Promise.all(allPromises);
  const seen = new Set<string>();
  const allTokens: PumpFunToken[] = [];

  for (const res of responses) {
    if (!res || !('ok' in res) || !res.ok) continue;
    try {
      const json = await res.json();
      if (!json?.success || !json.data?.tokens) continue;
      for (const t of json.data.tokens) {
        const mapped = mapBirdeyeTrending(t);
        if (!seen.has(mapped.mint)) {
          seen.add(mapped.mint);
          allTokens.push(mapped);
        }
      }
    } catch {
      continue;
    }
  }

  if (allTokens.length === 0) {
    throw new Error('Birdeye trending: no tokens returned');
  }

  return allTokens.slice(0, limit);
}

// -- Birdeye token overview (detail page) ------------------------------------

interface BirdeyeOverview {
  address: string;
  decimals: number;
  symbol: string;
  name: string;
  marketCap: number;
  fdv: number;
  extensions: {
    description?: string;
    twitter?: string;
    telegram?: string;
    website?: string;
    discord?: string;
  } | null;
  logoURI: string;
  liquidity: number;
  lastTradeUnixTime: number;
  price: number;
  priceChange24hPercent: number;
  totalSupply: number;
  circulatingSupply: number;
  holder: number;
  uniqueWallet24h: number;
  trade24h: number;
  buy24h: number;
  sell24h: number;
  v24hUSD: number;
  vBuy24hUSD: number;
  vSell24hUSD: number;
  numberMarkets: number;
}

function mapBirdeyeOverview(d: BirdeyeOverview): PumpFunToken {
  return {
    mint: d.address,
    name: d.name,
    symbol: d.symbol,
    description: d.extensions?.description || '',
    image_uri: d.logoURI || '',
    metadata_uri: '',
    twitter: d.extensions?.twitter
      ? extractHandle(d.extensions.twitter)
      : null,
    telegram: d.extensions?.telegram
      ? extractHandle(d.extensions.telegram)
      : null,
    bonding_curve: '',
    associated_bonding_curve: '',
    creator: '',
    created_timestamp: d.lastTradeUnixTime
      ? d.lastTradeUnixTime * 1000
      : Date.now(),
    raydium_pool: null,
    complete: true,
    virtual_sol_reserves: 0,
    virtual_token_reserves: 0,
    total_supply: d.totalSupply || 0,
    website: d.extensions?.website || null,
    show_name: true,
    king_of_the_hill_timestamp: null,
    market_cap: d.marketCap || 0,
    reply_count: d.trade24h || 0,
    last_reply: d.lastTradeUnixTime ? d.lastTradeUnixTime * 1000 : null,
    nsfw: false,
    market_id: null,
    inverted: null,
    usd_market_cap: d.marketCap || d.fdv || 0,
    username: null,
    profile_image: null,
    // Birdeye fields
    isPumpFun: isPumpFunAddress(d.address),
    price: d.price,
    liquidity: d.liquidity,
    volume24hUSD: d.v24hUSD,
    price24hChangePercent: d.priceChange24hPercent,
    holder: d.holder,
    uniqueWallet24h: d.uniqueWallet24h,
    trade24h: d.trade24h,
    buy24h: d.buy24h,
    sell24h: d.sell24h,
    vBuy24hUSD: d.vBuy24hUSD,
    vSell24hUSD: d.vSell24hUSD,
  };
}

async function fetchTokenFromBirdeye(
  mint: string
): Promise<PumpFunToken | null> {
  if (!BIRDEYE_KEY) return null;

  try {
    const res = await fetch(
      `${BIRDEYE_API}/defi/token_overview?address=${mint}`,
      { headers: birdeyeHeaders(), cache: 'no-store' }
    );
    if (!res.ok) return null;

    const json = await res.json();
    if (!json.success || !json.data) return null;

    return mapBirdeyeOverview(json.data);
  } catch {
    return null;
  }
}

// ============================================================================
// GeckoTerminal fallback (pump.fun specific, free, no key)
// ============================================================================

const GECKO_API = 'https://api.geckoterminal.com/api/v2';
const DEXSCREENER_API = 'https://api.dexscreener.com';

interface GeckoPool {
  id: string;
  type: 'pool';
  attributes: {
    address: string;
    name: string;
    pool_created_at: string;
    fdv_usd: string | null;
    market_cap_usd: string | null;
    transactions: Record<
      string,
      { buys: number; sells: number; buyers: number; sellers: number }
    >;
    volume_usd: Record<string, string | null>;
  };
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
  baseToken: { address: string };
  info?: {
    imageUrl?: string;
    websites?: Array<{ url: string }>;
    socials?: Array<{ type: string; url: string }>;
  };
}

async function fetchPumpFunFromGeckoTerminal(
  limit: number
): Promise<PumpFunToken[]> {
  const pages = Math.ceil(Math.min(limit, 120) / 20);

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
        if (item.type === 'token') geckoTokenMap.set(item.id, item);
      }
    }
  }

  if (pools.length === 0) throw new Error('No pools from GeckoTerminal');

  // Deduplicate by token address
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

  // Batch DexScreener enrichment
  const addresses = uniqueTokens.map((t) => t.token.attributes.address);
  const dexMeta = new Map<string, DexScreenerPair>();

  const batchPromises = [];
  for (let i = 0; i < addresses.length; i += 30) {
    const batch = addresses.slice(i, i + 30).join(',');
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
      if (!dexMeta.has(addr) || (pair.info && !dexMeta.get(addr)?.info)) {
        dexMeta.set(addr, pair);
      }
    }
  }

  // Build tokens
  const tokens: PumpFunToken[] = uniqueTokens.map(({ pool, token }) => {
    const addr = token.attributes.address;
    const dex = dexMeta.get(addr);
    const mcap = parseFloat(
      pool.attributes.market_cap_usd || pool.attributes.fdv_usd || '0'
    );
    const h24 = pool.attributes.transactions?.h24;

    const website = dex?.info?.websites?.[0]?.url || null;
    const tw = dex?.info?.socials?.find((s) => s.type === 'twitter')?.url;
    const tg = dex?.info?.socials?.find((s) => s.type === 'telegram')?.url;

    return {
      mint: addr,
      name: token.attributes.name,
      symbol: token.attributes.symbol,
      description: '',
      image_uri: token.attributes.image_url || dex?.info?.imageUrl || '',
      metadata_uri: '',
      twitter: tw ? tw.split('/').pop() || null : null,
      telegram: tg ? tg.split('/').pop() || null : null,
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
      market_cap: mcap,
      reply_count: h24 ? h24.buys + h24.sells : 0,
      last_reply: Date.now(),
      nsfw: false,
      market_id: null,
      inverted: null,
      usd_market_cap: mcap,
      username: null,
      profile_image: null,
      isPumpFun: true,
    };
  });

  tokens.sort((a, b) => (b.usd_market_cap || 0) - (a.usd_market_cap || 0));
  return tokens.slice(0, limit);
}

// ============================================================================
// Public API
// ============================================================================

export async function fetchTrendingTokens(
  limit: number = 200
): Promise<PumpFunToken[]> {
  // Primary: Birdeye API with multiple sort strategies for 300+ tokens
  if (BIRDEYE_KEY) {
    try {
      const tokens = await fetchTrendingFromBirdeye(limit);
      if (tokens.length > 0) {
        console.log(
          `Loaded ${tokens.length} trending tokens from Birdeye ` +
            `(${tokens.filter((t) => t.isPumpFun).length} pump.fun)`
        );
        return tokens;
      }
    } catch (e) {
      console.warn('Birdeye API failed:', e);
    }
  }

  // Fallback: GeckoTerminal pump.fun pools (no API key needed)
  try {
    const tokens = await fetchPumpFunFromGeckoTerminal(limit);
    if (tokens.length > 0) {
      console.log(`Loaded ${tokens.length} pump.fun tokens from GeckoTerminal`);
      return tokens;
    }
  } catch (e) {
    console.warn('GeckoTerminal fallback failed:', e);
  }

  return [];
}

export async function fetchTokenByMint(mint: string): Promise<PumpFunToken> {
  // Strategy 1: Birdeye token_overview (rich detail)
  const birdeyeToken = await fetchTokenFromBirdeye(mint);
  if (birdeyeToken) return birdeyeToken;

  // Strategy 2: GeckoTerminal + DexScreener
  try {
    const res = await fetch(
      `${GECKO_API}/networks/solana/tokens/${mint}/pools?page=1&include=base_token`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      const data: GeckoResponse = await res.json();
      if (data.data?.length > 0) {
        const pool = data.data[0];
        const tokenId = pool.relationships?.base_token?.data?.id;
        const geckoToken = data.included?.find(
          (t) => t.type === 'token' && t.id === tokenId
        );
        if (geckoToken) {
          const mcap = parseFloat(
            pool.attributes.market_cap_usd ||
              pool.attributes.fdv_usd ||
              '0'
          );
          return {
            mint,
            name: geckoToken.attributes.name,
            symbol: geckoToken.attributes.symbol,
            description: '',
            image_uri: geckoToken.attributes.image_url || '',
            metadata_uri: '',
            twitter: null,
            telegram: null,
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
            total_supply: 0,
            website: null,
            show_name: true,
            king_of_the_hill_timestamp: null,
            market_cap: mcap,
            reply_count: 0,
            last_reply: null,
            nsfw: false,
            market_id: null,
            inverted: null,
            usd_market_cap: mcap,
            username: null,
            profile_image: null,
            isPumpFun: isPumpFunAddress(mint),
          };
        }
      }
    }
  } catch {
    // continue
  }

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
    'Pump.fun Token': 0,
    'Unknown/Speculative': 0,
  };

  const marketCapByClassification: Record<Classification, number> = {
    'Likely Utility Token': 0,
    'Possible Utility/Hybrid': 0,
    'Likely Meme Token': 0,
    'Pump.fun Token': 0,
    'Unknown/Speculative': 0,
  };

  let totalUtilityScore = 0;
  let totalMemeScore = 0;
  let totalMarketCap = 0;
  let pumpFunCount = 0;

  tokens.forEach((token) => {
    const cls = token.analysis.classification;
    distributionByClassification[cls]++;
    marketCapByClassification[cls] += token.usd_market_cap || 0;
    totalUtilityScore += token.analysis.utilityScore;
    totalMemeScore += token.analysis.memeScore;
    totalMarketCap += token.usd_market_cap || 0;
    if (token.isPumpFun) pumpFunCount++;
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
    pumpFunCount,
  };
}

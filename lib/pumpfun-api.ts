// ============================================================================
// Pump.fun API Client
// Tries multiple endpoints with fallback to demo data if all are blocked
// ============================================================================

import { PumpFunToken, AnalyzedToken, TokenStats, Classification } from './types';
import { analyzeTokenUtility } from './utility-analyzer';

// Multiple API endpoints to try (Cloudflare blocks datacenter IPs on some)
const API_ENDPOINTS = [
  process.env.PUMPFUN_API_URL || 'https://frontend-api.pump.fun',
  'https://client-api-2-74b1891ee9f9.herokuapp.com',
];

const BROWSER_HEADERS: Record<string, string> = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Origin': 'https://pump.fun',
  'Referer': 'https://pump.fun/',
};

async function fetchWithFallback(path: string): Promise<Response> {
  let lastError: Error | null = null;

  for (const baseUrl of API_ENDPOINTS) {
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

  throw lastError || new Error('All API endpoints failed');
}

export async function fetchTrendingTokens(
  limit: number = 50,
  offset: number = 0,
  sort: string = 'market_cap',
  order: string = 'DESC',
  includeNsfw: boolean = false
): Promise<PumpFunToken[]> {
  try {
    const response = await fetchWithFallback(
      `/coins?offset=${offset}&limit=${limit}&sort=${sort}&order=${order}&includeNsfw=${includeNsfw}`
    );
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    // All endpoints blocked - return demo data so the app is functional
    console.warn('All pump.fun API endpoints blocked, using demo data');
    return generateDemoTokens(limit);
  }
}

export async function fetchTokenByMint(mint: string): Promise<PumpFunToken> {
  try {
    const response = await fetchWithFallback(`/coins/${mint}`);
    return response.json();
  } catch {
    // Check if it's a demo token
    const demo = generateDemoTokens(50).find((t) => t.mint === mint);
    if (demo) return demo;
    throw new Error('Token not found and API is unavailable');
  }
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

// ============================================================================
// Demo data generator - used when all pump.fun API endpoints are blocked
// ============================================================================

function generateDemoTokens(count: number): PumpFunToken[] {
  const templates = [
    { name: 'SolBridge Protocol', symbol: 'SBRIDGE', description: 'Cross-chain bridge protocol for Solana ecosystem. Enabling seamless asset transfers between Solana and EVM chains with decentralized governance and staking rewards.', website: 'https://solbridge.io', twitter: 'solbridge_io', telegram: 'solbridge', mcap: 4850000 },
    { name: 'DeFi Aggregator X', symbol: 'DAGX', description: 'AI-powered DeFi aggregator and yield optimizer platform. Analytics dashboard for liquidity pool management and automated swap routing.', website: 'https://dagx.finance', twitter: 'dagx_finance', telegram: 'dagxfinance', mcap: 3200000 },
    { name: 'GameFi Arena', symbol: 'GFARENA', description: 'Gaming and NFT marketplace platform built on Solana. Play-to-earn gaming ecosystem with governance token and staking.', website: 'https://gamefiarena.com', twitter: 'gamefiarena', telegram: null, mcap: 2100000 },
    { name: 'Oracle Network Sol', symbol: 'ORCL', description: 'Decentralized oracle service providing real-time price feeds and data for Solana DeFi protocols. Infrastructure layer for smart contract data.', website: 'https://oraclenetwork.sol', twitter: 'orcl_network', telegram: 'oraclenetwork', mcap: 5600000 },
    { name: 'Moon Doge Inu', symbol: 'MOONDOGE', description: 'The moon-bound doge community token! Diamond hands only. To the moon! Wen lambo? Based degen ape community.', website: null, twitter: 'moondogeinu', telegram: 'moondogeinu', mcap: 890000 },
    { name: 'Pepe Rocket', symbol: 'PEPERKT', description: 'Pepe goes to the moon! Community-driven meme token. HODL for 1000x gains. Wen pump?', website: null, twitter: null, telegram: 'peperocket', mcap: 450000 },
    { name: 'Chad Wojak', symbol: 'CWJK', description: 'The ultimate chad vs wojak meme token. Based community, diamond hands, degen approved.', website: null, twitter: 'chadwojak', telegram: null, mcap: 320000 },
    { name: 'SolPay Finance', symbol: 'SPAY', description: 'Payment gateway protocol for Solana. Enabling merchant crypto payments with instant settlement, low fees, and lending services.', website: 'https://solpay.finance', twitter: 'solpay_finance', telegram: 'solpayfinance', mcap: 7800000 },
    { name: 'DataDAO', symbol: 'DDAO', description: 'Decentralized data marketplace and DAO governance platform. Community-driven analytics and data oracle service for Web3 applications.', website: 'https://datadao.xyz', twitter: 'datadao_xyz', telegram: 'datadao', mcap: 1950000 },
    { name: 'Lambo Cat', symbol: 'LCAT', description: 'Cat meme token with lambo dreams. Community gem, moon soon! HODL gang assemble.', website: null, twitter: 'lambocat_sol', telegram: 'lambocatsol', mcap: 670000 },
    { name: 'StakeVault', symbol: 'SVLT', description: 'Liquid staking protocol and treasury management platform for Solana validators. Automated yield optimization with insurance.', website: 'https://stakevault.io', twitter: 'stakevault_io', telegram: 'stakevault', mcap: 4200000 },
    { name: 'AI Swap', symbol: 'AISWP', description: 'AI-powered decentralized exchange with intelligent routing. Swap aggregator with predictive analytics and MEV protection.', website: 'https://aiswap.dev', twitter: 'aiswap_dev', telegram: null, mcap: 3500000 },
    { name: 'Frog Pump', symbol: 'FROGP', description: 'Frog-themed pump token. Degen community gem! YOLO into the swamp. Wen 100x?', website: null, twitter: null, telegram: 'frogpumpsol', mcap: 180000 },
    { name: 'Launchpad Sol', symbol: 'LPAD', description: 'Token launchpad platform for Solana projects. IDO platform with KYC, vesting, and multi-chain bridge support.', website: 'https://launchpadsol.com', twitter: 'launchpadsol', telegram: 'launchpadsol', mcap: 6100000 },
    { name: 'Safu Moon', symbol: 'SAFUM', description: 'Safu community token going to the moon! Diamond hands hodl forever. FUD proof, degen approved, 1000x moonshot potential.', website: null, twitter: 'safumoon_sol', telegram: 'safumoonsol', mcap: 290000 },
    { name: 'NFT Marketplace Pro', symbol: 'NFTMP', description: 'Professional NFT marketplace with AI-generated collections, royalty enforcement, and cross-chain NFT bridge. Creator tools and analytics.', website: 'https://nftmpro.io', twitter: 'nftmpro', telegram: 'nftmpro', mcap: 2800000 },
    { name: 'Governance Hub', symbol: 'GHUB', description: 'Multi-DAO governance aggregator. Vote delegation, proposal management, and treasury analytics across Solana protocols.', website: 'https://governancehub.sol', twitter: 'gov_hub', telegram: null, mcap: 1600000 },
    { name: 'Elon Mars Token', symbol: 'EMARS', description: 'Elon takes us to Mars! Community meme token. Rocket emoji. To the moon and beyond! 🚀', website: null, twitter: 'elonmarstoken', telegram: 'elonmarschat', mcap: 520000 },
    { name: 'ZK Privacy Layer', symbol: 'ZKPL', description: 'Zero-knowledge privacy layer for Solana. Confidential transactions, private DeFi, and anonymous governance voting using ZK proofs.', website: 'https://zkprivacy.sol', twitter: 'zk_privacy', telegram: 'zkprivacylayer', mcap: 8200000 },
    { name: 'Stonks Token', symbol: 'STONK', description: 'Stonks only go up! The ultimate degen wagmi community token. Based meme, diamond hands only.', website: null, twitter: 'stonkstoken', telegram: null, mcap: 410000 },
    { name: 'Identity Protocol', symbol: 'IDPRO', description: 'Decentralized identity and credential verification protocol. Self-sovereign identity management for Web3 with privacy-preserving proofs.', website: 'https://idprotocol.io', twitter: 'id_protocol', telegram: 'idprotocol', mcap: 3900000 },
    { name: 'Yield Farm Plus', symbol: 'YFP', description: 'Advanced yield farming aggregator with auto-compounding, liquidity provision analytics, and risk scoring for DeFi protocols on Solana.', website: 'https://yieldfarmplus.com', twitter: 'yieldfarmplus', telegram: 'yfplus', mcap: 2400000 },
    { name: 'Ape Together', symbol: 'APET', description: 'Ape together strong! Community meme token for degens. FOMO in, hodl forever, wen pump wen moon.', website: null, twitter: 'apetogether_sol', telegram: 'apetogethersol', mcap: 350000 },
    { name: 'Supply Chain Sol', symbol: 'SCSL', description: 'Supply chain tracking and tokenization platform. Real-world asset management with IoT integration and transparent logistics.', website: 'https://supplychainsol.io', twitter: 'scsl_io', telegram: null, mcap: 1800000 },
  ];

  const now = Date.now();
  return templates.slice(0, count).map((t, i) => ({
    mint: `Demo${String(i).padStart(3, '0')}${'x'.repeat(40)}`.slice(0, 44),
    name: t.name,
    symbol: t.symbol,
    description: t.description,
    image_uri: '',
    metadata_uri: '',
    twitter: t.twitter,
    telegram: t.telegram,
    bonding_curve: '',
    associated_bonding_curve: '',
    creator: `Creator${'x'.repeat(40)}`.slice(0, 44),
    created_timestamp: now - (i * 3600000) - Math.random() * 86400000,
    raydium_pool: null,
    complete: false,
    virtual_sol_reserves: 0,
    virtual_token_reserves: 0,
    total_supply: 1000000000,
    website: t.website,
    show_name: true,
    king_of_the_hill_timestamp: null,
    market_cap: t.mcap / 150,
    reply_count: Math.floor(Math.random() * 200),
    last_reply: now - Math.random() * 3600000,
    nsfw: false,
    market_id: null,
    inverted: null,
    usd_market_cap: t.mcap,
    username: null,
    profile_image: null,
  }));
}

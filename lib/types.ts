// ============================================================================
// Solana Token Analytics - Type Definitions
// ============================================================================

export interface PumpFunToken {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image_uri: string;
  metadata_uri: string;
  twitter: string | null;
  telegram: string | null;
  bonding_curve: string;
  associated_bonding_curve: string;
  creator: string;
  created_timestamp: number;
  raydium_pool: string | null;
  complete: boolean;
  virtual_sol_reserves: number;
  virtual_token_reserves: number;
  total_supply: number;
  website: string | null;
  show_name: boolean;
  king_of_the_hill_timestamp: number | null;
  market_cap: number;
  reply_count: number;
  last_reply: number | null;
  nsfw: boolean;
  market_id: string | null;
  inverted: boolean | null;
  usd_market_cap: number;
  username: string | null;
  profile_image: string | null;

  // Birdeye-enriched fields
  isPumpFun?: boolean;
  price?: number;
  liquidity?: number;
  volume24hUSD?: number;
  price24hChangePercent?: number;
  volume24hChangePercent?: number;
  rank?: number;

  // Detail-only fields (from Birdeye token_overview)
  holder?: number;
  uniqueWallet24h?: number;
  trade24h?: number;
  buy24h?: number;
  sell24h?: number;
  vBuy24hUSD?: number;
  vSell24hUSD?: number;
}

export interface UtilityAnalysis {
  classification: Classification;
  utilityScore: number;
  memeScore: number;
  hasWebsite: boolean;
  hasTelegram: boolean;
  hasTwitter: boolean;
  utilityKeywords: string[];
  memeKeywords: string[];
  descriptionLength: number;
  scoreBreakdown: ScoreBreakdown;
}

export type Classification =
  | 'Likely Utility Token'
  | 'Possible Utility/Hybrid'
  | 'Likely Meme Token'
  | 'Pump.fun Token'
  | 'Unknown/Speculative';

export interface ScoreBreakdown {
  websitePoints: number;
  utilityKeywordPoints: number;
  telegramPoints: number;
  twitterPoints: number;
  descriptionPoints: number;
  totalUtility: number;
  totalMeme: number;
}

export interface AnalyzedToken extends PumpFunToken {
  analysis: UtilityAnalysis;
}

export interface TokenStats {
  totalAnalyzed: number;
  utilityCount: number;
  memeCount: number;
  hybridCount: number;
  unknownCount: number;
  totalMarketCap: number;
  averageUtilityScore: number;
  averageMemeScore: number;
  topUtilityTokens: AnalyzedToken[];
  distributionByClassification: Record<Classification, number>;
  marketCapByClassification: Record<Classification, number>;
  pumpFunCount?: number;
}

export interface TokenFilters {
  search: string;
  classification: Classification | 'all';
  minUtilityScore: number;
  maxUtilityScore: number;
  minMarketCap: number;
  maxMarketCap: number;
  hasWebsite: boolean | null;
  hasSocials: boolean | null;
  sortBy: SortField;
  sortOrder: 'asc' | 'desc';
  pumpFunOnly?: boolean;
}

export type SortField =
  | 'market_cap'
  | 'utility_score'
  | 'created_timestamp'
  | 'reply_count'
  | 'name'
  | 'volume24h'
  | 'price_change';

export interface AppSettings {
  refreshInterval: number;
  tokensToFetch: number;
  minUtilityScore: number;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  soundAlerts: boolean;
  autoRefresh: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  refreshInterval: 30000,
  tokensToFetch: 100,
  minUtilityScore: 0,
  theme: 'dark',
  notifications: true,
  soundAlerts: false,
  autoRefresh: true,
};

export interface ApiResponse<T> {
  data: T;
  error?: string;
  timestamp: number;
}

'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  MessageCircle,
  Twitter,
  Clock,
  Copy,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Droplets,
  Users,
  ShoppingCart,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClassificationBadge } from '@/components/ClassificationBadge';
import { UtilityAnalysisPanel } from '@/components/UtilityAnalysis';
import { useTokenDetail } from '@/hooks/useTokenDetail';
import { formatMarketCap, formatDate, truncateAddress } from '@/lib/utils';
import { useState } from 'react';

const GRADUATION_MCAP = 69_000;

export default function TokenDetailPage() {
  const params = useParams();
  const mint = params.mint as string;
  const { data: token, isLoading, error } = useTokenDetail(mint);
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(mint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <Link href="/tokens">
          <Button variant="ghost" size="sm" className="gap-1 mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Tokens
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <h3 className="text-lg font-semibold mb-1">Token not found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'The token could not be loaded'}
            </p>
            <Link href="/tokens">
              <Button variant="outline">Back to Token List</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const buySellRatio = token.buy24h && token.sell24h
    ? token.buy24h / (token.buy24h + token.sell24h)
    : null;
  const buyVolumeRatio = token.vBuy24hUSD && token.vSell24hUSD
    ? token.vBuy24hUSD / (token.vBuy24hUSD + token.vSell24hUSD)
    : null;
  const liquidityRatio = token.liquidity && token.usd_market_cap
    ? (token.liquidity / token.usd_market_cap) * 100
    : null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <Link href="/tokens">
        <Button variant="ghost" size="sm" className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Tokens
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Token header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {token.image_uri ? (
                  <img
                    src={token.image_uri}
                    alt={token.name}
                    className="h-16 w-16 rounded-full object-cover bg-muted"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold">
                    {token.symbol?.slice(0, 2)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold">{token.name}</h1>
                    <Badge variant="secondary" className="font-mono">
                      ${token.symbol}
                    </Badge>
                    {token.isPumpFun && <Badge variant="pumpfun">Pump.fun</Badge>}
                    {token.dexPlatform === 'pumpswap' && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">PumpSwap</Badge>
                    )}
                    {token.dexPlatform === 'raydium' && (
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">Raydium</Badge>
                    )}
                    {token.dexPlatform === 'bonding_curve' && (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">On Curve</Badge>
                    )}
                    <ClassificationBadge classification={token.analysis.classification} />
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {truncateAddress(mint, 8)}
                    </code>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
                      {copied ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>

                  {/* Price + key metrics */}
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    {token.price != null && (
                      <div>
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="text-lg font-bold">
                          ${token.price < 0.01 ? token.price.toExponential(2) : token.price.toFixed(4)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Market Cap</p>
                      <p className="text-lg font-bold">{formatMarketCap(token.usd_market_cap)}</p>
                    </div>
                    {token.price24hChangePercent != null && (
                      <div>
                        <p className="text-xs text-muted-foreground">24h Change</p>
                        <p className={`text-lg font-bold flex items-center gap-1 ${token.price24hChangePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {token.price24hChangePercent >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          {token.price24hChangePercent >= 0 ? '+' : ''}{token.price24hChangePercent.toFixed(2)}%
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(token.created_timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Data Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              icon={BarChart3}
              iconColor="text-blue-500"
              label="24h Volume"
              value={token.volume24hUSD ? formatMarketCap(token.volume24hUSD) : 'N/A'}
              sub={token.volume24hChangePercent != null
                ? `${token.volume24hChangePercent >= 0 ? '+' : ''}${token.volume24hChangePercent.toFixed(1)}% vol change`
                : undefined}
              subColor={token.volume24hChangePercent != null && token.volume24hChangePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}
            />
            <MetricCard
              icon={Droplets}
              iconColor="text-cyan-500"
              label="Liquidity"
              value={token.liquidity ? formatMarketCap(token.liquidity) : 'N/A'}
              sub={liquidityRatio != null ? `${liquidityRatio.toFixed(1)}% of MCap` : undefined}
              subColor={liquidityRatio != null && liquidityRatio >= 10 ? 'text-emerald-500' : liquidityRatio != null && liquidityRatio >= 5 ? 'text-amber-500' : 'text-red-500'}
            />
            <MetricCard
              icon={Users}
              iconColor="text-purple-500"
              label="Holders"
              value={token.holder ? token.holder.toLocaleString() : 'N/A'}
              sub={token.uniqueWallet24h ? `${token.uniqueWallet24h.toLocaleString()} unique 24h` : undefined}
            />
            <MetricCard
              icon={ArrowUpDown}
              iconColor="text-amber-500"
              label="24h Trades"
              value={token.trade24h ? token.trade24h.toLocaleString() : 'N/A'}
              sub={token.reply_count ? `${token.reply_count} replies` : undefined}
            />
          </div>

          {/* Bonding Curve / DEX Status */}
          {token.isPumpFun && token.bondingCurveProgress != null && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {token.isGraduated ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Graduated - Trading on {token.dexPlatform === 'pumpswap' ? 'PumpSwap' : token.dexPlatform === 'raydium' ? 'Raydium' : 'DEX'}
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 text-amber-500" />
                      Bonding Curve Progress
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress to graduation</span>
                    <span className="font-medium">{token.bondingCurveProgress}%</span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        token.bondingCurveProgress >= 100
                          ? 'bg-emerald-500'
                          : token.bondingCurveProgress >= 75
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                      }`}
                      style={{ width: `${token.bondingCurveProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Launch</span>
                    <span>~$69K MCap (Graduation)</span>
                  </div>
                  {!token.isGraduated && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatMarketCap(Math.max(0, GRADUATION_MCAP - (token.usd_market_cap || 0)))} away from graduating to {token.usd_market_cap && token.usd_market_cap > 50_000 ? 'PumpSwap' : 'PumpSwap/Raydium'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Buy/Sell Pressure */}
          {(token.buy24h != null || token.vBuy24hUSD != null) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-emerald-500" />
                  Buy / Sell Pressure (24h)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {token.buy24h != null && token.sell24h != null && (
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-emerald-500 font-medium">
                        {token.buy24h.toLocaleString()} buys ({buySellRatio != null ? (buySellRatio * 100).toFixed(1) : 0}%)
                      </span>
                      <span className="text-red-500 font-medium">
                        {token.sell24h.toLocaleString()} sells ({buySellRatio != null ? ((1 - buySellRatio) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                    <div className="h-3 bg-red-500 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-l-full transition-all"
                        style={{ width: `${(buySellRatio || 0.5) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Trade Count Pressure</p>
                  </div>
                )}

                {token.vBuy24hUSD != null && token.vSell24hUSD != null && (
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-emerald-500 font-medium">
                        {formatMarketCap(token.vBuy24hUSD)} buy vol ({buyVolumeRatio != null ? (buyVolumeRatio * 100).toFixed(1) : 0}%)
                      </span>
                      <span className="text-red-500 font-medium">
                        {formatMarketCap(token.vSell24hUSD)} sell vol ({buyVolumeRatio != null ? ((1 - buyVolumeRatio) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                    <div className="h-3 bg-red-500 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-l-full transition-all"
                        style={{ width: `${(buyVolumeRatio || 0.5) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Volume Pressure (USD)</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {token.description || 'No description provided for this token.'}
              </p>
              {token.description && (
                <p className="text-xs text-muted-foreground mt-2">
                  {token.description.length} characters
                </p>
              )}
            </CardContent>
          </Card>

          {/* Utility Analysis */}
          <UtilityAnalysisPanel analysis={token.analysis} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Links & Social</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {token.website ? (
                <a
                  href={token.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <Globe className="h-4 w-4 text-blue-400" />
                  <span className="text-sm truncate flex-1">{token.website}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-lg border border-border/30 opacity-50">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm">No website</span>
                </div>
              )}

              {token.telegram ? (
                <a
                  href={`https://t.me/${token.telegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-sky-400" />
                  <span className="text-sm truncate flex-1">@{token.telegram}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-lg border border-border/30 opacity-50">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">No Telegram</span>
                </div>
              )}

              {token.twitter ? (
                <a
                  href={`https://twitter.com/${token.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <Twitter className="h-4 w-4 text-blue-500" />
                  <span className="text-sm truncate flex-1">@{token.twitter}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-lg border border-border/30 opacity-50">
                  <Twitter className="h-4 w-4" />
                  <span className="text-sm">No Twitter</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Token Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Token Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Mint" value={truncateAddress(token.mint, 6)} />
              <InfoRow label="Creator" value={truncateAddress(token.creator, 6)} />
              {token.rank != null && <InfoRow label="Birdeye Rank" value={`#${token.rank}`} />}
              <InfoRow
                label="DEX Platform"
                value={
                  token.dexPlatform === 'pumpswap' ? 'PumpSwap'
                    : token.dexPlatform === 'raydium' ? 'Raydium'
                      : token.dexPlatform === 'bonding_curve' ? 'Bonding Curve'
                        : token.isPumpFun ? 'Pump.fun' : 'Unknown'
                }
              />
              <InfoRow label="Graduated" value={token.isGraduated ? 'Yes' : 'No'} />
              <InfoRow label="NSFW" value={token.nsfw ? 'Yes' : 'No'} />
            </CardContent>
          </Card>

          {/* External Links */}
          <div className="space-y-2">
            <a
              href={`https://pump.fun/${token.mint}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full gap-2" variant="outline">
                View on Pump.fun
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
            <a
              href={`https://birdeye.so/token/${token.mint}?chain=solana`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full gap-2 mt-2" variant="outline">
                View on Birdeye
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
            <a
              href={`https://dexscreener.com/solana/${token.mint}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full gap-2 mt-2" variant="outline">
                View on DexScreener
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-xs">{value}</span>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  iconColor,
  label,
  value,
  sub,
  subColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
        <p className="text-sm font-bold">{value}</p>
        {sub && <p className={`text-[10px] mt-0.5 ${subColor || 'text-muted-foreground'}`}>{sub}</p>}
      </CardContent>
    </Card>
  );
}

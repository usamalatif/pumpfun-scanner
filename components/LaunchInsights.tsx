'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMarketCap } from '@/lib/utils';
import {
  NamePattern,
  NicheSuccessRate,
  LiquidityInsight,
  SocialCorrelation,
  MarketOverview,
} from '@/lib/launch-intelligence';
import {
  Target,
  Droplets,
  Share2,
  Lightbulb,
  CheckCircle2,
  XCircle,
  BarChart3,
} from 'lucide-react';

// ---- Market Overview Section ----

function MarketOverviewSection({ overview }: { overview: MarketOverview }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-500" />
          Market Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MiniStat label="Avg Market Cap" value={formatMarketCap(overview.avgMarketCap)} />
          <MiniStat label="Median Market Cap" value={formatMarketCap(overview.medianMarketCap)} />
          <MiniStat label="Avg 24h Volume" value={formatMarketCap(overview.avgVolume)} />
          <MiniStat label="Avg Liquidity" value={formatMarketCap(overview.avgLiquidity)} />
          <MiniStat
            label="Overall Success Rate"
            value={`${overview.overallSuccessRate.toFixed(1)}%`}
            color={overview.overallSuccessRate >= 50 ? 'text-emerald-500' : 'text-red-500'}
          />
          <MiniStat
            label="Avg 24h Change"
            value={`${overview.avgPriceChange >= 0 ? '+' : ''}${overview.avgPriceChange.toFixed(1)}%`}
            color={overview.avgPriceChange >= 0 ? 'text-emerald-500' : 'text-red-500'}
          />
          <MiniStat
            label="Gainers / Losers"
            value={`${overview.gainersCount} / ${overview.losersCount}`}
            color="text-foreground"
          />
          <MiniStat
            label="Total Liquidity"
            value={formatMarketCap(overview.totalLiquidity)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-semibold ${color || ''}`}>{value}</p>
    </div>
  );
}

// ---- Name Patterns Section ----

function NamePatternsSection({ patterns }: { patterns: NamePattern[] }) {
  if (patterns.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Hot Name Patterns
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            Words appearing in 2+ token names
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0.5">
          {/* Header */}
          <div className="grid grid-cols-[1fr_60px_80px_80px_80px_60px] gap-2 px-3 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            <span>Pattern</span>
            <span className="text-right">Count</span>
            <span className="text-right">Avg MCap</span>
            <span className="text-right">Avg Volume</span>
            <span className="text-right">Avg Change</span>
            <span className="text-right">Win %</span>
          </div>

          {patterns.slice(0, 15).map((p) => (
            <div
              key={p.pattern}
              className="grid grid-cols-[1fr_60px_80px_80px_80px_60px] gap-2 items-center px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div>
                <span className="text-sm font-medium">&quot;{p.pattern}&quot;</span>
                <p className="text-[10px] text-muted-foreground">
                  {p.examples.map((e) => `$${e}`).join(', ')}
                  {p.pumpFunCount > 0 && <span className="text-cyan-400 ml-1">({p.pumpFunCount} PF)</span>}
                </p>
              </div>
              <span className="text-xs font-semibold text-right">{p.count}</span>
              <span className="text-xs font-mono text-right">{formatMarketCap(p.avgMarketCap)}</span>
              <span className="text-xs font-mono text-right">{formatMarketCap(p.avgVolume)}</span>
              <span className={`text-xs font-medium text-right ${p.avgPriceChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {p.avgPriceChange >= 0 ? '+' : ''}{p.avgPriceChange.toFixed(1)}%
              </span>
              <span className={`text-xs font-semibold text-right ${p.successRate >= 50 ? 'text-emerald-500' : 'text-red-500'}`}>
                {p.successRate.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Niche Success Rates ----

function NicheSuccessSection({ rates }: { rates: NicheSuccessRate[] }) {
  if (rates.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-emerald-500" />
          Niche Success Rates (24h)
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            % of tokens with positive price change
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rates.map((r) => (
            <div key={r.nicheName} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{r.nicheEmoji}</span>
                  <span className="text-sm font-medium">{r.nicheName}</span>
                  <span className="text-[10px] text-muted-foreground">({r.totalTokens} tokens)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-emerald-500 flex items-center gap-0.5">
                    <CheckCircle2 className="h-3 w-3" /> {r.gainers}
                  </span>
                  <span className="text-[10px] text-red-500 flex items-center gap-0.5">
                    <XCircle className="h-3 w-3" /> {r.losers}
                  </span>
                  <span className={`text-xs font-bold ${r.successRate >= 50 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {r.successRate.toFixed(0)}%
                  </span>
                </div>
              </div>
              {/* Success bar */}
              <div className="h-2 bg-red-500/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${r.successRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                  Avg gain: <span className="text-emerald-500">+{r.avgGain.toFixed(1)}%</span>
                  {' / '}
                  Avg loss: <span className="text-red-500">{r.avgLoss.toFixed(1)}%</span>
                </span>
                <span>
                  {r.bestToken && (
                    <span className="text-emerald-500">Best: ${r.bestToken.symbol} +{r.bestToken.change.toFixed(1)}%</span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Liquidity Analysis ----

function LiquiditySection({ insights }: { insights: LiquidityInsight[] }) {
  if (insights.length === 0) return null;

  const healthColors: Record<string, string> = {
    'Healthy': 'text-emerald-500 bg-emerald-500/10',
    'Moderate': 'text-amber-500 bg-amber-500/10',
    'Low': 'text-orange-500 bg-orange-500/10',
    'Very Low': 'text-red-500 bg-red-500/10',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Droplets className="h-4 w-4 text-blue-500" />
          Liquidity Analysis
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            Liquidity-to-market-cap ratio
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0.5">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] gap-2 px-3 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            <span>Niche</span>
            <span className="text-right">Avg Liquidity</span>
            <span className="text-right">Total Liquidity</span>
            <span className="text-right">Liq/MCap Ratio</span>
            <span className="text-right">Health</span>
          </div>

          {insights.map((l) => (
            <div key={l.nicheName} className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] gap-2 items-center px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2">
                <span>{l.nicheEmoji}</span>
                <span className="text-sm font-medium">{l.nicheName}</span>
                <span className="text-[10px] text-muted-foreground">({l.tokensWithLiquidity})</span>
              </div>
              <span className="text-xs font-mono text-right">{formatMarketCap(l.avgLiquidity)}</span>
              <span className="text-xs font-mono text-right">{formatMarketCap(l.totalLiquidity)}</span>
              <span className="text-xs font-mono text-right">{(l.avgLiquidityRatio * 100).toFixed(1)}%</span>
              <span className={`text-[10px] text-right px-1.5 py-0.5 rounded font-medium ${healthColors[l.healthRating]}`}>
                {l.healthRating}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Social Correlation ----

function SocialSection({ correlations }: { correlations: SocialCorrelation[] }) {
  if (correlations.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Share2 className="h-4 w-4 text-purple-500" />
          Social Presence vs Performance
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            Do socials matter?
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {correlations.map((c) => (
            <div key={c.category} className="flex items-center gap-4 p-3 rounded-lg border border-border/30 hover:bg-muted/20 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{c.category}</p>
                <p className="text-[10px] text-muted-foreground">{c.count} tokens</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Avg MCap</p>
                <p className="text-xs font-mono">{formatMarketCap(c.avgMarketCap)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Avg Volume</p>
                <p className="text-xs font-mono">{formatMarketCap(c.avgVolume)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Avg Change</p>
                <p className={`text-xs font-semibold ${c.avgPriceChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {c.avgPriceChange >= 0 ? '+' : ''}{c.avgPriceChange.toFixed(1)}%
                </p>
              </div>
              <div className="text-right min-w-[50px]">
                <p className="text-[10px] text-muted-foreground">Win %</p>
                <p className={`text-xs font-bold ${c.successRate >= 50 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {c.successRate.toFixed(0)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Main Export ----

interface LaunchInsightsProps {
  overview: MarketOverview;
  namePatterns: NamePattern[];
  successRates: NicheSuccessRate[];
  liquidityInsights: LiquidityInsight[];
  socialCorrelations: SocialCorrelation[];
}

export function LaunchInsights({
  overview,
  namePatterns,
  successRates,
  liquidityInsights,
  socialCorrelations,
}: LaunchInsightsProps) {
  return (
    <div className="space-y-4">
      <MarketOverviewSection overview={overview} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NicheSuccessSection rates={successRates} />
        <SocialSection correlations={socialCorrelations} />
      </div>
      <NamePatternsSection patterns={namePatterns} />
      <LiquiditySection insights={liquidityInsights} />
    </div>
  );
}

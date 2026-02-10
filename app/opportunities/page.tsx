'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTokens } from '@/hooks/useTokens';
import { useSettings } from '@/hooks/useSettings';
import { analyzeNiches } from '@/lib/niche-analyzer';
import {
  analyzeOpportunities,
  findNicheGaps,
  computeWinningFormulas,
  NicheOpportunity,
} from '@/lib/opportunity-analyzer';
import { analyzeNamePatterns } from '@/lib/launch-intelligence';
import { formatMarketCap } from '@/lib/utils';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Zap,
  BarChart3,
  ArrowRight,
  Lightbulb,
  Flame,
  Shield,
  AlertTriangle,
} from 'lucide-react';

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, score)}%`, backgroundColor: color }}
      />
    </div>
  );
}

function CompetitionBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'Very High': 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <Badge variant="outline" className={styles[level] || ''}>
      {level}
    </Badge>
  );
}

function OpportunityCard({ opp, rank }: { opp: NicheOpportunity; rank: number }) {
  const scoreColor =
    opp.opportunityScore >= 70 ? '#10B981'
      : opp.opportunityScore >= 50 ? '#F59E0B'
        : opp.opportunityScore >= 30 ? '#F97316' : '#EF4444';

  return (
    <Card className="border-border/50 hover:border-border transition-colors">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
              style={{ backgroundColor: `${opp.niche.color}20` }}
            >
              {opp.niche.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{opp.niche.name}</h3>
                {rank <= 3 && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs">
                    #{rank} Pick
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {opp.tokenCount} tokens | {opp.pumpFunCount} on pump.fun
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: scoreColor }}>
              {opp.opportunityScore}
            </div>
            <div className="text-xs text-muted-foreground">Score</div>
          </div>
        </div>

        {/* Score Bars */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-24">Demand</span>
            <ScoreBar score={opp.demandScore} color="#3B82F6" />
            <span className="text-xs font-mono w-8 text-right">{opp.demandScore}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-24">Momentum</span>
            <ScoreBar score={opp.momentumScore} color="#10B981" />
            <span className="text-xs font-mono w-8 text-right">{opp.momentumScore}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-24">Success Rate</span>
            <ScoreBar score={opp.successRate} color="#F59E0B" />
            <span className="text-xs font-mono w-8 text-right">{Math.round(opp.successRate)}%</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Avg Volume</div>
            <div className="text-sm font-semibold">{formatMarketCap(opp.avgVolume)}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Avg MCap</div>
            <div className="text-sm font-semibold">{formatMarketCap(opp.avgMarketCap)}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Competition</div>
            <div className="text-sm"><CompetitionBadge level={opp.competitionLevel} /></div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Liquidity</div>
            <div className="text-sm font-semibold">{opp.liquidityHealth}</div>
          </div>
        </div>

        {/* Gain/Loss */}
        <div className="flex gap-4 mb-3 text-sm">
          {opp.avgGain > 0 && (
            <div className="flex items-center gap-1 text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              Avg Gain: +{opp.avgGain.toFixed(1)}%
            </div>
          )}
          {opp.avgLoss < 0 && (
            <div className="flex items-center gap-1 text-red-400">
              <TrendingDown className="h-3 w-3" />
              Avg Loss: {opp.avgLoss.toFixed(1)}%
            </div>
          )}
        </div>

        {/* Top Performer */}
        {opp.topPerformer && (
          <div className="text-xs text-muted-foreground mb-3">
            Top performer: <span className="text-foreground font-medium">{opp.topPerformer.symbol}</span>
            {' '}({opp.topPerformer.change >= 0 ? '+' : ''}{opp.topPerformer.change.toFixed(1)}%, MCap {formatMarketCap(opp.topPerformer.mcap)})
          </div>
        )}

        {/* Recommendation */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">{opp.recommendation}</p>
          </div>
        </div>

        {/* Top tokens quick view */}
        {opp.topTokens.length > 0 && (
          <div className="mt-3 space-y-1">
            <div className="text-xs text-muted-foreground mb-1">Top tokens in niche:</div>
            {opp.topTokens.slice(0, 3).map((token) => (
              <Link
                key={token.mint}
                href={`/tokens/${token.mint}`}
                className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium truncate">{token.symbol}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{formatMarketCap(token.usd_market_cap || 0)}</span>
                  <span className={(token.price24hChangePercent || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {(token.price24hChangePercent || 0) >= 0 ? '+' : ''}{(token.price24hChangePercent || 0).toFixed(1)}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function OpportunitiesPage() {
  const { settings } = useSettings();
  const { allTokens, isLoading } = useTokens(
    settings.tokensToFetch,
    settings.refreshInterval,
    settings.autoRefresh
  );

  const niches = useMemo(() => analyzeNiches(allTokens), [allTokens]);
  const opportunities = useMemo(
    () => analyzeOpportunities(niches),
    [niches]
  );
  const gaps = useMemo(() => findNicheGaps(niches), [niches]);
  const formulas = useMemo(
    () => computeWinningFormulas(opportunities, allTokens),
    [opportunities, allTokens]
  );
  const namePatterns = useMemo(
    () => analyzeNamePatterns(allTokens),
    [allTokens]
  );

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading opportunity data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Target className="h-8 w-8 text-emerald-400" />
          Launch Opportunities
        </h1>
        <p className="text-muted-foreground mt-1">
          Find the best niches to launch your next token. Based on {allTokens.length} trending tokens.
        </p>
      </div>

      {/* Winning Formulas */}
      {formulas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {formulas.map((formula) => (
            <Card key={formula.label} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <h3 className="font-semibold text-sm">{formula.label}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{formula.description}</p>
                <div className="flex gap-3">
                  {formula.metrics.map((m) => (
                    <div key={m.key} className="text-center">
                      <div className="text-xs text-muted-foreground">{m.key}</div>
                      <div className="text-sm font-bold">{m.value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Niche Gap Analysis */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            Demand vs Supply Gap (Underserved Niches)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {gaps.map((gap) => (
              <div
                key={gap.nicheName}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="text-xl w-8">{gap.nicheEmoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{gap.nicheName}</span>
                    <Badge
                      variant="outline"
                      className={
                        gap.gapScore >= 70
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : gap.gapScore >= 50
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-muted text-muted-foreground border-border/50'
                      }
                    >
                      {gap.gapScore >= 70 ? 'High Gap' : gap.gapScore >= 50 ? 'Moderate Gap' : 'Saturated'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 mb-1.5">
                    <div className="flex-1">
                      <ScoreBar score={gap.gapScore} color={gap.nicheColor} />
                    </div>
                    <span className="text-xs font-mono w-8 text-right">{gap.gapScore}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{gap.insight}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-muted-foreground">{gap.tokenCount} tokens</div>
                  <div className="text-xs font-medium">{formatMarketCap(gap.demandPerToken)}/token</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Opportunity Rankings */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Flame className="h-5 w-5 text-orange-400" />
          Niche Opportunity Rankings
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {opportunities.map((opp, i) => (
            <OpportunityCard key={opp.niche.id} opp={opp} rank={i + 1} />
          ))}
        </div>
      </div>

      {/* Hot Name Patterns */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-purple-400" />
            Hot Name Patterns (What&apos;s Working)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="text-left p-2">Pattern</th>
                  <th className="text-right p-2">Tokens</th>
                  <th className="text-right p-2">Avg MCap</th>
                  <th className="text-right p-2">Avg Volume</th>
                  <th className="text-right p-2">Win Rate</th>
                  <th className="text-right p-2">Avg Change</th>
                  <th className="text-left p-2">Examples</th>
                </tr>
              </thead>
              <tbody>
                {namePatterns.slice(0, 15).map((p) => (
                  <tr key={p.pattern} className="border-b border-border/20 hover:bg-muted/50">
                    <td className="p-2 font-medium">{p.pattern}</td>
                    <td className="text-right p-2">{p.count}</td>
                    <td className="text-right p-2">{formatMarketCap(p.avgMarketCap)}</td>
                    <td className="text-right p-2">{formatMarketCap(p.avgVolume)}</td>
                    <td className="text-right p-2">
                      <span className={p.successRate >= 50 ? 'text-emerald-400' : 'text-red-400'}>
                        {p.successRate.toFixed(0)}%
                      </span>
                    </td>
                    <td className="text-right p-2">
                      <span className={p.avgPriceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {p.avgPriceChange >= 0 ? '+' : ''}{p.avgPriceChange.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2 text-muted-foreground text-xs">
                      {p.examples.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Launch Checklist */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-emerald-400" />
            Launch Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-emerald-400" />
                Based on Data
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">+</span>
                  Pick a niche with high opportunity score and low competition
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">+</span>
                  Use trending name patterns that are showing positive momentum
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">+</span>
                  Set up website + Twitter (data shows higher avg market cap)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">+</span>
                  Target niches with high demand-per-token (underserved gaps)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">+</span>
                  Study top performers in your chosen niche
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Watch Out For
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">-</span>
                  Avoid niches with very high competition and low success rate
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">-</span>
                  Low liquidity niches mean harder exits for buyers
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">-</span>
                  Negative momentum niches may be cooling off
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">-</span>
                  Very saturated niches need a unique angle to stand out
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">-</span>
                  Past performance doesn&apos;t guarantee future results
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

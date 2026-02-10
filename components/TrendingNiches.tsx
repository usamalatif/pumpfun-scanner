'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NicheStats } from '@/lib/niche-analyzer';
import { formatMarketCap } from '@/lib/utils';
import { Flame, TrendingUp, TrendingDown } from 'lucide-react';

interface TrendingNichesProps {
  niches: NicheStats[];
  onNicheClick?: (nicheId: string) => void;
}

function HeatBar({ heat }: { heat: number }) {
  const getColor = (h: number) => {
    if (h >= 70) return 'bg-red-500';
    if (h >= 40) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getColor(heat)}`}
          style={{ width: `${heat}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">{heat}</span>
    </div>
  );
}

export function TrendingNiches({ niches, onNicheClick }: TrendingNichesProps) {
  if (niches.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Trending Niches
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            Sorted by activity heat
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 px-3 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            <span>Niche</span>
            <span className="text-right">Tokens</span>
            <span className="text-right">Volume 24h</span>
            <span className="text-right">Avg Change</span>
            <span>Heat</span>
          </div>

          {niches.map((ns) => (
            <button
              key={ns.niche.id}
              onClick={() => onNicheClick?.(ns.niche.id)}
              className="w-full grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 items-center px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              {/* Niche name */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{ns.niche.emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{ns.niche.name}</p>
                  {ns.pumpFunCount > 0 && (
                    <p className="text-[10px] text-cyan-400">{ns.pumpFunCount} pump.fun</p>
                  )}
                </div>
              </div>

              {/* Token count */}
              <div className="text-right">
                <span className="text-sm font-semibold">{ns.tokenCount}</span>
              </div>

              {/* Volume */}
              <div className="text-right">
                <span className="text-xs font-mono">
                  {ns.totalVolume > 0 ? formatMarketCap(ns.totalVolume) : '-'}
                </span>
              </div>

              {/* Avg Price Change */}
              <div className="text-right">
                {ns.avgPriceChange !== 0 ? (
                  <span className={`text-xs font-medium flex items-center gap-0.5 justify-end ${ns.avgPriceChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {ns.avgPriceChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {ns.avgPriceChange >= 0 ? '+' : ''}{ns.avgPriceChange.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>

              {/* Heat */}
              <HeatBar heat={ns.heat} />
            </button>
          ))}
        </div>

        {/* Niche insights */}
        {niches.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {niches[0] && (
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <p className="text-[10px] text-red-400 uppercase tracking-wider font-medium mb-1">Hottest Niche</p>
                  <p className="text-sm font-semibold">{niches[0].niche.emoji} {niches[0].niche.name}</p>
                  <p className="text-xs text-muted-foreground">{niches[0].tokenCount} tokens, {formatMarketCap(niches[0].totalVolume)} vol</p>
                </div>
              )}
              {(() => {
                const bestGainer = [...niches].sort((a, b) => b.avgPriceChange - a.avgPriceChange)[0];
                return bestGainer && bestGainer.avgPriceChange > 0 ? (
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-medium mb-1">Biggest Gainer</p>
                    <p className="text-sm font-semibold">{bestGainer.niche.emoji} {bestGainer.niche.name}</p>
                    <p className="text-xs text-muted-foreground">+{bestGainer.avgPriceChange.toFixed(1)}% avg change</p>
                  </div>
                ) : null;
              })()}
              {(() => {
                const mostVolume = [...niches].sort((a, b) => b.totalVolume - a.totalVolume)[0];
                return mostVolume && mostVolume.totalVolume > 0 ? (
                  <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <p className="text-[10px] text-blue-400 uppercase tracking-wider font-medium mb-1">Most Volume</p>
                    <p className="text-sm font-semibold">{mostVolume.niche.emoji} {mostVolume.niche.name}</p>
                    <p className="text-xs text-muted-foreground">{formatMarketCap(mostVolume.totalVolume)} in 24h</p>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

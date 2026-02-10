'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnalyzedToken } from '@/lib/types';
import { formatMarketCap } from '@/lib/utils';
import { TrendingUp, TrendingDown, BarChart3, Rocket } from 'lucide-react';

interface MarketIntelligenceProps {
  topGainers: AnalyzedToken[];
  topLosers: AnalyzedToken[];
  topVolume: AnalyzedToken[];
  pumpFunLeaders: AnalyzedToken[];
}

function MiniTokenRow({ token, metric }: { token: AnalyzedToken; metric: React.ReactNode }) {
  return (
    <Link href={`/tokens/${token.mint}`}>
      <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 transition-colors cursor-pointer">
        {token.image_uri ? (
          <img
            src={token.image_uri}
            alt={token.name}
            className="h-6 w-6 rounded-full object-cover bg-muted flex-shrink-0"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '';
              (e.target as HTMLImageElement).className = 'h-6 w-6 rounded-full bg-muted flex-shrink-0';
            }}
          />
        ) : (
          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold flex-shrink-0">
            {token.symbol?.slice(0, 2)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium truncate">{token.name}</span>
            {token.isPumpFun && (
              <Badge variant="pumpfun" className="text-[8px] px-1 py-0 leading-tight">PF</Badge>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">${token.symbol}</span>
        </div>
        <div className="flex-shrink-0 text-right">{metric}</div>
      </div>
    </Link>
  );
}

export function MarketIntelligence({
  topGainers,
  topLosers,
  topVolume,
  pumpFunLeaders,
}: MarketIntelligenceProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top Gainers */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Top Gainers (24h)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {topGainers.length > 0 ? (
            <div className="space-y-0.5">
              {topGainers.map((token) => (
                <MiniTokenRow
                  key={token.mint}
                  token={token}
                  metric={
                    <span className="text-xs font-semibold text-emerald-500">
                      +{(token.price24hChangePercent || 0).toFixed(1)}%
                    </span>
                  }
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">No data available</p>
          )}
        </CardContent>
      </Card>

      {/* Top Losers */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            Top Losers (24h)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {topLosers.length > 0 ? (
            <div className="space-y-0.5">
              {topLosers.map((token) => (
                <MiniTokenRow
                  key={token.mint}
                  token={token}
                  metric={
                    <span className="text-xs font-semibold text-red-500">
                      {(token.price24hChangePercent || 0).toFixed(1)}%
                    </span>
                  }
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">No data available</p>
          )}
        </CardContent>
      </Card>

      {/* Top Volume */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            Highest Volume (24h)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {topVolume.length > 0 ? (
            <div className="space-y-0.5">
              {topVolume.map((token) => (
                <MiniTokenRow
                  key={token.mint}
                  token={token}
                  metric={
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatMarketCap(token.volume24hUSD || 0)}
                    </span>
                  }
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">No data available</p>
          )}
        </CardContent>
      </Card>

      {/* Pump.fun Leaders */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Rocket className="h-4 w-4 text-cyan-500" />
            Pump.fun Leaders
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {pumpFunLeaders.length > 0 ? (
            <div className="space-y-0.5">
              {pumpFunLeaders.map((token) => (
                <MiniTokenRow
                  key={token.mint}
                  token={token}
                  metric={
                    <div className="text-right">
                      <span className="text-xs font-mono">{formatMarketCap(token.usd_market_cap)}</span>
                      {token.price24hChangePercent != null && (
                        <p className={`text-[10px] ${token.price24hChangePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {token.price24hChangePercent >= 0 ? '+' : ''}{token.price24hChangePercent.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  }
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">No pump.fun tokens found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

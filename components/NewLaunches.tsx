'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnalyzedToken } from '@/lib/types';
import { formatMarketCap, formatTimeAgo } from '@/lib/utils';
import { Sparkles, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface NewLaunchesProps {
  tokens: AnalyzedToken[];
}

export function NewLaunches({ tokens }: NewLaunchesProps) {
  if (tokens.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Newest Tokens
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            Most recently created
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0.5">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 px-3 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            <span>Token</span>
            <span className="text-right">Age</span>
            <span className="text-right">Market Cap</span>
            <span className="text-right">Volume 24h</span>
            <span className="text-right">24h Change</span>
          </div>

          {tokens.map((token) => (
            <Link key={token.mint} href={`/tokens/${token.mint}`}>
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 items-center px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                {/* Token */}
                <div className="flex items-center gap-2 min-w-0">
                  {token.image_uri ? (
                    <img
                      src={token.image_uri}
                      alt={token.name}
                      className="h-7 w-7 rounded-full object-cover bg-muted flex-shrink-0"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                        (e.target as HTMLImageElement).className = 'h-7 w-7 rounded-full bg-muted flex-shrink-0';
                      }}
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                      {token.symbol?.slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium truncate">{token.name}</p>
                      {token.isPumpFun && (
                        <Badge variant="pumpfun" className="text-[8px] px-1 py-0">PF</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">${token.symbol}</p>
                  </div>
                </div>

                {/* Age */}
                <div className="text-right">
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5 justify-end">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(token.created_timestamp)}
                  </span>
                </div>

                {/* Market Cap */}
                <div className="text-right">
                  <span className="text-xs font-mono">{formatMarketCap(token.usd_market_cap)}</span>
                </div>

                {/* Volume */}
                <div className="text-right">
                  <span className="text-xs font-mono">
                    {token.volume24hUSD ? formatMarketCap(token.volume24hUSD) : '-'}
                  </span>
                </div>

                {/* Price change */}
                <div className="text-right">
                  {token.price24hChangePercent != null ? (
                    <span className={`text-xs font-medium flex items-center gap-0.5 justify-end ${token.price24hChangePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {token.price24hChangePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {token.price24hChangePercent >= 0 ? '+' : ''}{token.price24hChangePercent.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

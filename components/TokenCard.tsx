'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ClassificationBadge } from './ClassificationBadge';
import { UtilityScoreBadge } from './UtilityScoreBadge';
import { SocialLinks } from './SocialLinks';
import { AnalyzedToken } from '@/lib/types';
import { formatMarketCap, formatTimeAgo } from '@/lib/utils';
import { ExternalLink, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TokenCardProps {
  token: AnalyzedToken;
}

export function TokenCard({ token }: TokenCardProps) {
  return (
    <Link href={`/tokens/${token.mint}`}>
      <Card className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              {token.image_uri ? (
                <img
                  src={token.image_uri}
                  alt={token.name}
                  className="h-10 w-10 rounded-full object-cover bg-muted"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '';
                    (e.target as HTMLImageElement).className = 'h-10 w-10 rounded-full bg-muted';
                  }}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                  {token.symbol?.slice(0, 2)}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">{token.name}</h3>
                <p className="text-xs text-muted-foreground">${token.symbol}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {token.isPumpFun && (
                <Badge variant="pumpfun" className="text-[10px] px-1.5 py-0">PF</Badge>
              )}
              <ClassificationBadge classification={token.analysis.classification} size="sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {token.description || 'No description available'}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Market Cap</p>
              <p className="text-sm font-semibold">{formatMarketCap(token.usd_market_cap)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Utility Score</p>
              <UtilityScoreBadge score={token.analysis.utilityScore} size="sm" />
            </div>
            {token.price24hChangePercent != null && (
              <div>
                <p className="text-xs text-muted-foreground">24h Change</p>
                <p className={`text-sm font-semibold flex items-center gap-0.5 ${token.price24hChangePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {token.price24hChangePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {token.price24hChangePercent >= 0 ? '+' : ''}{token.price24hChangePercent.toFixed(1)}%
                </p>
              </div>
            )}
            {token.volume24hUSD != null && token.volume24hUSD > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">24h Volume</p>
                <p className="text-sm font-semibold flex items-center gap-0.5 justify-end">
                  <BarChart3 className="h-3 w-3 text-muted-foreground" />
                  {formatMarketCap(token.volume24hUSD)}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <SocialLinks
              website={token.website}
              telegram={token.telegram}
              twitter={token.twitter}
              size="sm"
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatTimeAgo(token.created_timestamp)}</span>
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

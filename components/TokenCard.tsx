'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ClassificationBadge } from './ClassificationBadge';
import { UtilityScoreBadge } from './UtilityScoreBadge';
import { SocialLinks } from './SocialLinks';
import { AnalyzedToken } from '@/lib/types';
import { formatMarketCap, formatTimeAgo } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

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
            <ClassificationBadge classification={token.analysis.classification} size="sm" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {token.description || 'No description available'}
          </p>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Market Cap</p>
              <p className="text-sm font-semibold">{formatMarketCap(token.usd_market_cap)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Utility Score</p>
              <UtilityScoreBadge score={token.analysis.utilityScore} size="sm" />
            </div>
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

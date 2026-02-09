'use client';

import Link from 'next/link';
import { ClassificationBadge } from './ClassificationBadge';
import { UtilityScoreBadge } from './UtilityScoreBadge';
import { SocialLinks } from './SocialLinks';
import { Button } from '@/components/ui/button';
import { AnalyzedToken, SortField } from '@/lib/types';
import { formatMarketCap, formatTimeAgo } from '@/lib/utils';
import { ArrowUpDown, Eye } from 'lucide-react';

interface TokenTableProps {
  tokens: AnalyzedToken[];
  sortBy: SortField;
  onSort: (field: SortField) => void;
}

function SortHeader({
  label,
  field,
  currentSort,
  onSort,
}: {
  label: string;
  field: SortField;
  currentSort: SortField;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentSort === field;
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown
        className={`h-3 w-3 ${isActive ? 'text-primary' : 'text-muted-foreground/50'}`}
      />
    </button>
  );
}

export function TokenTable({ tokens, sortBy, onSort }: TokenTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 text-xs text-muted-foreground">
            <th className="text-left py-3 px-4 font-medium">
              <SortHeader label="Token" field="name" currentSort={sortBy} onSort={onSort} />
            </th>
            <th className="text-left py-3 px-4 font-medium">Classification</th>
            <th className="text-left py-3 px-4 font-medium">
              <SortHeader label="Utility Score" field="utility_score" currentSort={sortBy} onSort={onSort} />
            </th>
            <th className="text-left py-3 px-4 font-medium">
              <SortHeader label="Market Cap" field="market_cap" currentSort={sortBy} onSort={onSort} />
            </th>
            <th className="text-left py-3 px-4 font-medium">
              <SortHeader label="Created" field="created_timestamp" currentSort={sortBy} onSort={onSort} />
            </th>
            <th className="text-left py-3 px-4 font-medium">Socials</th>
            <th className="text-left py-3 px-4 font-medium">
              <SortHeader label="Activity" field="reply_count" currentSort={sortBy} onSort={onSort} />
            </th>
            <th className="text-right py-3 px-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => (
            <tr
              key={token.mint}
              className="border-b border-border/30 hover:bg-muted/50 transition-colors"
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  {token.image_uri ? (
                    <img
                      src={token.image_uri}
                      alt={token.name}
                      className="h-8 w-8 rounded-full object-cover bg-muted"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                        (e.target as HTMLImageElement).className = 'h-8 w-8 rounded-full bg-muted';
                      }}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {token.symbol?.slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium truncate max-w-[150px]">{token.name}</p>
                    <p className="text-xs text-muted-foreground">${token.symbol}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <ClassificationBadge classification={token.analysis.classification} size="sm" />
              </td>
              <td className="py-3 px-4">
                <UtilityScoreBadge score={token.analysis.utilityScore} size="sm" />
              </td>
              <td className="py-3 px-4 font-mono text-xs">
                {formatMarketCap(token.usd_market_cap)}
              </td>
              <td className="py-3 px-4 text-xs text-muted-foreground">
                {formatTimeAgo(token.created_timestamp)}
              </td>
              <td className="py-3 px-4">
                <SocialLinks
                  website={token.website}
                  telegram={token.telegram}
                  twitter={token.twitter}
                  size="sm"
                />
              </td>
              <td className="py-3 px-4 text-xs text-muted-foreground">
                {token.reply_count} replies
              </td>
              <td className="py-3 px-4 text-right">
                <Link href={`/tokens/${token.mint}`}>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

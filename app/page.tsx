'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  TrendingUp,
  DollarSign,
  RefreshCw,
  LayoutGrid,
  List,
  ArrowRight,
  Target,
  Shuffle,
  Theater,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/StatsCard';
import { TokenCard } from '@/components/TokenCard';
import { TokenTable } from '@/components/TokenTable';
import { TokenCardSkeleton } from '@/components/TokenCardSkeleton';
import { ClassificationBadge } from '@/components/ClassificationBadge';
import { UtilityScoreBadge } from '@/components/UtilityScoreBadge';
import { useTokens } from '@/hooks/useTokens';
import { useSettings } from '@/hooks/useSettings';
import { formatMarketCap, formatTimeAgo } from '@/lib/utils';

export default function DashboardPage() {
  const { settings } = useSettings();
  const {
    tokens,
    allTokens,
    isLoading,
    refetch,
    dataUpdatedAt,
    filters,
    updateFilters,
    handleSort,
  } = useTokens(settings.tokensToFetch, settings.refreshInterval, settings.autoRefresh);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Compute quick stats
  const utilityCount = allTokens.filter(
    (t) => t.analysis.classification === 'Likely Utility Token'
  ).length;
  const memeCount = allTokens.filter(
    (t) => t.analysis.classification === 'Likely Meme Token'
  ).length;
  const totalMarketCap = allTokens.reduce((sum, t) => sum + (t.usd_market_cap || 0), 0);

  // Top utility tokens
  const topUtility = [...allTokens]
    .sort((a, b) => b.analysis.utilityScore - a.analysis.utilityScore)
    .slice(0, 3);

  const classificationFilter = filters.classification;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time pump.fun token analytics
            {dataUpdatedAt > 0 && (
              <span> &middot; Updated {formatTimeAgo(dataUpdatedAt)}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Analyzed"
          value={allTokens.length}
          description="Trending tokens"
          icon={Activity}
          color="bg-gradient-to-br from-blue-500 to-cyan-500"
        />
        <StatsCard
          title="Utility Tokens"
          value={utilityCount}
          description={`${allTokens.length > 0 ? ((utilityCount / allTokens.length) * 100).toFixed(1) : 0}% of total`}
          icon={Target}
          color="bg-gradient-to-br from-emerald-500 to-green-500"
        />
        <StatsCard
          title="Meme Tokens"
          value={memeCount}
          description={`${allTokens.length > 0 ? ((memeCount / allTokens.length) * 100).toFixed(1) : 0}% of total`}
          icon={Theater}
          color="bg-gradient-to-br from-purple-500 to-pink-500"
        />
        <StatsCard
          title="Total Market Cap"
          value={formatMarketCap(totalMarketCap)}
          description="Combined value"
          icon={DollarSign}
          color="bg-gradient-to-br from-amber-500 to-orange-500"
        />
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={classificationFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateFilters({ classification: 'all' })}
        >
          All ({allTokens.length})
        </Button>
        <Button
          variant={classificationFilter === 'Likely Utility Token' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateFilters({ classification: 'Likely Utility Token' })}
          className="border-emerald-500/30"
        >
          <Target className="h-3.5 w-3.5 mr-1" />
          Utility ({utilityCount})
        </Button>
        <Button
          variant={classificationFilter === 'Likely Meme Token' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateFilters({ classification: 'Likely Meme Token' })}
          className="border-purple-500/30"
        >
          <Theater className="h-3.5 w-3.5 mr-1" />
          Meme ({memeCount})
        </Button>
        <Button
          variant={classificationFilter === 'Possible Utility/Hybrid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateFilters({ classification: 'Possible Utility/Hybrid' })}
          className="border-amber-500/30"
        >
          <Shuffle className="h-3.5 w-3.5 mr-1" />
          Hybrid
        </Button>
        <Button
          variant={classificationFilter === 'Unknown/Speculative' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateFilters({ classification: 'Unknown/Speculative' })}
          className="border-gray-500/30"
        >
          <HelpCircle className="h-3.5 w-3.5 mr-1" />
          Unknown
        </Button>
      </div>

      {/* Featured utility tokens */}
      {topUtility.length > 0 && classificationFilter === 'all' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Top Utility Tokens
              </CardTitle>
              <Link href="/tokens">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topUtility.map((token) => (
                <Link key={token.mint} href={`/tokens/${token.mint}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer">
                    {token.image_uri ? (
                      <img
                        src={token.image_uri}
                        alt={token.name}
                        className="h-10 w-10 rounded-full object-cover bg-muted"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                        {token.symbol?.slice(0, 2)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{token.name}</p>
                        <ClassificationBadge
                          classification={token.analysis.classification}
                          size="sm"
                          showEmoji={false}
                        />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {formatMarketCap(token.usd_market_cap)}
                        </span>
                        <UtilityScoreBadge score={token.analysis.utilityScore} size="sm" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token feed */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <TokenCardSkeleton key={i} />
          ))}
        </div>
      ) : tokens.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No tokens found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your filters or refresh the data
            </p>
            <Button variant="outline" onClick={() => updateFilters({ classification: 'all' })}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tokens.slice(0, 20).map((token) => (
            <TokenCard key={token.mint} token={token} />
          ))}
        </div>
      ) : (
        <Card>
          <TokenTable
            tokens={tokens.slice(0, 20)}
            sortBy={filters.sortBy}
            onSort={handleSort}
          />
        </Card>
      )}

      {/* View more link */}
      {tokens.length > 20 && (
        <div className="flex justify-center">
          <Link href="/tokens">
            <Button variant="outline" className="gap-2">
              View All {tokens.length} Tokens
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

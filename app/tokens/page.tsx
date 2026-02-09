'use client';

import { useState } from 'react';
import {
  RefreshCw,
  LayoutGrid,
  List,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TokenCard } from '@/components/TokenCard';
import { TokenTable } from '@/components/TokenTable';
import { TokenCardSkeleton } from '@/components/TokenCardSkeleton';
import { FilterPanel } from '@/components/FilterPanel';
import { useTokens } from '@/hooks/useTokens';
import { useSettings } from '@/hooks/useSettings';
import { exportToCSV, exportToJSON, formatTimeAgo } from '@/lib/utils';

export default function TokenListPage() {
  const { settings } = useSettings();
  const {
    tokens,
    paginatedTokens,
    isLoading,
    refetch,
    dataUpdatedAt,
    filters,
    updateFilters,
    page,
    setPage,
    totalPages,
    handleSort,
  } = useTokens(settings.tokensToFetch, settings.refreshInterval, settings.autoRefresh);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const handleExportCSV = () => {
    const exportData = tokens.map((t) => ({
      name: t.name,
      symbol: t.symbol,
      mint: t.mint,
      classification: t.analysis.classification,
      utility_score: t.analysis.utilityScore,
      meme_score: t.analysis.memeScore,
      market_cap: t.usd_market_cap,
      has_website: t.analysis.hasWebsite,
      has_telegram: t.analysis.hasTelegram,
      has_twitter: t.analysis.hasTwitter,
      utility_keywords: t.analysis.utilityKeywords.join('; '),
      meme_keywords: t.analysis.memeKeywords.join('; '),
      created: new Date(t.created_timestamp).toISOString(),
    }));
    exportToCSV(exportData, `pumpfun-tokens-${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportJSON = () => {
    exportToJSON(tokens, `pumpfun-tokens-${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Token List</h1>
          <p className="text-sm text-muted-foreground">
            {tokens.length} tokens found
            {dataUpdatedAt > 0 && (
              <span> &middot; Updated {formatTimeAgo(dataUpdatedAt)}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <Download className="h-4 w-4 mr-1" />
            JSON
          </Button>
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

      {/* Filters */}
      <FilterPanel filters={filters} onFiltersChange={updateFilters} />

      {/* Token display */}
      {isLoading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <TokenCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Loading tokens...</p>
            </CardContent>
          </Card>
        )
      ) : tokens.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <h3 className="text-lg font-semibold mb-1">No tokens match your filters</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button
              variant="outline"
              onClick={() =>
                updateFilters({
                  search: '',
                  classification: 'all',
                  minUtilityScore: 0,
                  hasWebsite: null,
                  hasSocials: null,
                })
              }
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedTokens.map((token) => (
            <TokenCard key={token.mint} token={token} />
          ))}
        </div>
      ) : (
        <Card>
          <TokenTable
            tokens={paginatedTokens}
            sortBy={filters.sortBy}
            onSort={handleSort}
          />
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({tokens.length} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  className="w-9"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 5 && <span className="text-muted-foreground">...</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

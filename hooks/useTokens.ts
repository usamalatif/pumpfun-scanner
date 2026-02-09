'use client';

import { useQuery } from '@tanstack/react-query';
import { AnalyzedToken, TokenFilters, SortField } from '@/lib/types';
import { useMemo, useState, useCallback } from 'react';

const DEFAULT_FILTERS: TokenFilters = {
  search: '',
  classification: 'all',
  minUtilityScore: 0,
  maxUtilityScore: 15,
  minMarketCap: 0,
  maxMarketCap: Infinity,
  hasWebsite: null,
  hasSocials: null,
  sortBy: 'market_cap',
  sortOrder: 'desc',
};

async function fetchTokens(limit: number = 50): Promise<AnalyzedToken[]> {
  const res = await fetch(`/api/tokens/trending?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch tokens');
  const json = await res.json();
  return json.data || [];
}

export function useTokens(
  limit: number = 50,
  refreshInterval: number = 30000,
  autoRefresh: boolean = true
) {
  const [filters, setFilters] = useState<TokenFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: tokens = [], isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['tokens', limit],
    queryFn: () => fetchTokens(limit),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 15000,
  });

  const updateFilters = useCallback((updates: Partial<TokenFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
    setPage(1);
  }, []);

  // Apply filters and sorting
  const filteredTokens = useMemo(() => {
    let result = [...tokens];

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.symbol.toLowerCase().includes(search) ||
          (t.description && t.description.toLowerCase().includes(search))
      );
    }

    // Classification filter
    if (filters.classification !== 'all') {
      result = result.filter((t) => t.analysis.classification === filters.classification);
    }

    // Utility score filter
    result = result.filter(
      (t) =>
        t.analysis.utilityScore >= filters.minUtilityScore &&
        t.analysis.utilityScore <= filters.maxUtilityScore
    );

    // Market cap filter
    result = result.filter(
      (t) =>
        t.usd_market_cap >= filters.minMarketCap &&
        t.usd_market_cap <= filters.maxMarketCap
    );

    // Website filter
    if (filters.hasWebsite !== null) {
      result = result.filter((t) => t.analysis.hasWebsite === filters.hasWebsite);
    }

    // Socials filter
    if (filters.hasSocials !== null) {
      result = result.filter(
        (t) =>
          (t.analysis.hasTelegram || t.analysis.hasTwitter) === filters.hasSocials
      );
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'market_cap':
          comparison = (a.usd_market_cap || 0) - (b.usd_market_cap || 0);
          break;
        case 'utility_score':
          comparison = a.analysis.utilityScore - b.analysis.utilityScore;
          break;
        case 'created_timestamp':
          comparison = a.created_timestamp - b.created_timestamp;
          break;
        case 'reply_count':
          comparison = (a.reply_count || 0) - (b.reply_count || 0);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [tokens, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredTokens.length / pageSize);
  const paginatedTokens = filteredTokens.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleSort = useCallback(
    (field: SortField) => {
      setFilters((prev) => ({
        ...prev,
        sortBy: field,
        sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc',
      }));
    },
    []
  );

  return {
    tokens: filteredTokens,
    paginatedTokens,
    allTokens: tokens,
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
    filters,
    updateFilters,
    page,
    setPage,
    totalPages,
    pageSize,
    handleSort,
  };
}

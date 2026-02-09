'use client';

import { useQuery } from '@tanstack/react-query';
import { AnalyzedToken } from '@/lib/types';

async function fetchTokenDetail(mint: string): Promise<AnalyzedToken> {
  const res = await fetch(`/api/tokens/${mint}`);
  if (!res.ok) throw new Error('Failed to fetch token details');
  const json = await res.json();
  return json.data;
}

export function useTokenDetail(mint: string) {
  return useQuery({
    queryKey: ['token', mint],
    queryFn: () => fetchTokenDetail(mint),
    enabled: Boolean(mint),
    staleTime: 30000,
  });
}

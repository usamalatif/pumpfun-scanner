'use client';

import { useQuery } from '@tanstack/react-query';
import { TokenStats } from '@/lib/types';

async function fetchStats(limit: number = 200): Promise<TokenStats> {
  const res = await fetch(`/api/stats?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  const json = await res.json();
  return json.data;
}

export function useStats(limit: number = 200) {
  return useQuery({
    queryKey: ['stats', limit],
    queryFn: () => fetchStats(limit),
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

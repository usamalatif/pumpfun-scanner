'use client';

import { useQuery } from '@tanstack/react-query';
import { AnalyzedToken, PumpFunToken } from '@/lib/types';
import { analyzeTokenUtility } from '@/lib/utility-analyzer';

const PUMPFUN_API_URL = 'https://frontend-api.pump.fun';

// Fetch directly from pump.fun client-side to avoid Cloudflare blocking server-side requests
async function fetchTokenDetail(mint: string): Promise<AnalyzedToken> {
  const url = `${PUMPFUN_API_URL}/coins/${mint}`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Token not found: ${response.status}`);
  }

  const token: PumpFunToken = await response.json();
  return {
    ...token,
    analysis: analyzeTokenUtility(token),
  };
}

export function useTokenDetail(mint: string) {
  return useQuery({
    queryKey: ['token', mint],
    queryFn: () => fetchTokenDetail(mint),
    enabled: Boolean(mint),
    staleTime: 30000,
  });
}

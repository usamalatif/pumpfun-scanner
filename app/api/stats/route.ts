import { NextRequest, NextResponse } from 'next/server';
import { fetchTrendingTokens, analyzeTokens, computeStats } from '@/lib/pumpfun-api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');

    const tokens = await fetchTrendingTokens(limit);
    const analyzed = analyzeTokens(tokens);
    const stats = computeStats(analyzed);

    return NextResponse.json({
      data: stats,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error computing stats:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to compute stats',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

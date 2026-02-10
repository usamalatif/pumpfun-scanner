import { NextRequest, NextResponse } from 'next/server';
import { fetchTrendingTokens, analyzeTokens } from '@/lib/pumpfun-api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '200');

    const tokens = await fetchTrendingTokens(limit);
    const analyzed = analyzeTokens(tokens);

    return NextResponse.json({
      data: analyzed,
      timestamp: Date.now(),
      total: analyzed.length,
    });
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch trending tokens',
        data: [],
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

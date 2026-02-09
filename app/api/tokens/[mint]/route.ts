import { NextRequest, NextResponse } from 'next/server';
import { fetchTokenByMint } from '@/lib/pumpfun-api';
import { analyzeTokenUtility } from '@/lib/utility-analyzer';

export async function GET(
  request: NextRequest,
  { params }: { params: { mint: string } }
) {
  try {
    const { mint } = params;

    if (!mint || mint.length < 32) {
      return NextResponse.json(
        { error: 'Invalid mint address' },
        { status: 400 }
      );
    }

    const token = await fetchTokenByMint(mint);
    const analysis = analyzeTokenUtility(token);

    return NextResponse.json({
      data: { ...token, analysis },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching token:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch token',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

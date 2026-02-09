import { NextRequest, NextResponse } from 'next/server';
import { fetchTokenByMint } from '@/lib/pumpfun-api';
import { analyzeTokenUtility } from '@/lib/utility-analyzer';
import { PumpFunToken } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let token: PumpFunToken;

    if (body.mint) {
      // Fetch token by mint address
      token = await fetchTokenByMint(body.mint);
    } else if (body.name && body.description) {
      // Analyze provided token data directly
      token = {
        mint: body.mint || 'custom',
        name: body.name || '',
        symbol: body.symbol || '',
        description: body.description || '',
        image_uri: body.image_uri || '',
        metadata_uri: '',
        twitter: body.twitter || null,
        telegram: body.telegram || null,
        bonding_curve: '',
        associated_bonding_curve: '',
        creator: '',
        created_timestamp: Date.now(),
        raydium_pool: null,
        complete: false,
        virtual_sol_reserves: 0,
        virtual_token_reserves: 0,
        total_supply: 0,
        website: body.website || null,
        show_name: true,
        king_of_the_hill_timestamp: null,
        market_cap: body.market_cap || 0,
        reply_count: 0,
        last_reply: null,
        nsfw: false,
        market_id: null,
        inverted: null,
        usd_market_cap: body.usd_market_cap || 0,
        username: null,
        profile_image: null,
      };
    } else {
      return NextResponse.json(
        { error: 'Provide either a mint address or token data (name, description)' },
        { status: 400 }
      );
    }

    const analysis = analyzeTokenUtility(token);

    return NextResponse.json({
      data: { ...token, analysis },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error analyzing token:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to analyze token',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

# PumpFun Scanner - Token Analytics Dashboard

A real-time Next.js 14 dashboard for monitoring and analyzing trending tokens from pump.fun. Features automated utility scoring and classification to help identify utility tokens vs meme tokens.

## Features

- **Real-time Token Monitoring** - Auto-refreshing feed of trending pump.fun tokens (configurable 15s-5m intervals)
- **Utility Classification** - Automated scoring algorithm classifies tokens as Utility, Hybrid, Meme, or Unknown
- **Interactive Dashboard** - Grid/table views, search, filters, sorting by market cap/score/date/activity
- **Token Detail Pages** - Full analysis breakdown with score reasoning, keyword detection, and social links
- **Analytics Charts** - Pie charts, bar charts, and line charts for token distribution and market insights
- **Export Functionality** - Export filtered results to CSV or JSON
- **Dark/Light Theme** - Toggle between themes with system preference support
- **Settings** - Configurable refresh intervals, fetch limits, score filters, and notification preferences
- **Responsive Design** - Mobile-first layout works on all screen sizes

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Theming**: next-themes

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd pumpfun-scanner

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
PUMPFUN_API_URL=https://frontend-api.pump.fun
REFRESH_INTERVAL=30000
```

## Project Structure

```
pumpfun-scanner/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Main dashboard
│   ├── tokens/
│   │   ├── page.tsx            # Token list with filters
│   │   └── [mint]/page.tsx     # Token detail page
│   ├── analytics/page.tsx      # Analytics dashboard
│   ├── settings/page.tsx       # Settings page
│   └── api/
│       ├── tokens/
│       │   ├── trending/route.ts
│       │   ├── [mint]/route.ts
│       │   └── analyze/route.ts
│       └── stats/route.ts
├── components/
│   ├── ui/                     # shadcn/ui base components
│   ├── Charts/                 # Recharts wrappers
│   ├── Layout/                 # Header, Footer
│   ├── TokenCard.tsx
│   ├── TokenTable.tsx
│   ├── FilterPanel.tsx
│   ├── UtilityAnalysis.tsx
│   └── ...
├── hooks/
│   ├── useTokens.ts
│   ├── useTokenDetail.ts
│   ├── useStats.ts
│   └── useSettings.ts
├── lib/
│   ├── types.ts
│   ├── utils.ts
│   ├── pumpfun-api.ts
│   └── utility-analyzer.ts
└── public/
```

## Utility Scoring Algorithm

Tokens are scored based on:

| Indicator | Points |
|-----------|--------|
| Has website | +2 |
| Utility keywords in name/description | +2 each (max 10) |
| Has Telegram | +1 |
| Has Twitter | +1 |
| Description > 100 chars | +1 |

**Classification:**
- **Utility Token** (score >= 6, low meme indicators)
- **Hybrid** (score >= 3)
- **Meme Token** (2+ meme keywords or meme score >= 3)
- **Unknown** (low scores across the board)

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/tokens/trending` | GET | Fetch and analyze trending tokens |
| `/api/tokens/[mint]` | GET | Get specific token with analysis |
| `/api/tokens/analyze` | POST | Analyze custom token data |
| `/api/stats` | GET | Aggregate statistics |

## Deployment

Optimized for Vercel deployment:

```bash
npm run build
```

Or deploy directly via the Vercel CLI or GitHub integration.

## License

MIT

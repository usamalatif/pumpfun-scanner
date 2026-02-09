'use client';

import {
  Activity,
  Target,
  Theater,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '@/components/StatsCard';
import { PieChartWidget } from '@/components/Charts/PieChart';
import { BarChartWidget } from '@/components/Charts/BarChart';
import { LineChartWidget } from '@/components/Charts/LineChart';
import { useTokens } from '@/hooks/useTokens';
import { useSettings } from '@/hooks/useSettings';
import { formatMarketCap } from '@/lib/utils';
import { AnalyzedToken } from '@/lib/types';
import { useMemo } from 'react';

export default function AnalyticsPage() {
  const { settings } = useSettings();
  const { allTokens, isLoading } = useTokens(
    settings.tokensToFetch,
    settings.refreshInterval,
    settings.autoRefresh
  );

  const analytics = useMemo(() => computeAnalytics(allTokens), [allTokens]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Insights from {allTokens.length} analyzed tokens
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Avg Utility Score"
          value={analytics.avgUtilityScore.toFixed(1)}
          description="Across all tokens"
          icon={Target}
          color="bg-gradient-to-br from-emerald-500 to-green-500"
        />
        <StatsCard
          title="Avg Meme Score"
          value={analytics.avgMemeScore.toFixed(1)}
          description="Across all tokens"
          icon={Theater}
          color="bg-gradient-to-br from-purple-500 to-pink-500"
        />
        <StatsCard
          title="Total Market Cap"
          value={formatMarketCap(analytics.totalMarketCap)}
          description="Combined value"
          icon={DollarSign}
          color="bg-gradient-to-br from-amber-500 to-orange-500"
        />
        <StatsCard
          title="With Socials"
          value={`${analytics.withSocialsPercent}%`}
          description="Have at least one social link"
          icon={Activity}
          color="bg-gradient-to-br from-blue-500 to-cyan-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PieChartWidget
          title="Token Classification Distribution"
          data={analytics.classificationDistribution}
        />

        <BarChartWidget
          title="Market Cap by Classification"
          data={analytics.marketCapByClassification}
          valueFormatter={(v) => formatMarketCap(v)}
        />

        <BarChartWidget
          title="Utility Score Distribution"
          data={analytics.scoreDistribution}
          height={300}
        />

        <LineChartWidget
          title="Tokens by Creation Time"
          data={analytics.creationTimeline}
          height={300}
        />
      </div>

      {/* Additional insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Top Utility Keywords</h3>
            <div className="space-y-2">
              {analytics.topUtilityKeywords.map(({ keyword, count }) => (
                <div key={keyword} className="flex items-center justify-between">
                  <span className="text-sm">{keyword}</span>
                  <span className="text-xs font-mono text-emerald-500">{count}</span>
                </div>
              ))}
              {analytics.topUtilityKeywords.length === 0 && (
                <p className="text-xs text-muted-foreground">No utility keywords found</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Top Meme Keywords</h3>
            <div className="space-y-2">
              {analytics.topMemeKeywords.map(({ keyword, count }) => (
                <div key={keyword} className="flex items-center justify-between">
                  <span className="text-sm">{keyword}</span>
                  <span className="text-xs font-mono text-purple-500">{count}</span>
                </div>
              ))}
              {analytics.topMemeKeywords.length === 0 && (
                <p className="text-xs text-muted-foreground">No meme keywords found</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Social Presence</h3>
            <div className="space-y-3">
              <PresenceBar label="Website" count={analytics.withWebsite} total={allTokens.length} />
              <PresenceBar label="Twitter" count={analytics.withTwitter} total={allTokens.length} />
              <PresenceBar label="Telegram" count={analytics.withTelegram} total={allTokens.length} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PresenceBar({ label, count, total }: { label: string; count: number; total: number }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted-foreground">{count}/{total} ({percent}%)</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function computeAnalytics(tokens: AnalyzedToken[]) {
  const totalMarketCap = tokens.reduce((s, t) => s + (t.usd_market_cap || 0), 0);
  const avgUtilityScore = tokens.length > 0
    ? tokens.reduce((s, t) => s + t.analysis.utilityScore, 0) / tokens.length
    : 0;
  const avgMemeScore = tokens.length > 0
    ? tokens.reduce((s, t) => s + t.analysis.memeScore, 0) / tokens.length
    : 0;

  const withWebsite = tokens.filter((t) => t.analysis.hasWebsite).length;
  const withTwitter = tokens.filter((t) => t.analysis.hasTwitter).length;
  const withTelegram = tokens.filter((t) => t.analysis.hasTelegram).length;
  const withSocials = tokens.filter(
    (t) => t.analysis.hasWebsite || t.analysis.hasTwitter || t.analysis.hasTelegram
  ).length;
  const withSocialsPercent = tokens.length > 0 ? Math.round((withSocials / tokens.length) * 100) : 0;

  // Classification distribution
  const classMap: Record<string, number> = {};
  tokens.forEach((t) => {
    classMap[t.analysis.classification] = (classMap[t.analysis.classification] || 0) + 1;
  });

  const colorMap: Record<string, string> = {
    'Likely Utility Token': '#10B981',
    'Possible Utility/Hybrid': '#F59E0B',
    'Likely Meme Token': '#A855F7',
    'Unknown/Speculative': '#6B7280',
  };

  const classificationDistribution = Object.entries(classMap).map(([name, value]) => ({
    name: name.replace('Likely ', '').replace('Possible ', ''),
    value,
    color: colorMap[name] || '#6B7280',
  }));

  // Market cap by classification
  const mcMap: Record<string, number> = {};
  tokens.forEach((t) => {
    mcMap[t.analysis.classification] = (mcMap[t.analysis.classification] || 0) + (t.usd_market_cap || 0);
  });
  const marketCapByClassification = Object.entries(mcMap).map(([name, value]) => ({
    name: name.replace('Likely ', '').replace('Possible ', ''),
    value,
    color: colorMap[name] || '#6B7280',
  }));

  // Score distribution (histogram)
  const scoreBuckets: Record<string, number> = {
    '0': 0, '1-2': 0, '3-4': 0, '5-6': 0, '7-8': 0, '9-10': 0, '11+': 0,
  };
  tokens.forEach((t) => {
    const s = t.analysis.utilityScore;
    if (s === 0) scoreBuckets['0']++;
    else if (s <= 2) scoreBuckets['1-2']++;
    else if (s <= 4) scoreBuckets['3-4']++;
    else if (s <= 6) scoreBuckets['5-6']++;
    else if (s <= 8) scoreBuckets['7-8']++;
    else if (s <= 10) scoreBuckets['9-10']++;
    else scoreBuckets['11+']++;
  });
  const scoreDistribution = Object.entries(scoreBuckets).map(([name, value]) => ({
    name,
    value,
    color: name === '0' ? '#6B7280' : name === '11+' ? '#10B981' : '#3B82F6',
  }));

  // Creation timeline (group by hour for recent tokens)
  const sorted = [...tokens].sort((a, b) => a.created_timestamp - b.created_timestamp);
  const timeGroups: Record<string, number> = {};
  sorted.forEach((t) => {
    const d = new Date(t.created_timestamp);
    const key = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
    timeGroups[key] = (timeGroups[key] || 0) + 1;
  });
  const creationTimeline = Object.entries(timeGroups).map(([name, value]) => ({
    name,
    value,
  }));

  // Keyword frequency
  const utilityKwMap: Record<string, number> = {};
  const memeKwMap: Record<string, number> = {};
  tokens.forEach((t) => {
    t.analysis.utilityKeywords.forEach((kw) => {
      utilityKwMap[kw] = (utilityKwMap[kw] || 0) + 1;
    });
    t.analysis.memeKeywords.forEach((kw) => {
      memeKwMap[kw] = (memeKwMap[kw] || 0) + 1;
    });
  });

  const topUtilityKeywords = Object.entries(utilityKwMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([keyword, count]) => ({ keyword, count }));

  const topMemeKeywords = Object.entries(memeKwMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([keyword, count]) => ({ keyword, count }));

  return {
    totalMarketCap,
    avgUtilityScore,
    avgMemeScore,
    withWebsite,
    withTwitter,
    withTelegram,
    withSocialsPercent,
    classificationDistribution,
    marketCapByClassification,
    scoreDistribution,
    creationTimeline,
    topUtilityKeywords,
    topMemeKeywords,
  };
}

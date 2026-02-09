'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClassificationBadge } from './ClassificationBadge';
import { UtilityAnalysis as UtilityAnalysisType } from '@/lib/types';
import { getScorePercentage } from '@/lib/utility-analyzer';
import {
  Globe,
  MessageCircle,
  Twitter,
  FileText,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react';

interface UtilityAnalysisProps {
  analysis: UtilityAnalysisType;
}

export function UtilityAnalysisPanel({ analysis }: UtilityAnalysisProps) {
  const scorePercentage = getScorePercentage(analysis.utilityScore);

  return (
    <div className="space-y-6">
      {/* Classification & Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Token Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Classification</p>
              <ClassificationBadge classification={analysis.classification} />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Utility Score</p>
              <p className="text-3xl font-bold">
                {analysis.utilityScore}
                <span className="text-base text-muted-foreground">/15</span>
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Score Progress</span>
              <span>{scorePercentage}%</span>
            </div>
            <Progress
              value={scorePercentage}
              className="h-3"
              indicatorClassName={
                scorePercentage >= 60
                  ? 'bg-emerald-500'
                  : scorePercentage >= 30
                  ? 'bg-amber-500'
                  : 'bg-gray-500'
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ScoreRow
              icon={<Globe className="h-4 w-4" />}
              label="Website"
              points={analysis.scoreBreakdown.websitePoints}
              maxPoints={2}
              has={analysis.hasWebsite}
            />
            <ScoreRow
              icon={<FileText className="h-4 w-4" />}
              label="Utility Keywords"
              points={analysis.scoreBreakdown.utilityKeywordPoints}
              maxPoints={10}
              count={analysis.utilityKeywords.length}
            />
            <ScoreRow
              icon={<MessageCircle className="h-4 w-4" />}
              label="Telegram"
              points={analysis.scoreBreakdown.telegramPoints}
              maxPoints={1}
              has={analysis.hasTelegram}
            />
            <ScoreRow
              icon={<Twitter className="h-4 w-4" />}
              label="Twitter"
              points={analysis.scoreBreakdown.twitterPoints}
              maxPoints={1}
              has={analysis.hasTwitter}
            />
            <ScoreRow
              icon={<FileText className="h-4 w-4" />}
              label="Description (>100 chars)"
              points={analysis.scoreBreakdown.descriptionPoints}
              maxPoints={1}
              has={analysis.descriptionLength > 100}
            />

            <div className="border-t border-border/50 pt-4 flex justify-between items-center">
              <span className="font-semibold">Total Utility Score</span>
              <span className="text-lg font-bold text-emerald-500">
                {analysis.scoreBreakdown.totalUtility}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-muted-foreground">Meme Indicators</span>
              <span className="text-lg font-bold text-purple-500">
                {analysis.scoreBreakdown.totalMeme}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keywords Found */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-emerald-500">
              Utility Keywords Found ({analysis.utilityKeywords.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.utilityKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {analysis.utilityKeywords.map((kw) => (
                  <Badge key={kw} variant="utility" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No utility keywords found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-purple-500">
              Meme Keywords Found ({analysis.memeKeywords.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.memeKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {analysis.memeKeywords.map((kw) => (
                  <Badge key={kw} variant="meme" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No meme keywords found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ScoreRow({
  icon,
  label,
  points,
  maxPoints,
  has,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  points: number;
  maxPoints: number;
  has?: boolean;
  count?: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm">{label}</span>
        {has !== undefined && (
          has ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
          )
        )}
        {count !== undefined && count > 0 && (
          <span className="text-xs text-muted-foreground">({count} found)</span>
        )}
      </div>
      <span className="text-sm font-mono">
        <span className={points > 0 ? 'text-emerald-500' : 'text-muted-foreground'}>
          +{points}
        </span>
        <span className="text-muted-foreground/50">/{maxPoints}</span>
      </span>
    </div>
  );
}

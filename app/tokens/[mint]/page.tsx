'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  MessageCircle,
  Twitter,
  Clock,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClassificationBadge } from '@/components/ClassificationBadge';
import { UtilityAnalysisPanel } from '@/components/UtilityAnalysis';
import { useTokenDetail } from '@/hooks/useTokenDetail';
import { formatMarketCap, formatDate, truncateAddress } from '@/lib/utils';
import { useState } from 'react';

export default function TokenDetailPage() {
  const params = useParams();
  const mint = params.mint as string;
  const { data: token, isLoading, error } = useTokenDetail(mint);
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(mint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <Link href="/tokens">
          <Button variant="ghost" size="sm" className="gap-1 mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Tokens
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <h3 className="text-lg font-semibold mb-1">Token not found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'The token could not be loaded'}
            </p>
            <Link href="/tokens">
              <Button variant="outline">Back to Token List</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <Link href="/tokens">
        <Button variant="ghost" size="sm" className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Tokens
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Token header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {token.image_uri ? (
                  <img
                    src={token.image_uri}
                    alt={token.name}
                    className="h-16 w-16 rounded-full object-cover bg-muted"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold">
                    {token.symbol?.slice(0, 2)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold">{token.name}</h1>
                    <Badge variant="secondary" className="font-mono">
                      ${token.symbol}
                    </Badge>
                    <ClassificationBadge classification={token.analysis.classification} />
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {truncateAddress(mint, 8)}
                    </code>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
                      {copied ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Market Cap</p>
                      <p className="text-lg font-bold">{formatMarketCap(token.usd_market_cap)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Replies</p>
                      <p className="text-lg font-bold">{token.reply_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(token.created_timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {token.description || 'No description provided for this token.'}
              </p>
              {token.description && (
                <p className="text-xs text-muted-foreground mt-2">
                  {token.description.length} characters
                </p>
              )}
            </CardContent>
          </Card>

          {/* Utility Analysis */}
          <UtilityAnalysisPanel analysis={token.analysis} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Links & Social</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {token.website ? (
                <a
                  href={token.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <Globe className="h-4 w-4 text-blue-400" />
                  <span className="text-sm truncate flex-1">{token.website}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-lg border border-border/30 opacity-50">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm">No website</span>
                </div>
              )}

              {token.telegram ? (
                <a
                  href={`https://t.me/${token.telegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-sky-400" />
                  <span className="text-sm truncate flex-1">@{token.telegram}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-lg border border-border/30 opacity-50">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">No Telegram</span>
                </div>
              )}

              {token.twitter ? (
                <a
                  href={`https://twitter.com/${token.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <Twitter className="h-4 w-4 text-blue-500" />
                  <span className="text-sm truncate flex-1">@{token.twitter}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-lg border border-border/30 opacity-50">
                  <Twitter className="h-4 w-4" />
                  <span className="text-sm">No Twitter</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Token Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Token Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Mint" value={truncateAddress(token.mint, 6)} />
              <InfoRow label="Creator" value={truncateAddress(token.creator, 6)} />
              <InfoRow label="Complete" value={token.complete ? 'Yes' : 'No'} />
              <InfoRow
                label="Raydium Pool"
                value={token.raydium_pool ? truncateAddress(token.raydium_pool, 6) : 'N/A'}
              />
              <InfoRow label="NSFW" value={token.nsfw ? 'Yes' : 'No'} />
            </CardContent>
          </Card>

          {/* View on pump.fun */}
          <a
            href={`https://pump.fun/${token.mint}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="w-full gap-2" variant="outline">
              View on pump.fun
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-xs">{value}</span>
    </div>
  );
}

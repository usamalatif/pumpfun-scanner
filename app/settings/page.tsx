'use client';

import { RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings, loaded } = useSettings();
  const { theme, setTheme } = useTheme();

  if (!loaded) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <div className="h-8 w-32 bg-muted animate-pulse rounded mb-6" />
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure your dashboard preferences
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={resetSettings}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset to Defaults
        </Button>
      </div>

      {/* Data Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Settings</CardTitle>
          <CardDescription>
            Configure how token data is fetched and displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-refresh */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-refresh</Label>
              <p className="text-xs text-muted-foreground">
                Automatically fetch new token data
              </p>
            </div>
            <Switch
              checked={settings.autoRefresh}
              onCheckedChange={(checked) => updateSettings({ autoRefresh: checked })}
            />
          </div>

          {/* Refresh interval */}
          <div className="space-y-2">
            <Label>Refresh Interval</Label>
            <Select
              value={String(settings.refreshInterval)}
              onValueChange={(value) =>
                updateSettings({ refreshInterval: parseInt(value) })
              }
              disabled={!settings.autoRefresh}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15000">15 seconds</SelectItem>
                <SelectItem value="30000">30 seconds</SelectItem>
                <SelectItem value="60000">1 minute</SelectItem>
                <SelectItem value="300000">5 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tokens to fetch */}
          <div className="space-y-2">
            <Label>Tokens to Fetch</Label>
            <Select
              value={String(settings.tokensToFetch)}
              onValueChange={(value) =>
                updateSettings({ tokensToFetch: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 tokens</SelectItem>
                <SelectItem value="20">20 tokens</SelectItem>
                <SelectItem value="50">50 tokens</SelectItem>
                <SelectItem value="100">100 tokens</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Min utility score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Minimum Utility Score Filter</Label>
              <span className="text-sm font-mono">{settings.minUtilityScore}</span>
            </div>
            <Slider
              value={[settings.minUtilityScore]}
              onValueChange={([value]) =>
                updateSettings({ minUtilityScore: value })
              }
              max={15}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Only show tokens with a utility score at or above this value
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme */}
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select
              value={theme || 'dark'}
              onValueChange={(value) => setTheme(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
          <CardDescription>Configure alerts and notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notifications toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Desktop Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Get notified when high-utility tokens are found
              </p>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) =>
                updateSettings({ notifications: checked })
              }
            />
          </div>

          {/* Sound alerts */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Sound Alerts</Label>
              <p className="text-xs text-muted-foreground">
                Play a sound for new high-utility token alerts
              </p>
            </div>
            <Switch
              checked={settings.soundAlerts}
              onCheckedChange={(checked) =>
                updateSettings({ soundAlerts: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>PumpFun Scanner - Token Analytics Dashboard</p>
          <p>
            Monitors trending tokens from pump.fun and classifies them using a
            utility scoring algorithm. Identifies utility tokens vs meme tokens
            based on keywords, social presence, and project indicators.
          </p>
          <p className="text-xs">
            Data sourced from the pump.fun public API. Not financial advice.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '@/lib/types';

const SETTINGS_KEY = 'pumpfun-dashboard-settings';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch {
      // Use defaults
    }
    setLoaded(true);
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(SETTINGS_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return { settings, updateSettings, resetSettings, loaded };
}

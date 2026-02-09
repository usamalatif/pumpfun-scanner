'use client';

import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Classification, TokenFilters, SortField } from '@/lib/types';
import { useState } from 'react';

interface FilterPanelProps {
  filters: TokenFilters;
  onFiltersChange: (filters: Partial<TokenFilters>) => void;
}

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, symbol, or description..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="pl-9 pr-9"
          />
          {filters.search && (
            <button
              onClick={() => onFiltersChange({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Classification filter */}
        <Select
          value={filters.classification}
          onValueChange={(value) =>
            onFiltersChange({ classification: value as Classification | 'all' })
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Likely Utility Token">Utility</SelectItem>
            <SelectItem value="Possible Utility/Hybrid">Hybrid</SelectItem>
            <SelectItem value="Likely Meme Token">Meme</SelectItem>
            <SelectItem value="Unknown/Speculative">Unknown</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={filters.sortBy}
          onValueChange={(value) => onFiltersChange({ sortBy: value as SortField })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="market_cap">Market Cap</SelectItem>
            <SelectItem value="utility_score">Utility Score</SelectItem>
            <SelectItem value="created_timestamp">Created Date</SelectItem>
            <SelectItem value="reply_count">Activity</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort order */}
        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            onFiltersChange({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })
          }
          aria-label="Toggle sort order"
        >
          {filters.sortOrder === 'asc' ? '↑' : '↓'}
        </Button>

        {/* Advanced toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-label="Advanced filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="flex flex-wrap gap-3 p-4 rounded-lg border border-border/50 bg-muted/30">
          <Select
            value={
              filters.hasWebsite === null
                ? 'any'
                : filters.hasWebsite
                ? 'yes'
                : 'no'
            }
            onValueChange={(value) =>
              onFiltersChange({
                hasWebsite: value === 'any' ? null : value === 'yes',
              })
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Has website" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Website</SelectItem>
              <SelectItem value="yes">Has Website</SelectItem>
              <SelectItem value="no">No Website</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={
              filters.hasSocials === null
                ? 'any'
                : filters.hasSocials
                ? 'yes'
                : 'no'
            }
            onValueChange={(value) =>
              onFiltersChange({
                hasSocials: value === 'any' ? null : value === 'yes',
              })
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Has socials" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Socials</SelectItem>
              <SelectItem value="yes">Has Socials</SelectItem>
              <SelectItem value="no">No Socials</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Min Score:</span>
            <Input
              type="number"
              min={0}
              max={15}
              value={filters.minUtilityScore}
              onChange={(e) =>
                onFiltersChange({ minUtilityScore: parseInt(e.target.value) || 0 })
              }
              className="w-20 h-9"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onFiltersChange({
                search: '',
                classification: 'all',
                minUtilityScore: 0,
                maxUtilityScore: 15,
                minMarketCap: 0,
                maxMarketCap: Infinity,
                hasWebsite: null,
                hasSocials: null,
              })
            }
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}

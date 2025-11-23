'use client'

import { Button, Input } from '@/components/ui'

interface FilterOption {
  value: string
  label: string
}

interface FilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  onSearch: (e: React.FormEvent) => void
  searchPlaceholder?: string
  filters?: {
    name: string
    label: string
    value: string
    onChange: (value: string) => void
    options: FilterOption[]
  }[]
}

export function FilterBar({
  search,
  onSearchChange,
  onSearch,
  searchPlaceholder = 'Search...',
  filters = [],
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-neu shadow-neu p-4 mb-6">
      <form onSubmit={onSearch} className="flex gap-4 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            id="search"
            name="search"
            type="text"
            label="Search"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        {filters.map((filter) => (
          <div key={filter.name}>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {filter.label}
            </label>
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
        <Button type="submit">Search</Button>
      </form>
    </div>
  )
}

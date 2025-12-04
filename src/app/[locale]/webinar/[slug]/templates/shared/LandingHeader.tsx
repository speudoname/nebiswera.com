'use client'

import type { LandingPageConfig } from '../types'

interface LandingHeaderProps {
  config: LandingPageConfig
}

export function LandingHeader({ config }: LandingHeaderProps) {
  const logoText = config.logoText || ':::...ნებისწერა...:::'

  return (
    <header className="py-4 px-6">
      <div className="max-w-7xl mx-auto">
        {config.logoType === 'IMAGE' && config.logoImageUrl ? (
          <img
            src={config.logoImageUrl}
            alt="Logo"
            className="h-10 w-auto"
          />
        ) : (
          <span className="text-xl font-medium text-text-primary">
            {logoText}
          </span>
        )}
      </div>
    </header>
  )
}

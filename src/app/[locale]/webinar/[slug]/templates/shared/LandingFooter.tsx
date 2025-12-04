'use client'

import type { LandingPageConfig } from '../types'

interface LandingFooterProps {
  config: LandingPageConfig
}

export function LandingFooter({ config }: LandingFooterProps) {
  const logoText = config.logoText || ':::...ნებისწერა...:::'

  return (
    <footer className="py-8 px-6 border-t border-neu-dark/20">
      <div className="max-w-7xl mx-auto text-center">
        {/* Logo */}
        <div className="mb-4">
          {config.logoType === 'IMAGE' && config.logoImageUrl ? (
            <img
              src={config.logoImageUrl}
              alt="Logo"
              className="h-8 w-auto mx-auto"
            />
          ) : (
            <span className="text-lg font-medium text-text-primary">
              {logoText}
            </span>
          )}
        </div>

        {/* Disclaimer */}
        {config.footerDisclaimerText && (
          <p className="text-sm text-text-secondary max-w-2xl mx-auto">
            {config.footerDisclaimerText}
          </p>
        )}

        {/* Copyright */}
        <p className="text-xs text-text-muted mt-4">
          © {new Date().getFullYear()} Nebiswera. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

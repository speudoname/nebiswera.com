const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Reduce build output size
  output: 'standalone',

  // Disable powered-by header
  poweredByHeader: false,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Reduce bundle size by excluding source maps in production
  productionBrowserSourceMaps: false,

  // Experimental optimizations
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['next-intl'],
  },
}

module.exports = withNextIntl(nextConfig)

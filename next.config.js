// Next.js Configuration
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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.nebiswera.com',
      },
    ],
  },

  // Reduce bundle size by excluding source maps in production
  productionBrowserSourceMaps: false,

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // SWC minification options - target modern browsers
  swcMinify: true,

  // Disable legacy browser support (ES5 transpilation)
  // This removes polyfills for features supported in all modern browsers
  transpilePackages: [],

  // Experimental optimizations - target modern browsers
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['next-intl', 'lucide-react'],

    // Enable optimized CSS loading
    optimizeCss: true,

    // Use CSS chunks for better caching
    cssChunking: 'loose',
  },

  // Security headers and caching
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=()',
          },
        ],
      },
      {
        // Cache static assets (JS, CSS, fonts, images) for 1 year
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache images for 30 days with revalidation
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, must-revalidate',
          },
        ],
      },
    ]
  },
}

module.exports = withNextIntl(nextConfig)

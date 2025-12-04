import { locales, defaultLocale } from '@/i18n/config'

export const seoConfig = {
  siteUrl: 'https://www.nebiswera.com',
  locales,
  defaultLocale,

  /**
   * Brand colors - used for theme-color meta tag and webmanifest
   * Should match your design system's primary color
   */
  themeColor: '#8B5CF6', // Primary purple from design system

  /**
   * Default OG image settings
   * Place images in /public/og/ folder
   * Naming convention: {pageKey}.png (e.g., home.png, about.png)
   * Recommended size: 1200x630 pixels
   */
  ogImage: {
    width: 1200,
    height: 630,
    defaultImage: '/og/default.png', // Fallback if page-specific image doesn't exist
  },

  /**
   * Social media handles (optional)
   */
  social: {
    twitter: '@nebiswera', // Update with your actual handle or remove
  },

  /**
   * Pages that should be indexed by search engines.
   * These appear in sitemap.xml and are allowed in robots.txt.
   *
   * - path: URL path after locale (empty string for homepage)
   * - key: Key in content/seo/{locale}.json
   * - priority: Sitemap priority (0.0 to 1.0)
   * - changefreq: How often the page changes
   */
  indexedPages: [
    { path: '', key: 'home', priority: 1.0, changefreq: 'weekly' },
    { path: '/schedule', key: 'schedule', priority: 0.9, changefreq: 'weekly' },
    { path: '/about', key: 'about', priority: 0.8, changefreq: 'monthly' },
    { path: '/love', key: 'love', priority: 0.9, changefreq: 'weekly' },
    { path: '/collectlove', key: 'collectlove', priority: 0.6, changefreq: 'monthly' },
    { path: '/contact', key: 'contact', priority: 0.7, changefreq: 'monthly' },
    { path: '/privacy', key: 'privacy', priority: 0.3, changefreq: 'yearly' },
    { path: '/terms', key: 'terms', priority: 0.3, changefreq: 'yearly' },
  ] as const,

  /**
   * Pages that should NOT be indexed.
   * These get noindex meta tag and are blocked in robots.txt.
   *
   * - path: URL path pattern after locale
   * - key: Key in content/seo/{locale}.json
   */
  noIndexPages: [
    { path: '/auth/login', key: 'login' },
    { path: '/auth/register', key: 'register' },
    { path: '/auth/forgot-password', key: 'forgotPassword' },
    { path: '/auth/reset-password', key: 'resetPassword' },
    { path: '/auth/verify-email', key: 'verifyEmail' },
    { path: '/auth/verify-required', key: 'verifyRequired' },
    { path: '/auth/error', key: 'authError' },
    { path: '/dashboard', key: 'dashboard' },
    { path: '/profile', key: 'profile' },
    { path: '/unsubscribe', key: 'unsubscribe' },
  ] as const,

  /**
   * Additional paths to block in robots.txt (API routes, admin, etc.)
   */
  robotsDisallow: [
    '/api/',
    '/admin/',
  ],
} as const

export type PageKey = typeof seoConfig.indexedPages[number]['key'] | typeof seoConfig.noIndexPages[number]['key']

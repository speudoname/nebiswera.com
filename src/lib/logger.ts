/**
 * Logger Utility
 *
 * Conditional logging based on environment
 * Use this in new code instead of console.log for better production hygiene
 */

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  /**
   * Debug logs - only shown in development
   */
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args)
  },

  /**
   * Info logs - only shown in development
   */
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args)
  },

  /**
   * Debug logs - only shown in development
   */
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args)
  },

  /**
   * Warning logs - shown in all environments
   */
  warn: (...args: unknown[]) => {
    console.warn(...args)
  },

  /**
   * Error logs - shown in all environments
   */
  error: (...args: unknown[]) => {
    console.error(...args)
  },

  /**
   * Table logs - only shown in development
   */
  table: (data: unknown) => {
    if (isDev) console.table(data)
  },

  /**
   * Group logs - only shown in development
   */
  group: (label: string) => {
    if (isDev) console.group(label)
  },

  /**
   * Group end - only shown in development
   */
  groupEnd: () => {
    if (isDev) console.groupEnd()
  },

  /**
   * Time tracking - only shown in development
   */
  time: (label: string) => {
    if (isDev) console.time(label)
  },

  /**
   * Time tracking end - only shown in development
   */
  timeEnd: (label: string) => {
    if (isDev) console.timeEnd(label)
  },
}

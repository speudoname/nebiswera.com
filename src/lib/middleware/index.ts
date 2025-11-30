// Middleware handlers
export { handleAdminRoutes } from './admin'
export { handleLocaleRedirect } from './locale'
export { handleRouteProtection } from './routes'
export { handleEmailVerification } from './verification'

// Constants
export {
  LOCALE_COOKIE_NAME,
  LOCALE_PATTERN,
  LOCALE_EXTRACT_PATTERN,
  PROTECTED_PATHS,
  AUTH_PATHS,
  VERIFY_REQUIRED_PATH,
  VERIFICATION_GRACE_PERIOD_HOURS,
} from './constants'

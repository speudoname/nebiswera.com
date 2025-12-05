/**
 * LMS Components
 *
 * Reusable components for the Learning Management System
 */

// Skeleton loaders
export {
  Skeleton,
  CourseCardSkeleton,
  CoursePlayerSkeleton,
  QuizSkeleton,
  ProgressCardSkeleton,
  CertificateCardSkeleton,
  SidebarItemSkeleton,
} from './Skeleton'

// Error handling
export {
  LmsErrorBoundary,
  ErrorMessage,
  LoadingError,
} from './ErrorBoundary'

// Empty states
export {
  NoCoursesEnrolled,
  NoCertificates,
  NoCoursesAvailable,
  NoSearchResults,
  ContentNotFound,
  QuizNotAvailable,
  CourseLocked,
} from './EmptyStates'

// Progress migration
export { ProgressMigrationBanner } from './ProgressMigrationBanner'
export { ProgressMigrationWrapper } from './ProgressMigrationWrapper'

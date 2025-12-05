/**
 * LMS TypeScript Types
 *
 * These types correspond to JSON fields in the Prisma schema.
 * They provide type safety for content blocks, course settings, quiz options, etc.
 */

// ===========================================
// CONTENT BLOCK TYPES
// ===========================================

/**
 * Base content block structure
 * All content blocks share these properties
 */
export interface BaseContentBlock {
  id: string;
  type: ContentBlockType;
  order: number;
}

export type ContentBlockType =
  | 'text'
  | 'video'
  | 'audio'
  | 'html'
  | 'image'
  | 'file'
  | 'embed'
  | 'quiz';

/**
 * Text content block - Rich text / Markdown content
 */
export interface TextContentBlock extends BaseContentBlock {
  type: 'text';
  content: string; // Markdown or rich text HTML
}

/**
 * Video content block - Bunny.net Stream HLS video
 */
export interface VideoContentBlock extends BaseContentBlock {
  type: 'video';
  url: string; // HLS manifest URL
  duration: number; // Duration in seconds
  thumbnail?: string; // Thumbnail URL
  bunnyVideoId?: string; // Bunny.net Stream video ID
}

/**
 * Audio content block - Audio file
 */
export interface AudioContentBlock extends BaseContentBlock {
  type: 'audio';
  url: string; // Audio file URL
  duration: number; // Duration in seconds
  title?: string; // Optional audio title
}

/**
 * HTML content block - Raw HTML content
 */
export interface HtmlContentBlock extends BaseContentBlock {
  type: 'html';
  content: string; // Raw HTML (will be sanitized on render)
}

/**
 * Image content block - Single image
 */
export interface ImageContentBlock extends BaseContentBlock {
  type: 'image';
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

/**
 * File content block - Downloadable file
 */
export interface FileContentBlock extends BaseContentBlock {
  type: 'file';
  url: string;
  filename: string;
  size: number; // File size in bytes
  mimeType: string;
}

/**
 * Embed content block - External embed (YouTube, Vimeo, etc.)
 */
export interface EmbedContentBlock extends BaseContentBlock {
  type: 'embed';
  provider: EmbedProvider;
  embedUrl: string; // The embed URL or video ID
  aspectRatio?: string; // e.g., "16:9", "4:3"
  title?: string;
}

export type EmbedProvider = 'youtube' | 'vimeo' | 'custom';

/**
 * Quiz content block - Reference to a quiz
 */
export interface QuizContentBlock extends BaseContentBlock {
  type: 'quiz';
  quizId: string; // Reference to LmsQuiz.id
  isGate?: boolean; // If true, must pass to continue
}

/**
 * Union type for all content blocks
 */
export type ContentBlock =
  | TextContentBlock
  | VideoContentBlock
  | AudioContentBlock
  | HtmlContentBlock
  | ImageContentBlock
  | FileContentBlock
  | EmbedContentBlock
  | QuizContentBlock;

// ===========================================
// COURSE SETTINGS
// ===========================================

/**
 * Course settings stored in Course.settings JSON field
 */
export interface CourseSettings {
  /** Percentage of video that must be watched to auto-complete (0-100, default 90) */
  videoCompletionThreshold: number;

  /** If true, students must complete previous content to access next */
  sequentialLock: boolean;

  /** If true, content is released over time based on dripIntervalDays */
  dripContent: boolean;

  /** Days between content unlocks when dripContent is true */
  dripIntervalDays: number;

  /** Days after enrollment when access expires (null = never expires) */
  expirationDays: number | null;

  /** If true, certificate is generated on course completion */
  certificateEnabled: boolean;

  /** Certificate template identifier (null = default template) */
  certificateTemplate: string | null;
}

/**
 * Default course settings
 */
export const DEFAULT_COURSE_SETTINGS: CourseSettings = {
  videoCompletionThreshold: 90,
  sequentialLock: false,
  dripContent: false,
  dripIntervalDays: 1,
  expirationDays: null,
  certificateEnabled: true,
  certificateTemplate: null,
};

// ===========================================
// QUIZ TYPES
// ===========================================

/**
 * Quiz option for multiple choice questions
 * Stored in LmsQuizQuestion.options JSON field
 */
export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

/**
 * Selected options in quiz answer
 * Stored in LmsQuizAnswer.selectedOptions JSON field
 */
export type SelectedOptions = string[]; // Array of QuizOption.id values

// ===========================================
// ANALYTICS EVENT DATA
// ===========================================

/**
 * Event data stored in CourseAnalyticsEvent.eventData JSON field
 * Type varies based on eventType
 */
export interface VideoProgressEventData {
  position: number; // Current position in seconds
  duration: number; // Total duration in seconds
  percent: number; // Percentage watched (0-100)
}

export interface VideoSeekEventData {
  fromPosition: number;
  toPosition: number;
}

export interface QuizEventData {
  score?: number; // Percentage score
  passed?: boolean;
  attemptNumber?: number;
  timeSpentSeconds?: number;
}

export interface FileDownloadEventData {
  filename: string;
  fileSize: number;
}

export type AnalyticsEventData =
  | VideoProgressEventData
  | VideoSeekEventData
  | QuizEventData
  | FileDownloadEventData
  | Record<string, unknown>; // Generic fallback

// ===========================================
// CERTIFICATE TEMPLATE DATA
// ===========================================

/**
 * Certificate template data stored in LmsCertificate.templateData JSON field
 */
export interface CertificateTemplateData {
  /** Custom title (default: "Certificate of Completion") */
  title?: string;

  /** Custom subtitle */
  subtitle?: string;

  /** Custom description template */
  description?: string;

  /** Logo URL */
  logoUrl?: string;

  /** Signature image URL */
  signatureUrl?: string;

  /** Signer name */
  signerName?: string;

  /** Signer title */
  signerTitle?: string;

  /** Background color */
  backgroundColor?: string;

  /** Primary color (for accents) */
  primaryColor?: string;

  /** Custom CSS (advanced) */
  customCss?: string;
}

// ===========================================
// LOCAL STORAGE TYPES (for Open courses)
// ===========================================

/**
 * Progress data stored in localStorage for open courses
 */
export interface LocalStoragePartProgress {
  status: 'not_started' | 'in_progress' | 'completed';
  watchTime: number; // Seconds watched
  watchPercent: number; // Percentage watched (0-100)
  completedAt?: string; // ISO date string
}

export interface LocalStorageQuizAttempt {
  quizId: string;
  score: number | null;
  passed: boolean | null;
  startedAt: string; // ISO date string
  completedAt?: string; // ISO date string
  answers: Record<string, string[] | string>; // questionId -> answer
}

export interface LocalStorageCourseProgress {
  enrolledAt: string; // ISO date string
  parts: Record<string, LocalStoragePartProgress>; // partId -> progress
  quizAttempts: Record<string, LocalStorageQuizAttempt[]>; // quizId -> attempts
  lastAccessedAt: string; // ISO date string
  lastPartId?: string; // Last viewed part for resume
}

export interface LocalStorageLmsData {
  anonymousId: string;
  courses: Record<string, LocalStorageCourseProgress>; // courseId -> progress
}

// ===========================================
// NOTIFICATION TEMPLATE VARIABLES
// ===========================================

/**
 * Variables available in notification email templates
 */
export interface NotificationTemplateVariables {
  studentName: string;
  studentEmail: string;
  studentFirstName: string;
  courseTitle: string;
  courseUrl: string;
  progressPercent: number;
  enrollmentDate: string;
  expirationDate?: string;
  daysUntilExpiration?: number;
  quizTitle?: string;
  quizScore?: number;
  certificateUrl?: string;
}

// ===========================================
// API RESPONSE TYPES
// ===========================================

/**
 * Course with nested content structure
 */
export interface CourseWithContent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  locale: string;
  accessType: 'OPEN' | 'FREE' | 'PAID';
  settings: CourseSettings;
  modules: ModuleWithLessons[];
  lessons: LessonWithParts[]; // Direct lessons (no module)
}

export interface ModuleWithLessons {
  id: string;
  title: string;
  description: string | null;
  order: number;
  availableAfterDays: number | null;
  contentBlocks: ContentBlock[];
  lessons: LessonWithParts[];
}

export interface LessonWithParts {
  id: string;
  title: string;
  description: string | null;
  order: number;
  availableAfterDays: number | null;
  contentBlocks: ContentBlock[];
  parts: PartData[];
}

export interface PartData {
  id: string;
  title: string;
  description: string | null;
  order: number;
  contentBlocks: ContentBlock[];
}

/**
 * Course progress summary for user profile
 */
export interface CourseProgressSummary {
  courseId: string;
  courseTitle: string;
  courseThumbnail: string | null;
  courseSlug: string;
  enrolledAt: Date;
  progressPercent: number;
  completedAt: Date | null;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'SUSPENDED';
  lastAccessedAt: Date | null;
  lastPartId: string | null;
  certificateUrl: string | null;
}

// ===========================================
// TYPE GUARDS
// ===========================================

export function isTextBlock(block: ContentBlock): block is TextContentBlock {
  return block.type === 'text';
}

export function isVideoBlock(block: ContentBlock): block is VideoContentBlock {
  return block.type === 'video';
}

export function isAudioBlock(block: ContentBlock): block is AudioContentBlock {
  return block.type === 'audio';
}

export function isHtmlBlock(block: ContentBlock): block is HtmlContentBlock {
  return block.type === 'html';
}

export function isImageBlock(block: ContentBlock): block is ImageContentBlock {
  return block.type === 'image';
}

export function isFileBlock(block: ContentBlock): block is FileContentBlock {
  return block.type === 'file';
}

export function isEmbedBlock(block: ContentBlock): block is EmbedContentBlock {
  return block.type === 'embed';
}

export function isQuizBlock(block: ContentBlock): block is QuizContentBlock {
  return block.type === 'quiz';
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Parse course settings from JSON, applying defaults
 */
export function parseCourseSettings(json: unknown): CourseSettings {
  const settings = (json as Partial<CourseSettings>) || {};
  return {
    ...DEFAULT_COURSE_SETTINGS,
    ...settings,
  };
}

/**
 * Parse content blocks from JSON
 */
export function parseContentBlocks(json: unknown): ContentBlock[] {
  if (!Array.isArray(json)) {
    return [];
  }
  return json as ContentBlock[];
}

/**
 * Parse quiz options from JSON
 */
export function parseQuizOptions(json: unknown): QuizOption[] {
  if (!Array.isArray(json)) {
    return [];
  }
  return json as QuizOption[];
}

/**
 * Generate a new content block ID
 */
export function generateBlockId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new empty content block of a given type
 */
export function createEmptyBlock(type: ContentBlockType, order: number): ContentBlock {
  const base = { id: generateBlockId(), order };

  switch (type) {
    case 'text':
      return { ...base, type: 'text', content: '' };
    case 'video':
      return { ...base, type: 'video', url: '', duration: 0 };
    case 'audio':
      return { ...base, type: 'audio', url: '', duration: 0 };
    case 'html':
      return { ...base, type: 'html', content: '' };
    case 'image':
      return { ...base, type: 'image', url: '' };
    case 'file':
      return { ...base, type: 'file', url: '', filename: '', size: 0, mimeType: '' };
    case 'embed':
      return { ...base, type: 'embed', provider: 'youtube', embedUrl: '' };
    case 'quiz':
      return { ...base, type: 'quiz', quizId: '' };
  }
}

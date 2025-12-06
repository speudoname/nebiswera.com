import { z } from 'zod'

// Password must be at least 8 characters with at least one uppercase, one lowercase, and one number
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

const emailSchema = z.string().email('Invalid email address').toLowerCase()

const localeSchema = z.enum(['ka', 'en']).default('ka')

// Register schema
export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long').optional(),
  email: emailSchema,
  password: passwordSchema,
  locale: localeSchema,
})

// Login schema (less strict - just validate format)
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

// Reset password schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
})

// Profile update schema
export const profileUpdateSchema = z.object({
  name: z.string().max(100, 'Name is too long').optional(),
  nameKa: z.string().max(100, 'Georgian name is too long').optional(),
  nameEn: z.string().max(100, 'English name is too long').optional(),
  preferredLocale: localeSchema.optional(),
  currentPassword: z.string().optional(),
  newPassword: passwordSchema.optional(),
}).refine(
  (data) => {
    // If newPassword is provided, currentPassword must also be provided
    if (data.newPassword && !data.currentPassword) {
      return false
    }
    return true
  },
  {
    message: 'Current password is required to set a new password',
    path: ['currentPassword'],
  }
)

// Helper function to format Zod errors into a single message
export function formatZodError(error: z.ZodError<unknown>): string {
  return error.issues.map((e) => e.message).join(', ')
}

// ==========================================
// Tag Schemas
// ==========================================

export const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  description: z.string().max(255, 'Description too long').optional(),
})

export const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  description: z.string().max(255).optional(),
})

// ==========================================
// Testimonial Schemas
// ==========================================

export const updateTestimonialSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  text: z.string().min(1).max(2000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  locale: z.enum(['ka', 'en']).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  type: z.enum(['TEXT', 'VIDEO', 'AUDIO']).optional(),
  tags: z.array(z.string()).optional(),
})

export const patchTestimonialSchema = z.object({
  profilePhoto: z.string().url().optional().nullable(),
  images: z.array(z.string().url()).optional(),
  audioUrl: z.string().url().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
  videoThumbnail: z.string().url().optional().nullable(),
  type: z.enum(['TEXT', 'VIDEO', 'AUDIO']).optional(),
})

// ==========================================
// Contact Schemas
// ==========================================

export const createContactSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  source: z.string().max(50).optional(),
  status: z.enum(['SUBSCRIBED', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED']).optional(),
  tagIds: z.array(z.string()).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
})

export const updateContactSchema = createContactSchema.partial()

// ==========================================
// Segment Schemas
// ==========================================

export const segmentFilterSchema = z.object({
  field: z.string(),
  operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'is_empty', 'is_not_empty']),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
})

export const createSegmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  filters: z.array(segmentFilterSchema),
  filterLogic: z.enum(['AND', 'OR']).default('AND'),
})

export const updateSegmentSchema = createSegmentSchema.partial()

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type CreateTagInput = z.infer<typeof createTagSchema>
export type UpdateTagInput = z.infer<typeof updateTagSchema>
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>
export type PatchTestimonialInput = z.infer<typeof patchTestimonialSchema>
export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>
export type CreateSegmentInput = z.infer<typeof createSegmentSchema>
export type UpdateSegmentInput = z.infer<typeof updateSegmentSchema>

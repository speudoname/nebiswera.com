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

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>

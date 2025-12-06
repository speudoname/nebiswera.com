/**
 * LMS Certificate Generation
 *
 * Generates PDF certificates for course completion.
 */

import { prisma } from '@/lib/db'
import { uploadToBunnyStorage, generateLmsCertificateKey } from '@/lib/storage'
import { renderToBuffer } from '@react-pdf/renderer'
import { createCertificatePdf } from './certificate-template'
import { nanoid } from 'nanoid'

export interface CertificateData {
  studentName: string
  courseName: string
  completedAt: Date
  verificationCode: string
  instructorName?: string
  courseDuration?: string
  locale: string
}

/**
 * Generate a unique verification code
 */
export function generateVerificationCode(): string {
  return nanoid(12).toUpperCase()
}

/**
 * Generate and upload a certificate for an enrollment
 */
export async function generateCertificate(enrollmentId: string): Promise<{
  certificateUrl: string
  certificateId: string
}> {
  // Get enrollment with course and user details
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: {
        select: {
          title: true,
          locale: true,
          settings: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  if (!enrollment) {
    throw new Error('Enrollment not found')
  }

  if (!enrollment.completedAt) {
    throw new Error('Course not completed')
  }

  // Check if certificate is enabled for this course
  const settings = enrollment.course.settings as Record<string, unknown> | null
  if (settings?.certificateEnabled === false) {
    throw new Error('Certificates are not enabled for this course')
  }

  // Generate verification code
  const verificationCode = generateVerificationCode()

  // Prepare certificate data
  const certificateData: CertificateData = {
    studentName: enrollment.user.name || enrollment.user.email,
    courseName: enrollment.course.title,
    completedAt: enrollment.completedAt,
    verificationCode,
    locale: enrollment.course.locale,
  }

  // Generate PDF
  const pdfBuffer = await renderToBuffer(createCertificatePdf(certificateData))

  // Upload to Bunny CDN
  const filePath = generateLmsCertificateKey(verificationCode)
  const certificateUrl = await uploadToBunnyStorage(Buffer.from(pdfBuffer), filePath)

  // Update enrollment with certificate info
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      certificateId: verificationCode,
      certificateUrl,
      certificateIssuedAt: new Date(),
    },
  })

  return {
    certificateUrl,
    certificateId: verificationCode,
  }
}

/**
 * Get certificate data for verification
 */
export async function getCertificateForVerification(verificationCode: string): Promise<{
  valid: boolean
  certificate?: {
    studentName: string
    courseName: string
    completedAt: Date
    issuedAt: Date
    verificationCode: string
    certificateUrl: string
  }
}> {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      certificateId: verificationCode,
    },
    include: {
      course: {
        select: {
          title: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  if (!enrollment || !enrollment.certificateIssuedAt) {
    return { valid: false }
  }

  return {
    valid: true,
    certificate: {
      studentName: enrollment.user.name || enrollment.user.email,
      courseName: enrollment.course.title,
      completedAt: enrollment.completedAt!,
      issuedAt: enrollment.certificateIssuedAt,
      verificationCode,
      certificateUrl: enrollment.certificateUrl!,
    },
  }
}

/**
 * Check if enrollment has a certificate
 */
export async function hasCertificate(enrollmentId: string): Promise<boolean> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { certificateId: true },
  })

  return !!enrollment?.certificateId
}

/**
 * Regenerate certificate (e.g., if name changed)
 */
export async function regenerateCertificate(enrollmentId: string): Promise<{
  certificateUrl: string
  certificateId: string
}> {
  // Clear existing certificate
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      certificateId: null,
      certificateUrl: null,
      certificateIssuedAt: null,
    },
  })

  // Generate new one
  return generateCertificate(enrollmentId)
}

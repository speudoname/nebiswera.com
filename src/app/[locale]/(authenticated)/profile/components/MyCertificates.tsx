'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button, IconBadge } from '@/components/ui'
import { Award, Download, ExternalLink, Share2 } from 'lucide-react'

interface Certificate {
  enrollmentId: string
  courseTitle: string
  courseSlug: string
  certificateUrl: string
  certificateIssuedAt: string
  completedAt: string
}

interface CourseEnrollment {
  enrollmentId: string
  certificateUrl: string | null
  certificateIssuedAt: string | null
  completedAt: string | null
  course: {
    title: string
    slug: string
  }
}

export function MyCertificates() {
  const t = useTranslations('profile')
  const locale = useLocale()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await fetch('/api/profile/courses')
        if (res.ok) {
          const data = await res.json()
          const courses: CourseEnrollment[] = data.data?.courses || []
          // Filter to only courses with certificates
          const certs = courses
            .filter((c) => c.certificateUrl)
            .map((c) => ({
              enrollmentId: c.enrollmentId,
              courseTitle: c.course.title,
              courseSlug: c.course.slug,
              certificateUrl: c.certificateUrl!,
              certificateIssuedAt: c.certificateIssuedAt!,
              completedAt: c.completedAt!,
            }))
          setCertificates(certs)
        }
      } catch (error) {
        console.error('Failed to fetch certificates:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCertificates()
  }, [])

  // Don't show section if loading or no certificates
  if (loading) {
    return null
  }

  if (certificates.length === 0) {
    return null
  }

  const handleShare = async (cert: Certificate) => {
    const shareUrl = `${window.location.origin}/${locale}/verify/${cert.enrollmentId}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: t('certificateShareTitle', { course: cert.courseTitle }),
          text: t('certificateShareText', { course: cert.courseTitle }),
          url: shareUrl,
        })
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl)
      alert(t('certificateLinkCopied'))
    }
  }

  return (
    <Card className="mb-4 md:mb-6">
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-neu-dark/20">
        <h3 className="no-margin flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          {t('myCertificates')}
        </h3>
      </div>

      <div className="px-4 md:px-6 py-4 md:py-6">
        <div className="space-y-3">
          {certificates.map((cert) => (
            <div
              key={cert.enrollmentId}
              className="flex items-center justify-between gap-4 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Award className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-medium text-gray-900 truncate text-sm">
                    {cert.courseTitle}
                  </h5>
                  <p className="text-xs text-gray-500">
                    {t('issuedOn', {
                      date: new Date(cert.certificateIssuedAt).toLocaleDateString(),
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* View/Download */}
                <a
                  href={cert.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-yellow-100 rounded-lg transition-colors"
                  title={t('viewCertificate')}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                {/* Share */}
                <button
                  onClick={() => handleShare(cert)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-yellow-100 rounded-lg transition-colors"
                  title={t('shareCertificate')}
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {/* Download */}
                <a
                  href={cert.certificateUrl}
                  download
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-yellow-100 rounded-lg transition-colors"
                  title={t('downloadCertificate')}
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

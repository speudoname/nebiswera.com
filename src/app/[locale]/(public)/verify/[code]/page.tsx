import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getCertificateForVerification } from '@/lib/lms/certificates'
import { CheckCircle, XCircle, Award, Calendar, Download, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ locale: string; code: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params
  const result = await getCertificateForVerification(code)

  if (!result.valid || !result.certificate) {
    return {
      title: 'Certificate Verification - Nebiswera',
      description: 'Verify a certificate from Nebiswera courses',
    }
  }

  return {
    title: `Certificate: ${result.certificate.studentName} - ${result.certificate.courseName}`,
    description: `Verified certificate for ${result.certificate.studentName} completing ${result.certificate.courseName}`,
  }
}

export default async function CertificateVerificationPage({ params }: PageProps) {
  const { locale, code } = await params
  const t = await getTranslations('certificates')
  const result = await getCertificateForVerification(code)

  if (!result.valid || !result.certificate) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('invalidCertificate')}</h1>
            <p className="text-gray-600 mb-6">{t('invalidCertificateDescription')}</p>
            <Link
              href={`/${locale}`}
              className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {t('backToHome')}
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const { certificate } = result

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/${locale}`} className="text-purple-600 font-medium">
            :::...nebiswera...:::
          </Link>
          <span className="text-sm text-gray-500">{t('certificateVerification')}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Verification Badge */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Success Banner */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
            <div className="flex items-center gap-3 text-white">
              <CheckCircle className="w-6 h-6" />
              <div>
                <h2 className="font-semibold">{t('verifiedCertificate')}</h2>
                <p className="text-sm text-green-100">{t('authenticCertificate')}</p>
              </div>
            </div>
          </div>

          {/* Certificate Details */}
          <div className="p-8">
            {/* Award Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                <Award className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Student Name */}
            <div className="text-center mb-8">
              <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                {t('awardedTo')}
              </p>
              <h1 className="text-3xl font-bold text-gray-900">{certificate.studentName}</h1>
            </div>

            {/* Course Name */}
            <div className="text-center mb-8">
              <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                {t('forCompleting')}
              </p>
              <h2 className="text-xl font-semibold text-purple-700">{certificate.courseName}</h2>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wide">{t('completedOn')}</span>
                </div>
                <p className="font-medium text-gray-900">
                  {new Date(certificate.completedAt).toLocaleDateString(
                    locale === 'ka' ? 'ka-GE' : 'en-US',
                    { year: 'numeric', month: 'long', day: 'numeric' }
                  )}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
                  <Award className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wide">{t('issuedOn')}</span>
                </div>
                <p className="font-medium text-gray-900">
                  {new Date(certificate.issuedAt).toLocaleDateString(
                    locale === 'ka' ? 'ka-GE' : 'en-US',
                    { year: 'numeric', month: 'long', day: 'numeric' }
                  )}
                </p>
              </div>
            </div>

            {/* Verification Code */}
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-purple-600 text-center mb-1">{t('certificateId')}</p>
              <p className="text-center font-mono text-lg font-semibold text-purple-900 tracking-widest">
                {certificate.verificationCode}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <a
                href={certificate.certificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {t('viewCertificate')}
              </a>
              <a
                href={certificate.certificateUrl}
                download
                className="inline-flex items-center gap-2 px-4 py-2 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                {t('download')}
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              {t('verificationNote')}
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

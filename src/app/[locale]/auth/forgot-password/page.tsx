import { generatePageMetadata } from '@/lib/metadata'
import type { Metadata } from 'next'
import { ForgotPasswordClient } from './ForgotPasswordClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata('forgotPassword', locale)
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />
}

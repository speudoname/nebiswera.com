import { generatePageMetadata } from '@/lib/metadata'
import type { Metadata } from 'next'
import { ResetPasswordClient } from './ResetPasswordClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata('resetPassword', locale)
}

export default function ResetPasswordPage() {
  return <ResetPasswordClient />
}

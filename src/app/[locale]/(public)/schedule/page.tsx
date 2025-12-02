import { generatePageMetadata } from '@/lib/metadata'
import type { Metadata } from 'next'
import { ScheduleClient } from './ScheduleClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata('schedule', locale)
}

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return <ScheduleClient />
}

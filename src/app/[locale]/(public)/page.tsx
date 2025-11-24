import { generatePageMetadata } from '@/lib/metadata'
import type { Metadata } from 'next'
import { HomeClient } from './home/HomeClient'
import { PhilosophySection } from './home/content/PhilosophySection'
import { ProblemAwarenessSection } from './home/content/ProblemAwarenessSection'
import { SecretRevealSection } from './home/content/SecretRevealSection'
import { TransformationPromiseSection } from './home/content/TransformationPromiseSection'
import { SocialProofSection } from './home/content/SocialProofSection'
import { CTASection } from './home/content/CTASection'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata('home', locale)
}

export default function HomePage() {
  return (
    <>
      <HomeClient />
      <PhilosophySection />
      <ProblemAwarenessSection />
      <SecretRevealSection />
      <TransformationPromiseSection />
      <SocialProofSection />
      <CTASection />
    </>
  )
}

import { generatePageMetadata } from '@/lib/metadata'
import type { Metadata } from 'next'
import { HomeClient } from './home/HomeClient'
import { PhilosophySection } from './home/content/PhilosophySection'
import { ProblemAwarenessSection } from './home/content/ProblemAwarenessSection'
import { SecretRevealSection } from './home/content/SecretRevealSection'
import { TransformationPromiseSection } from './home/content/TransformationPromiseSection'
import { SocialProofSection } from './home/content/SocialProofSection'
import { CTASection } from './home/content/CTASection'
import { TestimonialShowcase } from './home/content/TestimonialShowcase'
import { WorkshopOfferSection } from './home/content/WorkshopOfferSection'
import { NotTherapySection } from './home/content/NotTherapySection'
import { NotCoachingSection } from './home/content/NotCoachingSection'
import { NotMagicSection } from './home/content/NotMagicSection'
import { ChoiceParadoxSection } from './home/content/ChoiceParadoxSection'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return generatePageMetadata('home', locale)
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('home')

  return (
    <>
      {/* Hero Section */}
      <HomeClient />

      {/* Testimonials #1 */}
      <TestimonialShowcase count={3} />

      {/* Secret Reveal */}
      <SecretRevealSection />

      {/* What Nebiswera is NOT: Therapy */}
      <NotTherapySection />

      {/* Problem Awareness */}
      <ProblemAwarenessSection />

      {/* Testimonials #2 */}
      <TestimonialShowcase count={2} />

      {/* Transformation Promise */}
      <TransformationPromiseSection />

      {/* What Nebiswera is NOT: Coaching */}
      <NotCoachingSection />

      {/* 3-Day Workshop Offer */}
      <WorkshopOfferSection />

      {/* Philosophy (3 Steps) */}
      <PhilosophySection />

      {/* Testimonials #3 - Videos preferred */}
      <TestimonialShowcase count={3} type="VIDEO" />

      {/* What Nebiswera is NOT: Magic */}
      <NotMagicSection />

      {/* Choice Paradox + Contrast Callout */}
      <ChoiceParadoxSection />

      {/* Social Proof (Stats + Link to all testimonials) */}
      <SocialProofSection />

      {/* Final CTA */}
      <CTASection />
    </>
  )
}

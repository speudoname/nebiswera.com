import { generatePageMetadata } from '@/lib/metadata'
import type { Metadata } from 'next'
import { HeroSection } from './home/content/HeroSection'
import { PhilosophySection } from './home/content/PhilosophySection'
import { ProblemAwarenessSection } from './home/content/ProblemAwarenessSection'
import { SecretRevealSection } from './home/content/SecretRevealSection'
import { TransformationPromiseSection } from './home/content/TransformationPromiseSection'
import { PowerOfWillSection } from './home/content/PowerOfWillSection'
import { SocialProofSection } from './home/content/SocialProofSection'
import { CTASection } from './home/content/CTASection'
import { TestimonialShowcase } from './home/content/TestimonialShowcase'
import { WorkshopOfferSection } from './home/content/WorkshopOfferSection'
import { WorkshopThreeThings } from './home/content/WorkshopThreeThings'
import { WhatItIsNotSection } from './home/content/WhatItIsNotSection'
import { LifeBecomesYoursSection } from './home/content/LifeBecomesYoursSection'
import { WhatIsNebisweraSection } from './home/content/WhatIsNebisweraSection'

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

  return (
    <div className="overflow-x-hidden">
      {/* Transformation Promise - NEW HERO */}
      <TransformationPromiseSection />

      {/* Old Hero Section */}
      <HeroSection locale={locale} />

        {/* Testimonials #1 */}
        <TestimonialShowcase count={3} darkBackground={true} />

        {/* Power of Will Section */}
        <PowerOfWillSection />

        {/* What Nebiswera is NOT (Combined: Therapy, Coaching, Magic) */}
        <WhatItIsNotSection />

        {/* Your Life Becomes Yours Again - Hope after problem */}
        <LifeBecomesYoursSection />

        {/* Problem Awareness */}
        <ProblemAwarenessSection />

        {/* What Is Nebiswera - Creates curiosity about the solution */}
        <WhatIsNebisweraSection />

        {/* Testimonials #2 */}
        <TestimonialShowcase count={2} darkBackground={true} />

        {/* Secret Reveal */}
        <SecretRevealSection />

        {/* 3-Day Workshop Offer - Part 1 (Header, Schedule, Stats) */}
        <WorkshopOfferSection />

        {/* Philosophy (3 Steps) */}
        <PhilosophySection />

        {/* Testimonials #3 - Videos preferred (between stats and three things) */}
        <TestimonialShowcase count={3} type="VIDEO" />

        {/* Workshop Three Things (სამი რამ რაც ხდება ვორქშოფის დროს) */}
        <WorkshopThreeThings />

        {/* Social Proof (Stats + Link to all testimonials) */}
        <SocialProofSection />

      {/* Final CTA */}
      <CTASection />
    </div>
  )
}

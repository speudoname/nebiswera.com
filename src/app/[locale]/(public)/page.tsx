import { generatePageMetadata } from '@/lib/metadata'
import type { Metadata } from 'next'
import { HeroSection } from './home/content/HeroSection'
import { PhilosophySection } from './home/content/PhilosophySection'
import { SecretRevealSection } from './home/content/SecretRevealSection'
import { TransformationPromiseSection } from './home/content/TransformationPromiseSection'
import { PowerOfWillSection } from './home/content/PowerOfWillSection'
import { SocialProofSection } from './home/content/SocialProofSection'
import { CTASection } from './home/content/CTASection'
import { TestimonialShowcase } from './home/content/TestimonialShowcase'
import { WhatItIsNotSection } from './home/content/WhatItIsNotSection'
import { KnowWhatYouWantSection } from './home/content/KnowWhatYouWantSection'
import { ControlYourRealitySection } from './home/content/ControlYourRealitySection'
import { ThyWillBeDoneSection } from './home/content/ThyWillBeDoneSection'
import { FreedomSection } from './home/content/FreedomSection'
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

        {/* What Is Nebiswera - Creates curiosity about the solution */}
        <WhatIsNebisweraSection />

        {/* Know What You Want - First step */}
        <KnowWhatYouWantSection />

        {/* Your Life Becomes Yours Again - Hope after problem */}
        <LifeBecomesYoursSection />

        {/* Control Your Reality - Independence from external factors */}
        <ControlYourRealitySection />

        {/* Secret Reveal */}
        <SecretRevealSection />

        {/* Thy Will Be Done - Feel safe with control */}
        <ThyWillBeDoneSection />

        {/* Testimonials #2 */}
        <TestimonialShowcase count={2} darkBackground={true} />

        {/* Freedom - Your will = your freedom */}
        <FreedomSection />

        {/* Social Proof (Stats + Link to all testimonials) */}
        <SocialProofSection />

        {/* Philosophy (3 Steps) */}
        <PhilosophySection />

        {/* Testimonials #3 - Videos preferred */}
        <TestimonialShowcase count={3} type="VIDEO" />

      {/* Final CTA */}
      <CTASection />
    </div>
  )
}

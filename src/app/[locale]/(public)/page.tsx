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
import { AchieveYourGoalsSection } from './home/content/AchieveYourGoalsSection'
import { ThyWillBeDoneSection } from './home/content/ThyWillBeDoneSection'
import { FreedomSection } from './home/content/FreedomSection'
import { LifeBecomesYoursSection } from './home/content/LifeBecomesYoursSection'
import { WhatIsNebisweraSection } from './home/content/WhatIsNebisweraSection'
import { BecomeTheEngineerSection } from './home/content/BecomeTheEngineerSection'
import { ExistentialNavigationSection } from './home/content/ExistentialNavigationSection'
import { PersonalRealityOSSection } from './home/content/PersonalRealityOSSection'
import { ClaritySection } from './home/content/ClaritySection'
import { InnerFreedomSection } from './home/content/InnerFreedomSection'
import { NoMoreUncertaintySection } from './home/content/NoMoreUncertaintySection'

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

        {/* No More Uncertainty - Predictable future through principles */}
        <NoMoreUncertaintySection />

        {/* Power of Will Section */}
        <PowerOfWillSection />

        {/* What Nebiswera is NOT (Combined: Therapy, Coaching, Magic) */}
        <WhatItIsNotSection />

        {/* Become the Engineer - Control reality, don't just consume it */}
        <BecomeTheEngineerSection />

        {/* Achieve Your Goals - What areas Nebiswera helps with */}
        <AchieveYourGoalsSection />

        {/* Existential Navigation - Beyond personal transformation */}
        <ExistentialNavigationSection />

        {/* Your Life Becomes Yours Again - Hope after problem */}
        <LifeBecomesYoursSection />

        {/* Personal Reality OS - Technology of thinking for reality creation */}
        <PersonalRealityOSSection />

        {/* Clarity - Order the chaos, from noise to signal */}
        <ClaritySection />

        {/* Inner Freedom - What you will gain */}
        <InnerFreedomSection />

        {/* Know What You Want - First step */}
        <KnowWhatYouWantSection />

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

        {/* What Is Nebiswera - Creates curiosity about the solution */}
        <WhatIsNebisweraSection />

      {/* Final CTA */}
      <CTASection />
    </div>
  )
}

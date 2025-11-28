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
import { WorkshopThreeThings } from './home/content/WorkshopThreeThings'
import { WhatItIsNotSection } from './home/content/WhatItIsNotSection'
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
      {/* Preload hero poster for faster LCP - only on home page */}
      <link
        rel="preload"
        as="image"
        href="https://vz-1693fee0-2ad.b-cdn.net/973721e6-63ae-4773-877f-021b677f08f7/thumbnail.jpg"
        fetchPriority="high"
      />
      <div className="overflow-x-hidden">
        {/* Hero Section */}
        <HomeClient />

        {/* Secret Reveal */}
        <SecretRevealSection />

        {/* Testimonials #1 */}
        <TestimonialShowcase count={3} darkBackground={true} />

        {/* Problem Awareness */}
        <ProblemAwarenessSection />

        {/* What Nebiswera is NOT (Combined: Therapy, Coaching, Magic) */}
        <WhatItIsNotSection />

        {/* Testimonials #2 */}
        <TestimonialShowcase count={2} darkBackground={true} />

        {/* Transformation Promise */}
        <TransformationPromiseSection />

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
    </>
  )
}

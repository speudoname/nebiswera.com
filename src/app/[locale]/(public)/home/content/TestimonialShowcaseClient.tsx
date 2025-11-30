'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { TestimonialData } from '@/lib/testimonials'
import { TestimonialCard } from './TestimonialCard'
import {
  fadeUpVariants,
  staggerContainerVariants,
  staggerItemVariants,
  defaultViewport,
} from '@/lib/animations'

interface TestimonialShowcaseClientProps {
  testimonials: TestimonialData[]
  title?: string
  subtitle?: string
  darkBackground?: boolean
}

export function TestimonialShowcaseClient({
  testimonials,
  title,
  subtitle,
  darkBackground = false,
}: TestimonialShowcaseClientProps) {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const bgClass = darkBackground
    ? 'bg-gradient-to-b from-neu-base to-neu-light'
    : 'bg-gradient-to-b from-neu-light to-neu-base'

  const gridClass = `grid gap-6 md:gap-8 ${
    testimonials.length === 1 ? 'max-w-2xl mx-auto' :
    testimonials.length === 2 ? 'md:grid-cols-2' :
    'md:grid-cols-2 lg:grid-cols-3'
  }`

  const HeaderContent = () => (
    <div className="text-center mb-12 md:mb-16">
      {title && (
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-3">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="text-lg md:text-xl text-text-secondary">{subtitle}</p>
      )}
    </div>
  )

  const TestimonialGrid = () => (
    <div className={gridClass}>
      {testimonials.map((testimonial) => (
        <TestimonialCard key={testimonial.id} testimonial={testimonial} />
      ))}
    </div>
  )

  return (
    <section className={`py-16 md:py-20 px-4 sm:px-6 md:px-8 ${bgClass}`}>
      <div className="max-w-6xl mx-auto">
        {isMounted ? (
          <>
            {(title || subtitle) && (
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={defaultViewport}
                variants={fadeUpVariants}
              >
                <HeaderContent />
              </motion.div>
            )}

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={staggerContainerVariants}
              className={gridClass}
            >
              {testimonials.map((testimonial) => (
                <motion.div key={testimonial.id} variants={staggerItemVariants}>
                  <TestimonialCard testimonial={testimonial} />
                </motion.div>
              ))}
            </motion.div>
          </>
        ) : (
          <>
            {(title || subtitle) && <HeaderContent />}
            <TestimonialGrid />
          </>
        )}
      </div>
    </section>
  )
}

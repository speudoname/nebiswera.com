// Engagement score calculation for webinar registrations
// Score ranges from 0-100 based on various engagement factors

import { prisma } from '@/lib/db'

interface EngagementFactors {
  watchPercentage: number      // 0-100 (% of video watched)
  pollsAnswered: number        // Count of polls answered
  totalPolls: number           // Total polls in webinar
  ctaClicks: number            // Count of CTA clicks
  totalCTAs: number            // Total CTAs in webinar
  chatMessages: number         // Count of chat messages sent
  completed: boolean           // Watched past completion threshold
  joinedOnTime: boolean        // Joined within 5 min of start (for scheduled)
}

interface EngagementWeights {
  watchTime: number            // Weight for watch time (max 40 points)
  completion: number           // Weight for completion bonus (10 points)
  pollParticipation: number    // Weight for polls (max 20 points)
  ctaEngagement: number        // Weight for CTA clicks (max 15 points)
  chatActivity: number         // Weight for chat (max 10 points)
  punctuality: number          // Weight for joining on time (5 points)
}

const DEFAULT_WEIGHTS: EngagementWeights = {
  watchTime: 40,
  completion: 10,
  pollParticipation: 20,
  ctaEngagement: 15,
  chatActivity: 10,
  punctuality: 5,
}

/**
 * Calculate engagement score for a registration
 * Returns a score from 0-100
 */
export function calculateEngagementScore(
  factors: EngagementFactors,
  weights: EngagementWeights = DEFAULT_WEIGHTS
): number {
  let score = 0

  // Watch time score (linear, up to max weight)
  const watchScore = Math.min(factors.watchPercentage / 100, 1) * weights.watchTime
  score += watchScore

  // Completion bonus
  if (factors.completed) {
    score += weights.completion
  }

  // Poll participation score
  if (factors.totalPolls > 0) {
    const pollRate = factors.pollsAnswered / factors.totalPolls
    score += pollRate * weights.pollParticipation
  }

  // CTA engagement score
  if (factors.totalCTAs > 0) {
    // Give credit for clicking at least one CTA, bonus for more
    const ctaRate = Math.min(factors.ctaClicks / factors.totalCTAs, 1)
    score += ctaRate * weights.ctaEngagement
  }

  // Chat activity score (diminishing returns after 3 messages)
  const chatScore = Math.min(factors.chatMessages / 3, 1) * weights.chatActivity
  score += chatScore

  // Punctuality bonus (only for scheduled sessions)
  if (factors.joinedOnTime) {
    score += weights.punctuality
  }

  return Math.round(score * 10) / 10 // Round to 1 decimal
}

/**
 * Get engagement label based on score
 */
export function getEngagementLabel(score: number): {
  label: string
  color: string
} {
  if (score >= 80) return { label: 'Highly Engaged', color: 'green' }
  if (score >= 60) return { label: 'Engaged', color: 'blue' }
  if (score >= 40) return { label: 'Moderate', color: 'yellow' }
  if (score >= 20) return { label: 'Low', color: 'orange' }
  return { label: 'Minimal', color: 'red' }
}

/**
 * Calculate and update engagement score for a registration
 */
export async function updateEngagementScore(registrationId: string): Promise<number> {
  // Get registration with related data
  const registration = await prisma.webinarRegistration.findUnique({
    where: { id: registrationId },
    include: {
      webinar: {
        select: {
          videoDuration: true,
          completionPercent: true,
          interactions: {
            where: { enabled: true },
            select: { id: true, type: true },
          },
        },
      },
      session: {
        select: { scheduledAt: true, type: true },
      },
      pollResponses: {
        select: { id: true },
      },
      chatMessages: {
        where: { isSimulated: false },
        select: { id: true },
      },
    },
  })

  if (!registration) {
    throw new Error('Registration not found')
  }

  // Calculate watch percentage
  const videoDuration = registration.webinar.videoDuration || 0
  const watchPercentage = videoDuration > 0
    ? (registration.maxVideoPosition / videoDuration) * 100
    : 0

  // Count interactions by type
  const totalPolls = registration.webinar.interactions.filter(i => i.type === 'POLL').length
  const totalCTAs = registration.webinar.interactions.filter(
    i => i.type === 'CTA' || i.type === 'DOWNLOAD' || i.type === 'SPECIAL_OFFER'
  ).length

  // Determine if joined on time (within 5 min of scheduled start)
  let joinedOnTime = false
  if (registration.session && registration.joinedAt) {
    const scheduledAt = new Date(registration.session.scheduledAt)
    const joinedAt = new Date(registration.joinedAt)
    const diffMinutes = (joinedAt.getTime() - scheduledAt.getTime()) / (1000 * 60)
    joinedOnTime = diffMinutes <= 5 && diffMinutes >= -5 // Within 5 min before or after
  }

  const factors: EngagementFactors = {
    watchPercentage: Math.min(watchPercentage, 100),
    pollsAnswered: registration.pollResponses.length,
    totalPolls,
    ctaClicks: registration.ctaClickCount,
    totalCTAs,
    chatMessages: registration.chatMessages.length,
    completed: registration.completedAt !== null,
    joinedOnTime,
  }

  const score = calculateEngagementScore(factors)

  // Update registration with new score
  await prisma.webinarRegistration.update({
    where: { id: registrationId },
    data: {
      engagementScore: score,
      chatMessageCount: registration.chatMessages.length,
      pollResponseCount: registration.pollResponses.length,
    },
  })

  return score
}

/**
 * Batch update engagement scores for all registrations of a webinar
 */
export async function updateWebinarEngagementScores(webinarId: string): Promise<{
  updated: number
  averageScore: number
}> {
  const registrations = await prisma.webinarRegistration.findMany({
    where: { webinarId, joinedAt: { not: null } },
    select: { id: true },
  })

  let totalScore = 0
  let updated = 0

  for (const reg of registrations) {
    try {
      const score = await updateEngagementScore(reg.id)
      totalScore += score
      updated++
    } catch (error) {
      console.error(`Failed to update engagement for ${reg.id}:`, error)
    }
  }

  const averageScore = updated > 0 ? Math.round((totalScore / updated) * 10) / 10 : 0

  return { updated, averageScore }
}

/**
 * Get engagement breakdown for analytics
 */
export async function getEngagementBreakdown(webinarId: string): Promise<{
  distribution: Array<{ label: string; count: number; percentage: number }>
  averageScore: number
  topEngaged: Array<{ email: string; score: number }>
}> {
  const registrations = await prisma.webinarRegistration.findMany({
    where: {
      webinarId,
      engagementScore: { not: null },
    },
    select: {
      email: true,
      engagementScore: true,
    },
    orderBy: { engagementScore: 'desc' },
  })

  // Calculate distribution
  const brackets = [
    { min: 80, max: 100, label: 'Highly Engaged (80-100)' },
    { min: 60, max: 79, label: 'Engaged (60-79)' },
    { min: 40, max: 59, label: 'Moderate (40-59)' },
    { min: 20, max: 39, label: 'Low (20-39)' },
    { min: 0, max: 19, label: 'Minimal (0-19)' },
  ]

  const total = registrations.length
  const distribution = brackets.map(bracket => {
    const count = registrations.filter(
      r => r.engagementScore !== null &&
           r.engagementScore >= bracket.min &&
           r.engagementScore <= bracket.max
    ).length
    return {
      label: bracket.label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }
  })

  // Calculate average
  const totalScore = registrations.reduce((sum, r) => sum + (r.engagementScore || 0), 0)
  const averageScore = total > 0 ? Math.round((totalScore / total) * 10) / 10 : 0

  // Get top engaged
  const topEngaged = registrations.slice(0, 10).map(r => ({
    email: r.email,
    score: r.engagementScore || 0,
  }))

  return { distribution, averageScore, topEngaged }
}

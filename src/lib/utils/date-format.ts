/**
 * Date formatting utilities with Georgian/English locale support
 */

const monthsKa = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
]

const monthsEn = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

/**
 * Format a date for display in Georgian or English
 * Returns format: "15 January, 2024"
 */
export function formatDate(date: Date | string, locale: string = 'en'): string {
  const d = new Date(date)
  const day = d.getDate()
  const year = d.getFullYear()
  const monthIndex = d.getMonth()

  const isKa = locale === 'ka'
  const month = isKa ? monthsKa[monthIndex] : monthsEn[monthIndex]

  return `${day} ${month}, ${year}`
}

/**
 * Get relative time string (e.g., "2 days ago")
 */
export function getRelativeTime(date: Date | string, locale: string = 'en'): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const isKa = locale === 'ka'

  if (diffDays === 0) {
    return isKa ? 'დღეს' : 'Today'
  } else if (diffDays === 1) {
    return isKa ? 'გუშინ' : 'Yesterday'
  } else if (diffDays < 7) {
    return isKa ? `${diffDays} დღის წინ` : `${diffDays} days ago`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return isKa ? `${weeks} კვირის წინ` : `${weeks} week${weeks > 1 ? 's' : ''} ago`
  } else {
    return formatDate(date, locale)
  }
}

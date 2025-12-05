/**
 * Georgian to Latin transliteration utilities
 * Used for generating URL-friendly slugs from Georgian text
 */

// Georgian to Latin character mapping
const georgianToLatin: Record<string, string> = {
  'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z',
  'თ': 't', 'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o',
  'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'f',
  'ქ': 'k', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz',
  'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
}

// Common stop words to remove from slugs (English + Georgian particles)
const stopWords = new Set([
  // English
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
  'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where',
  'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here',
  // Georgian particles (transliterated)
  'da', 'an', 'rom', 'ras', 'aris', 'iyo', 'iqo', 'unda', 'sheidzleba',
])

/**
 * Transliterate Georgian text to Latin characters
 */
export function transliterate(text: string): string {
  return text
    .split('')
    .map(char => georgianToLatin[char] || char)
    .join('')
}

/**
 * Generate a URL-friendly slug from text (supports Georgian)
 * Removes stop words and limits to ~60 characters for clean URLs
 */
export function generateSlug(text: string, maxWords = 5, maxLength = 60): string {
  const transliterated = transliterate(text)
  const words = transliterated
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 0 && !stopWords.has(word))

  // Take first N significant words for a clean, short slug
  const slugWords = words.slice(0, maxWords)

  return slugWords
    .join('-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, maxLength)
}

/**
 * Simple slug generation without stop word removal
 * Used when full text preservation is needed
 */
export function generateSimpleSlug(text: string, maxLength = 100): string {
  const transliterated = transliterate(text)

  return transliterated
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .substring(0, maxLength)
}

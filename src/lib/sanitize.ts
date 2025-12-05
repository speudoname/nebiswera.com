import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Use this before rendering any user-generated or database-stored HTML.
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    // Allow common HTML tags for rich content
    ALLOWED_TAGS: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'br',
      'hr',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'em',
      'strong',
      'b',
      'i',
      'u',
      's',
      'strike',
      'sub',
      'sup',
      'a',
      'img',
      'figure',
      'figcaption',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'div',
      'span',
      'iframe', // For embedded videos (YouTube, Vimeo)
    ],
    // Allow common attributes
    ALLOWED_ATTR: [
      'href',
      'src',
      'alt',
      'title',
      'class',
      'id',
      'target',
      'rel',
      'width',
      'height',
      'style',
      // For iframes (embedded videos)
      'frameborder',
      'allow',
      'allowfullscreen',
    ],
    // Allow specific URI schemes
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    // Allow YouTube and Vimeo iframes
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder'],
  })
}

/**
 * Sanitizes HTML with stricter settings - no iframes, no styles.
 * Use for content where embedded media is not expected.
 */
export function sanitizeHtmlStrict(html: string | null | undefined): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'br',
      'hr',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'em',
      'strong',
      'b',
      'i',
      'u',
      'a',
      'img',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
  })
}

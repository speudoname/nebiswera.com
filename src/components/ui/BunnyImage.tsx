/**
 * BunnyImage - Responsive image component using Bunny CDN's Dynamic Image API
 *
 * This component uses Bunny's on-the-fly image resizing instead of Next.js Image optimization.
 * Benefits:
 * - No disk usage on server (all caching happens on Bunny CDN)
 * - Automatic WebP/AVIF conversion
 * - Global CDN caching
 * - Responsive sizing via URL parameters
 *
 * Usage:
 *   <BunnyImage
 *     src="https://nebiswera-cdn.b-cdn.net/images/door.jpg"
 *     alt="Door artwork"
 *     width={512}
 *     height={768}
 *     sizes="(max-width: 768px) 90vw, 50vw"
 *   />
 */

import { ImgHTMLAttributes } from 'react'

interface BunnyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  src: string
  alt: string
  width: number
  height: number
  sizes?: string
  quality?: number
  priority?: boolean
}

export function BunnyImage({
  src,
  alt,
  width,
  height,
  sizes = '100vw',
  quality = 75,
  priority = false,
  className = '',
  ...props
}: BunnyImageProps) {
  // Generate responsive widths (common breakpoints)
  const widths = [400, 640, 768, 1024, 1280, 1536, 1920]

  // Filter widths that are smaller than or equal to the max width
  const responsiveWidths = widths.filter(w => w <= width * 2).concat(width)
  const uniqueWidths = Array.from(new Set(responsiveWidths)).sort((a, b) => a - b)

  // Generate srcSet with Bunny's width parameter
  const srcSet = uniqueWidths
    .map(w => `${src}?width=${w}&quality=${quality} ${w}w`)
    .join(', ')

  // Default src with original width
  const defaultSrc = `${src}?width=${width}&quality=${quality}`

  return (
    <img
      src={defaultSrc}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      className={className}
      {...props}
    />
  )
}

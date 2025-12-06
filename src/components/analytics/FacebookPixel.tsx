'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

interface FacebookPixelProps {
  pixelId?: string | null
}

/**
 * Facebook Pixel Script Component
 * Loads the Facebook Pixel base code and initializes it
 */
export function FacebookPixel({ pixelId: propPixelId }: FacebookPixelProps) {
  const [pixelId, setPixelId] = useState<string | null>(propPixelId || null)

  // Fetch pixel ID from API if not provided
  useEffect(() => {
    if (propPixelId !== undefined) return

    async function fetchPixelId() {
      try {
        const res = await fetch('/api/pixel/track', { method: 'GET' })
        const data = await res.json()
        if (data.pixelEnabled && data.pixelId) {
          setPixelId(data.pixelId)
        }
      } catch (error) {
        console.error('[Pixel] Failed to fetch pixel ID:', error)
      }
    }

    fetchPixelId()
  }, [propPixelId])

  if (!pixelId) {
    return null
  }

  return (
    <>
      {/* Facebook Pixel Base Code */}
      <Script
        id="fb-pixel-base"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />

      {/* NoScript Fallback */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}

export default FacebookPixel

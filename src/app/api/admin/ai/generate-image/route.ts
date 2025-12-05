// API endpoint for generating blog images using Google Nano Banana Pro (Gemini 3 Pro Image)
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { uploadToBunnyStorage, generateBlogImageKey } from '@/lib/bunny-storage'
import { logger } from '@/lib'

export const runtime = 'nodejs'
export const maxDuration = 120 // Allow up to 120 seconds for image generation

const GOOGLE_API_KEY = process.env.NANO_BANANA_API_KEY

// Model options:
// - gemini-2.5-flash-image = Nano Banana (fast)
// - gemini-3-pro-image-preview = Nano Banana Pro (advanced, high quality)
const IMAGE_MODEL = 'gemini-3-pro-image-preview'

// Valid aspect ratios supported by Gemini Image API
type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9'

// Valid image sizes (must be uppercase K)
type ImageSize = '1K' | '2K' | '4K'

interface GenerateImageRequest {
  prompt: string
  style?: string
  aspectRatio?: AspectRatio
  imageSize?: ImageSize
  useFastModel?: boolean // Use Nano Banana (fast) instead of Pro
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!GOOGLE_API_KEY) {
    return NextResponse.json(
      { error: 'Google API key not configured.' },
      { status: 503 }
    )
  }

  try {
    const body: GenerateImageRequest = await request.json()
    const { prompt, style, aspectRatio = '16:9', imageSize = '2K', useFastModel = false } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Enhance prompt with style if provided
    let enhancedPrompt = prompt
    if (style) {
      enhancedPrompt = `${prompt}, ${style} style`
    }

    // Select model: Nano Banana Pro (default) or Nano Banana (fast)
    const model = useFastModel ? 'gemini-2.5-flash-image' : IMAGE_MODEL

    // Use Nano Banana Pro (Gemini 3 Pro Image) for high-quality image generation
    // With aspect ratio and size control for optimal social media/blog images
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: enhancedPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['IMAGE'],
            // Image configuration for aspect ratio and size
            imageConfig: {
              aspectRatio: aspectRatio,
              imageSize: imageSize,
            },
          },
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      logger.error('Google Gemini API error:', errorData)
      throw new Error(errorData.error?.message || 'Failed to generate image')
    }

    const data = await response.json()

    // Find the image part in the response
    const parts = data.candidates?.[0]?.content?.parts || []
    const imagePart = parts.find((part: { inlineData?: { mimeType: string; data: string } }) =>
      part.inlineData?.mimeType?.startsWith('image/')
    )

    if (!imagePart?.inlineData?.data) {
      // If no image generated, return helpful error
      const textPart = parts.find((part: { text?: string }) => part.text)
      throw new Error(textPart?.text || 'No image generated. Try a different prompt.')
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64')

    // Upload to Bunny Storage
    const ext = imagePart.inlineData.mimeType.split('/')[1] || 'png'
    const filename = `ai-generated-${Date.now()}.${ext}`
    const key = generateBlogImageKey(filename)
    const permanentUrl = await uploadToBunnyStorage(imageBuffer, key)

    return NextResponse.json({
      success: true,
      url: permanentUrl,
      prompt: enhancedPrompt,
    })
  } catch (error: unknown) {
    logger.error('Error generating image:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 500 }
    )
  }
}

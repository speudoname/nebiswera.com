// API endpoint for generating blog text using Claude API
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { logger, unauthorizedResponse, badRequestResponse, errorResponse } from '@/lib'

export const runtime = 'nodejs'
export const maxDuration = 60 // Allow up to 60 seconds for AI generation

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

interface GenerateTextRequest {
  prompt: string
  context?: string // Optional context like existing content
  type?: 'blog_post' | 'excerpt' | 'seo_title' | 'seo_description' | 'translate'
  language?: 'ka' | 'en'
  sourceLanguage?: 'ka' | 'en' // For translation
  sourceContent?: string // Content to translate
}

export async function POST(request: NextRequest) {
  // Check admin auth
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  // Check if API key is configured
  if (!CLAUDE_API_KEY) {
    return errorResponse('Claude API key not configured. Please add CLAUDE_API_KEY to environment variables.', 503)
  }

  try {
    const body: GenerateTextRequest = await request.json()
    const { prompt, context, type = 'blog_post', language = 'en', sourceLanguage, sourceContent } = body

    // For translation, we need sourceContent
    if (type === 'translate' && !sourceContent) {
      return badRequestResponse('Source content is required for translation')
    }

    if (type !== 'translate' && !prompt) {
      return badRequestResponse('Prompt is required')
    }

    // Build system prompt based on type and language
    let systemPrompt = ''

    if (type === 'translate') {
      const targetLang = language === 'ka' ? 'Georgian (ქართული)' : 'English'
      const sourceLang = sourceLanguage === 'ka' ? 'Georgian' : 'English'
      systemPrompt = `You are a professional translator specializing in ${sourceLang} to ${targetLang} translation.
Translate the provided content accurately while:
- Preserving the exact HTML structure and formatting
- Maintaining the tone and style of the original
- Ensuring the translation sounds natural in ${targetLang}
- Keeping any technical terms or proper nouns appropriately
Only output the translated content, no explanations.`
    } else if (type === 'blog_post') {
      systemPrompt = language === 'ka'
        ? 'თქვენ ხართ პროფესიონალი ბლოგერი რომელიც წერს ქართულად. დაწერეთ ინფორმატიული და საინტერესო ბლოგ პოსტი მოცემულ თემაზე. გამოიყენეთ HTML ფორმატირება (h2, h3, p, ul, ol, strong, em).'
        : 'You are a professional blogger. Write an informative and engaging blog post about the given topic. Use HTML formatting (h2, h3, p, ul, ol, strong, em).'
    } else if (type === 'excerpt') {
      systemPrompt = language === 'ka'
        ? 'დაწერეთ მოკლე, საინტერესო შეჯამება (2-3 წინადადება) მოცემული შინაარსისთვის.'
        : 'Write a short, engaging summary (2-3 sentences) for the given content.'
    } else if (type === 'seo_title') {
      systemPrompt = language === 'ka'
        ? 'დაწერეთ SEO ოპტიმიზირებული სათაური (50-60 სიმბოლო) მოცემული შინაარსისთვის.'
        : 'Write an SEO-optimized title (50-60 characters) for the given content.'
    } else if (type === 'seo_description') {
      systemPrompt = language === 'ka'
        ? 'დაწერეთ SEO მეტა აღწერა (150-160 სიმბოლო) მოცემული შინაარსისთვის.'
        : 'Write an SEO meta description (150-160 characters) for the given content.'
    }

    // Build user message
    let userMessage = ''
    if (type === 'translate') {
      userMessage = `Translate the following content:\n\n${sourceContent}`
    } else {
      userMessage = prompt
      if (context) {
        userMessage = `Context:\n${context}\n\nRequest:\n${prompt}`
      }
    }

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: (type === 'blog_post' || type === 'translate') ? 8192 : 256,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      logger.error('Claude API error:', errorData)
      throw new Error(errorData.error?.message || 'Failed to generate text')
    }

    const data = await response.json()
    const generatedText = data.content?.[0]?.text || ''

    return NextResponse.json({
      success: true,
      text: generatedText,
      usage: data.usage,
    })
  } catch (error: unknown) {
    logger.error('Error generating text:', error)
    return errorResponse(error instanceof Error ? error.message : 'Failed to generate text')
  }
}

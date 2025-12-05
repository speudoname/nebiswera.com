'use client'

import { useState } from 'react'
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Loader2,
  Copy,
  Check,
  FileText,
  Type,
  ChevronDown,
  ChevronUp,
  X,
  Languages,
  Newspaper,
} from 'lucide-react'
import { Button } from '@/components/ui'

interface TranslationResult {
  title: string
  excerpt: string
  content: string
  seoTitle: string
  seoDescription: string
  targetLanguage: 'ka' | 'en'
}

interface AIAssistantProps {
  onTextGenerated?: (text: string) => void
  onImageGenerated?: (url: string) => void
  onTranslated?: (result: TranslationResult) => void
  onFullArticleGenerated?: (content: string, featuredImage?: string) => void
  existingContent?: string
  // All content for translation
  titleKa?: string
  titleEn?: string
  excerptKa?: string
  excerptEn?: string
  contentKa?: string
  contentEn?: string
  seoTitleKa?: string
  seoTitleEn?: string
  seoDescriptionKa?: string
  seoDescriptionEn?: string
  language?: 'ka' | 'en'
}

type GenerationType = 'blog_post' | 'excerpt' | 'seo_title' | 'seo_description'

export function AIAssistant({
  onTextGenerated,
  onImageGenerated,
  onTranslated,
  onFullArticleGenerated,
  existingContent,
  titleKa = '',
  titleEn = '',
  excerptKa = '',
  excerptEn = '',
  contentKa = '',
  contentEn = '',
  seoTitleKa = '',
  seoTitleEn = '',
  seoDescriptionKa = '',
  seoDescriptionEn = '',
  language = 'en',
}: AIAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'translate' | 'full-article'>('text')

  // Text generation state
  const [textPrompt, setTextPrompt] = useState('')
  const [generationType, setGenerationType] = useState<GenerationType>('blog_post')
  const [isGeneratingText, setIsGeneratingText] = useState(false)
  const [generatedText, setGeneratedText] = useState('')
  const [textError, setTextError] = useState<string | null>(null)

  // Image generation state
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageStyle, setImageStyle] = useState('')
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('16:9')
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState('')
  const [imageError, setImageError] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)

  // Translation state
  const [translateFrom, setTranslateFrom] = useState<'ka' | 'en'>(language === 'ka' ? 'en' : 'ka')
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null)
  const [translateError, setTranslateError] = useState<string | null>(null)
  const [translateProgress, setTranslateProgress] = useState('')

  // Full article generation state
  const [articleTopic, setArticleTopic] = useState('')
  const [articleLanguage, setArticleLanguage] = useState<'ka' | 'en'>(language)
  const [includeImages, setIncludeImages] = useState(true)
  const [imageCount, setImageCount] = useState(2)
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false)
  const [articleProgress, setArticleProgress] = useState('')
  const [generatedArticle, setGeneratedArticle] = useState('')
  const [generatedFeaturedImage, setGeneratedFeaturedImage] = useState('')
  const [articleError, setArticleError] = useState<string | null>(null)

  const handleGenerateText = async () => {
    if (!textPrompt.trim()) return

    setIsGeneratingText(true)
    setTextError(null)
    setGeneratedText('')

    try {
      const response = await fetch('/api/admin/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textPrompt,
          context: existingContent,
          type: generationType,
          language,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate text')
      }

      setGeneratedText(data.text)
    } catch (error) {
      setTextError(error instanceof Error ? error.message : 'Failed to generate text')
    } finally {
      setIsGeneratingText(false)
    }
  }

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return

    setIsGeneratingImage(true)
    setImageError(null)
    setGeneratedImageUrl('')

    try {
      const response = await fetch('/api/admin/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          style: imageStyle,
          aspectRatio: aspectRatio,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image')
      }

      setGeneratedImageUrl(data.url)
      onImageGenerated?.(data.url)
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Failed to generate image')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleUseText = () => {
    if (generatedText) {
      onTextGenerated?.(generatedText)
      setGeneratedText('')
      setTextPrompt('')
    }
  }

  const handleCopyUrl = async () => {
    if (generatedImageUrl) {
      await navigator.clipboard.writeText(generatedImageUrl)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    }
  }

  const getSourceData = () => {
    if (translateFrom === 'ka') {
      return {
        title: titleKa,
        excerpt: excerptKa,
        content: contentKa,
        seoTitle: seoTitleKa,
        seoDescription: seoDescriptionKa,
      }
    }
    return {
      title: titleEn,
      excerpt: excerptEn,
      content: contentEn,
      seoTitle: seoTitleEn,
      seoDescription: seoDescriptionEn,
    }
  }

  const translateText = async (text: string, sourceLanguage: 'ka' | 'en', targetLanguage: 'ka' | 'en'): Promise<string> => {
    if (!text?.trim()) return ''

    const response = await fetch('/api/admin/ai/generate-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'translate',
        language: targetLanguage,
        sourceLanguage,
        sourceContent: text,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to translate')
    }

    return data.text
  }

  const handleTranslate = async () => {
    const sourceData = getSourceData()
    if (!sourceData.content?.trim() && !sourceData.title?.trim()) return

    setIsTranslating(true)
    setTranslateError(null)
    setTranslationResult(null)
    setTranslateProgress('Translating title...')

    const targetLanguage = translateFrom === 'ka' ? 'en' : 'ka'

    try {
      // Translate title
      const translatedTitle = await translateText(sourceData.title, translateFrom, targetLanguage)

      // Translate excerpt
      setTranslateProgress('Translating excerpt...')
      const translatedExcerpt = await translateText(sourceData.excerpt, translateFrom, targetLanguage)

      // Translate content
      setTranslateProgress('Translating content...')
      const translatedContent = await translateText(sourceData.content, translateFrom, targetLanguage)

      // Translate SEO title (or use translated title if empty)
      setTranslateProgress('Translating SEO fields...')
      const translatedSeoTitle = sourceData.seoTitle
        ? await translateText(sourceData.seoTitle, translateFrom, targetLanguage)
        : translatedTitle

      // Translate SEO description (or use translated excerpt if empty)
      const translatedSeoDescription = sourceData.seoDescription
        ? await translateText(sourceData.seoDescription, translateFrom, targetLanguage)
        : translatedExcerpt

      setTranslationResult({
        title: translatedTitle,
        excerpt: translatedExcerpt,
        content: translatedContent,
        seoTitle: translatedSeoTitle,
        seoDescription: translatedSeoDescription,
        targetLanguage,
      })
      setTranslateProgress('')
    } catch (error) {
      setTranslateError(error instanceof Error ? error.message : 'Failed to translate')
      setTranslateProgress('')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleUseTranslation = () => {
    if (translationResult && onTranslated) {
      onTranslated(translationResult)
      setTranslationResult(null)
    }
  }

  const handleGenerateFullArticle = async () => {
    if (!articleTopic.trim()) return

    setIsGeneratingArticle(true)
    setArticleError(null)
    setGeneratedArticle('')
    setGeneratedFeaturedImage('')
    setArticleProgress('Generating article content...')

    try {
      // Step 1: Generate article content with Claude
      const textResponse = await fetch('/api/admin/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Write a comprehensive, well-structured blog article about: ${articleTopic}

Requirements:
- Write in ${articleLanguage === 'ka' ? 'Georgian (ქართული)' : 'English'}
- Use HTML formatting (h2, h3, p, ul, ol, strong, em)
- Include 4-6 sections with clear headings
- Make it informative, engaging, and professional
- Include practical tips or actionable advice where relevant
- Aim for 800-1200 words
${includeImages ? `- Add ${imageCount} image placeholders where images would enhance the content using this exact format: [IMAGE_PLACEHOLDER: description of the image that should go here]` : ''}`,
          type: 'blog_post',
          language: articleLanguage,
        }),
      })

      const textData = await textResponse.json()

      if (!textResponse.ok) {
        throw new Error(textData.error || 'Failed to generate article text')
      }

      let articleContent = textData.text

      // Step 2: Generate images if enabled
      if (includeImages) {
        setArticleProgress('Generating images with Nano Banana Pro...')

        // Extract image placeholders
        const placeholderRegex = /\[IMAGE_PLACEHOLDER:\s*([^\]]+)\]/g
        const placeholders: { match: string; description: string }[] = []
        let match

        while ((match = placeholderRegex.exec(articleContent)) !== null) {
          placeholders.push({ match: match[0], description: match[1].trim() })
        }

        // Generate featured image first
        if (placeholders.length > 0) {
          setArticleProgress(`Generating featured image (1/${placeholders.length + 1})...`)
          try {
            const featuredResponse = await fetch('/api/admin/ai/generate-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: `Professional blog header image for article about: ${articleTopic}. High quality, clean, modern design.`,
                style: 'photorealistic, professional, high quality',
                aspectRatio: '16:9',
              }),
            })

            const featuredData = await featuredResponse.json()
            if (featuredResponse.ok && featuredData.url) {
              setGeneratedFeaturedImage(featuredData.url)
            }
          } catch (imgError) {
            console.error('Failed to generate featured image:', imgError)
          }
        }

        // Generate images for each placeholder
        for (let i = 0; i < Math.min(placeholders.length, imageCount); i++) {
          const placeholder = placeholders[i]
          setArticleProgress(`Generating image ${i + 2}/${placeholders.length + 1}: ${placeholder.description.substring(0, 30)}...`)

          try {
            const imageResponse = await fetch('/api/admin/ai/generate-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: placeholder.description,
                style: 'professional, high quality, relevant to blog content',
                aspectRatio: '16:9',
              }),
            })

            const imageData = await imageResponse.json()

            if (imageResponse.ok && imageData.url) {
              // Replace placeholder with actual image
              const imageHtml = `<figure class="my-6"><img src="${imageData.url}" alt="${placeholder.description}" class="w-full rounded-lg shadow-md" /><figcaption class="text-sm text-gray-500 mt-2 text-center">${placeholder.description}</figcaption></figure>`
              articleContent = articleContent.replace(placeholder.match, imageHtml)
            } else {
              // Remove placeholder if image generation failed
              articleContent = articleContent.replace(placeholder.match, '')
            }
          } catch (imgError) {
            console.error('Failed to generate image:', imgError)
            articleContent = articleContent.replace(placeholder.match, '')
          }
        }

        // Remove any remaining placeholders
        articleContent = articleContent.replace(/\[IMAGE_PLACEHOLDER:\s*[^\]]+\]/g, '')
      }

      setGeneratedArticle(articleContent)
      setArticleProgress('')
    } catch (error) {
      setArticleError(error instanceof Error ? error.message : 'Failed to generate article')
      setArticleProgress('')
    } finally {
      setIsGeneratingArticle(false)
    }
  }

  const handleUseArticle = () => {
    if (generatedArticle) {
      onFullArticleGenerated?.(generatedArticle, generatedFeaturedImage)
      setGeneratedArticle('')
      setGeneratedFeaturedImage('')
      setArticleTopic('')
    }
  }

  const generationTypeLabels: Record<GenerationType, string> = {
    blog_post: 'Full Blog Post',
    excerpt: 'Excerpt/Summary',
    seo_title: 'SEO Title',
    seo_description: 'SEO Description',
  }

  const sourceData = getSourceData()

  return (
    <div className="border border-purple-200 rounded-lg bg-purple-50">
      {/* Header - Always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-purple-100 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span className="font-medium text-purple-900">AI Assistant</span>
          <span className="text-xs text-purple-600 bg-purple-200 px-2 py-0.5 rounded-full">
            Beta
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-purple-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-purple-600" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-purple-200 p-4">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('full-article')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'full-article'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-purple-700 hover:bg-purple-100'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              Full Article
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'text'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-purple-700 hover:bg-purple-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              Generate Text
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('image')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'image'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-purple-700 hover:bg-purple-100'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Generate Image
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('translate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'translate'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-purple-700 hover:bg-purple-100'
              }`}
            >
              <Languages className="w-4 h-4" />
              Translate
            </button>
          </div>

          {/* Full Article Generation */}
          {activeTab === 'full-article' && (
            <div className="space-y-3">
              <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Newspaper className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">One-Click Article Generator</span>
                </div>
                <p className="text-xs text-purple-600">
                  Generate a complete blog article with AI-generated images using Claude + Nano Banana Pro
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Article Topic
                </label>
                <textarea
                  value={articleTopic}
                  onChange={(e) => setArticleTopic(e.target.value)}
                  placeholder="e.g., 10 Essential Tips for Better Sleep Quality"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    value={articleLanguage}
                    onChange={(e) => setArticleLanguage(e.target.value as 'ka' | 'en')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="ka">ქართული (Georgian)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Images
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeImages}
                        onChange={(e) => setIncludeImages(e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Include</span>
                    </label>
                    {includeImages && (
                      <select
                        value={imageCount}
                        onChange={(e) => setImageCount(parseInt(e.target.value))}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value={1}>1 image</option>
                        <option value={2}>2 images</option>
                        <option value={3}>3 images</option>
                        <option value={4}>4 images</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGenerateFullArticle}
                disabled={isGeneratingArticle || !articleTopic.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isGeneratingArticle ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {articleProgress || 'Generating...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Full Article
                  </>
                )}
              </Button>

              {articleError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {articleError}
                </div>
              )}

              {generatedArticle && (
                <div className="space-y-2">
                  {generatedFeaturedImage && (
                    <div className="relative rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={generatedFeaturedImage}
                        alt="Featured"
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        Featured Image
                      </div>
                    </div>
                  )}
                  <div className="p-3 bg-white border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                    <div
                      className="text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: generatedArticle }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleUseArticle}
                      variant="primary"
                      size="sm"
                    >
                      <Type className="w-4 h-4 mr-1" />
                      Use This Article
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setGeneratedArticle('')
                        setGeneratedFeaturedImage('')
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Discard
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Text Generation */}
          {activeTab === 'text' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What would you like to generate?
                </label>
                <select
                  value={generationType}
                  onChange={(e) => setGenerationType(e.target.value as GenerationType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {Object.entries(generationTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Describe what you want
                </label>
                <textarea
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  placeholder={
                    language === 'ka'
                      ? 'აღწერეთ რა გინდათ რომ დაიწეროს...'
                      : 'Describe what you want to be written...'
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <Button
                type="button"
                onClick={handleGenerateText}
                disabled={isGeneratingText || !textPrompt.trim()}
                className="w-full"
              >
                {isGeneratingText ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Text
                  </>
                )}
              </Button>

              {textError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {textError}
                </div>
              )}

              {generatedText && (
                <div className="space-y-2">
                  <div className="p-3 bg-white border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    <div
                      className="text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: generatedText }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleUseText}
                      variant="primary"
                      size="sm"
                    >
                      <Type className="w-4 h-4 mr-1" />
                      Use This Text
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setGeneratedText('')}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Discard
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Image Generation */}
          {activeTab === 'image' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Describe the image you want
                </label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="A professional blog header image showing..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Style (optional)
                  </label>
                  <input
                    type="text"
                    value={imageStyle}
                    onChange={(e) => setImageStyle(e.target.value)}
                    placeholder="e.g., photorealistic, watercolor"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aspect Ratio
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as typeof aspectRatio)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="16:9">Landscape (16:9)</option>
                    <option value="1:1">Square (1:1)</option>
                    <option value="4:3">Standard (4:3)</option>
                    <option value="3:4">Portrait (3:4)</option>
                    <option value="9:16">Tall (9:16)</option>
                  </select>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !imagePrompt.trim()}
                className="w-full"
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating (this may take a minute)...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>

              {imageError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {imageError}
                </div>
              )}

              {generatedImageUrl && (
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={generatedImageUrl}
                      alt="Generated"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleCopyUrl}
                      variant="secondary"
                      size="sm"
                    >
                      {copiedUrl ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy URL
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setGeneratedImageUrl('')}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Image has been saved to your library. Copy the URL to use it in your post.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Translation */}
          {activeTab === 'translate' && (
            <div className="space-y-3">
              <div className="p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Languages className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Translate Title, Excerpt & Content
                  </span>
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Translate from
                  </label>
                  <select
                    value={translateFrom}
                    onChange={(e) => setTranslateFrom(e.target.value as 'ka' | 'en')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="en">English → ქართული</option>
                    <option value="ka">ქართული → English</option>
                  </select>
                </div>

                {/* Source content status */}
                <div className="space-y-1 text-xs">
                  <div className={sourceData.title ? 'text-green-600' : 'text-gray-400'}>
                    {sourceData.title ? <Check className="w-3 h-3 inline mr-1" /> : '○ '}
                    Title: {sourceData.title ? `"${sourceData.title.substring(0, 30)}..."` : 'empty'}
                  </div>
                  <div className={sourceData.excerpt ? 'text-green-600' : 'text-gray-400'}>
                    {sourceData.excerpt ? <Check className="w-3 h-3 inline mr-1" /> : '○ '}
                    Excerpt: {sourceData.excerpt ? `${sourceData.excerpt.length} chars` : 'empty'}
                  </div>
                  <div className={sourceData.content ? 'text-green-600' : 'text-gray-400'}>
                    {sourceData.content ? <Check className="w-3 h-3 inline mr-1" /> : '○ '}
                    Content: {sourceData.content ? `${sourceData.content.length} chars` : 'empty'}
                  </div>
                  <div className={sourceData.seoTitle ? 'text-green-600' : 'text-gray-400'}>
                    {sourceData.seoTitle ? <Check className="w-3 h-3 inline mr-1" /> : '○ '}
                    SEO Title: {sourceData.seoTitle ? `${sourceData.seoTitle.length} chars` : 'will use title'}
                  </div>
                  <div className={sourceData.seoDescription ? 'text-green-600' : 'text-gray-400'}>
                    {sourceData.seoDescription ? <Check className="w-3 h-3 inline mr-1" /> : '○ '}
                    SEO Description: {sourceData.seoDescription ? `${sourceData.seoDescription.length} chars` : 'will use excerpt'}
                  </div>
                </div>

                {!sourceData.title && !sourceData.content && (
                  <p className="text-xs text-orange-600 mt-2">
                    Add content to the {translateFrom === 'ka' ? 'ქართული' : 'English'} tab first.
                  </p>
                )}
              </div>

              <Button
                type="button"
                onClick={handleTranslate}
                disabled={isTranslating || (!sourceData.title?.trim() && !sourceData.content?.trim())}
                className="w-full"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {translateProgress || 'Translating...'}
                  </>
                ) : (
                  <>
                    <Languages className="w-4 h-4 mr-2" />
                    Translate All to {translateFrom === 'ka' ? 'English' : 'ქართული'}
                  </>
                )}
              </Button>

              {translateError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {translateError}
                </div>
              )}

              {translationResult && (
                <div className="space-y-3">
                  <div className="p-3 bg-white border border-gray-200 rounded-lg">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Translated Title</h4>
                    <p className="text-sm font-medium">{translationResult.title || '(empty)'}</p>
                  </div>

                  {translationResult.excerpt && (
                    <div className="p-3 bg-white border border-gray-200 rounded-lg">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Translated Excerpt</h4>
                      <p className="text-sm">{translationResult.excerpt}</p>
                    </div>
                  )}

                  <div className="p-3 bg-white border border-gray-200 rounded-lg max-h-32 overflow-y-auto">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Translated Content</h4>
                    <div
                      className="text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: translationResult.content || '(empty)' }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-xs font-semibold text-blue-600 uppercase mb-1">SEO Title</h4>
                      <p className="text-xs">{translationResult.seoTitle || '(empty)'}</p>
                    </div>
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-xs font-semibold text-blue-600 uppercase mb-1">SEO Description</h4>
                      <p className="text-xs line-clamp-2">{translationResult.seoDescription || '(empty)'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleUseTranslation}
                      variant="primary"
                      size="sm"
                    >
                      <Type className="w-4 h-4 mr-1" />
                      Apply to {translationResult.targetLanguage === 'en' ? 'English' : 'ქართული'} Tab
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setTranslationResult(null)}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Discard
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

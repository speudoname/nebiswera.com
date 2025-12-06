'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Save,
  Eye,
  Globe,
  Tag,
  FileText,
  Settings,
  Loader2,
  ArrowLeft,
  Sparkles,
  Code,
  Type,
  Check,
  AlertCircle,
  ChevronDown,
} from 'lucide-react'
import Link from 'next/link'
import type { BlogPost, BlogPostStatus } from '@prisma/client'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { generateSlug } from '@/lib/utils/transliterate'
import { extractExcerpt } from '@/lib/utils/reading-time'
import { WebinarMediaPicker } from '@/app/admin/webinars/components/WebinarMediaPicker'
import { BlogImageManager } from './components/BlogImageManager'
import { AIAssistant } from './components/AIAssistant'

type Tab = 'content' | 'seo' | 'settings'
type Language = 'ka' | 'en'
type EditorMode = 'visual' | 'html'

interface BlogPostEditorProps {
  post?: BlogPost
}

interface UserProfile {
  name: string | null
  nameKa: string | null
  nameEn: string | null
  image: string | null
}

export function BlogPostEditor({ post }: BlogPostEditorProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>('content')
  const [activeLanguage, setActiveLanguage] = useState<Language>('ka')
  const [editorMode, setEditorMode] = useState<EditorMode>('visual')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreviewDropdown, setShowPreviewDropdown] = useState(false)
  const previewDropdownRef = useRef<HTMLDivElement>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  // Close preview dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (previewDropdownRef.current && !previewDropdownRef.current.contains(event.target as Node)) {
        setShowPreviewDropdown(false)
      }
    }
    if (showPreviewDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPreviewDropdown])

  // Form state
  const [formData, setFormData] = useState({
    // Georgian content
    titleKa: post?.titleKa || '',
    slugKa: post?.slugKa || '',
    excerptKa: post?.excerptKa || '',
    contentKa: post?.contentKa || '',
    seoTitleKa: post?.seoTitleKa || '',
    seoDescriptionKa: post?.seoDescriptionKa || '',
    ogImageKa: post?.ogImageKa || '',

    // English content
    titleEn: post?.titleEn || '',
    slugEn: post?.slugEn || '',
    excerptEn: post?.excerptEn || '',
    contentEn: post?.contentEn || '',
    seoTitleEn: post?.seoTitleEn || '',
    seoDescriptionEn: post?.seoDescriptionEn || '',
    ogImageEn: post?.ogImageEn || '',

    // Shared
    featuredImage: post?.featuredImage || '',
    featuredImageAlt: post?.featuredImageAlt || '',
    category: post?.category || '',
    tags: post?.tags || [],
    status: (post?.status || 'DRAFT') as BlogPostStatus,
    publishedKa: post?.publishedKa ?? false,
    publishedEn: post?.publishedEn ?? false,
    authorName: post?.authorName || '',
    authorAvatar: post?.authorAvatar || '',
  })

  const [tagInput, setTagInput] = useState('')

  // Auto-generate slug from title
  useEffect(() => {
    if (!post && formData.titleKa && !formData.slugKa) {
      const slug = generateSlug(formData.titleKa)
      setFormData((prev) => ({ ...prev, slugKa: slug }))
    }
  }, [formData.titleKa, post, formData.slugKa])

  useEffect(() => {
    if (!post && formData.titleEn && !formData.slugEn) {
      const slug = generateSlug(formData.titleEn)
      setFormData((prev) => ({ ...prev, slugEn: slug }))
    }
  }, [formData.titleEn, post, formData.slugEn])

  // Fetch user profile for author info
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile')
        if (res.ok) {
          const data = await res.json()
          setUserProfile(data)
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      }
    }
    if (session?.user) {
      fetchProfile()
    }
  }, [session])

  // Auto-populate author info from user profile for new posts
  useEffect(() => {
    if (!post && userProfile) {
      const authorName = activeLanguage === 'ka'
        ? (userProfile.nameKa || userProfile.name || '')
        : (userProfile.nameEn || userProfile.name || '')

      setFormData((prev) => ({
        ...prev,
        authorName: prev.authorName || authorName,
        authorAvatar: prev.authorAvatar || userProfile.image || '',
      }))
    }
  }, [userProfile, post, activeLanguage])


  const generateSeoFromContent = () => {
    // Auto-generate SEO fields from content
    if (activeLanguage === 'ka') {
      const excerpt = extractExcerpt(formData.contentKa, 160)
      setFormData((prev) => ({
        ...prev,
        seoTitleKa: prev.seoTitleKa || prev.titleKa,
        seoDescriptionKa: prev.seoDescriptionKa || excerpt,
        excerptKa: prev.excerptKa || excerpt,
      }))
    } else {
      const excerpt = extractExcerpt(formData.contentEn, 160)
      setFormData((prev) => ({
        ...prev,
        seoTitleEn: prev.seoTitleEn || prev.titleEn,
        seoDescriptionEn: prev.seoDescriptionEn || excerpt,
        excerptEn: prev.excerptEn || excerpt,
      }))
    }
  }

  const handleSave = async (newStatus?: string) => {
    setSaving(true)
    setError(null)

    try {
      const dataToSave = {
        ...formData,
        status: newStatus || formData.status,
      }

      const url = post ? `/api/admin/blog/${post.id}` : '/api/admin/blog'
      const method = post ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save post')
      }

      const savedPost = await response.json()

      if (!post) {
        router.push(`/admin/blog/${savedPost.id}`)
      } else {
        setFormData((prev) => ({ ...prev, status: savedPost.status }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const tabs = [
    { id: 'content' as Tab, label: 'Content', icon: FileText },
    { id: 'seo' as Tab, label: 'SEO', icon: Globe },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/blog"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {post ? 'Edit Post' : 'New Post'}
            </h2>
            {post && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  formData.status === 'PUBLISHED'
                    ? 'bg-green-100 text-green-700'
                    : formData.status === 'DRAFT'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {formData.status}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Preview Dropdown */}
          {formData.status === 'PUBLISHED' && (formData.slugKa || formData.slugEn) && (
            <div className="relative" ref={previewDropdownRef}>
              <button
                type="button"
                onClick={() => setShowPreviewDropdown(!showPreviewDropdown)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Eye className="w-4 h-4" />
                Preview
                <ChevronDown className="w-4 h-4" />
              </button>
              {showPreviewDropdown && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {formData.slugKa && formData.titleKa && (
                    <Link
                      href={`/blog/${formData.slugKa}`}
                      target="_blank"
                      onClick={() => setShowPreviewDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm"
                    >
                      <span className="w-6 h-6 rounded bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                        ქა
                      </span>
                      ქართული
                    </Link>
                  )}
                  {formData.slugEn && formData.titleEn && (
                    <Link
                      href={`/blog/${formData.slugEn}`}
                      target="_blank"
                      onClick={() => setShowPreviewDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm"
                    >
                      <span className="w-6 h-6 rounded bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                        EN
                      </span>
                      English
                    </Link>
                  )}
                  {!formData.slugKa && !formData.slugEn && (
                    <p className="px-4 py-2 text-sm text-gray-500">No previews available</p>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Draft
          </button>

          <button
            onClick={() => handleSave('PUBLISHED')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            Publish
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Language Toggle (for content and SEO tabs) */}
      {(activeTab === 'content' || activeTab === 'seo') && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveLanguage('ka')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeLanguage === 'ka'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ქართული
          </button>
          <button
            onClick={() => setActiveLanguage('en')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeLanguage === 'en'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            English
          </button>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title {activeLanguage === 'ka' ? '(ქართული)' : '(English)'}
            </label>
            <input
              type="text"
              value={activeLanguage === 'ka' ? formData.titleKa : formData.titleEn}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  [activeLanguage === 'ka' ? 'titleKa' : 'titleEn']: e.target.value,
                }))
              }
              placeholder={activeLanguage === 'ka' ? 'შეიყვანეთ სათაური' : 'Enter post title'}
              className="w-full px-4 py-3 text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Slug {activeLanguage === 'ka' ? '(ქართული)' : '(English)'}
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500 text-sm">
                /blog/
              </span>
              <input
                type="text"
                value={activeLanguage === 'ka' ? formData.slugKa : formData.slugEn}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [activeLanguage === 'ka' ? 'slugKa' : 'slugEn']: e.target.value,
                  }))
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excerpt {activeLanguage === 'ka' ? '(ქართული)' : '(English)'}
            </label>
            <textarea
              value={activeLanguage === 'ka' ? formData.excerptKa : formData.excerptEn}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  [activeLanguage === 'ka' ? 'excerptKa' : 'excerptEn']: e.target.value,
                }))
              }
              rows={3}
              placeholder={
                activeLanguage === 'ka'
                  ? 'მოკლე აღწერა (გამოჩნდება სიაში)'
                  : 'Short description (shown in list)'
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* AI Assistant */}
          <AIAssistant
            language={activeLanguage}
            existingContent={activeLanguage === 'ka' ? formData.contentKa : formData.contentEn}
            titleKa={formData.titleKa}
            titleEn={formData.titleEn}
            excerptKa={formData.excerptKa}
            excerptEn={formData.excerptEn}
            contentKa={formData.contentKa}
            contentEn={formData.contentEn}
            seoTitleKa={formData.seoTitleKa}
            seoTitleEn={formData.seoTitleEn}
            seoDescriptionKa={formData.seoDescriptionKa}
            seoDescriptionEn={formData.seoDescriptionEn}
            onTextGenerated={(text) => {
              setFormData((prev) => ({
                ...prev,
                [activeLanguage === 'ka' ? 'contentKa' : 'contentEn']:
                  prev[activeLanguage === 'ka' ? 'contentKa' : 'contentEn'] + text,
              }))
            }}
            onTranslated={(result) => {
              // Apply translation to ALL target language fields
              const isTargetKa = result.targetLanguage === 'ka'

              if (isTargetKa) {
                // Translating to Georgian
                setFormData((prev) => ({
                  ...prev,
                  titleKa: result.title || '',
                  excerptKa: result.excerpt || '',
                  contentKa: result.content || '',
                  seoTitleKa: result.seoTitle || '',
                  seoDescriptionKa: result.seoDescription || '',
                  slugKa: result.title ? generateSlug(result.title) : prev.slugKa,
                }))
              } else {
                // Translating to English
                setFormData((prev) => ({
                  ...prev,
                  titleEn: result.title || '',
                  excerptEn: result.excerpt || '',
                  contentEn: result.content || '',
                  seoTitleEn: result.seoTitle || '',
                  seoDescriptionEn: result.seoDescription || '',
                  slugEn: result.title ? generateSlug(result.title) : prev.slugEn,
                }))
              }
              // Switch to target language tab
              setActiveLanguage(result.targetLanguage)
            }}
            onFullArticleGenerated={(content, featuredImage) => {
              setFormData((prev) => ({
                ...prev,
                [activeLanguage === 'ka' ? 'contentKa' : 'contentEn']: content,
                ...(featuredImage ? { featuredImage } : {}),
              }))
            }}
          />

          {/* Image Manager */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images
            </label>
            <BlogImageManager />
          </div>

          {/* Editor Mode Toggle */}
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Content {activeLanguage === 'ka' ? '(ქართული)' : '(English)'}
            </label>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setEditorMode('visual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  editorMode === 'visual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Type className="w-4 h-4" />
                Visual
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('html')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  editorMode === 'html'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Code className="w-4 h-4" />
                HTML
              </button>
            </div>
          </div>

          {/* Visual Rich Text Editor */}
          {editorMode === 'visual' && (
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <RichTextEditor
                content={activeLanguage === 'ka' ? formData.contentKa : formData.contentEn}
                onChange={(content) =>
                  setFormData((prev) => ({
                    ...prev,
                    [activeLanguage === 'ka' ? 'contentKa' : 'contentEn']: content,
                  }))
                }
                placeholder={
                  activeLanguage === 'ka'
                    ? 'დაიწყეთ წერა...'
                    : 'Start writing...'
                }
                imageUploadEndpoint="/api/admin/blog-images/upload"
              />
            </div>
          )}

          {/* HTML Editor */}
          {editorMode === 'html' && (
            <div>
              <textarea
                value={activeLanguage === 'ka' ? formData.contentKa : formData.contentEn}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [activeLanguage === 'ka' ? 'contentKa' : 'contentEn']: e.target.value,
                  }))
                }
                rows={20}
                placeholder={
                  activeLanguage === 'ka'
                    ? '<!-- შეიყვანეთ HTML კოდი აქ -->'
                    : '<!-- Enter HTML code here -->'
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                spellCheck={false}
              />
              <p className="mt-2 text-xs text-gray-500">
                Write custom HTML for full control over your blog post content. Use this mode for fully custom layouts.
              </p>
            </div>
          )}
        </div>
      )}

      {/* SEO Tab */}
      {activeTab === 'seo' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={generateSeoFromContent}
              className="flex items-center gap-2 px-4 py-2 text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100"
            >
              <Sparkles className="w-4 h-4" />
              Auto-generate from content
            </button>
          </div>

          {/* SEO Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SEO Title {activeLanguage === 'ka' ? '(ქართული)' : '(English)'}
            </label>
            <input
              type="text"
              value={activeLanguage === 'ka' ? formData.seoTitleKa : formData.seoTitleEn}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  [activeLanguage === 'ka' ? 'seoTitleKa' : 'seoTitleEn']: e.target.value,
                }))
              }
              placeholder="SEO optimized title (50-60 characters)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              {(activeLanguage === 'ka' ? formData.seoTitleKa : formData.seoTitleEn).length}/60
              characters
            </p>
          </div>

          {/* SEO Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SEO Description {activeLanguage === 'ka' ? '(ქართული)' : '(English)'}
            </label>
            <textarea
              value={
                activeLanguage === 'ka' ? formData.seoDescriptionKa : formData.seoDescriptionEn
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  [activeLanguage === 'ka' ? 'seoDescriptionKa' : 'seoDescriptionEn']:
                    e.target.value,
                }))
              }
              rows={3}
              placeholder="Meta description for search engines (150-160 characters)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              {(activeLanguage === 'ka'
                ? formData.seoDescriptionKa
                : formData.seoDescriptionEn
              ).length}
              /160 characters
            </p>
          </div>

          {/* OG Image */}
          <WebinarMediaPicker
            label={`OG Image ${activeLanguage === 'ka' ? '(ქართული)' : '(English)'}`}
            value={activeLanguage === 'ka' ? formData.ogImageKa : formData.ogImageEn}
            onChange={(url) =>
              setFormData((prev) => ({
                ...prev,
                [activeLanguage === 'ka' ? 'ogImageKa' : 'ogImageEn']: url,
              }))
            }
            mediaType="images"
            contentContext={`${activeLanguage === 'ka' ? formData.titleKa : formData.titleEn}. ${activeLanguage === 'ka' ? formData.excerptKa : formData.excerptEn}`}
            hint="Image shown when shared on social media (1200x630px). Uses featured image if empty."
          />

          {/* SEO Preview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Search Preview</h4>
            <div className="bg-white p-4 rounded border border-gray-200">
              <p className="text-blue-600 text-lg hover:underline cursor-pointer">
                {(activeLanguage === 'ka' ? formData.seoTitleKa : formData.seoTitleEn) ||
                  (activeLanguage === 'ka' ? formData.titleKa : formData.titleEn) ||
                  'Page Title'}
              </p>
              <p className="text-green-700 text-sm">
                nebiswera.com/blog/
                {activeLanguage === 'ka' ? formData.slugKa : formData.slugEn || 'post-url'}
              </p>
              <p className="text-gray-600 text-sm mt-1">
                {(activeLanguage === 'ka'
                  ? formData.seoDescriptionKa
                  : formData.seoDescriptionEn) ||
                  'Meta description will appear here...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Featured Image */}
          <WebinarMediaPicker
            label="Featured Image"
            value={formData.featuredImage}
            onChange={(url) => setFormData((prev) => ({ ...prev, featuredImage: url }))}
            mediaType="images"
            contentContext={`${formData.titleKa || formData.titleEn}. ${formData.excerptKa || formData.excerptEn}`}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Featured Image Alt Text
            </label>
            <input
              type="text"
              value={formData.featuredImageAlt}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, featuredImageAlt: e.target.value }))
              }
              placeholder="Describe the image for accessibility"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              placeholder="e.g., Psychology, Self-Development"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-2" />
              Tags
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add a tag"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={addTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-primary-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Author */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Author Name</label>
              <input
                type="text"
                value={formData.authorName}
                onChange={(e) => setFormData((prev) => ({ ...prev, authorName: e.target.value }))}
                placeholder="Author name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Author Avatar URL
              </label>
              <input
                type="text"
                value={formData.authorAvatar}
                onChange={(e) => setFormData((prev) => ({ ...prev, authorAvatar: e.target.value }))}
                placeholder="https://..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Publishing Status */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Publishing Status</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Georgian publish toggle */}
              <div className={`p-3 rounded-lg border-2 transition-colors ${
                formData.publishedKa
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="block font-medium text-gray-900">ქართული</span>
                    <span className="text-xs text-gray-500">
                      {formData.titleKa ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Content ready
                        </span>
                      ) : (
                        <span className="text-orange-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> No content
                        </span>
                      )}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.publishedKa}
                    onChange={(e) => setFormData((prev) => ({ ...prev, publishedKa: e.target.checked }))}
                    disabled={!formData.titleKa}
                    className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50"
                  />
                </label>
              </div>

              {/* English publish toggle */}
              <div className={`p-3 rounded-lg border-2 transition-colors ${
                formData.publishedEn
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="block font-medium text-gray-900">English</span>
                    <span className="text-xs text-gray-500">
                      {formData.titleEn ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Content ready
                        </span>
                      ) : (
                        <span className="text-orange-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> No content
                        </span>
                      )}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.publishedEn}
                    onChange={(e) => setFormData((prev) => ({ ...prev, publishedEn: e.target.checked }))}
                    disabled={!formData.titleEn}
                    className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Overall Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as BlogPostStatus }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.status === 'PUBLISHED'
                  ? `Post is live. ${formData.publishedKa ? 'Georgian' : ''} ${formData.publishedKa && formData.publishedEn ? '&' : ''} ${formData.publishedEn ? 'English' : ''} ${!formData.publishedKa && !formData.publishedEn ? 'No languages enabled - enable at least one above' : 'version(s) visible'}`
                  : formData.status === 'DRAFT'
                    ? 'Post is not visible to public'
                    : 'Post is archived and not visible'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

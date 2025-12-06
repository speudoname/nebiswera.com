'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Card } from '@/components/ui'
import { Save, Loader2 } from 'lucide-react'
import { WebinarMediaPicker } from '../WebinarMediaPicker'
import { TemplateSelector, type LandingPageTemplate } from '../TemplateSelector'
import { RichTextEditor, type RichTextPart } from '../RichTextEditor'

// Content Alignment type
type ContentAlignment = 'LEFT' | 'CENTER' | 'RIGHT'

// Section 2 Item interface
interface Section2Item {
  headline: string
  subheadline: string
  paragraph: string
}

// Landing Page Config Interface
interface LandingPageConfig {
  template: LandingPageTemplate
  logoType: 'TEXT' | 'IMAGE'
  logoText?: string
  logoImageUrl?: string
  heroEyebrow?: string
  heroTitle?: string
  heroTitleParts?: RichTextPart[] | null
  heroSubtitle?: string
  heroSubtitleParts?: RichTextPart[] | null
  heroParagraph?: string
  heroButtonText?: string
  heroBelowButtonText?: string
  heroButtonStyle: 'POPUP_FORM' | 'INLINE_EMAIL' | 'EXPAND_FORM'
  heroMediaType: 'IMAGE' | 'VIDEO'
  heroImageUrl?: string
  heroVideoUrl?: string
  heroImagePlacement: 'LEFT' | 'RIGHT' | 'BACKGROUND' | 'NONE'
  heroAlignment: ContentAlignment
  section2Title?: string
  section2Items: Section2Item[]
  section2CtaText?: string
  section2SubCtaText?: string
  section2ButtonText?: string
  section2ButtonStyle: 'POPUP_FORM' | 'INLINE_EMAIL' | 'EXPAND_FORM'
  section2ImagePlacement: 'LEFT' | 'RIGHT' | 'BACKGROUND' | 'NONE'
  section2Alignment: ContentAlignment
  presenterImageUrl?: string
  presenterImageShape: 'CIRCLE' | 'SQUARE'
  footerDisclaimerText?: string
  primaryColor?: string
  backgroundColor?: string
}

function getDefaultConfig(): LandingPageConfig {
  return {
    template: 'IMAGE_RIGHT',
    logoType: 'TEXT',
    logoText: ':::...ნებისწერა...:::',
    heroButtonStyle: 'POPUP_FORM',
    heroMediaType: 'IMAGE',
    heroImagePlacement: 'RIGHT',
    heroAlignment: 'LEFT',
    heroTitleParts: null,
    heroSubtitleParts: null,
    section2Items: [
      { headline: '', subheadline: '', paragraph: '' },
      { headline: '', subheadline: '', paragraph: '' },
      { headline: '', subheadline: '', paragraph: '' },
    ],
    section2ButtonStyle: 'POPUP_FORM',
    section2ImagePlacement: 'RIGHT',
    section2Alignment: 'LEFT',
    presenterImageShape: 'CIRCLE',
  }
}

interface LandingPageTabProps {
  webinarId: string
}

export function LandingPageTab({ webinarId }: LandingPageTabProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<LandingPageConfig | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch(`/api/admin/webinars/${webinarId}/landing-page`)
        if (res.ok) {
          const data = await res.json()
          setConfig(data.config || getDefaultConfig())
        } else if (res.status === 404) {
          setConfig(getDefaultConfig())
        } else {
          throw new Error('Failed to fetch landing page config')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load landing page config')
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [webinarId])

  const handleSave = async () => {
    if (!config) return

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const res = await fetch(`/api/admin/webinars/${webinarId}/landing-page`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save landing page config')
      }

      const data = await res.json()
      setConfig(data.config)
      setSuccessMessage('Landing page saved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof LandingPageConfig, value: unknown) => {
    if (!config) return
    setConfig({ ...config, [field]: value })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  if (error && !config) {
    return <div className="text-center py-12 text-red-600">{error}</div>
  }

  if (!config) return null

  return (
    <div className="space-y-8">
      {/* Success message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-neu text-green-700">
          {successMessage}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-neu text-red-700">{error}</div>
      )}

      {/* Template Selection */}
      <Card variant="raised" padding="md">
        <h3 className="text-lg font-semibold mb-4">Template Layout</h3>
        <p className="text-sm text-text-muted mb-4">
          Choose how your landing page is structured. Each template has a unique design.
        </p>
        <TemplateSelector
          value={config.template}
          onChange={(template) => handleChange('template', template)}
          primaryColor={config.primaryColor}
        />
      </Card>

      {/* Header / Logo */}
      <Card variant="raised" padding="md">
        <h3 className="text-lg font-semibold mb-4">Header / Logo</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="logoType"
                checked={config.logoType === 'TEXT'}
                onChange={() => handleChange('logoType', 'TEXT')}
                className="accent-primary-500"
              />
              Text Logo
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="logoType"
                checked={config.logoType === 'IMAGE'}
                onChange={() => handleChange('logoType', 'IMAGE')}
                className="accent-primary-500"
              />
              Image Logo
            </label>
          </div>
          {config.logoType === 'TEXT' ? (
            <Input
              label="Logo Text"
              value={config.logoText || ''}
              onChange={(e) => handleChange('logoText', e.target.value)}
              placeholder=":::...ნებისწერა...:::"
            />
          ) : (
            <Input
              label="Logo Image URL"
              value={config.logoImageUrl || ''}
              onChange={(e) => handleChange('logoImageUrl', e.target.value)}
              placeholder="https://..."
            />
          )}
        </div>
      </Card>

      {/* Section 1: Hero / Above the Fold */}
      <Card variant="raised" padding="md">
        <h3 className="text-lg font-semibold mb-4">Section 1: Above the Fold (Hero)</h3>
        <div className="space-y-4">
          {/* Hero Alignment Selector */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Text Alignment
            </label>
            <div className="flex gap-4">
              {(['LEFT', 'CENTER', 'RIGHT'] as ContentAlignment[]).map((alignment) => (
                <label key={alignment} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="heroAlignment"
                    checked={config.heroAlignment === alignment}
                    onChange={() => handleChange('heroAlignment', alignment)}
                    className="accent-primary-500"
                  />
                  {alignment === 'LEFT' && 'Left'}
                  {alignment === 'CENTER' && 'Center'}
                  {alignment === 'RIGHT' && 'Right'}
                </label>
              ))}
            </div>
          </div>

          <Input
            label="Eyebrow"
            value={config.heroEyebrow || ''}
            onChange={(e) => handleChange('heroEyebrow', e.target.value)}
            placeholder="Small text above title"
          />

          {/* Rich Text Title */}
          <RichTextEditor
            label="Title (Rich Text)"
            value={config.heroTitleParts || null}
            plainValue={config.heroTitle || null}
            onChange={(parts) => handleChange('heroTitleParts', parts)}
            onPlainChange={(text) => handleChange('heroTitle', text)}
            placeholder="Main headline - use **bold**, *italic*, {{primary:colored}}"
            primaryColor={config.primaryColor}
          />

          {/* Rich Text Subtitle */}
          <RichTextEditor
            label="Subtitle (Rich Text)"
            value={config.heroSubtitleParts || null}
            plainValue={config.heroSubtitle || null}
            onChange={(parts) => handleChange('heroSubtitleParts', parts)}
            onPlainChange={(text) => handleChange('heroSubtitle', text)}
            placeholder="Secondary headline - use **bold**, *italic*, {{primary:colored}}"
            primaryColor={config.primaryColor}
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Paragraph</label>
            <textarea
              value={config.heroParagraph || ''}
              onChange={(e) => handleChange('heroParagraph', e.target.value)}
              placeholder="Descriptive paragraph..."
              rows={4}
              className="w-full px-4 py-3 rounded-neu bg-white shadow-neu-inset border-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Input
            label="Button Text"
            value={config.heroButtonText || ''}
            onChange={(e) => handleChange('heroButtonText', e.target.value)}
            placeholder="Register Now"
          />
          <Input
            label="Text Below Button"
            value={config.heroBelowButtonText || ''}
            onChange={(e) => handleChange('heroBelowButtonText', e.target.value)}
            placeholder="Limited spots available"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Button Style</label>
            <div className="flex gap-4 flex-wrap">
              {(['POPUP_FORM', 'INLINE_EMAIL', 'EXPAND_FORM'] as const).map((style) => (
                <label key={style} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="heroButtonStyle"
                    checked={config.heroButtonStyle === style}
                    onChange={() => handleChange('heroButtonStyle', style)}
                    className="accent-primary-500"
                  />
                  {style === 'POPUP_FORM' && 'Popup Form'}
                  {style === 'INLINE_EMAIL' && 'Inline Email'}
                  {style === 'EXPAND_FORM' && 'Expand Form'}
                </label>
              ))}
            </div>
          </div>
          {/* Hero Media Type Selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Hero Media Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="heroMediaType"
                  checked={config.heroMediaType === 'IMAGE'}
                  onChange={() => handleChange('heroMediaType', 'IMAGE')}
                  className="accent-primary-500"
                />
                Image
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="heroMediaType"
                  checked={config.heroMediaType === 'VIDEO'}
                  onChange={() => handleChange('heroMediaType', 'VIDEO')}
                  className="accent-primary-500"
                />
                Video
              </label>
            </div>
          </div>

          {/* Hero Media Picker */}
          {config.heroMediaType === 'IMAGE' ? (
            <WebinarMediaPicker
              label="Hero Image"
              value={config.heroImageUrl || null}
              onChange={(url) => handleChange('heroImageUrl', url)}
              mediaType="images"
            />
          ) : (
            <WebinarMediaPicker
              label="Hero Video"
              value={config.heroVideoUrl || null}
              onChange={(url) => handleChange('heroVideoUrl', url)}
              mediaType="videos"
            />
          )}
        </div>
      </Card>

      {/* Section 2: Below the Fold */}
      <Card variant="raised" padding="md">
        <h3 className="text-lg font-semibold mb-4">Section 2: Below the Fold</h3>
        <div className="space-y-4">
          {/* Section 2 Layout Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Text Alignment
              </label>
              <div className="flex gap-3">
                {(['LEFT', 'CENTER', 'RIGHT'] as ContentAlignment[]).map((alignment) => (
                  <label key={alignment} className="flex items-center gap-1 text-sm">
                    <input
                      type="radio"
                      name="section2Alignment"
                      checked={config.section2Alignment === alignment}
                      onChange={() => handleChange('section2Alignment', alignment)}
                      className="accent-primary-500"
                    />
                    {alignment === 'LEFT' && 'Left'}
                    {alignment === 'CENTER' && 'Center'}
                    {alignment === 'RIGHT' && 'Right'}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Image Placement
              </label>
              <div className="flex gap-3">
                {(['LEFT', 'RIGHT', 'NONE'] as const).map((placement) => (
                  <label key={placement} className="flex items-center gap-1 text-sm">
                    <input
                      type="radio"
                      name="section2ImagePlacement"
                      checked={config.section2ImagePlacement === placement}
                      onChange={() => handleChange('section2ImagePlacement', placement)}
                      className="accent-primary-500"
                    />
                    {placement === 'LEFT' && 'Left'}
                    {placement === 'RIGHT' && 'Right'}
                    {placement === 'NONE' && 'None'}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <Input
            label="Section Title"
            value={config.section2Title || ''}
            onChange={(e) => handleChange('section2Title', e.target.value)}
            placeholder="What you'll learn"
          />

          {/* List Items */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              List Items (3-9 items with headline, subheadline, paragraph)
            </label>
            <Section2ItemsEditor
              items={config.section2Items || []}
              onChange={(items) => handleChange('section2Items', items)}
            />
          </div>

          <Input
            label="CTA Text"
            value={config.section2CtaText || ''}
            onChange={(e) => handleChange('section2CtaText', e.target.value)}
            placeholder="Join us on..."
          />
          <Input
            label="Sub-CTA Text"
            value={config.section2SubCtaText || ''}
            onChange={(e) => handleChange('section2SubCtaText', e.target.value)}
            placeholder="December 15, 2024 at 6:00 PM"
          />
          <Input
            label="Button Text"
            value={config.section2ButtonText || ''}
            onChange={(e) => handleChange('section2ButtonText', e.target.value)}
            placeholder="Reserve Your Spot"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Button Style</label>
            <div className="flex gap-4 flex-wrap">
              {(['POPUP_FORM', 'INLINE_EMAIL', 'EXPAND_FORM'] as const).map((style) => (
                <label key={style} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="section2ButtonStyle"
                    checked={config.section2ButtonStyle === style}
                    onChange={() => handleChange('section2ButtonStyle', style)}
                    className="accent-primary-500"
                  />
                  {style === 'POPUP_FORM' && 'Popup Form'}
                  {style === 'INLINE_EMAIL' && 'Inline Email'}
                  {style === 'EXPAND_FORM' && 'Expand Form'}
                </label>
              ))}
            </div>
          </div>
          <WebinarMediaPicker
            label="Presenter Image"
            value={config.presenterImageUrl || null}
            onChange={(url) => handleChange('presenterImageUrl', url)}
            mediaType="images"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Presenter Image Shape
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="presenterImageShape"
                  checked={config.presenterImageShape === 'CIRCLE'}
                  onChange={() => handleChange('presenterImageShape', 'CIRCLE')}
                  className="accent-primary-500"
                />
                Circle
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="presenterImageShape"
                  checked={config.presenterImageShape === 'SQUARE'}
                  onChange={() => handleChange('presenterImageShape', 'SQUARE')}
                  className="accent-primary-500"
                />
                Square
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <Card variant="raised" padding="md">
        <h3 className="text-lg font-semibold mb-4">Footer</h3>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Disclaimer Text
          </label>
          <textarea
            value={config.footerDisclaimerText || ''}
            onChange={(e) => handleChange('footerDisclaimerText', e.target.value)}
            placeholder="Legal disclaimer or copyright notice..."
            rows={3}
            className="w-full px-4 py-3 rounded-neu bg-white shadow-neu-inset border-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Landing Page
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// Section 2 Items Editor Component
function Section2ItemsEditor({
  items,
  onChange,
}: {
  items: Section2Item[]
  onChange: (items: Section2Item[]) => void
}) {
  const addItem = () => {
    if (items.length >= 9) return
    onChange([...items, { headline: '', subheadline: '', paragraph: '' }])
  }

  const removeItem = (index: number) => {
    if (items.length <= 3) return
    onChange(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof Section2Item, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    onChange(newItems)
  }

  // Ensure we have at least 3 items
  const displayItems =
    items.length < 3
      ? [...items, ...Array(3 - items.length).fill({ headline: '', subheadline: '', paragraph: '' })]
      : items

  return (
    <div className="space-y-4">
      {displayItems.map((item, index) => (
        <div key={index} className="p-4 bg-neu-base rounded-neu space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-text-muted">Item {index + 1}</span>
            {items.length > 3 && (
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-red-500 text-sm hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>
          <Input
            label="Headline"
            value={item.headline}
            onChange={(e) => updateItem(index, 'headline', e.target.value)}
            placeholder="Main point"
          />
          <Input
            label="Subheadline"
            value={item.subheadline}
            onChange={(e) => updateItem(index, 'subheadline', e.target.value)}
            placeholder="Supporting text"
          />
          <textarea
            value={item.paragraph}
            onChange={(e) => updateItem(index, 'paragraph', e.target.value)}
            placeholder="Detailed description..."
            rows={2}
            className="w-full px-4 py-3 rounded-neu bg-white shadow-neu-inset border-0 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
      ))}
      {items.length < 9 && (
        <button
          type="button"
          onClick={addItem}
          className="w-full py-2 text-primary-600 hover:text-primary-800 font-medium text-sm border-2 border-dashed border-gray-300 rounded-neu hover:border-primary-400 transition-colors"
        >
          + Add Item
        </button>
      )}
    </div>
  )
}

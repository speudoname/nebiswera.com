'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { Users, Loader2, RefreshCw } from 'lucide-react'
import { CampaignData } from './CampaignEditor'

interface Step3AudienceProps {
  data: CampaignData
  onUpdate: (updates: Partial<CampaignData>) => void
}

interface Tag {
  id: string
  name: string
  color: string
  _count: { contacts: number }
}

interface Segment {
  id: string
  name: string
  description: string | null
  contactCount: number
  filters?: any
}

export function Step3Audience({ data, onUpdate }: Step3AudienceProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [estimating, setEstimating] = useState(false)
  const [estimatedCount, setEstimatedCount] = useState<number | null>(null)

  useEffect(() => {
    fetchTagsAndSegments()
  }, [])

  useEffect(() => {
    // Auto-estimate when target type or criteria changes
    if (data.targetType) {
      estimateRecipients()
    }
  }, [data.targetType, data.targetCriteria])

  const fetchTagsAndSegments = async () => {
    setLoading(true)
    try {
      const [tagsRes, segmentsRes] = await Promise.all([
        fetch('/api/admin/contacts/tags'),
        fetch('/api/admin/contacts/segments'),
      ])

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json()
        setTags(tagsData)
      }

      if (segmentsRes.ok) {
        const segmentsData = await segmentsRes.json()
        setSegments(segmentsData)
      }
    } catch (error) {
      console.error('Failed to fetch tags/segments:', error)
    } finally {
      setLoading(false)
    }
  }

  const estimateRecipients = async () => {
    setEstimating(true)
    try {
      const params = new URLSearchParams()
      params.set('targetType', data.targetType)
      if (data.targetCriteria) {
        params.set('targetCriteria', JSON.stringify(data.targetCriteria))
      }

      const res = await fetch(`/api/admin/campaigns/_preview?${params}`)
      if (res.ok) {
        const result = await res.json()
        setEstimatedCount(result.count)
      }
    } catch (error) {
      console.error('Failed to estimate recipients:', error)
    } finally {
      setEstimating(false)
    }
  }

  const handleTargetTypeChange = (type: CampaignData['targetType']) => {
    onUpdate({
      targetType: type,
      targetCriteria: null,
    })
    setEstimatedCount(null)
  }

  const handleTagSelection = (tagId: string) => {
    onUpdate({
      targetCriteria: { tagId },
    })
  }

  const handleSegmentSelection = (segmentId: string) => {
    const segment = segments.find((s) => s.id === segmentId)
    onUpdate({
      targetCriteria: { segmentId, filters: segment?.filters || {} },
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Select Audience</h2>
        <p className="text-text-muted">
          Choose who will receive this campaign
        </p>
      </div>

      {/* Target Type Selection */}
      <div>
        <label className="block text-body-sm font-medium text-secondary mb-3">
          Target Type *
        </label>
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 bg-neu-base rounded-neu cursor-pointer hover:bg-neu-dark/30 transition-colors">
            <input
              type="radio"
              name="targetType"
              value="ALL_CONTACTS"
              checked={data.targetType === 'ALL_CONTACTS'}
              onChange={() => handleTargetTypeChange('ALL_CONTACTS')}
              className="mt-1"
            />
            <div>
              <div className="font-medium text-text-primary">All Subscribed Contacts</div>
              <div className="text-sm text-text-muted">
                Send to everyone with marketingStatus = SUBSCRIBED
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 bg-neu-base rounded-neu cursor-pointer hover:bg-neu-dark/30 transition-colors">
            <input
              type="radio"
              name="targetType"
              value="REGISTERED_USERS"
              checked={data.targetType === 'REGISTERED_USERS'}
              onChange={() => handleTargetTypeChange('REGISTERED_USERS')}
              className="mt-1"
            />
            <div>
              <div className="font-medium text-text-primary">Registered Users Only</div>
              <div className="text-sm text-text-muted">
                Send only to contacts with user accounts
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 bg-neu-base rounded-neu cursor-pointer hover:bg-neu-dark/30 transition-colors">
            <input
              type="radio"
              name="targetType"
              value="TAG"
              checked={data.targetType === 'TAG'}
              onChange={() => handleTargetTypeChange('TAG')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-text-primary">Specific Tag</div>
              <div className="text-sm text-text-muted mb-3">
                Send to contacts with a specific tag
              </div>
              {data.targetType === 'TAG' && (
                <select
                  value={data.targetCriteria?.tagId || ''}
                  onChange={(e) => handleTagSelection(e.target.value)}
                  className="block w-full rounded-neu border-2 border-transparent bg-white px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                >
                  <option value="">Select a tag...</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name} ({tag._count.contacts} contacts)
                    </option>
                  ))}
                </select>
              )}
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 bg-neu-base rounded-neu cursor-pointer hover:bg-neu-dark/30 transition-colors">
            <input
              type="radio"
              name="targetType"
              value="SEGMENT"
              checked={data.targetType === 'SEGMENT'}
              onChange={() => handleTargetTypeChange('SEGMENT')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-text-primary">Saved Segment</div>
              <div className="text-sm text-text-muted mb-3">
                Use a pre-configured segment with filters
              </div>
              {data.targetType === 'SEGMENT' && (
                <select
                  value={data.targetCriteria?.segmentId || ''}
                  onChange={(e) => handleSegmentSelection(e.target.value)}
                  className="block w-full rounded-neu border-2 border-transparent bg-white px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                >
                  <option value="">Select a segment...</option>
                  {segments.map((segment) => (
                    <option key={segment.id} value={segment.id}>
                      {segment.name} ({segment.contactCount} contacts)
                    </option>
                  ))}
                </select>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Estimated Recipients */}
      <div className="bg-primary-50 border-2 border-primary-200 rounded-neu p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center bg-primary-100 rounded-full">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <div className="text-sm text-text-muted">Estimated Recipients</div>
              {estimating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                  <span className="text-sm text-text-muted">Calculating...</span>
                </div>
              ) : estimatedCount !== null ? (
                <div className="text-3xl font-bold text-primary-600">
                  {estimatedCount.toLocaleString()}
                </div>
              ) : (
                <div className="text-lg text-text-muted">-</div>
              )}
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={estimateRecipients}
            disabled={estimating}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${estimating ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <p className="text-xs text-text-muted mt-3">
          Only subscribed contacts will receive the campaign. Suppressed and unsubscribed contacts are automatically excluded.
        </p>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-neu p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">🎯 Targeting Tips</h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Use segments to combine multiple filters (status, source, tags, etc.)</li>
          <li>• Tag-based campaigns are perfect for specific interest groups</li>
          <li>• Registered users campaigns work well for product updates</li>
          <li>• Test with a small segment before sending to everyone</li>
        </ul>
      </div>
    </div>
  )
}

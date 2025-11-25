'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input } from '@/components/ui'
import { TagBadge } from '@/components/admin'
import { ArrowLeft, Loader2, Link2, User } from 'lucide-react'

interface Tag {
  id: string
  name: string
  color: string
}

interface Contact {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  source: string
  sourceDetails: string | null
  status: 'ACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED' | 'ARCHIVED'
  notes: string | null
  createdAt: string
  updatedAt: string
  tags: Tag[]
  user?: {
    id: string
    name: string | null
    email: string
  } | null
}

export default function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    source: '',
    sourceDetails: '',
    status: 'ACTIVE' as 'ACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED' | 'ARCHIVED',
    notes: '',
  })
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contactRes, tagsRes] = await Promise.all([
          fetch(`/api/admin/contacts/${id}`),
          fetch('/api/admin/contacts/tags'),
        ])

        if (!contactRes.ok) {
          setError('Contact not found')
          return
        }

        const contactData = await contactRes.json()
        const tagsData = await tagsRes.json()

        setContact(contactData)
        setAllTags(tagsData)
        setFormData({
          email: contactData.email,
          firstName: contactData.firstName || '',
          lastName: contactData.lastName || '',
          phone: contactData.phone || '',
          source: contactData.source,
          sourceDetails: contactData.sourceDetails || '',
          status: contactData.status,
          notes: contactData.notes || '',
        })
        setSelectedTags(contactData.tags.map((t: Tag) => t.id))
      } catch (err) {
        setError('Failed to load contact')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tagIds: selectedTags,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setContact(updated)
        setSuccess('Contact updated successfully')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to update contact')
      }
    } catch (err) {
      setError('Failed to update contact')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  if (error && !contact) {
    return (
      <div>
        <Link
          href="/admin/contacts"
          className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Contacts
        </Link>
        <div className="bg-red-50 text-red-600 p-4 rounded-neu">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div>
      <Link
        href="/admin/contacts"
        className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Contacts
      </Link>

      <div className="flex items-center justify-between mb-8">
        <h1 className="no-margin">Edit Contact</h1>
        {contact?.user && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-neu text-sm text-primary-700">
            <Link2 className="w-4 h-4" />
            Linked to user: {contact.user.name || contact.user.email}
          </div>
        )}
      </div>

      <div className="bg-neu-light rounded-neu shadow-neu p-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-neu text-sm mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-neu text-sm mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email *"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              id="phone"
              name="phone"
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <Input
              id="firstName"
              name="firstName"
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />

            <Input
              id="lastName"
              name="lastName"
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />

            <div>
              <label className="block text-body-sm font-medium text-secondary mb-1">
                Source *
              </label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                required
              >
                <option value="manual">Manual</option>
                <option value="newsletter">Newsletter</option>
                <option value="webinar">Webinar</option>
                <option value="import">Import</option>
                <option value="website">Website</option>
              </select>
            </div>

            <Input
              id="sourceDetails"
              name="sourceDetails"
              label="Source Details"
              placeholder="e.g., Webinar name"
              value={formData.sourceDetails}
              onChange={(e) => setFormData({ ...formData, sourceDetails: e.target.value })}
            />

            <div>
              <label className="block text-body-sm font-medium text-secondary mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
              >
                <option value="ACTIVE">Active</option>
                <option value="UNSUBSCRIBED">Unsubscribed</option>
                <option value="BOUNCED">Bounced</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-secondary mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-neu-base rounded-neu shadow-neu-inset min-h-[50px]">
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    if (selectedTags.includes(tag.id)) {
                      setSelectedTags(selectedTags.filter((t) => t !== tag.id))
                    } else {
                      setSelectedTags([...selectedTags, tag.id])
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    selectedTags.includes(tag.id)
                      ? 'ring-2 ring-offset-1'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                    ['--tw-ring-color' as string]: tag.color,
                  } as React.CSSProperties}
                >
                  {tag.name}
                </button>
              ))}
              {allTags.length === 0 && (
                <span className="text-text-muted text-sm">
                  No tags available.{' '}
                  <Link href="/admin/contacts/tags" className="text-primary-600 hover:underline">
                    Create some tags
                  </Link>
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-secondary mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neu-dark">
            <div className="text-sm text-text-muted">
              Created: {contact && new Date(contact.createdAt).toLocaleString()}
              <br />
              Updated: {contact && new Date(contact.updatedAt).toLocaleString()}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/admin/contacts')}
              >
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

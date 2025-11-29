'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Badge, Input, Modal } from '@/components/ui'
import { TagBadge } from '@/components/admin'
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Link2,
  Edit2,
  Trash2,
  AlertTriangle,
  Loader2,
  Tag,
  Plus,
  Clock,
  User,
  FileText,
  Send,
  Eye,
  AlertCircle,
  Check,
} from 'lucide-react'

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

interface Activity {
  id: string
  type: string
  description: string
  metadata: Record<string, unknown> | null
  createdAt: string
  createdBy: string | null
}

interface Email {
  id: string
  messageId: string
  to: string
  subject: string
  type: string
  status: string
  sentAt: string
  deliveredAt: string | null
  openedAt: string | null
  bouncedAt: string | null
}

const statusConfig = {
  ACTIVE: { variant: 'success' as const, label: 'Active' },
  UNSUBSCRIBED: { variant: 'warning' as const, label: 'Unsubscribed' },
  BOUNCED: { variant: 'error' as const, label: 'Bounced' },
  ARCHIVED: { variant: 'default' as const, label: 'Archived' },
}

const activityIcons: Record<string, typeof Clock> = {
  CREATED: User,
  UPDATED: Edit2,
  TAG_ADDED: Tag,
  TAG_REMOVED: Tag,
  STATUS_CHANGED: AlertCircle,
  EMAIL_SENT: Send,
  EMAIL_OPENED: Eye,
  EMAIL_BOUNCED: AlertCircle,
  IMPORTED: FileText,
  NOTE_ADDED: FileText,
}

export default function ContactProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const resolvedParams = use(params)
  const contactId = resolvedParams.id

  const [contact, setContact] = useState<Contact | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [emails, setEmails] = useState<Email[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'activity' | 'emails'>('activity')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [tagModalOpen, setTagModalOpen] = useState(false)

  const fetchContact = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/contacts/${contactId}`)
      if (!res.ok) throw new Error('Failed to fetch contact')
      const data = await res.json()
      setContact(data)
    } catch (error) {
      console.error('Failed to fetch contact:', error)
    }
  }, [contactId])

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/contacts/${contactId}/activity`)
      if (!res.ok) throw new Error('Failed to fetch activities')
      const data = await res.json()
      setActivities(data.activities)
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    }
  }, [contactId])

  const fetchEmails = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/contacts/${contactId}/emails`)
      if (!res.ok) throw new Error('Failed to fetch emails')
      const data = await res.json()
      setEmails(data.emails)
    } catch (error) {
      console.error('Failed to fetch emails:', error)
    }
  }, [contactId])

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/contacts/tags')
      if (!res.ok) throw new Error('Failed to fetch tags')
      const data = await res.json()
      setAllTags(data)
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchContact(), fetchActivities(), fetchEmails(), fetchTags()]).finally(
      () => setLoading(false)
    )
  }, [fetchContact, fetchActivities, fetchEmails, fetchTags])

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/contacts/${contactId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.push('/admin/contacts')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete contact')
      }
    } catch (error) {
      console.error('Failed to delete contact:', error)
      alert('Failed to delete contact')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">Contact not found</p>
        <Link href="/admin/contacts">
          <Button variant="secondary" className="mt-4">
            Back to Contacts
          </Button>
        </Link>
      </div>
    )
  }

  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ')
  const statusInfo = statusConfig[contact.status]

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/contacts"
          className="inline-flex items-center text-sm text-text-muted hover:text-text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Contacts
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold text-xl">
                {fullName?.[0]?.toUpperCase() || contact.email[0].toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="no-margin">{fullName || 'No name'}</h1>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                {contact.user && (
                  <span title="Linked to user" className="text-primary-500">
                    <Link2 className="w-5 h-5" />
                  </span>
                )}
              </div>
              <p className="text-text-muted no-margin">{contact.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditModalOpen(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Info */}
        <div className="space-y-6">
          {/* Contact Info Card */}
          <div className="bg-neu-light rounded-neu shadow-neu p-6">
            <h3 className="mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-text-muted" />
                <span className="text-sm">{contact.email}</span>
              </div>
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-text-muted" />
                  <span className="text-sm">{contact.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-text-muted" />
                <span className="text-sm">
                  Added {new Date(contact.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Source Card */}
          <div className="bg-neu-light rounded-neu shadow-neu p-6">
            <h3 className="mb-4">Source</h3>
            <p className="text-sm font-medium">{contact.source}</p>
            {contact.sourceDetails && (
              <p className="text-sm text-text-muted mt-1">{contact.sourceDetails}</p>
            )}
          </div>

          {/* Tags Card */}
          <div className="bg-neu-light rounded-neu shadow-neu p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="no-margin">Tags</h3>
              <button
                onClick={() => setTagModalOpen(true)}
                className="text-primary-600 hover:text-primary-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {contact.tags.length > 0 ? (
                contact.tags.map((tag) => (
                  <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                ))
              ) : (
                <p className="text-sm text-text-muted">No tags</p>
              )}
            </div>
          </div>

          {/* Notes Card */}
          <div className="bg-neu-light rounded-neu shadow-neu p-6">
            <h3 className="mb-4">Notes</h3>
            {contact.notes ? (
              <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
            ) : (
              <p className="text-sm text-text-muted">No notes</p>
            )}
          </div>

          {/* Linked User Card */}
          {contact.user && (
            <div className="bg-neu-light rounded-neu shadow-neu p-6">
              <h3 className="mb-4">Linked User Account</h3>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-medium text-sm">
                    {contact.user.name?.[0]?.toUpperCase() ||
                      contact.user.email[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {contact.user.name || 'No name'}
                  </p>
                  <p className="text-xs text-text-muted">{contact.user.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Activity & Emails */}
        <div className="col-span-2">
          <div className="bg-neu-light rounded-neu shadow-neu">
            {/* Tabs */}
            <div className="flex border-b border-neu-dark">
              <button
                onClick={() => setActiveTab('activity')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'activity'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Activity Timeline
              </button>
              <button
                onClick={() => setActiveTab('emails')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'emails'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Email History ({emails.length})
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'activity' ? (
                <ActivityTimeline activities={activities} />
              ) : (
                <EmailHistory emails={emails} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <EditContactModal
          contact={contact}
          allTags={allTags}
          onClose={() => setEditModalOpen(false)}
          onSuccess={() => {
            setEditModalOpen(false)
            fetchContact()
            fetchActivities()
          }}
        />
      )}

      {/* Tag Modal */}
      {tagModalOpen && (
        <ManageTagsModal
          contact={contact}
          allTags={allTags}
          onClose={() => setTagModalOpen(false)}
          onSuccess={() => {
            setTagModalOpen(false)
            fetchContact()
            fetchActivities()
          }}
        />
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Contact"
      >
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-primary-100 rounded-full">
          <AlertTriangle className="w-6 h-6 text-primary-600" />
        </div>
        <p className="text-text-secondary text-center mb-6">
          Are you sure you want to delete this contact? This action cannot be undone.
          All activity history will also be deleted.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <p className="text-text-muted text-center py-8">No activity recorded yet</p>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.type] || Clock
        return (
          <div key={activity.id} className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-neu-base rounded-full flex items-center justify-center">
                <Icon className="w-4 h-4 text-text-muted" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{activity.description}</p>
              <p className="text-xs text-text-muted mt-1">
                {new Date(activity.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EmailHistory({ emails }: { emails: Email[] }) {
  if (emails.length === 0) {
    return (
      <p className="text-text-muted text-center py-8">No emails sent to this contact</p>
    )
  }

  const statusIcons: Record<string, typeof Send> = {
    SENT: Send,
    DELIVERED: Check,
    OPENED: Eye,
    BOUNCED: AlertCircle,
    SPAM_COMPLAINT: AlertCircle,
  }

  const statusColors: Record<string, string> = {
    SENT: 'text-blue-600',
    DELIVERED: 'text-green-600',
    OPENED: 'text-purple-600',
    BOUNCED: 'text-red-600',
    SPAM_COMPLAINT: 'text-red-600',
  }

  return (
    <div className="space-y-4">
      {emails.map((email) => {
        const StatusIcon = statusIcons[email.status] || Send
        return (
          <div
            key={email.id}
            className="flex items-start gap-4 p-4 bg-neu-base rounded-neu"
          >
            <div className={`flex-shrink-0 ${statusColors[email.status] || ''}`}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{email.subject}</p>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant={email.status === 'BOUNCED' ? 'error' : 'default'}>
                  {email.status}
                </Badge>
                <span className="text-xs text-text-muted">{email.type}</span>
              </div>
              <p className="text-xs text-text-muted mt-2">
                Sent: {new Date(email.sentAt).toLocaleString()}
              </p>
              {email.openedAt && (
                <p className="text-xs text-green-600 mt-1">
                  Opened: {new Date(email.openedAt).toLocaleString()}
                </p>
              )}
              {email.bouncedAt && (
                <p className="text-xs text-red-600 mt-1">
                  Bounced: {new Date(email.bouncedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EditContactModal({
  contact,
  allTags,
  onClose,
  onSuccess,
}: {
  contact: Contact
  allTags: Tag[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    email: contact.email,
    firstName: contact.firstName || '',
    lastName: contact.lastName || '',
    phone: contact.phone || '',
    source: contact.source,
    sourceDetails: contact.sourceDetails || '',
    status: contact.status,
    notes: contact.notes || '',
  })
  const [selectedTags, setSelectedTags] = useState<string[]>(
    contact.tags.map((t) => t.id)
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tagIds: selectedTags,
        }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to update contact')
      }
    } catch (err) {
      setError('Failed to update contact')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Contact" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-neu text-sm">{error}</div>
        )}

        <Input
          id="email"
          name="email"
          type="email"
          label="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <Input
          id="phone"
          name="phone"
          label="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-body-sm font-medium text-secondary mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as Contact['status'],
                })
              }
              className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
            >
              <option value="ACTIVE">Active</option>
              <option value="UNSUBSCRIBED">Unsubscribed</option>
              <option value="BOUNCED">Bounced</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div>
            <label className="block text-body-sm font-medium text-secondary mb-1">
              Source
            </label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
            >
              <option value="manual">Manual</option>
              <option value="newsletter">Newsletter</option>
              <option value="webinar">Webinar</option>
              <option value="import">Import</option>
              <option value="website">Website</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-body-sm font-medium text-secondary mb-1">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 p-2 bg-neu-base rounded-neu shadow-neu-inset min-h-[40px]">
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
                className={`px-2 py-1 rounded-full text-xs transition-all ${
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

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function ManageTagsModal({
  contact,
  allTags,
  onClose,
  onSuccess,
}: {
  contact: Contact
  allTags: Tag[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [selectedTags, setSelectedTags] = useState<string[]>(
    contact.tags.map((t) => t.id)
  )
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagIds: selectedTags }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update tags')
      }
    } catch (error) {
      console.error('Failed to update tags:', error)
      alert('Failed to update tags')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Manage Tags">
      <div className="space-y-4">
        <p className="text-sm text-text-muted">
          Select tags to assign to this contact:
        </p>
        <div className="flex flex-wrap gap-2">
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
        </div>
        {allTags.length === 0 && (
          <p className="text-sm text-text-muted">No tags available</p>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} loading={loading}>
          Save Tags
        </Button>
      </div>
    </Modal>
  )
}

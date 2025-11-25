import { Badge } from '@/components/ui'
import { TagBadge } from './TagBadge'
import { Link2 } from 'lucide-react'

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
  status: 'ACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED' | 'ARCHIVED'
  createdAt: string
  tags: Tag[]
  user?: {
    id: string
    name: string | null
    email: string
  } | null
}

interface ContactRowProps {
  contact: Contact
  onEdit: () => void
  onDelete: () => void
  hideFirstColumn?: boolean
}

const statusConfig = {
  ACTIVE: { variant: 'success' as const, label: 'Active' },
  UNSUBSCRIBED: { variant: 'warning' as const, label: 'Unsubscribed' },
  BOUNCED: { variant: 'error' as const, label: 'Bounced' },
  ARCHIVED: { variant: 'default' as const, label: 'Archived' },
}

export function ContactRow({ contact, onEdit, onDelete, hideFirstColumn }: ContactRowProps) {
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ')
  const statusInfo = statusConfig[contact.status]

  // When hideFirstColumn is true, we render as fragment to be used inside a parent <tr>
  // Otherwise we render a full <tr>
  const content = (
    <>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-medium text-sm">
              {fullName?.[0]?.toUpperCase() || contact.email[0].toUpperCase()}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-text-primary flex items-center gap-2">
              {fullName || 'No name'}
              {contact.user && (
                <span title="Linked to user">
                  <Link2 className="w-3 h-3 text-primary-500" />
                </span>
              )}
            </div>
            <div className="text-sm text-text-muted">{contact.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
        {contact.phone || '-'}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1 max-w-xs">
          {contact.tags.length > 0 ? (
            contact.tags.map((tag) => (
              <TagBadge key={tag.id} name={tag.name} color={tag.color} />
            ))
          ) : (
            <span className="text-sm text-text-muted">-</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
        {contact.source}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
        {new Date(contact.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={onEdit}
          className="text-primary-600 hover:text-primary-700 mr-3"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="text-primary-700 hover:text-primary-800"
        >
          Delete
        </button>
      </td>
    </>
  )

  if (hideFirstColumn) {
    return content
  }

  return <tr>{content}</tr>
}

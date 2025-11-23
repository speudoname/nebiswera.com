import { Badge } from '@/components/ui'

interface EmailLog {
  id: string
  messageId: string
  to: string
  subject: string
  type: 'VERIFICATION' | 'PASSWORD_RESET' | 'WELCOME'
  status: 'SENT' | 'DELIVERED' | 'BOUNCED' | 'SPAM_COMPLAINT' | 'OPENED'
  locale: string
  sentAt: string
  deliveredAt: string | null
  openedAt: string | null
  bouncedAt: string | null
  bounceType: string | null
}

interface EmailLogRowProps {
  email: EmailLog
  onViewDetails: () => void
}

const statusVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'gray'> = {
  SENT: 'info',
  DELIVERED: 'success',
  BOUNCED: 'error',
  SPAM_COMPLAINT: 'error',
  OPENED: 'info',
}

const typeVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'gray'> = {
  VERIFICATION: 'info',
  PASSWORD_RESET: 'warning',
  WELCOME: 'success',
}

function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function EmailLogRow({ email, onViewDetails }: EmailLogRowProps) {
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{email.to}</div>
        <div className="text-sm text-gray-500 truncate max-w-xs">{email.subject}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={typeVariants[email.type]}>
          {email.type.replace('_', ' ')}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={statusVariants[email.status]}>
          {email.status.replace('_', ' ')}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(email.sentAt)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={onViewDetails}
          className="text-indigo-600 hover:text-indigo-900"
        >
          Details
        </button>
      </td>
    </tr>
  )
}

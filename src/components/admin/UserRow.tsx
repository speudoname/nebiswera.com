import { Badge } from '@/components/ui'

interface User {
  id: string
  name: string | null
  email: string
  emailVerified: string | null
  role: 'USER' | 'ADMIN'
  createdAt: string
}

interface UserRowProps {
  user: User
  onEdit: () => void
  onDelete: () => void
}

export function UserRow({ user, onEdit, onDelete }: UserRowProps) {
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-indigo-600 font-medium text-sm">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {user.name || 'No name'}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {user.emailVerified ? (
          <Badge variant="success">Verified</Badge>
        ) : (
          <Badge variant="warning">Pending</Badge>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={user.role === 'ADMIN' ? 'info' : 'gray'}>
          {user.role}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(user.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={onEdit}
          className="text-indigo-600 hover:text-indigo-900 mr-3"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-900"
        >
          Delete
        </button>
      </td>
    </tr>
  )
}

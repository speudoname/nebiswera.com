'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, Input, Modal, Pagination } from '@/components/ui'
import { FilterBar, UserRow } from '@/components/admin'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface User {
  id: string
  name: string | null
  email: string
  emailVerified: string | null
  role: 'USER' | 'ADMIN'
  createdAt: string
}

interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        status,
      })
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search, status])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchUsers()
  }

  const handleEdit = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          role: user.role,
        }),
      })
      if (res.ok) {
        setEditingUser(null)
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      alert('Failed to update user')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDeleteConfirm(null)
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('Failed to delete user')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="no-margin">Users</h1>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        onSearch={handleSearch}
        searchPlaceholder="Search by name or email..."
        filters={[
          {
            name: 'status',
            label: 'Status',
            value: status,
            onChange: (value) => {
              setStatus(value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            },
            options: [
              { value: 'all', label: 'All' },
              { value: 'verified', label: 'Verified' },
              { value: 'unverified', label: 'Unverified' },
            ],
          },
        ]}
      />

      {/* Users Table */}
      <div className="bg-white rounded-neu shadow-neu overflow-hidden">
        <table className="min-w-full divide-y divide-neu-dark">
          <thead className="bg-neu-light">
            <tr>
              <th className="px-6 py-3 text-left label-sm">User</th>
              <th className="px-6 py-3 text-left label-sm">Status</th>
              <th className="px-6 py-3 text-left label-sm">Role</th>
              <th className="px-6 py-3 text-left label-sm">Joined</th>
              <th className="px-6 py-3 text-right label-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neu-dark">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <Loader2 className="h-8 w-8 text-primary-600 animate-spin mx-auto" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onEdit={() => setEditingUser(user)}
                  onDelete={() => setDeleteConfirm(user.id)}
                />
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-neu-dark">
            <div className="flex-1 flex items-center justify-between">
              <p className="text-body-sm text-secondary no-margin">
                Showing{' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete User"
      >
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-primary-100 rounded-full">
          <AlertTriangle className="w-6 h-6 text-primary-600" />
        </div>
        <p className="text-text-secondary text-center mb-6">
          Are you sure you want to delete this user? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function EditUserModal({
  user,
  onClose,
  onSave,
}: {
  user: User
  onClose: () => void
  onSave: (user: User) => void
}) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email,
    role: user.role,
  })

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit User">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSave({ ...user, ...formData })
        }}
        className="space-y-4"
      >
        <Input
          id="name"
          name="name"
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <Input
          id="email"
          name="email"
          type="email"
          label="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <div>
          <label className="block text-body-sm font-medium text-secondary mb-1">
            Role
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'USER' | 'ADMIN' })}
            className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Modal>
  )
}

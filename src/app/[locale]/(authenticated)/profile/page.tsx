'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useTranslations, useLocale } from 'next-intl'
import { Button, Input, Modal } from '@/components/ui'

interface UserProfile {
  id: string
  name: string | null
  email: string
  emailVerified: string | null
  preferredLocale: string
  createdAt: string
}

export default function ProfilePage() {
  const t = useTranslations('profile')
  const common = useTranslations('common')
  const errors = useTranslations('auth.errors')
  const languages = useTranslations('languages')
  const locale = useLocale()
  const router = useRouter()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    preferredLocale: 'ka',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    const controller = new AbortController()

    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile', { signal: controller.signal })
        if (res.ok) {
          const data = await res.json()
          setUser(data)
          setFormData({
            name: data.name || '',
            preferredLocale: data.preferredLocale || 'ka',
          })
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
        console.error('Failed to fetch profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
    return () => controller.abort()
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const data = await res.json()
        setUser(data)
        setMessage({ type: 'success', text: t('updateSuccess') })

        if (formData.preferredLocale !== locale) {
          router.push(`/${formData.preferredLocale}/profile`)
        }
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: errors('somethingWrong') })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: errors('passwordMismatch') })
      return
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: errors('weakPassword') })
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: t('passwordChangeSuccess') })
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: errors('somethingWrong') })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch('/api/profile', { method: 'DELETE' })
      if (res.ok) {
        await signOut({ callbackUrl: '/' })
      }
    } catch (error) {
      console.error('Failed to delete account:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <main className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-600 mt-1">{t('subtitle')}</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Personal Information */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('personalInfo')}</h2>
        </div>
        <form onSubmit={handleUpdateProfile} className="px-6 py-4 space-y-4">
          <Input
            id="name"
            name="name"
            label={t('name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('email')}
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-500"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={saving} loadingText={common('loading')}>
              {common('save')}
            </Button>
          </div>
        </form>
      </div>

      {/* Language Preferences */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('preferences')}</h2>
        </div>
        <form onSubmit={handleUpdateProfile} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('language')}
            </label>
            <select
              value={formData.preferredLocale}
              onChange={(e) => setFormData({ ...formData, preferredLocale: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="ka">{languages('ka')}</option>
              <option value="en">{languages('en')}</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">{t('languageDescription')}</p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={saving} loadingText={common('loading')}>
              {common('save')}
            </Button>
          </div>
        </form>
      </div>

      {/* Security */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('security')}</h2>
        </div>
        <form onSubmit={handleChangePassword} className="px-6 py-4 space-y-4">
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            label={t('currentPassword')}
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
          />
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            label={t('newPassword')}
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
          />
          <Input
            id="confirmNewPassword"
            name="confirmNewPassword"
            type="password"
            label={t('confirmNewPassword')}
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={saving} loadingText={common('loading')}>
              {t('changePassword')}
            </Button>
          </div>
        </form>
      </div>

      {/* Account Info */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('accountInfo')}</h2>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">{t('createdAt')}</span>
            <span className="text-sm text-gray-900">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">{t('verificationStatus')}</span>
            <span className={`text-sm ${user?.emailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
              {user?.emailVerified ? t('verified') : t('notVerified')}
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white shadow rounded-lg border border-red-200">
        <div className="px-6 py-4 border-b border-red-200 bg-red-50">
          <h2 className="text-lg font-semibold text-red-700">{t('dangerZone')}</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 mb-4">{t('deleteAccountWarning')}</p>
          <Button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 hover:bg-red-700"
          >
            {t('deleteAccount')}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('deleteConfirmTitle')}
      >
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-gray-600 text-center mb-6">
          {t('deleteConfirmMessage')}
        </p>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            onClick={() => setShowDeleteConfirm(false)}
            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            {common('cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleDeleteAccount}
            className="bg-red-600 hover:bg-red-700"
          >
            {common('delete')}
          </Button>
        </div>
      </Modal>
    </main>
  )
}

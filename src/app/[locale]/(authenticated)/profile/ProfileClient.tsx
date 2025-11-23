'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useTranslations, useLocale } from 'next-intl'
import { Button, Input, Select, Modal, IconBadge } from '@/components/ui'
import { Card } from '@/components/ui/Card'

interface UserProfile {
  id: string
  name: string | null
  email: string
  emailVerified: string | null
  preferredLocale: string
  createdAt: string
}

export function ProfileClient() {
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
        <IconBadge icon="Loader2" size="lg" variant="primary" iconClassName="animate-spin" />
      </div>
    )
  }

  return (
    <main className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="no-margin">{t('title')}</h1>
        <p className="text-secondary mt-1 no-margin">{t('subtitle')}</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-neu ${
            message.type === 'success'
              ? 'bg-secondary-50 shadow-neu-inset-sm text-secondary-700'
              : 'bg-primary-100 shadow-neu-inset-sm text-primary-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Personal Information */}
      <Card className="mb-6">
        <div className="px-6 py-4 border-b border-neu-dark/20">
          <h3 className="no-margin">{t('personalInfo')}</h3>
        </div>
        <form onSubmit={handleUpdateProfile} className="px-6 py-4 space-y-4">
          <Input
            id="name"
            name="name"
            label={t('name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            id="email"
            name="email"
            type="email"
            label={t('email')}
            value={user?.email || ''}
            disabled
          />
          <div className="flex justify-end">
            <Button type="submit" loading={saving} loadingText={common('loading')}>
              {common('save')}
            </Button>
          </div>
        </form>
      </Card>

      {/* Language Preferences */}
      <Card className="mb-6">
        <div className="px-6 py-4 border-b border-neu-dark/20">
          <h3 className="no-margin">{t('preferences')}</h3>
        </div>
        <form onSubmit={handleUpdateProfile} className="px-6 py-4 space-y-4">
          <Select
            id="preferredLocale"
            label={t('language')}
            value={formData.preferredLocale}
            onChange={(e) => setFormData({ ...formData, preferredLocale: e.target.value })}
            hint={t('languageDescription')}
          >
            <option value="ka">{languages('ka')}</option>
            <option value="en">{languages('en')}</option>
          </Select>
          <div className="flex justify-end">
            <Button type="submit" loading={saving} loadingText={common('loading')}>
              {common('save')}
            </Button>
          </div>
        </form>
      </Card>

      {/* Security */}
      <Card className="mb-6">
        <div className="px-6 py-4 border-b border-neu-dark/20">
          <h3 className="no-margin">{t('security')}</h3>
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
      </Card>

      {/* Account Info */}
      <Card className="mb-6">
        <div className="px-6 py-4 border-b border-neu-dark/20">
          <h3 className="no-margin">{t('accountInfo')}</h3>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-body-sm text-secondary">{t('createdAt')}</span>
            <span className="text-body-sm">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-body-sm text-secondary">{t('verificationStatus')}</span>
            <span className={`text-body-sm ${user?.emailVerified ? 'text-secondary-600' : 'text-primary-600'}`}>
              {user?.emailVerified ? t('verified') : t('notVerified')}
            </span>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-2 border-primary-300">
        <div className="px-6 py-4 border-b border-primary-300 bg-primary-50 rounded-t-neu">
          <h3 className="no-margin text-primary-700">{t('dangerZone')}</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-body-sm text-secondary mb-4 no-margin">{t('deleteAccountWarning')}</p>
          <Button
            type="button"
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            {t('deleteAccount')}
          </Button>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('deleteConfirmTitle')}
      >
        <div className="flex justify-center mb-4">
          <IconBadge icon="AlertTriangle" size="lg" variant="danger" />
        </div>
        <p className="text-text-secondary text-center mb-6">
          {t('deleteConfirmMessage')}
        </p>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowDeleteConfirm(false)}
          >
            {common('cancel')}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDeleteAccount}
          >
            {common('delete')}
          </Button>
        </div>
      </Modal>
    </main>
  )
}

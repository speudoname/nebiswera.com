'use client'

import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

export interface ConfirmDialogProps {
  title: string
  message: string | string[]
  confirmText?: string
  cancelText?: string
  variant?: 'warning' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const messages = Array.isArray(message) ? message : [message]

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'text-red-500',
          bg: 'bg-red-50',
          border: 'border-red-200',
        }
      default:
        return {
          icon: 'text-amber-500',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className={`${styles.bg} ${styles.border} border rounded-lg p-3`}>
            {messages.length === 1 ? (
              <p className="text-sm text-gray-700">{messages[0]}</p>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {messages.map((msg, i) => (
                  <li key={i} className="text-sm text-gray-700">
                    {msg}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button onClick={onConfirm} variant={variant === 'danger' ? 'primary' : 'primary'}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

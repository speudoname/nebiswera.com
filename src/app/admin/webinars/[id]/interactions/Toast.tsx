'use client'

import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: CheckCircle,
        }
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: AlertCircle,
        }
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: Info,
        }
    }
  }

  const styles = getStyles()
  const Icon = styles.icon

  return (
    <div
      className={`fixed top-4 right-4 ${styles.bg} ${styles.border} border rounded-lg shadow-lg p-4 flex items-start gap-3 max-w-md z-[9999] animate-in slide-in-from-top-2`}
    >
      <Icon className={`w-5 h-5 ${styles.text} flex-shrink-0 mt-0.5`} />
      <p className={`text-sm ${styles.text} flex-1`}>{message}</p>
      <button
        onClick={onClose}
        className={`${styles.text} hover:opacity-70 flex-shrink-0`}
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

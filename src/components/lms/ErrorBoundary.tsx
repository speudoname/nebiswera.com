'use client'

/**
 * LMS Error Boundary
 *
 * Catches errors in LMS components and displays a friendly error message
 */

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  locale?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export class LmsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LMS Error Boundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const locale = this.props.locale || 'en'
      const isKa = locale === 'ka'

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {isKa ? 'შეცდომა მოხდა' : 'Something went wrong'}
            </h2>

            <p className="text-gray-600 mb-6">
              {isKa
                ? 'კონტენტის ჩატვირთვისას შეცდომა მოხდა. გთხოვთ სცადოთ თავიდან.'
                : 'An error occurred while loading the content. Please try again.'}
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                {isKa ? 'თავიდან ცდა' : 'Try Again'}
              </button>

              <Link
                href={`/${locale}`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Home className="w-4 h-4" />
                {isKa ? 'მთავარი' : 'Home'}
              </Link>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
                <p className="text-sm font-mono text-red-600 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Inline error display for smaller components
 */
interface ErrorMessageProps {
  message?: string
  onRetry?: () => void
  locale?: string
}

export function ErrorMessage({ message, onRetry, locale = 'en' }: ErrorMessageProps) {
  const isKa = locale === 'ka'

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-red-800">
            {message || (isKa ? 'შეცდომა მოხდა' : 'An error occurred')}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              {isKa ? 'თავიდან ცდა' : 'Try again'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Loading error state for async operations
 */
interface LoadingErrorProps {
  title?: string
  message?: string
  onRetry?: () => void
  locale?: string
}

export function LoadingError({ title, message, onRetry, locale = 'en' }: LoadingErrorProps) {
  const isKa = locale === 'ka'

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-12 h-12 mb-4 rounded-full bg-red-100 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {title || (isKa ? 'ჩატვირთვა ვერ მოხერხდა' : 'Failed to load')}
      </h3>
      <p className="text-gray-500 text-center mb-4 max-w-sm">
        {message || (isKa ? 'გთხოვთ სცადოთ თავიდან' : 'Please try again')}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {isKa ? 'თავიდან ცდა' : 'Retry'}
        </button>
      )}
    </div>
  )
}

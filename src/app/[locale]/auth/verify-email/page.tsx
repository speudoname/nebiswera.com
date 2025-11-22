'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided')
      return
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await res.json()

        if (res.ok) {
          setStatus('success')
          setMessage('Your email has been verified successfully!')
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed')
        }
      } catch {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="bg-white rounded-xl shadow-xl p-8 text-center">
      {status === 'loading' && (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900">Verifying your email...</h1>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Email Verified!</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Verification Failed</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link href="/auth/login">
            <Button variant="outline">Back to Login</Button>
          </Link>
        </>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="bg-white rounded-xl shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900">Loading...</h1>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

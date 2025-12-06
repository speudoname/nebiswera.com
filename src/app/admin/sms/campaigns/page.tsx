'use client'

import Link from 'next/link'
import { ArrowLeft, Construction, Plus } from 'lucide-react'

export default function SmsCampaignsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/sms"
          className="inline-flex items-center gap-2 text-accent-600 hover:text-accent-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to SMS
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-accent-900">SMS Campaigns</h1>
            <p className="text-accent-600 mt-1">Create and manage bulk SMS campaigns</p>
          </div>
          <button
            disabled
            className="px-4 py-2 bg-accent-600 text-white rounded-neu opacity-50 cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-neu shadow-neu-flat p-12 text-center">
        <Construction className="h-16 w-16 mx-auto mb-4 text-accent-300" />
        <h2 className="text-xl font-semibold text-accent-900 mb-2">Coming Soon</h2>
        <p className="text-accent-600 max-w-md mx-auto">
          SMS campaign management is under development. You&apos;ll be able to create, schedule,
          and send bulk SMS messages to your contacts.
        </p>
        <div className="mt-6 text-sm text-accent-500">
          <p>Planned features:</p>
          <ul className="mt-2 space-y-1">
            <li>Create campaigns with audience targeting</li>
            <li>Schedule sends for optimal times</li>
            <li>Track delivery and engagement</li>
            <li>A/B testing for messages</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

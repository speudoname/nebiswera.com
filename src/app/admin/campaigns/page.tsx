import { Suspense } from 'react'
import { CampaignsTable } from './CampaignsTable'

export const metadata = {
  title: 'Campaigns - Admin',
  robots: 'noindex',
}

export default function AdminCampaignsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Email Campaigns</h1>
        <p className="text-text-secondary">Create and manage marketing email campaigns</p>
      </div>

      <Suspense fallback={<div className="text-center py-12">Loading campaigns...</div>}>
        <CampaignsTable />
      </Suspense>
    </div>
  )
}

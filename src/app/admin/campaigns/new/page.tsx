import { CampaignEditor } from '@/components/admin/campaigns/CampaignEditor'

export const metadata = {
  title: 'New Campaign - Admin',
  robots: 'noindex',
}

export default function NewCampaignPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Create New Campaign</h1>
        <p className="text-text-secondary">Design and schedule your email marketing campaign</p>
      </div>

      <CampaignEditor />
    </div>
  )
}

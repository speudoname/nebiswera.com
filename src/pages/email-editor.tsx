// This is a Pages Router page (not App Router) - works better for isolated editor
import dynamic from 'next/dynamic'

// Dynamically import the editor component with no SSR
// This prevents mjml-browser and easy-email from running on the server
const EmailEditorComponent = dynamic(() => import('@/components/admin/campaigns/EmailEditorPage'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #e0e0e0', borderTopColor: '#8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#666' }}>Loading editor...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  ),
})

export default function EmailEditorPage() {
  return <EmailEditorComponent />
}

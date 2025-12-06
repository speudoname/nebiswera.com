import { Metadata } from 'next'
import { SmsUnsubscribeClient } from './SmsUnsubscribeClient'

export const metadata: Metadata = {
  title: 'SMS Unsubscribe | ნებისწერა',
  description: 'Unsubscribe from SMS marketing messages',
  robots: {
    index: false,
    follow: false,
  },
}

export default function SmsUnsubscribePage() {
  return <SmsUnsubscribeClient />
}

import { prisma } from '@/lib/db'

const SETTINGS_ID = 'app_settings'

export interface AppSettings {
  postmarkServerToken: string | null
  postmarkStreamName: string
  emailFromAddress: string | null
  emailFromName: string
}

export async function getSettings(): Promise<AppSettings> {
  let settings = await prisma.settings.findUnique({
    where: { id: SETTINGS_ID },
  })

  // Create default settings if they don't exist
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        id: SETTINGS_ID,
        // Initialize with env variables if available
        postmarkServerToken: process.env.POSTMARK_SERVER_TOKEN || null,
        emailFromAddress: process.env.EMAIL_FROM || null,
      },
    })
  }

  return {
    postmarkServerToken: settings.postmarkServerToken,
    postmarkStreamName: settings.postmarkStreamName,
    emailFromAddress: settings.emailFromAddress,
    emailFromName: settings.emailFromName,
  }
}

export async function updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
  const settings = await prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update: data,
    create: {
      id: SETTINGS_ID,
      ...data,
    },
  })

  return {
    postmarkServerToken: settings.postmarkServerToken,
    postmarkStreamName: settings.postmarkStreamName,
    emailFromAddress: settings.emailFromAddress,
    emailFromName: settings.emailFromName,
  }
}

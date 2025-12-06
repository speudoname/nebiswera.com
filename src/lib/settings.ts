import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

const SETTINGS_ID = 'app_settings'

export interface SocialLinks {
  facebook?: string
  instagram?: string
  linkedin?: string
  twitter?: string
  youtube?: string
  tiktok?: string
}

export interface AppSettings {
  // Transactional email settings
  postmarkServerToken: string | null
  postmarkStreamName: string
  emailFromAddress: string | null
  emailFromName: string
  // Marketing email settings
  marketingServerToken: string | null
  marketingStreamName: string
  marketingFromAddress: string | null
  marketingFromName: string
  // Campaign footer settings (CAN-SPAM compliance)
  companyName: string
  companyNameKa: string
  companyAddress: string
  companyAddressKa: string
  companyPhone: string | null
  socialLinks: SocialLinks | null
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
    marketingServerToken: settings.marketingServerToken,
    marketingStreamName: settings.marketingStreamName,
    marketingFromAddress: settings.marketingFromAddress,
    marketingFromName: settings.marketingFromName,
    companyName: settings.companyName,
    companyNameKa: settings.companyNameKa,
    companyAddress: settings.companyAddress,
    companyAddressKa: settings.companyAddressKa,
    companyPhone: settings.companyPhone,
    socialLinks: settings.socialLinks as SocialLinks | null,
  }
}

export async function updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
  // Convert socialLinks to Prisma-compatible format
  const { socialLinks, ...rest } = data

  // Build update data with proper Prisma JSON handling
  const updateData: Prisma.SettingsUpdateInput = {
    ...rest,
  }

  // Handle socialLinks separately due to Prisma JSON type requirements
  if (socialLinks !== undefined) {
    updateData.socialLinks = socialLinks === null
      ? Prisma.DbNull
      : (socialLinks as Prisma.InputJsonValue)
  }

  const settings = await prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update: updateData,
    create: {
      id: SETTINGS_ID,
      ...rest,
      socialLinks: socialLinks === null ? Prisma.DbNull : (socialLinks as Prisma.InputJsonValue | undefined),
    },
  })

  return {
    postmarkServerToken: settings.postmarkServerToken,
    postmarkStreamName: settings.postmarkStreamName,
    emailFromAddress: settings.emailFromAddress,
    emailFromName: settings.emailFromName,
    marketingServerToken: settings.marketingServerToken,
    marketingStreamName: settings.marketingStreamName,
    marketingFromAddress: settings.marketingFromAddress,
    marketingFromName: settings.marketingFromName,
    companyName: settings.companyName,
    companyNameKa: settings.companyNameKa,
    companyAddress: settings.companyAddress,
    companyAddressKa: settings.companyAddressKa,
    companyPhone: settings.companyPhone,
    socialLinks: settings.socialLinks as SocialLinks | null,
  }
}

/**
 * Generate the campaign footer HTML for CAN-SPAM compliance
 * @param locale - 'en' or 'ka' (Georgian)
 * @param unsubscribeLink - The unsubscribe link placeholder or actual URL
 */
export function generateCampaignFooter(
  settings: AppSettings,
  locale: 'en' | 'ka' = 'ka',
  unsubscribeLink: string = '{{{ pm:unsubscribe }}}'
): { html: string; text: string } {
  const companyName = locale === 'ka' ? settings.companyNameKa : settings.companyName
  const companyAddress = locale === 'ka' ? settings.companyAddressKa : settings.companyAddress
  const unsubscribeText = locale === 'ka' ? 'გამოწერის გაუქმება' : 'Unsubscribe'

  // Build social links if available
  let socialHtml = ''
  let socialText = ''
  if (settings.socialLinks) {
    const links = settings.socialLinks
    const socialItems: string[] = []
    const socialTextItems: string[] = []

    if (links.facebook) {
      socialItems.push(`<a href="${links.facebook}" style="color:#8B5CF6;text-decoration:none;margin:0 8px;">Facebook</a>`)
      socialTextItems.push(`Facebook: ${links.facebook}`)
    }
    if (links.instagram) {
      socialItems.push(`<a href="${links.instagram}" style="color:#8B5CF6;text-decoration:none;margin:0 8px;">Instagram</a>`)
      socialTextItems.push(`Instagram: ${links.instagram}`)
    }
    if (links.linkedin) {
      socialItems.push(`<a href="${links.linkedin}" style="color:#8B5CF6;text-decoration:none;margin:0 8px;">LinkedIn</a>`)
      socialTextItems.push(`LinkedIn: ${links.linkedin}`)
    }
    if (links.youtube) {
      socialItems.push(`<a href="${links.youtube}" style="color:#8B5CF6;text-decoration:none;margin:0 8px;">YouTube</a>`)
      socialTextItems.push(`YouTube: ${links.youtube}`)
    }
    if (links.twitter) {
      socialItems.push(`<a href="${links.twitter}" style="color:#8B5CF6;text-decoration:none;margin:0 8px;">Twitter</a>`)
      socialTextItems.push(`Twitter: ${links.twitter}`)
    }
    if (links.tiktok) {
      socialItems.push(`<a href="${links.tiktok}" style="color:#8B5CF6;text-decoration:none;margin:0 8px;">TikTok</a>`)
      socialTextItems.push(`TikTok: ${links.tiktok}`)
    }

    if (socialItems.length > 0) {
      socialHtml = `<div style="margin-bottom:15px;">${socialItems.join('')}</div>`
      socialText = '\n' + socialTextItems.join('\n')
    }
  }

  const html = `
<div style="margin-top:40px;padding-top:20px;border-top:1px solid #e5e5e5;text-align:center;font-size:12px;color:#666666;font-family:Arial,sans-serif;">
  ${socialHtml}
  <p style="margin:0 0 8px 0;font-weight:600;">${companyName}</p>
  <p style="margin:0 0 8px 0;">${companyAddress}</p>
  ${settings.companyPhone ? `<p style="margin:0 0 8px 0;">${settings.companyPhone}</p>` : ''}
  <p style="margin:15px 0 0 0;">
    <a href="${unsubscribeLink}" style="color:#8B5CF6;text-decoration:underline;">${unsubscribeText}</a>
  </p>
</div>`

  const text = `
---
${companyName}
${companyAddress}${settings.companyPhone ? '\n' + settings.companyPhone : ''}${socialText}

${unsubscribeText}: ${unsubscribeLink}
`

  return { html, text }
}

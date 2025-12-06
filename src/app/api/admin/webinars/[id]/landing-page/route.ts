import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import { unauthorizedResponse, notFoundResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import type { NextRequest } from 'next/server'
import type {
  LandingPageTemplate,
  ButtonStyle,
  ImagePlacement,
  ContentAlignment,
  PresenterImageShape,
  LogoType,
  HeroMediaType,
} from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/webinars/[id]/landing-page - Get landing page configuration
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const config = await prisma.webinarLandingPageConfig.findUnique({
      where: { webinarId: id },
    })

    if (!config) {
      return NextResponse.json({ config: null })
    }

    return NextResponse.json({
      config: {
        id: config.id,
        template: config.template,
        logoType: config.logoType,
        logoText: config.logoText,
        logoImageUrl: config.logoImageUrl,
        heroEyebrow: config.heroEyebrow,
        heroTitle: config.heroTitle,
        heroTitleParts: config.heroTitleParts,
        heroSubtitle: config.heroSubtitle,
        heroSubtitleParts: config.heroSubtitleParts,
        heroParagraph: config.heroParagraph,
        heroButtonText: config.heroButtonText,
        heroBelowButtonText: config.heroBelowButtonText,
        heroButtonStyle: config.heroButtonStyle,
        heroMediaType: config.heroMediaType,
        heroImageUrl: config.heroImageUrl,
        heroVideoUrl: config.heroVideoUrl,
        heroImagePlacement: config.heroImagePlacement,
        heroAlignment: config.heroAlignment,
        section2Title: config.section2Title,
        section2Items: config.section2Items,
        section2CtaText: config.section2CtaText,
        section2SubCtaText: config.section2SubCtaText,
        section2ButtonText: config.section2ButtonText,
        section2ButtonStyle: config.section2ButtonStyle,
        section2ImagePlacement: config.section2ImagePlacement,
        section2Alignment: config.section2Alignment,
        presenterImageUrl: config.presenterImageUrl,
        presenterImageShape: config.presenterImageShape,
        footerDisclaimerText: config.footerDisclaimerText,
        primaryColor: config.primaryColor,
        backgroundColor: config.backgroundColor,
      },
    })
  } catch (error) {
    logger.error('Failed to fetch landing page config:', error)
    return errorResponse('Failed to fetch landing page configuration')
  }
}

// PUT /api/admin/webinars/[id]/landing-page - Create or update landing page configuration
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    // Check webinar exists
    const webinar = await prisma.webinar.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!webinar) {
      return notFoundResponse('Webinar not found')
    }

    const body = await request.json()
    const {
      template,
      logoType,
      logoText,
      logoImageUrl,
      heroEyebrow,
      heroTitle,
      heroTitleParts,
      heroSubtitle,
      heroSubtitleParts,
      heroParagraph,
      heroButtonText,
      heroBelowButtonText,
      heroButtonStyle,
      heroMediaType,
      heroImageUrl,
      heroVideoUrl,
      heroImagePlacement,
      heroAlignment,
      section2Title,
      section2Items,
      section2CtaText,
      section2SubCtaText,
      section2ButtonText,
      section2ButtonStyle,
      section2ImagePlacement,
      section2Alignment,
      presenterImageUrl,
      presenterImageShape,
      footerDisclaimerText,
      primaryColor,
      backgroundColor,
    } = body

    // Validate enums
    const validTemplates: LandingPageTemplate[] = [
      'IMAGE_RIGHT',
      'IMAGE_LEFT',
      'IMAGE_BACKGROUND',
      'CENTERED_HERO',
      'CENTERED_MINIMAL',
      'GRADIENT_OVERLAY',
      'VIDEO_FOCUS',
      'CARD_FLOAT',
      'SPLIT_DIAGONAL',
    ]
    if (template && !validTemplates.includes(template)) {
      return badRequestResponse('Invalid template')
    }

    const validButtonStyles: ButtonStyle[] = ['POPUP_FORM', 'INLINE_EMAIL', 'EXPAND_FORM']
    if (heroButtonStyle && !validButtonStyles.includes(heroButtonStyle)) {
      return badRequestResponse('Invalid hero button style')
    }
    if (section2ButtonStyle && !validButtonStyles.includes(section2ButtonStyle)) {
      return badRequestResponse('Invalid section 2 button style')
    }

    const validImagePlacements: ImagePlacement[] = ['LEFT', 'RIGHT', 'BACKGROUND', 'NONE']
    if (heroImagePlacement && !validImagePlacements.includes(heroImagePlacement)) {
      return badRequestResponse('Invalid image placement')
    }

    const validPresenterShapes: PresenterImageShape[] = ['CIRCLE', 'SQUARE']
    if (presenterImageShape && !validPresenterShapes.includes(presenterImageShape)) {
      return badRequestResponse('Invalid presenter image shape')
    }

    const validLogoTypes: LogoType[] = ['TEXT', 'IMAGE']
    if (logoType && !validLogoTypes.includes(logoType)) {
      return badRequestResponse('Invalid logo type')
    }

    const validHeroMediaTypes: HeroMediaType[] = ['IMAGE', 'VIDEO']
    if (heroMediaType && !validHeroMediaTypes.includes(heroMediaType)) {
      return badRequestResponse('Invalid hero media type')
    }

    const validContentAlignments: ContentAlignment[] = ['LEFT', 'CENTER', 'RIGHT']
    if (heroAlignment && !validContentAlignments.includes(heroAlignment)) {
      return badRequestResponse('Invalid hero alignment')
    }
    if (section2Alignment && !validContentAlignments.includes(section2Alignment)) {
      return badRequestResponse('Invalid section 2 alignment')
    }
    if (section2ImagePlacement && !validImagePlacements.includes(section2ImagePlacement)) {
      return badRequestResponse('Invalid section 2 image placement')
    }

    // Prepare data
    const configData = {
      template: (template as LandingPageTemplate) || 'IMAGE_RIGHT',
      logoType: (logoType as LogoType) || 'TEXT',
      logoText: logoText || null,
      logoImageUrl: logoImageUrl || null,
      heroEyebrow: heroEyebrow || null,
      heroTitle: heroTitle || null,
      heroTitleParts: heroTitleParts || null,
      heroSubtitle: heroSubtitle || null,
      heroSubtitleParts: heroSubtitleParts || null,
      heroParagraph: heroParagraph || null,
      heroButtonText: heroButtonText || null,
      heroBelowButtonText: heroBelowButtonText || null,
      heroButtonStyle: (heroButtonStyle as ButtonStyle) || 'POPUP_FORM',
      heroMediaType: (heroMediaType as HeroMediaType) || 'IMAGE',
      heroImageUrl: heroImageUrl || null,
      heroVideoUrl: heroVideoUrl || null,
      heroImagePlacement: (heroImagePlacement as ImagePlacement) || 'RIGHT',
      heroAlignment: (heroAlignment as ContentAlignment) || 'LEFT',
      section2Title: section2Title || null,
      section2Items: section2Items || [],
      section2CtaText: section2CtaText || null,
      section2SubCtaText: section2SubCtaText || null,
      section2ButtonText: section2ButtonText || null,
      section2ButtonStyle: (section2ButtonStyle as ButtonStyle) || 'POPUP_FORM',
      section2ImagePlacement: (section2ImagePlacement as ImagePlacement) || 'LEFT',
      section2Alignment: (section2Alignment as ContentAlignment) || 'LEFT',
      presenterImageUrl: presenterImageUrl || null,
      presenterImageShape: (presenterImageShape as PresenterImageShape) || 'CIRCLE',
      footerDisclaimerText: footerDisclaimerText || null,
      primaryColor: primaryColor || null,
      backgroundColor: backgroundColor || null,
    }

    // Upsert landing page config
    const config = await prisma.webinarLandingPageConfig.upsert({
      where: { webinarId: id },
      create: {
        webinarId: id,
        ...configData,
      },
      update: configData,
    })

    return NextResponse.json({
      config: {
        id: config.id,
        template: config.template,
        logoType: config.logoType,
        logoText: config.logoText,
        logoImageUrl: config.logoImageUrl,
        heroEyebrow: config.heroEyebrow,
        heroTitle: config.heroTitle,
        heroTitleParts: config.heroTitleParts,
        heroSubtitle: config.heroSubtitle,
        heroSubtitleParts: config.heroSubtitleParts,
        heroParagraph: config.heroParagraph,
        heroButtonText: config.heroButtonText,
        heroBelowButtonText: config.heroBelowButtonText,
        heroButtonStyle: config.heroButtonStyle,
        heroMediaType: config.heroMediaType,
        heroImageUrl: config.heroImageUrl,
        heroVideoUrl: config.heroVideoUrl,
        heroImagePlacement: config.heroImagePlacement,
        heroAlignment: config.heroAlignment,
        section2Title: config.section2Title,
        section2Items: config.section2Items,
        section2CtaText: config.section2CtaText,
        section2SubCtaText: config.section2SubCtaText,
        section2ButtonText: config.section2ButtonText,
        section2ButtonStyle: config.section2ButtonStyle,
        section2ImagePlacement: config.section2ImagePlacement,
        section2Alignment: config.section2Alignment,
        presenterImageUrl: config.presenterImageUrl,
        presenterImageShape: config.presenterImageShape,
        footerDisclaimerText: config.footerDisclaimerText,
        primaryColor: config.primaryColor,
        backgroundColor: config.backgroundColor,
      },
    })
  } catch (error) {
    logger.error('Failed to save landing page config:', error)
    return errorResponse('Failed to save landing page configuration')
  }
}

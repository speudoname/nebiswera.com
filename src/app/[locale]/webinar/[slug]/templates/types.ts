import type {
  LandingPageTemplate,
  ButtonStyle,
  ImagePlacement,
  PresenterImageShape,
  LogoType,
  HeroMediaType,
  ContentAlignment,
} from '@prisma/client'

// Rich text part for styled headlines
export interface RichTextPart {
  text: string
  bold?: boolean
  italic?: boolean
  color?: 'default' | 'primary' | 'secondary' | 'muted' | 'white' | string // custom hex supported
}

export interface Section2Item {
  headline: string
  subheadline?: string
  paragraph?: string
}

export interface LandingPageConfig {
  id: string
  template: LandingPageTemplate
  logoType: LogoType
  logoText: string | null
  logoImageUrl: string | null
  heroEyebrow: string | null
  heroTitle: string | null
  heroTitleParts: RichTextPart[] | null  // Rich text parts for styled title
  heroSubtitle: string | null
  heroSubtitleParts: RichTextPart[] | null  // Rich text parts for styled subtitle
  heroParagraph: string | null
  heroButtonText: string | null
  heroBelowButtonText: string | null
  heroButtonStyle: ButtonStyle
  heroMediaType: HeroMediaType
  heroImageUrl: string | null
  heroVideoUrl: string | null
  heroImagePlacement: ImagePlacement
  heroAlignment: ContentAlignment  // Text alignment in hero section
  section2Title: string | null
  section2Items: Section2Item[]
  section2CtaText: string | null
  section2SubCtaText: string | null
  section2ButtonText: string | null
  section2ButtonStyle: ButtonStyle
  section2ImagePlacement: ImagePlacement  // Independent section 2 layout
  section2Alignment: ContentAlignment     // Section 2 text alignment
  presenterImageUrl: string | null
  presenterImageShape: PresenterImageShape
  footerDisclaimerText: string | null
  primaryColor: string | null
  backgroundColor: string | null
}

export interface WebinarData {
  id: string
  title: string
  description: string | null
  presenterName: string | null
  presenterTitle: string | null
  presenterBio: string | null
  presenterAvatar: string | null
  thumbnailUrl: string | null
  scheduleConfig: {
    eventType: string
    startsAt: Date | null
    endsAt: Date | null
  } | null
}

export interface TemplateProps {
  config: LandingPageConfig
  webinar: WebinarData
  slug: string
  locale: string
}

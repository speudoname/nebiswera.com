export interface WebinarEmailTemplate {
  subject: string
  previewText: string
  html: string
  text: string
}

export interface WebinarTemplateVariables {
  firstName: string
  lastName?: string
  email: string
  webinarTitle: string
  webinarDescription?: string
  sessionDate?: string
  watchUrl: string
  replayUrl: string
  unsubscribeUrl?: string
  watchedPercent?: number
  watchTimeMinutes?: number
}

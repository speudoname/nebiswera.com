// Types for custom registration fields

export type NameFieldFormat = 'SPLIT' | 'FULL'

export type CustomFieldType = 'text' | 'textarea' | 'select' | 'checkbox'

export interface CustomField {
  id: string
  label: string
  type: CustomFieldType
  required: boolean
  options?: string[] // For select type
  placeholder?: string
}

export interface RegistrationFieldConfig {
  nameFormat: NameFieldFormat
  showPhone: boolean
  phoneRequired: boolean
  customFields: CustomField[]
}

export interface RegistrationFormData {
  email: string
  firstName?: string
  lastName?: string
  fullName?: string // Used when nameFormat is FULL
  phone?: string
  customFieldResponses?: Record<string, string | boolean>
}

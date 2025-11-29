/**
 * Email Personalization System
 *
 * Renders personalized content by replacing variables with contact data
 * Syntax: {{variableName}} or {{variableName|fallback}}
 */

export interface PersonalizationData {
  email: string
  firstName?: string | null
  lastName?: string | null
  fullName?: string
  // Add more fields as needed
  [key: string]: string | null | undefined
}

/**
 * Available personalization variables
 */
export const PERSONALIZATION_VARIABLES = [
  {
    key: 'email',
    label: 'Email Address',
    description: 'Recipient email address',
    example: 'john@example.com',
    alwaysAvailable: true,
  },
  {
    key: 'firstName',
    label: 'First Name',
    description: 'First name with optional fallback',
    example: '{{firstName|Friend}}',
    alwaysAvailable: false,
  },
  {
    key: 'lastName',
    label: 'Last Name',
    description: 'Last name with optional fallback',
    example: '{{lastName|there}}',
    alwaysAvailable: false,
  },
  {
    key: 'fullName',
    label: 'Full Name',
    description: 'First name + Last name or email if not available',
    example: '{{fullName}}',
    alwaysAvailable: true,
  },
] as const

/**
 * Renders a template by replacing all variables with actual values
 *
 * @param template - Template string with {{variable}} or {{variable|fallback}} syntax
 * @param data - Contact data to use for replacement
 * @returns Rendered string with variables replaced
 *
 * @example
 * renderTemplate("Hi {{firstName|there}}!", { firstName: "John" })
 * // Returns: "Hi John!"
 *
 * renderTemplate("Hi {{firstName|there}}!", { firstName: null })
 * // Returns: "Hi there!"
 */
export function renderTemplate(template: string, data: PersonalizationData): string {
  if (!template) return ''

  // Regular expression to match {{variable}} or {{variable|fallback}}
  const variableRegex = /\{\{([a-zA-Z0-9_]+)(?:\|([^}]+))?\}\}/g

  return template.replace(variableRegex, (match, variable, fallback) => {
    // Get the value from data
    let value = data[variable as keyof PersonalizationData]

    // Handle null/undefined values
    if (value === null || value === undefined || value === '') {
      // Use fallback if provided
      if (fallback !== undefined) {
        return fallback
      }

      // Special handling for specific variables
      if (variable === 'fullName') {
        // fullName fallback: try firstName, then email
        return data.firstName || data.email
      }

      // No fallback and no value - return empty string
      return ''
    }

    return String(value)
  })
}

/**
 * Validates a template to ensure all required variables are present
 *
 * @param template - Template string to validate
 * @returns Object with validation results
 */
export function validateTemplate(template: string): {
  valid: boolean
  missingVariables: string[]
  hasUnsubscribeLink: boolean
} {
  const variableRegex = /\{\{([a-zA-Z0-9_]+)(?:\|([^}]+))?\}\}/g
  const foundVariables = new Set<string>()

  let match
  while ((match = variableRegex.exec(template)) !== null) {
    foundVariables.add(match[1])
  }

  // Check for required unsubscribe link (Postmark syntax)
  const hasUnsubscribeLink = template.includes('{{{ pm:unsubscribe }}}')

  // Check if any variables are unknown
  const knownVariables = PERSONALIZATION_VARIABLES.map((v) => v.key)
  const missingVariables = Array.from(foundVariables).filter(
    (v) => !knownVariables.includes(v as any)
  )

  return {
    valid: hasUnsubscribeLink && missingVariables.length === 0,
    missingVariables,
    hasUnsubscribeLink,
  }
}

/**
 * Extracts all variables used in a template
 *
 * @param template - Template string
 * @returns Array of variable names found in template
 */
export function extractVariables(template: string): string[] {
  const variableRegex = /\{\{([a-zA-Z0-9_]+)(?:\|([^}]+))?\}\}/g
  const variables = new Set<string>()

  let match
  while ((match = variableRegex.exec(template)) !== null) {
    variables.add(match[1])
  }

  return Array.from(variables)
}

/**
 * Generates preview data for testing templates
 *
 * @returns Sample personalization data for preview
 */
export function getSampleData(): PersonalizationData {
  return {
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
  }
}

/**
 * Prepares contact data for personalization
 * Ensures all required fields are present
 *
 * @param contact - Raw contact data from database
 * @returns Normalized personalization data
 */
export function prepareContactData(contact: {
  email: string
  firstName?: string | null
  lastName?: string | null
}): PersonalizationData {
  const fullName = [contact.firstName, contact.lastName]
    .filter(Boolean)
    .join(' ') || contact.email

  return {
    email: contact.email,
    firstName: contact.firstName || null,
    lastName: contact.lastName || null,
    fullName,
  }
}

/**
 * Preview a template with sample data
 * Useful for showing users what their email will look like
 *
 * @param template - Template string
 * @param customData - Optional custom data (uses sample data if not provided)
 * @returns Rendered preview
 */
export function previewTemplate(
  template: string,
  customData?: Partial<PersonalizationData>
): string {
  const data = {
    ...getSampleData(),
    ...customData,
  }
  return renderTemplate(template, data)
}

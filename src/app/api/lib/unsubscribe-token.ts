import crypto from 'crypto'

/**
 * Get the unsubscribe secret, throwing if not configured
 */
function getUnsubscribeSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET
  if (!secret) {
    throw new Error(
      'UNSUBSCRIBE_SECRET environment variable is not configured. ' +
        'Please set it in your .env file to enable secure unsubscribe tokens.'
    )
  }
  return secret
}

/**
 * Generate a secure unsubscribe token for an email
 * This token should be included in marketing emails
 */
export function generateUnsubscribeToken(email: string): string {
  const secret = getUnsubscribeSecret()
  const timestamp = Date.now()
  const data = `${email}:${timestamp}`
  const hmac = crypto.createHmac('sha256', secret).update(data).digest('hex')
  // Base64 encode the token with timestamp
  const token = Buffer.from(`${timestamp}:${email}:${hmac}`).toString('base64url')
  return token
}

/**
 * Verify an unsubscribe token
 * Returns the email if valid, null if invalid or expired
 */
export function verifyUnsubscribeToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const [timestampStr, email, providedHmac] = decoded.split(':')
    const timestamp = parseInt(timestampStr, 10)

    // Token expires after 30 days
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
    if (Date.now() - timestamp > thirtyDaysMs) {
      return null
    }

    // Verify HMAC
    const secret = getUnsubscribeSecret()
    const data = `${email}:${timestamp}`
    const expectedHmac = crypto.createHmac('sha256', secret).update(data).digest('hex')

    if (providedHmac !== expectedHmac) {
      return null
    }

    return email
  } catch {
    return null
  }
}

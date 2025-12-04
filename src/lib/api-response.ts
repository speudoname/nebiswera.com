/**
 * API Response Utilities
 *
 * Standardized API response helpers for consistent error/success handling
 */

import { NextResponse } from 'next/server'
import { getErrorMessage } from './validation-utils'

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Standard error response
 * @param error - Error object, string, or ApiError
 * @param defaultStatus - Default status code if error is not ApiError
 * @returns NextResponse with error
 */
export function errorResponse(error: unknown, defaultStatus = 500): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error.code && { code: error.code })
      },
      { status: error.status }
    )
  }

  return NextResponse.json(
    { error: getErrorMessage(error) },
    { status: defaultStatus }
  )
}

/**
 * Standard success response
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with data
 */
export function successResponse<T = any>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

/**
 * Unauthorized response (401)
 * @param message - Error message
 * @returns NextResponse with 401 status
 */
export function unauthorizedResponse(message = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}

/**
 * Forbidden response (403)
 * @param message - Error message
 * @returns NextResponse with 403 status
 */
export function forbiddenResponse(message = 'Forbidden'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 })
}

/**
 * Not found response (404)
 * @param message - Error message
 * @returns NextResponse with 404 status
 */
export function notFoundResponse(message = 'Not found'): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 })
}

/**
 * Bad request response (400)
 * @param message - Error message
 * @returns NextResponse with 400 status
 */
export function badRequestResponse(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 })
}

/**
 * Validation error response (400) with field details
 * @param errors - Object with field-specific error messages
 * @returns NextResponse with 400 status and field errors
 */
export function validationErrorResponse(errors: Record<string, string>): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation failed',
      errors
    },
    { status: 400 }
  )
}

/**
 * SMS Module - UBill Integration
 *
 * Main exports for SMS functionality
 */

// UBill API Client
export {
  UBillClient,
  getUBillClient,
  mapUBillStatusToSmsStatus,
  UBILL_STATUS,
  type UBillStatusId,
  type UBillSendResponse,
  type UBillReportResponse,
  type UBillBalanceResponse,
  type UBillDeliveryStatus,
  type SendSmsOptions as UBillSendSmsOptions,
} from './ubill-client'

// Utility functions
export {
  normalizePhoneNumber,
  isValidGeorgianPhone,
  formatPhoneForDisplay,
  calculateSmsSegments,
  getSmsCharacterInfo,
  renderSmsTemplate,
  extractTemplateVariables,
  truncateForSms,
} from './utils'

// Send functions
export {
  sendSms,
  queueSms,
  sendTemplatedSms,
  appendUnsubscribeFooter,
} from './send'

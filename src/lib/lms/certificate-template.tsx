/**
 * Certificate PDF Template
 *
 * Uses @react-pdf/renderer to generate certificate PDFs
 */

import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { CertificateData } from './certificates'

// Register fonts (using standard fonts for now)
// In production, you might want to register custom fonts:
// Font.register({ family: 'CustomFont', src: '/path/to/font.ttf' })

// Styles for the certificate
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    position: 'relative',
  },
  border: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 3,
    borderColor: '#7C3AED',
    borderStyle: 'solid',
  },
  innerBorder: {
    position: 'absolute',
    top: 30,
    left: 30,
    right: 30,
    bottom: 30,
    borderWidth: 1,
    borderColor: '#C4B5FD',
    borderStyle: 'solid',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 60,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  logo: {
    fontSize: 14,
    color: '#7C3AED',
    letterSpacing: 4,
    marginBottom: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 30,
    textAlign: 'center',
  },
  presentedTo: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },
  studentName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 20,
    textAlign: 'center',
  },
  forCompletion: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  courseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 30,
    textAlign: 'center',
    maxWidth: 400,
  },
  dateSection: {
    marginTop: 20,
    marginBottom: 30,
    textAlign: 'center',
  },
  dateLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dateValue: {
    fontSize: 14,
    color: '#374151',
  },
  footer: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    paddingHorizontal: 40,
  },
  signatureBlock: {
    alignItems: 'center',
  },
  signatureLine: {
    width: 150,
    height: 1,
    backgroundColor: '#D1D5DB',
    marginBottom: 8,
  },
  signatureLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  verificationSection: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  verificationLabel: {
    fontSize: 8,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  verificationCode: {
    fontSize: 10,
    color: '#6B7280',
    letterSpacing: 2,
  },
  verificationUrl: {
    fontSize: 8,
    color: '#9CA3AF',
    marginTop: 4,
  },
})

// Georgian translations
const translations = {
  en: {
    certificate: 'Certificate',
    ofCompletion: 'of Completion',
    presentedTo: 'This is to certify that',
    forCompletion: 'has successfully completed the course',
    completionDate: 'Date of Completion',
    instructor: 'Instructor',
    verifyAt: 'Verify at',
    certificateId: 'Certificate ID',
  },
  ka: {
    certificate: 'სერტიფიკატი',
    ofCompletion: 'დასრულების შესახებ',
    presentedTo: 'ეს სერტიფიკატი ადასტურებს, რომ',
    forCompletion: 'წარმატებით დაასრულა კურსი',
    completionDate: 'დასრულების თარიღი',
    instructor: 'ინსტრუქტორი',
    verifyAt: 'გადაამოწმეთ',
    certificateId: 'სერტიფიკატის ID',
  },
}

function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function createCertificatePdf(data: CertificateData) {
  const t = translations[data.locale as keyof typeof translations] || translations.en
  const verifyUrl = `nebiswera.com/verify/${data.verificationCode}`

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Decorative borders */}
        <View style={styles.border} />
        <View style={styles.innerBorder} />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>:::...NEBISWERA...:::</Text>
            <Text style={styles.title}>{t.certificate}</Text>
            <Text style={styles.subtitle}>{t.ofCompletion}</Text>
          </View>

          {/* Main content */}
          <Text style={styles.presentedTo}>{t.presentedTo}</Text>
          <Text style={styles.studentName}>{data.studentName}</Text>
          <Text style={styles.forCompletion}>{t.forCompletion}</Text>
          <Text style={styles.courseName}>{data.courseName}</Text>

          {/* Date */}
          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>{t.completionDate}</Text>
            <Text style={styles.dateValue}>{formatDate(data.completedAt, data.locale)}</Text>
          </View>
        </View>

        {/* Verification info at bottom */}
        <View style={styles.verificationSection}>
          <Text style={styles.verificationLabel}>{t.certificateId}</Text>
          <Text style={styles.verificationCode}>{data.verificationCode}</Text>
          <Text style={styles.verificationUrl}>
            {t.verifyAt}: {verifyUrl}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

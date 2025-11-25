'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Button, Input } from '@/components/ui'
import { ArrowLeft, Upload, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface ImportResult {
  total: number
  imported: number
  failed: number
  errors: { row: number; email: string; error: string }[]
}

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([])
  const [source, setSource] = useState('import')
  const [sourceDetails, setSourceDetails] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setError('')
    setFile(selectedFile)

    try {
      const text = await selectedFile.text()
      let data: Record<string, string>[]

      if (selectedFile.name.endsWith('.json')) {
        data = JSON.parse(text)
        if (!Array.isArray(data)) {
          throw new Error('JSON must be an array of objects')
        }
      } else if (selectedFile.name.endsWith('.csv')) {
        data = parseCSV(text)
      } else {
        throw new Error('Unsupported file format. Please use CSV or JSON.')
      }

      if (data.length === 0) {
        throw new Error('No data found in file')
      }

      // Validate required field
      const hasEmail = data.every((row) => row.email)
      if (!hasEmail) {
        throw new Error('All rows must have an email field')
      }

      setParsedData(data)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
    }
  }

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split('\n').filter((line) => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
    const data: Record<string, string>[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/(".*?"|[^,]+)/g)?.map((v) =>
        v.trim().replace(/^"|"$/g, '')
      ) || []

      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      data.push(row)
    }

    return data
  }

  const handleImport = async () => {
    setStep('importing')
    setError('')

    try {
      const res = await fetch('/api/admin/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: parsedData.map((row) => ({
            email: row.email,
            firstName: row.firstName || row.first_name,
            lastName: row.lastName || row.last_name,
            phone: row.phone,
            notes: row.notes,
          })),
          source,
          sourceDetails,
          fileName: file?.name || 'import',
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setResult(data.results)
        setStep('complete')
      } else {
        setError(data.error || 'Import failed')
        setStep('preview')
      }
    } catch (err) {
      setError('Import failed')
      setStep('preview')
    }
  }

  const resetImport = () => {
    setStep('upload')
    setFile(null)
    setParsedData([])
    setResult(null)
    setError('')
    setSource('import')
    setSourceDetails('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <Link
        href="/admin/contacts"
        className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Contacts
      </Link>

      <h1 className="mb-8">Import Contacts</h1>

      <div className="bg-neu-light rounded-neu shadow-neu p-6 max-w-3xl">
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="text-center py-8 border-2 border-dashed border-neu-dark rounded-neu">
              <Upload className="w-12 h-12 mx-auto text-text-muted mb-4" />
              <p className="text-text-secondary mb-2">
                Upload a CSV or JSON file with contact data
              </p>
              <p className="text-sm text-text-muted mb-4">
                Required field: email
                <br />
                Optional: firstName, lastName, phone, notes
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                Select File
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-neu text-sm">
                {error}
              </div>
            )}

            <div className="p-4 bg-neu-base rounded-neu">
              <h3 className="font-medium text-text-primary mb-2">Sample CSV format:</h3>
              <code className="text-xs text-text-muted block whitespace-pre">
{`email,firstName,lastName,phone,notes
john@example.com,John,Doe,+1234567890,VIP customer
jane@example.com,Jane,Smith,,`}
              </code>
            </div>

            <div className="p-4 bg-neu-base rounded-neu">
              <h3 className="font-medium text-text-primary mb-2">Sample JSON format:</h3>
              <code className="text-xs text-text-muted block whitespace-pre">
{`[
  { "email": "john@example.com", "firstName": "John", "lastName": "Doe" },
  { "email": "jane@example.com", "firstName": "Jane" }
]`}
              </code>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-3 bg-neu-base rounded-neu">
              <FileText className="w-5 h-5 text-primary-600" />
              <div>
                <p className="font-medium text-text-primary">{file?.name}</p>
                <p className="text-sm text-text-muted">{parsedData.length} contacts to import</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-neu text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-body-sm font-medium text-secondary mb-1">
                  Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                >
                  <option value="import">Import</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="webinar">Webinar</option>
                  <option value="website">Website</option>
                </select>
              </div>
              <Input
                id="sourceDetails"
                name="sourceDetails"
                label="Source Details"
                placeholder="e.g., Campaign name"
                value={sourceDetails}
                onChange={(e) => setSourceDetails(e.target.value)}
              />
            </div>

            <div>
              <h3 className="font-medium text-text-primary mb-2">Preview (first 5 rows):</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-neu-dark">
                      {Object.keys(parsedData[0] || {}).map((key) => (
                        <th key={key} className="px-3 py-2 text-left text-text-muted">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-neu-dark/50">
                        {Object.values(row).map((value, j) => (
                          <td key={j} className="px-3 py-2 text-text-secondary">
                            {value || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 5 && (
                <p className="text-sm text-text-muted mt-2">
                  ... and {parsedData.length - 5} more rows
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={resetImport}>
                Cancel
              </Button>
              <Button onClick={handleImport}>
                Import {parsedData.length} Contacts
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4" />
            <p className="text-text-secondary">Importing contacts...</p>
          </div>
        )}

        {step === 'complete' && result && (
          <div className="space-y-6">
            <div className="text-center py-6">
              {result.failed === 0 ? (
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              ) : result.imported === 0 ? (
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              ) : (
                <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              )}
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                Import Complete
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-neu-base rounded-neu">
                <p className="text-2xl font-bold text-text-primary">{result.total}</p>
                <p className="text-sm text-text-muted">Total</p>
              </div>
              <div className="p-4 bg-green-50 rounded-neu">
                <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                <p className="text-sm text-green-600">Imported</p>
              </div>
              <div className="p-4 bg-red-50 rounded-neu">
                <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                <p className="text-sm text-red-600">Failed</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <h3 className="font-medium text-text-primary mb-2">Errors:</h3>
                <div className="max-h-48 overflow-y-auto bg-neu-base rounded-neu p-3">
                  {result.errors.map((err, i) => (
                    <div key={i} className="text-sm py-1 border-b border-neu-dark/30 last:border-0">
                      <span className="text-text-muted">Row {err.row}:</span>{' '}
                      <span className="text-red-600">{err.error}</span>
                      {err.email && (
                        <span className="text-text-muted"> ({err.email})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={resetImport}>
                Import More
              </Button>
              <Link href="/admin/contacts">
                <Button>View Contacts</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

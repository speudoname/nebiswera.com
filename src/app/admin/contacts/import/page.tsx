'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Button, Input } from '@/components/ui'
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Plus,
  X,
} from 'lucide-react'
import {
  detectColumns,
  transformData,
  validateTransformedData,
  type ColumnMapping,
  type FieldType,
} from '@/app/api/admin/contacts/lib/import-utils'

interface Tag {
  id: string
  name: string
  color: string
}

interface ImportResult {
  total: number
  created: number
  updated: number
  skipped: number
  failed: number
  errors: { row: number; email: string; error: string }[]
}

type UpdateStrategy = 'SKIP_EXISTING' | 'UPDATE_EMPTY_ONLY' | 'OVERWRITE_ALL' | 'ADD_TAGS_ONLY'

const FIELD_OPTIONS: { value: FieldType | 'skip'; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'fullName', label: 'Full Name (will be split)' },
  { value: 'phone', label: 'Phone' },
  { value: 'notes', label: 'Notes' },
  { value: 'skip', label: 'Skip this column' },
]

const UPDATE_STRATEGIES: { value: UpdateStrategy; label: string; description: string }[] = [
  {
    value: 'SKIP_EXISTING',
    label: 'Skip existing contacts',
    description: 'Only import new contacts, ignore existing ones',
  },
  {
    value: 'UPDATE_EMPTY_ONLY',
    label: 'Fill empty fields only',
    description: 'Update existing contacts only where fields are empty',
  },
  {
    value: 'OVERWRITE_ALL',
    label: 'Overwrite all data',
    description: 'Replace all data for existing contacts',
  },
  {
    value: 'ADD_TAGS_ONLY',
    label: 'Add tags only',
    description: 'Only add tags to existing contacts, don\'t change other data',
  },
]

const CONFIDENCE_COLORS = {
  high: 'text-green-600 bg-green-50',
  medium: 'text-amber-600 bg-amber-50',
  low: 'text-gray-500 bg-gray-50',
}

const TAG_COLORS = [
  '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6',
  '#EF4444', '#6366F1', '#14B8A6', '#F97316', '#8B5CF6',
]

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'complete'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [rawData, setRawData] = useState<Record<string, string>[]>([])
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [hasEmail, setHasEmail] = useState(false)
  const [source, setSource] = useState('import')
  const [sourceDetails, setSourceDetails] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')
  const [validationResult, setValidationResult] = useState<ReturnType<typeof validateTransformedData> | null>(null)

  // New state for update strategy and tags
  const [updateStrategy, setUpdateStrategy] = useState<UpdateStrategy>('SKIP_EXISTING')
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [newTags, setNewTags] = useState<{ name: string; color: string }[]>([])
  const [newTagInput, setNewTagInput] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])

  // Import progress state
  const [importProgress, setImportProgress] = useState({
    processed: 0,
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  })

  // Fetch available tags
  useEffect(() => {
    fetch('/api/admin/contacts/tags')
      .then(res => res.json())
      .then(data => setAvailableTags(data))
      .catch(console.error)
  }, [])

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split('\n').filter((line) => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
    const data: Record<string, string>[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/(\".*?\"|[^,]+)/g)?.map((v) =>
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

      setRawData(data)

      const detection = detectColumns(data)
      setMappings(detection.mappings)
      setHasEmail(detection.hasEmail)

      setStep('mapping')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
    }
  }

  const handleMappingChange = (index: number, newType: FieldType | 'skip') => {
    const updated = [...mappings]

    if (newType !== 'skip' && newType !== 'unknown') {
      updated.forEach((m, i) => {
        if (i !== index && m.detectedType === newType) {
          m.detectedType = 'unknown'
          m.confidence = 'low'
        }
      })
    }

    updated[index] = {
      ...updated[index],
      detectedType: newType === 'skip' ? 'unknown' : newType,
      confidence: 'high',
    }

    setMappings(updated)
    setHasEmail(updated.some(m => m.detectedType === 'email'))
  }

  const handleAddNewTag = () => {
    if (newTagInput.trim()) {
      // Check if tag already exists in available or new tags
      const existsInAvailable = availableTags.some(
        t => t.name.toLowerCase() === newTagInput.trim().toLowerCase()
      )
      const existsInNew = newTags.some(
        t => t.name.toLowerCase() === newTagInput.trim().toLowerCase()
      )

      if (!existsInAvailable && !existsInNew) {
        setNewTags([...newTags, { name: newTagInput.trim(), color: newTagColor }])
      }
      setNewTagInput('')
      setNewTagColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)])
    }
  }

  const handleRemoveNewTag = (name: string) => {
    setNewTags(newTags.filter(t => t.name !== name))
  }

  const toggleTagSelection = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId))
    } else {
      setSelectedTagIds([...selectedTagIds, tagId])
    }
  }

  const handleProceedToPreview = () => {
    const transformed = transformData(rawData, mappings)
    const validation = validateTransformedData(transformed)

    setValidationResult(validation)
    setStep('preview')
  }

  const handleImport = async () => {
    if (!validationResult) return

    setStep('importing')
    setError('')

    const contacts = validationResult.valid
    const BATCH_SIZE = 100
    const totalBatches = Math.ceil(contacts.length / BATCH_SIZE)

    // Initialize progress
    setImportProgress({
      processed: 0,
      total: contacts.length,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    })

    const allErrors: { row: number; email: string; error: string }[] = [
      ...validationResult.invalid.map(inv => ({
        row: inv.row,
        email: inv.data.email || '',
        error: inv.error,
      })),
    ]
    let totalCreated = 0
    let totalUpdated = 0
    let totalSkipped = 0
    let totalFailed = validationResult.invalid.length

    try {
      for (let i = 0; i < totalBatches; i++) {
        const start = i * BATCH_SIZE
        const end = Math.min(start + BATCH_SIZE, contacts.length)
        const batch = contacts.slice(start, end)

        const res = await fetch('/api/admin/contacts/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contacts: batch,
            source,
            sourceDetails,
            fileName: file?.name || 'import',
            updateStrategy,
            tagIds: selectedTagIds,
            newTags: i === 0 ? newTags : [], // Only create new tags on first batch
            batchOffset: start, // For accurate row numbers in errors
          }),
        })

        const data = await res.json()

        if (res.ok) {
          totalCreated += data.results.created
          totalUpdated += data.results.updated
          totalSkipped += data.results.skipped
          totalFailed += data.results.failed

          // Add errors with adjusted row numbers
          if (data.results.errors) {
            allErrors.push(...data.results.errors.map((err: { row: number; email: string; error: string }) => ({
              ...err,
              row: err.row + start, // Adjust row number for batch offset
            })))
          }

          // Update progress
          setImportProgress({
            processed: end,
            total: contacts.length,
            created: totalCreated,
            updated: totalUpdated,
            skipped: totalSkipped,
            failed: totalFailed,
          })
        } else {
          // If a batch fails completely, mark all as failed
          totalFailed += batch.length
          setImportProgress(prev => ({
            ...prev,
            processed: end,
            failed: totalFailed,
          }))
        }
      }

      setResult({
        total: rawData.length,
        created: totalCreated,
        updated: totalUpdated,
        skipped: totalSkipped,
        failed: totalFailed,
        errors: allErrors.slice(0, 100), // Limit errors shown
      })
      setStep('complete')
    } catch (err) {
      setError('Import failed')
      setStep('preview')
    }
  }

  const resetImport = () => {
    setStep('upload')
    setFile(null)
    setRawData([])
    setMappings([])
    setHasEmail(false)
    setResult(null)
    setError('')
    setSource('import')
    setSourceDetails('')
    setValidationResult(null)
    setUpdateStrategy('SKIP_EXISTING')
    setSelectedTagIds([])
    setNewTags([])
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

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {['Upload', 'Map & Options', 'Preview', 'Import'].map((label, i) => {
          const stepKeys = ['upload', 'mapping', 'preview', 'importing']
          const currentStepIndex = stepKeys.indexOf(step === 'complete' ? 'importing' : step)
          const isActive = i === currentStepIndex
          const isComplete = i < currentStepIndex || step === 'complete'

          return (
            <div key={label} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  isComplete
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-primary-600 text-white'
                    : 'bg-neu-dark text-text-muted'
                }`}
              >
                {isComplete ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`ml-2 text-sm ${
                  isActive ? 'text-text-primary font-medium' : 'text-text-muted'
                }`}
              >
                {label}
              </span>
              {i < 3 && <ChevronRight className="w-4 h-4 mx-3 text-text-muted" />}
            </div>
          )
        })}
      </div>

      <div className="bg-neu-light rounded-neu shadow-neu p-6 max-w-4xl">
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="text-center py-8 border-2 border-dashed border-neu-dark rounded-neu">
              <Upload className="w-12 h-12 mx-auto text-text-muted mb-4" />
              <p className="text-text-secondary mb-2">
                Upload a CSV or JSON file with contact data
              </p>
              <p className="text-sm text-text-muted mb-4">
                <Sparkles className="w-4 h-4 inline mr-1" />
                Smart detection will automatically identify columns
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
              <h3 className="font-medium text-text-primary mb-2">
                Supported formats:
              </h3>
              <ul className="text-sm text-text-muted space-y-1">
                <li>CSV with any column headers (we&apos;ll detect them)</li>
                <li>JSON array of objects</li>
                <li>Full names in one column will be automatically split</li>
                <li>Email is required (must be detectable in your data)</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-3 bg-neu-base rounded-neu">
              <FileText className="w-5 h-5 text-primary-600" />
              <div>
                <p className="font-medium text-text-primary">{file?.name}</p>
                <p className="text-sm text-text-muted">{rawData.length} rows detected</p>
              </div>
            </div>

            {!hasEmail && (
              <div className="bg-amber-50 text-amber-700 p-3 rounded-neu text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  No email column detected. Please select which column contains email addresses.
                </span>
              </div>
            )}

            {/* Column Mapping */}
            <div>
              <h3 className="font-medium text-text-primary mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-500" />
                Column Mapping
              </h3>

              <div className="space-y-3">
                {mappings.map((mapping, index) => (
                  <div
                    key={mapping.originalHeader}
                    className="flex items-center gap-4 p-3 bg-neu-base rounded-neu"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-text-primary truncate">
                        {mapping.originalHeader}
                      </div>
                      <div className="text-xs text-text-muted truncate">
                        {mapping.sampleValues.slice(0, 3).join(', ') || 'No values'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {mapping.detectedType !== 'unknown' && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            CONFIDENCE_COLORS[mapping.confidence]
                          }`}
                        >
                          {mapping.confidence === 'high'
                            ? 'Detected'
                            : mapping.confidence === 'medium'
                            ? 'Likely'
                            : 'Guess'}
                        </span>
                      )}

                      <select
                        value={mapping.detectedType === 'unknown' ? 'skip' : mapping.detectedType}
                        onChange={(e) =>
                          handleMappingChange(index, e.target.value as FieldType | 'skip')
                        }
                        className="rounded-neu border-2 border-transparent bg-neu-light px-3 py-1.5 text-sm text-text-primary shadow-neu focus:border-primary-400 focus:outline-none"
                      >
                        {FIELD_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Update Strategy */}
            <div>
              <h3 className="font-medium text-text-primary mb-3">
                Existing Contacts
              </h3>
              <div className="space-y-2">
                {UPDATE_STRATEGIES.map((strategy) => (
                  <label
                    key={strategy.value}
                    className={`flex items-start gap-3 p-3 rounded-neu cursor-pointer transition-all ${
                      updateStrategy === strategy.value
                        ? 'bg-primary-50 ring-2 ring-primary-400'
                        : 'bg-neu-base hover:bg-neu-dark/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="updateStrategy"
                      value={strategy.value}
                      checked={updateStrategy === strategy.value}
                      onChange={(e) => setUpdateStrategy(e.target.value as UpdateStrategy)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-text-primary">{strategy.label}</div>
                      <div className="text-sm text-text-muted">{strategy.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="font-medium text-text-primary mb-3">
                Apply Tags
              </h3>
              <p className="text-sm text-text-muted mb-3">
                Select existing tags or create new ones to apply to imported contacts
              </p>

              {/* Existing Tags */}
              {availableTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTagSelection(tag.id)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        selectedTagIds.includes(tag.id)
                          ? 'ring-2 ring-offset-1'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        ['--tw-ring-color' as string]: tag.color,
                      } as React.CSSProperties}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}

              {/* New Tags */}
              {newTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {newTags.map((tag) => (
                    <span
                      key={tag.name}
                      className="px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveNewTag(tag.name)}
                        className="hover:opacity-70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add New Tag */}
              <div className="flex gap-2">
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-10 h-10 rounded-neu border-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewTag())}
                  placeholder="Create new tag..."
                  className="flex-1 rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                />
                <Button type="button" variant="secondary" onClick={handleAddNewTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Source */}
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

            <div className="flex justify-between">
              <Button variant="secondary" onClick={resetImport}>
                Cancel
              </Button>
              <Button onClick={handleProceedToPreview} disabled={!hasEmail}>
                Continue to Preview
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && validationResult && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-text-primary">Preview Transformed Data</h3>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600">
                  {validationResult.valid.length} valid
                </span>
                {validationResult.invalid.length > 0 && (
                  <span className="text-red-600">
                    {validationResult.invalid.length} invalid
                  </span>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-neu-base rounded-neu">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-muted">Update Strategy:</span>{' '}
                  <span className="font-medium text-text-primary">
                    {UPDATE_STRATEGIES.find(s => s.value === updateStrategy)?.label}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">Tags to apply:</span>{' '}
                  <span className="font-medium text-text-primary">
                    {selectedTagIds.length + newTags.length || 'None'}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-neu text-sm">
                {error}
              </div>
            )}

            {validationResult.invalid.length > 0 && (
              <div className="bg-amber-50 p-3 rounded-neu">
                <p className="text-amber-700 text-sm font-medium mb-2">
                  {validationResult.invalid.length} rows will be skipped:
                </p>
                <ul className="text-xs text-amber-600 space-y-1 max-h-24 overflow-y-auto">
                  {validationResult.invalid.slice(0, 10).map((inv) => (
                    <li key={inv.row}>
                      Row {inv.row}: {inv.error}
                    </li>
                  ))}
                  {validationResult.invalid.length > 10 && (
                    <li>... and {validationResult.invalid.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-neu-dark">
                    <th className="px-3 py-2 text-left text-text-muted">Email</th>
                    <th className="px-3 py-2 text-left text-text-muted">First Name</th>
                    <th className="px-3 py-2 text-left text-text-muted">Last Name</th>
                    <th className="px-3 py-2 text-left text-text-muted">Phone</th>
                    <th className="px-3 py-2 text-left text-text-muted">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {validationResult.valid.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-b border-neu-dark/50">
                      <td className="px-3 py-2 text-text-secondary">{row.email}</td>
                      <td className="px-3 py-2 text-text-secondary">{row.firstName || '-'}</td>
                      <td className="px-3 py-2 text-text-secondary">{row.lastName || '-'}</td>
                      <td className="px-3 py-2 text-text-secondary">{row.phone || '-'}</td>
                      <td className="px-3 py-2 text-text-secondary truncate max-w-[150px]">
                        {row.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {validationResult.valid.length > 10 && (
                <p className="text-sm text-text-muted mt-2 px-3">
                  ... and {validationResult.valid.length - 10} more rows
                </p>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep('mapping')}>
                Back to Mapping
              </Button>
              <Button onClick={handleImport} disabled={validationResult.valid.length === 0}>
                Import {validationResult.valid.length} Contacts
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 space-y-6">
            <div className="text-center">
              <div className="animate-spin w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4" />
              <p className="text-lg font-medium text-text-primary mb-1">Importing contacts...</p>
              <p className="text-sm text-text-muted">
                {importProgress.processed} of {importProgress.total} processed
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-neu-base rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-300 ease-out"
                style={{
                  width: `${importProgress.total > 0 ? (importProgress.processed / importProgress.total) * 100 : 0}%`,
                }}
              />
            </div>

            {/* Live stats */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-green-50 rounded-neu">
                <p className="text-xl font-bold text-green-600">{importProgress.created}</p>
                <p className="text-xs text-green-600">Created</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-neu">
                <p className="text-xl font-bold text-blue-600">{importProgress.updated}</p>
                <p className="text-xs text-blue-600">Updated</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-neu">
                <p className="text-xl font-bold text-gray-600">{importProgress.skipped}</p>
                <p className="text-xs text-gray-600">Skipped</p>
              </div>
              <div className="p-3 bg-red-50 rounded-neu">
                <p className="text-xl font-bold text-red-600">{importProgress.failed}</p>
                <p className="text-xs text-red-600">Failed</p>
              </div>
            </div>

            <p className="text-xs text-center text-text-muted">
              Processing in batches of 100 contacts...
            </p>
          </div>
        )}

        {step === 'complete' && result && (
          <div className="space-y-6">
            <div className="text-center py-6">
              {result.failed === 0 ? (
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              ) : result.created === 0 && result.updated === 0 ? (
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              ) : (
                <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              )}
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                Import Complete
              </h2>
            </div>

            <div className="grid grid-cols-5 gap-3 text-center">
              <div className="p-3 bg-neu-base rounded-neu">
                <p className="text-xl font-bold text-text-primary">{result.total}</p>
                <p className="text-xs text-text-muted">Total</p>
              </div>
              <div className="p-3 bg-green-50 rounded-neu">
                <p className="text-xl font-bold text-green-600">{result.created}</p>
                <p className="text-xs text-green-600">Created</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-neu">
                <p className="text-xl font-bold text-blue-600">{result.updated}</p>
                <p className="text-xs text-blue-600">Updated</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-neu">
                <p className="text-xl font-bold text-gray-600">{result.skipped}</p>
                <p className="text-xs text-gray-600">Skipped</p>
              </div>
              <div className="p-3 bg-red-50 rounded-neu">
                <p className="text-xl font-bold text-red-600">{result.failed}</p>
                <p className="text-xs text-red-600">Failed</p>
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

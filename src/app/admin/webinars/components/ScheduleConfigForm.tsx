'use client'

import { useState } from 'react'
import { Button, Input, Card } from '@/components/ui'
import {
  Calendar,
  Loader2,
  CheckCircle,
  Repeat,
  Play,
} from 'lucide-react'
import {
  RecurringScheduleSection,
  SpecificDatesSection,
  AdditionalOptionsSection,
} from './schedule-sections'

interface ScheduleConfig {
  id?: string
  eventType: 'RECURRING' | 'ONE_TIME' | 'SPECIFIC_DATES' | 'ON_DEMAND_ONLY'
  startsAt: string
  endsAt: string | null
  recurringDays: number[]
  recurringTimes: string[]
  specificDates: string[]
  onDemandEnabled: boolean
  onDemandUngated: boolean
  justInTimeEnabled: boolean
  intervalMinutes: number
  intervalStartHour: number
  intervalEndHour: number
  replayEnabled: boolean
  replayUngated: boolean
  replayExpiresAfterDays: number | null
  maxSessionsToShow: number
  blackoutDates: string[]
  useAttendeeTimezone: boolean
}

interface ScheduleConfigFormProps {
  webinarId: string
  webinarTimezone: string
  initialConfig?: ScheduleConfig | null
  onSave: (config: ScheduleConfig) => Promise<void>
}

const defaultConfig: ScheduleConfig = {
  eventType: 'RECURRING',
  startsAt: new Date().toISOString().split('T')[0],
  endsAt: null,
  recurringDays: [1, 3, 5], // Mon, Wed, Fri
  recurringTimes: ['10:00', '14:00'],
  specificDates: [],
  onDemandEnabled: false,
  onDemandUngated: false,
  justInTimeEnabled: true,
  intervalMinutes: 15, // Default: every 15 minutes
  intervalStartHour: 9, // 9 AM
  intervalEndHour: 17, // 5 PM
  replayEnabled: true,
  replayUngated: false,
  replayExpiresAfterDays: null,
  maxSessionsToShow: 3,
  blackoutDates: [],
  useAttendeeTimezone: false,
}

export function ScheduleConfigForm({
  webinarId,
  webinarTimezone,
  initialConfig,
  onSave,
}: ScheduleConfigFormProps) {
  const [config, setConfig] = useState<ScheduleConfig>(initialConfig || defaultConfig)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = <K extends keyof ScheduleConfig>(
    field: K,
    value: ScheduleConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      await onSave(config)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save schedule')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Event Type */}
      <Card variant="raised" padding="lg">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Event Type</h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              value: 'RECURRING',
              label: 'Recurring',
              description: 'Repeats weekly on selected days',
              icon: Repeat,
            },
            {
              value: 'ONE_TIME',
              label: 'One-time',
              description: 'Single event on one date',
              icon: Calendar,
            },
            {
              value: 'SPECIFIC_DATES',
              label: 'Specific Dates',
              description: 'Multiple specific dates',
              icon: Calendar,
            },
            {
              value: 'ON_DEMAND_ONLY',
              label: 'On-demand Only',
              description: 'No scheduled times',
              icon: Play,
            },
          ].map((type) => {
            const Icon = type.icon
            const isSelected = config.eventType === type.value
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => handleChange('eventType', type.value as ScheduleConfig['eventType'])}
                className={`p-4 rounded-neu text-left transition-all ${
                  isSelected
                    ? 'bg-primary-100 border-2 border-primary-500 shadow-neu-pressed'
                    : 'bg-neu-base border-2 border-transparent shadow-neu hover:shadow-neu-hover'
                }`}
              >
                <Icon
                  className={`w-5 h-5 mb-2 ${isSelected ? 'text-primary-600' : 'text-text-muted'}`}
                />
                <div className={`font-medium ${isSelected ? 'text-primary-700' : 'text-text-primary'}`}>
                  {type.label}
                </div>
                <div className="text-xs text-text-muted mt-1">{type.description}</div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Date Range */}
      {config.eventType !== 'ON_DEMAND_ONLY' && (
        <Card variant="raised" padding="lg">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Date Range</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Starts"
              type="date"
              value={config.startsAt}
              onChange={(e) => handleChange('startsAt', e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Ends</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={config.endsAt === null}
                    onChange={() => handleChange('endsAt', null)}
                    className="text-primary-600"
                  />
                  <span className="text-sm">Never</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={config.endsAt !== null}
                    onChange={() => handleChange('endsAt', new Date().toISOString().split('T')[0])}
                    className="text-primary-600"
                  />
                  <span className="text-sm">End date</span>
                </label>
              </div>
              {config.endsAt !== null && (
                <input
                  type="date"
                  value={config.endsAt}
                  onChange={(e) => handleChange('endsAt', e.target.value)}
                  className="mt-2 w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                />
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Recurring Schedule */}
      {config.eventType === 'RECURRING' && (
        <RecurringScheduleSection
          recurringDays={config.recurringDays}
          recurringTimes={config.recurringTimes}
          webinarTimezone={webinarTimezone}
          onDaysChange={(days) => handleChange('recurringDays', days)}
          onTimesChange={(times) => handleChange('recurringTimes', times)}
        />
      )}

      {/* Specific Dates */}
      {config.eventType === 'SPECIFIC_DATES' && (
        <SpecificDatesSection
          specificDates={config.specificDates}
          onDatesChange={(dates) => handleChange('specificDates', dates)}
        />
      )}

      {/* Additional Options */}
      <AdditionalOptionsSection
        config={{
          onDemandEnabled: config.onDemandEnabled,
          onDemandUngated: config.onDemandUngated,
          justInTimeEnabled: config.justInTimeEnabled,
          intervalMinutes: config.intervalMinutes,
          intervalStartHour: config.intervalStartHour,
          intervalEndHour: config.intervalEndHour,
          replayEnabled: config.replayEnabled,
          replayUngated: config.replayUngated,
          replayExpiresAfterDays: config.replayExpiresAfterDays,
          useAttendeeTimezone: config.useAttendeeTimezone,
          maxSessionsToShow: config.maxSessionsToShow,
        }}
        webinarTimezone={webinarTimezone}
        onChange={(field, value) => {
          handleChange(field as keyof ScheduleConfig, value as any)
        }}
      />

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-neu text-red-700">
          {error}
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Schedule
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

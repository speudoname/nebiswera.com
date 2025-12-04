'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Card } from '@/components/ui'
import {
  Calendar,
  Clock,
  Plus,
  X,
  Loader2,
  CheckCircle,
  RefreshCw,
  Play,
  Repeat,
} from 'lucide-react'

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
  justInTimeMinutes: number
  intervalMinutes: number | null
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
  justInTimeMinutes: 15,
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

const DAYS = [
  { value: 0, label: 'Sun', shortLabel: 'S' },
  { value: 1, label: 'Mon', shortLabel: 'M' },
  { value: 2, label: 'Tue', shortLabel: 'T' },
  { value: 3, label: 'Wed', shortLabel: 'W' },
  { value: 4, label: 'Thu', shortLabel: 'T' },
  { value: 5, label: 'Fri', shortLabel: 'F' },
  { value: 6, label: 'Sat', shortLabel: 'S' },
]

export function ScheduleConfigForm({
  webinarId,
  webinarTimezone,
  initialConfig,
  onSave,
}: ScheduleConfigFormProps) {
  const [config, setConfig] = useState<ScheduleConfig>(initialConfig || defaultConfig)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newTime, setNewTime] = useState('10:00')

  const handleChange = <K extends keyof ScheduleConfig>(
    field: K,
    value: ScheduleConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const toggleDay = (day: number) => {
    setConfig((prev) => ({
      ...prev,
      recurringDays: prev.recurringDays.includes(day)
        ? prev.recurringDays.filter((d) => d !== day)
        : [...prev.recurringDays, day].sort((a, b) => a - b),
    }))
  }

  const addTime = () => {
    if (newTime && !config.recurringTimes.includes(newTime)) {
      setConfig((prev) => ({
        ...prev,
        recurringTimes: [...prev.recurringTimes, newTime].sort(),
      }))
    }
  }

  const removeTime = (time: string) => {
    setConfig((prev) => ({
      ...prev,
      recurringTimes: prev.recurringTimes.filter((t) => t !== time),
    }))
  }

  const addSpecificDate = () => {
    const today = new Date().toISOString().split('T')[0]
    if (!config.specificDates.includes(today)) {
      setConfig((prev) => ({
        ...prev,
        specificDates: [...prev.specificDates, today].sort(),
      }))
    }
  }

  const updateSpecificDate = (index: number, value: string) => {
    setConfig((prev) => ({
      ...prev,
      specificDates: prev.specificDates.map((d, i) => (i === index ? value : d)).sort(),
    }))
  }

  const removeSpecificDate = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      specificDates: prev.specificDates.filter((_, i) => i !== index),
    }))
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
        <Card variant="raised" padding="lg">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Weekly Schedule</h3>

          {/* Days */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-3">Days</label>
            <div className="flex gap-2">
              {DAYS.map((day) => {
                const isSelected = config.recurringDays.includes(day.value)
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-primary-500 text-white shadow-neu-pressed'
                        : 'bg-neu-base text-text-primary shadow-neu hover:shadow-neu-hover'
                    }`}
                  >
                    {day.shortLabel}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-text-muted mt-2">
              Selected: {config.recurringDays.map((d) => DAYS[d].label).join(', ') || 'None'}
            </p>
          </div>

          {/* Times */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Times ({webinarTimezone})
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {config.recurringTimes.map((time) => (
                <div
                  key={time}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm"
                >
                  <Clock className="w-3 h-3" />
                  {time}
                  <button
                    type="button"
                    onClick={() => removeTime(time)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="rounded-neu border-2 border-transparent bg-neu-base px-4 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
              />
              <Button type="button" variant="secondary" size="sm" onClick={addTime}>
                <Plus className="w-4 h-4 mr-1" />
                Add time
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Specific Dates */}
      {config.eventType === 'SPECIFIC_DATES' && (
        <Card variant="raised" padding="lg">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Specific Dates & Times</h3>

          <div className="space-y-3 mb-4">
            {config.specificDates.map((date, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => updateSpecificDate(index, e.target.value)}
                  className="flex-1 rounded-neu border-2 border-transparent bg-neu-base px-4 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeSpecificDate(index)}
                  className="p-2 text-text-muted hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <Button type="button" variant="secondary" size="sm" onClick={addSpecificDate}>
            <Plus className="w-4 h-4 mr-1" />
            Add date
          </Button>
        </Card>
      )}

      {/* Additional Options */}
      <Card variant="raised" padding="lg">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Additional Options</h3>

        <div className="space-y-6">
          {/* On-demand */}
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium text-text-primary">On-demand webinars</div>
              <p className="text-sm text-text-muted">
                Allow viewers to start watching immediately after registering
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.onDemandEnabled}
                onChange={(e) => handleChange('onDemandEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neu-dark rounded-full peer peer-checked:bg-primary-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>

          {config.onDemandEnabled && (
            <div className="ml-6 flex items-center gap-2">
              <input
                type="checkbox"
                id="onDemandUngated"
                checked={config.onDemandUngated}
                onChange={(e) => handleChange('onDemandUngated', e.target.checked)}
                className="rounded border-gray-300 text-primary-600"
              />
              <label htmlFor="onDemandUngated" className="text-sm text-text-secondary">
                Enable ungated on-demand link (no registration required)
              </label>
            </div>
          )}

          {/* Just-in-time */}
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium text-text-primary">Just-in-time sessions</div>
              <p className="text-sm text-text-muted">
                Show "Starting in X minutes" option on registration
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.justInTimeEnabled}
                onChange={(e) => handleChange('justInTimeEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neu-dark rounded-full peer peer-checked:bg-primary-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>

          {config.justInTimeEnabled && (
            <div className="ml-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Session Interval
                </label>
                <select
                  value={config.intervalMinutes || 15}
                  onChange={(e) => handleChange('intervalMinutes', parseInt(e.target.value))}
                  className="rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                >
                  <option value={5}>Every 5 minutes</option>
                  <option value={15}>Every 15 minutes</option>
                  <option value={30}>Every 30 minutes</option>
                  <option value={60}>Every 60 minutes</option>
                </select>
                <p className="mt-1 text-xs text-text-muted">
                  {config.intervalMinutes === 5 && "Creates 96 sessions per day"}
                  {config.intervalMinutes === 15 && "Creates 32 sessions per day"}
                  {config.intervalMinutes === 30 && "Creates 16 sessions per day"}
                  {config.intervalMinutes === 60 && "Creates 8 sessions per day"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Start Hour
                  </label>
                  <select
                    value={config.intervalStartHour}
                    onChange={(e) => handleChange('intervalStartHour', parseInt(e.target.value))}
                    className="w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    End Hour
                  </label>
                  <select
                    value={config.intervalEndHour}
                    onChange={(e) => handleChange('intervalEndHour', parseInt(e.target.value))}
                    className="w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-xs text-text-muted bg-neu-dark/30 rounded-lg p-3">
                <strong>Preview:</strong> Sessions will be available between{' '}
                {config.intervalStartHour === 0 ? '12 AM' : config.intervalStartHour < 12 ? `${config.intervalStartHour} AM` : config.intervalStartHour === 12 ? '12 PM' : `${config.intervalStartHour - 12} PM`}
                {' and '}
                {config.intervalEndHour === 0 ? '12 AM' : config.intervalEndHour < 12 ? `${config.intervalEndHour} AM` : config.intervalEndHour === 12 ? '12 PM' : `${config.intervalEndHour - 12} PM`}
                {' '}every day, at {config.intervalMinutes}-minute intervals.
              </div>
            </div>
          )}

          {/* Replays */}
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium text-text-primary">Replays</div>
              <p className="text-sm text-text-muted">
                Allow registrants to watch replay after the webinar
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.replayEnabled}
                onChange={(e) => handleChange('replayEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neu-dark rounded-full peer peer-checked:bg-primary-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>

          {config.replayEnabled && (
            <div className="ml-6 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="replayUngated"
                  checked={config.replayUngated}
                  onChange={(e) => handleChange('replayUngated', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600"
                />
                <label htmlFor="replayUngated" className="text-sm text-text-secondary">
                  Enable ungated replay link (no registration required)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">Replay expires after</span>
                <select
                  value={config.replayExpiresAfterDays ?? 'never'}
                  onChange={(e) =>
                    handleChange(
                      'replayExpiresAfterDays',
                      e.target.value === 'never' ? null : parseInt(e.target.value)
                    )
                  }
                  className="rounded-neu border-2 border-transparent bg-neu-base px-3 py-1.5 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                >
                  <option value="never">Never</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>
            </div>
          )}

          {/* Timezone */}
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium text-text-primary">Timezone handling</div>
              <p className="text-sm text-text-muted">
                How to display times to attendees
              </p>
            </div>
            <select
              value={config.useAttendeeTimezone ? 'attendee' : 'fixed'}
              onChange={(e) => handleChange('useAttendeeTimezone', e.target.value === 'attendee')}
              className="rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
            >
              <option value="fixed">Fixed ({webinarTimezone})</option>
              <option value="attendee">Attendee's local time</option>
            </select>
          </div>

          {/* Max sessions */}
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium text-text-primary">Sessions to display</div>
              <p className="text-sm text-text-muted">
                Maximum number of upcoming sessions to show on registration
              </p>
            </div>
            <select
              value={config.maxSessionsToShow}
              onChange={(e) => handleChange('maxSessionsToShow', parseInt(e.target.value))}
              className="rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
            >
              <option value={1}>1 session</option>
              <option value={2}>2 sessions</option>
              <option value={3}>3 sessions</option>
              <option value={5}>5 sessions</option>
              <option value={10}>10 sessions</option>
            </select>
          </div>
        </div>
      </Card>

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

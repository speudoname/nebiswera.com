/**
 * AdditionalOptionsSection Component
 *
 * Handles all additional scheduling options:
 * - On-demand webinars
 * - Just-in-time sessions
 * - Replays
 * - Timezone handling
 * - Max sessions display
 */

'use client'

import { Card } from '@/components/ui'

interface AdditionalOptions {
  onDemandEnabled: boolean
  onDemandUngated: boolean
  justInTimeEnabled: boolean
  intervalMinutes: number | null
  intervalStartHour: number
  intervalEndHour: number
  replayEnabled: boolean
  replayUngated: boolean
  replayExpiresAfterDays: number | null
  useAttendeeTimezone: boolean
  maxSessionsToShow: number
}

interface AdditionalOptionsSectionProps {
  config: AdditionalOptions
  webinarTimezone: string
  onChange: <K extends keyof AdditionalOptions>(field: K, value: AdditionalOptions[K]) => void
}

export function AdditionalOptionsSection({
  config,
  webinarTimezone,
  onChange,
}: AdditionalOptionsSectionProps) {
  return (
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
              onChange={(e) => onChange('onDemandEnabled', e.target.checked)}
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
              onChange={(e) => onChange('onDemandUngated', e.target.checked)}
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
              onChange={(e) => onChange('justInTimeEnabled', e.target.checked)}
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
                onChange={(e) => onChange('intervalMinutes', parseInt(e.target.value))}
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
                  onChange={(e) => onChange('intervalStartHour', parseInt(e.target.value))}
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
                  onChange={(e) => onChange('intervalEndHour', parseInt(e.target.value))}
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
              onChange={(e) => onChange('replayEnabled', e.target.checked)}
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
                onChange={(e) => onChange('replayUngated', e.target.checked)}
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
                  onChange(
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
            onChange={(e) => onChange('useAttendeeTimezone', e.target.value === 'attendee')}
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
            onChange={(e) => onChange('maxSessionsToShow', parseInt(e.target.value))}
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
  )
}

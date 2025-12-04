'use client'

import { MessageSquare, TrendingUp, Clock, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface ChatData {
  totalMessages: number
  uniqueChatters: number
  messagesPerMinute: Array<{ minute: number; count: number }>
  topChatters: Array<{ email: string; name: string; count: number }>
  peakActivity: {
    minute: number
    count: number
  }
}

interface ChatAnalyticsProps {
  data: ChatData
  videoDuration: number
}

export function ChatAnalytics({ data, videoDuration }: ChatAnalyticsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const maxMessages = Math.max(...data.messagesPerMinute.map((m) => m.count), 1)
  const avgMessagesPerMinute = data.messagesPerMinute.length > 0
    ? Math.round(data.totalMessages / data.messagesPerMinute.length)
    : 0

  const chatParticipationRate = data.uniqueChatters > 0
    ? Math.round((data.uniqueChatters / (data.uniqueChatters + 10)) * 100) // Approximate
    : 0

  return (
    <Card variant="raised" padding="lg">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-primary-500" />
        <h3 className="text-lg font-semibold text-text-primary">Chat Analytics</h3>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-neu-light rounded-lg">
          <p className="text-2xl font-bold text-text-primary">{data.totalMessages}</p>
          <p className="text-xs text-text-secondary mt-1">Total Messages</p>
        </div>
        <div className="text-center p-4 bg-neu-light rounded-lg">
          <p className="text-2xl font-bold text-primary-600">{data.uniqueChatters}</p>
          <p className="text-xs text-text-secondary mt-1">Unique Chatters</p>
        </div>
        <div className="text-center p-4 bg-neu-light rounded-lg">
          <p className="text-2xl font-bold text-green-600">{avgMessagesPerMinute}</p>
          <p className="text-xs text-text-secondary mt-1">Avg per Minute</p>
        </div>
        <div className="text-center p-4 bg-neu-light rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{data.peakActivity.count}</p>
          <p className="text-xs text-text-secondary mt-1">Peak Messages</p>
        </div>
      </div>

      {/* Messages Timeline */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-text-primary">Messages Over Time</h4>
          <span className="text-xs text-text-secondary">
            Peak at {formatTime(data.peakActivity.minute * 60)}
          </span>
        </div>

        {data.messagesPerMinute.length > 0 ? (
          <div className="flex items-end gap-1 h-32">
            {data.messagesPerMinute.map((item, index) => {
              const height = (item.count / maxMessages) * 100
              return (
                <div
                  key={index}
                  className="flex-1 group relative"
                >
                  <div
                    className={`w-full rounded-t transition-all ${
                      item.minute === data.peakActivity.minute
                        ? 'bg-primary-500'
                        : 'bg-blue-400 hover:bg-blue-500'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-10">
                    {formatTime(item.minute * 60)}: {item.count} msg
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center bg-neu-light rounded-lg">
            <p className="text-sm text-text-secondary">No chat activity</p>
          </div>
        )}

        {/* Timeline Labels */}
        {data.messagesPerMinute.length > 0 && (
          <div className="flex justify-between mt-2 text-xs text-text-secondary">
            <span>0:00</span>
            <span>{formatTime(videoDuration)}</span>
          </div>
        )}
      </div>

      {/* Top Chatters */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary-500" />
          <h4 className="text-sm font-medium text-text-primary">Top Chatters</h4>
        </div>

        {data.topChatters.length > 0 ? (
          <div className="space-y-2">
            {data.topChatters.map((chatter, index) => (
              <div
                key={chatter.email}
                className="flex items-center gap-3 p-3 bg-neu-light rounded-lg hover:shadow-neu transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {chatter.name}
                  </p>
                  <p className="text-xs text-text-secondary truncate">{chatter.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-text-secondary" />
                  <span className="text-sm font-semibold text-text-primary">
                    {chatter.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-neu-light rounded-lg text-center">
            <p className="text-sm text-text-secondary">No chat messages yet</p>
          </div>
        )}
      </div>

      {/* Insights */}
      {data.totalMessages > 0 && (
        <div className="mt-6 p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-green-900">
            <strong>Insight:</strong>{' '}
            {data.peakActivity.count > avgMessagesPerMinute * 2
              ? `Peak activity at ${formatTime(data.peakActivity.minute * 60)} - consider reviewing that content segment for engagement drivers.`
              : avgMessagesPerMinute > 5
              ? 'Consistent chat engagement throughout the webinar - audience is highly engaged!'
              : 'Moderate chat activity - consider adding more discussion prompts or Q&A segments.'}
          </p>
        </div>
      )}
    </Card>
  )
}

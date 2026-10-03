import { useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { MoodBadge } from '../components/MoodBadge'
import { Button } from '../components/Button'
import { Wind, MessageCircle, Smile, Leaf, Plus, Sparkles, Activity } from 'lucide-react'
import type { WellnessActivity } from '../types'

const ACTIVITY_META: Record<WellnessActivity['type'], { icon: typeof Wind; color: string; bg: string }> = {
  breathing: { icon: Wind,          color: 'text-blue-500',   bg: 'bg-blue-50'   },
  chat:      { icon: MessageCircle, color: 'text-violet-500', bg: 'bg-violet-50' },
  mood:      { icon: Smile,         color: 'text-emerald-500',bg: 'bg-emerald-50'},
  grounding: { icon: Leaf,          color: 'text-teal-500',   bg: 'bg-teal-50'   },
  fusion:    { icon: Sparkles,      color: 'text-indigo-500', bg: 'bg-indigo-50' },
  signal:    { icon: Activity,      color: 'text-amber-500',  bg: 'bg-amber-50'  },
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString())     return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function groupByDay<T extends { timestamp: string }>(items: T[]): { label: string; items: T[] }[] {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = item.timestamp.slice(0, 10)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, items]) => ({ label: formatDate(key + 'T12:00:00'), items }))
}

export function History() {
  const navigate = useNavigate()
  const { moodHistory, activities } = useApp()

  const moodGroups     = groupByDay(moodHistory)
  const activityGroups = groupByDay(activities)
  const hasAny = moodHistory.length > 0 || activities.length > 0

  if (!hasAny) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <span className="text-5xl mb-4">🌱</span>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Nothing here yet</h2>
        <p className="text-gray-400 text-sm mb-8 max-w-xs">
          Your wellness history will appear here after your first mood check-in or activity.
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          <Button onClick={() => navigate('/mood')}>
            <Plus size={15} /> Start a mood check-in
          </Button>
          <Button variant="secondary" onClick={() => navigate('/breathing')}>
            <Wind size={15} /> Try a breathing exercise
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-28 md:pb-8 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">History</h1>
      <p className="text-gray-400 text-sm mb-8">Your wellness journey over time.</p>

      {/* ── Mood check-ins ── */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Mood Check-ins
        </h2>
        {moodGroups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-xs">
            <p className="text-gray-400 text-sm mb-3">No mood check-ins yet.</p>
            <Button size="sm" variant="secondary" onClick={() => navigate('/mood')}>
              Check in now
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {moodGroups.map(({ label, items }) => (
              <div key={label}>
                {/* Date label with left-border accent */}
                <p className="text-xs font-semibold text-gray-400 mb-2 border-l-2 border-violet-200 pl-2">{label}</p>
                <div className="flex flex-col gap-2">
                  {items.map(entry => (
                    <div
                      key={entry.id}
                      className="bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <MoodBadge mood={entry.mood} size="sm" />
                            <span className="text-xs text-gray-400">{formatTime(entry.timestamp)}</span>
                          </div>
                          {entry.note && (
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{entry.note}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Separator between sections */}
      <hr className="border-gray-100 mb-8" />

      {/* ── Activity log ── */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
          Activity Log
        </h2>
        {activityGroups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-xs">
            <p className="text-gray-400 text-sm">No activities recorded yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {activityGroups.map(({ label, items }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-gray-400 mb-2 border-l-2 border-violet-200 pl-2">{label}</p>
                {/* Plain div instead of Card to avoid double-border */}
                <div className="divide-y divide-gray-100 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                  {items.map(a => {
                    const meta = ACTIVITY_META[a.type]
                    const Icon = meta.icon
                    return (
                      <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}>
                          <Icon size={14} className={meta.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{a.label}</p>
                          {a.duration != null && a.duration > 0 && (
                            <p className="text-xs text-gray-400">
                              {a.duration < 60 ? `${a.duration}s` : `${Math.round(a.duration / 60)} min`}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{formatTime(a.timestamp)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

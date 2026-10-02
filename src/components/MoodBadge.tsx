import type { Mood } from '../types'

export const moodConfig: Record<Mood, {
  emoji: string
  label: string
  bg: string
  text: string
  border: string
  ring: string
  description: string
}> = {
  great:     { emoji: '😄', label: 'Great',     bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-400', ring: 'ring-emerald-300', description: 'Feeling energised and positive'   },
  good:      { emoji: '🙂', label: 'Good',      bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-400',    ring: 'ring-blue-300',    description: 'Generally doing well'              },
  okay:      { emoji: '😐', label: 'Okay',      bg: 'bg-yellow-100',  text: 'text-yellow-700',  border: 'border-yellow-400',  ring: 'ring-yellow-300',  description: 'Neutral, getting through the day'  },
  low:       { emoji: '😔', label: 'Low',       bg: 'bg-orange-100',  text: 'text-orange-700',  border: 'border-orange-400',  ring: 'ring-orange-300',  description: 'Feeling a bit down or flat'        },
  difficult: { emoji: '😢', label: 'Difficult', bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-400',     ring: 'ring-red-300',     description: 'Having a tough time right now'     },
}

export function MoodBadge({ mood, size = 'md' }: { mood: Mood; size?: 'sm' | 'md' }) {
  const c = moodConfig[mood]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${c.bg} ${c.text} ${
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    }`}>
      {c.emoji} {c.label}
    </span>
  )
}

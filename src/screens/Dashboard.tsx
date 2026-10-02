import { useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { Card } from '../components/Card'
import { MoodBadge } from '../components/MoodBadge'
import {
  Smile, MessageCircle, Wind, Activity,
  Clock, ChevronRight, Mic, BarChart2, Leaf,
} from 'lucide-react'

const quickActions = [
  { label: 'Check Mood',    icon: Smile,         to: '/mood',      bg: 'bg-violet-100', text: 'text-violet-700', desc: 'How are you feeling?' },
  { label: 'Talk to Sync',  icon: MessageCircle, to: '/companion', bg: 'bg-blue-100',   text: 'text-blue-700',   desc: 'AI wellness chat'     },
  { label: 'Breathe',       icon: Wind,          to: '/breathing', bg: 'bg-emerald-100',text: 'text-emerald-700',desc: 'Guided exercise'       },
  { label: 'Ground',        icon: Leaf,          to: '/grounding', bg: 'bg-green-100',  text: 'text-green-700',  desc: '5-4-3-2-1 technique'  },
  { label: 'Voice',         icon: Mic,           to: '/voice',     bg: 'bg-pink-100',   text: 'text-pink-700',   desc: 'Speak with Sync'      },
  { label: 'Signals',       icon: Activity,      to: '/signals',   bg: 'bg-orange-100', text: 'text-orange-700', desc: 'Wellness indicators'  },
  { label: 'Summary',       icon: BarChart2,     to: '/summary',   bg: 'bg-teal-100',   text: 'text-teal-700',   desc: 'Trends & insights'    },
  { label: 'History',       icon: Clock,         to: '/history',   bg: 'bg-rose-100',   text: 'text-rose-700',   desc: 'Past check-ins'       },
]

function greeting(name: string) {
  const h = new Date().getHours()
  const time = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${time}, ${name || 'Friend'} 👋`
}

/** Count unique calendar days with at least one mood entry */
function streak(timestamps: string[]): number {
  if (!timestamps.length) return 0
  const days = [...new Set(timestamps.map(t => t.slice(0, 10)))].sort().reverse()
  let count = 0
  let cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  for (const d of days) {
    const day = new Date(d)
    const diff = Math.round((cursor.getTime() - day.getTime()) / 86400000)
    if (diff > 1) break
    count++
    cursor = day
  }
  return count
}

export function Dashboard() {
  const navigate = useNavigate()
  const { profile, currentMood, moodHistory, activities } = useApp()
  const currentStreak = streak(moodHistory.map(e => e.timestamp))

  return (
    <div className="flex-1 p-5 md:p-8 pb-24 md:pb-8 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{greeting(profile.name)}</h1>
        <p className="text-gray-500 text-sm mt-1">How can I support you today?</p>
      </div>

      {/* Mood banner */}
      {currentMood ? (
        <Card className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1">Today's mood</p>
            <MoodBadge mood={currentMood.mood} />
            {currentMood.note && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">{currentMood.note}</p>
            )}
          </div>
          <button onClick={() => navigate('/mood')} className="text-violet-400 hover:text-violet-600">
            <ChevronRight size={20} />
          </button>
        </Card>
      ) : (
        <Card className="mb-5 bg-violet-50 border-violet-100" onClick={() => navigate('/mood')}>
          <p className="text-sm font-medium text-violet-700">✨ Start with a mood check-in</p>
          <p className="text-xs text-violet-500 mt-0.5">Takes less than a minute</p>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <p className="text-2xl font-bold text-violet-600">{moodHistory.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Check-ins</p>
        </Card>
        <Card>
          <p className="text-2xl font-bold text-emerald-600">{activities.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Activities</p>
        </Card>
        <Card>
          <p className="text-2xl font-bold text-orange-500">{currentStreak}</p>
          <p className="text-xs text-gray-400 mt-0.5">Day streak 🔥</p>
        </Card>
      </div>

      {/* Quick actions */}
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {quickActions.map(({ label, icon: Icon, to, bg, text, desc }) => (
          <Card key={to} onClick={() => navigate(to)} className="flex flex-col gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon size={20} className={text} />
            </div>
            <div>
              <p className="font-medium text-sm text-gray-800">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { Card } from '../components/Card'
import { MoodBadge } from '../components/MoodBadge'
import {
  Smile, MessageCircle, Wind, Activity,
  Clock, ChevronRight, Mic, BarChart2, Leaf, Heart, Sun
} from 'lucide-react'

const quickActions = [
  { label: 'Voice Agent',   icon: Mic,           to: '/voice',     bg: 'bg-violet-100', text: 'text-violet-700', desc: 'Hands-free voice chat' },
  { label: 'Check Mood',    icon: Smile,         to: '/mood',      bg: 'bg-amber-100',  text: 'text-amber-700',  desc: 'Daily emotional check' },
  { label: 'AI Companion',  icon: MessageCircle, to: '/companion', bg: 'bg-blue-100',   text: 'text-blue-700',   desc: 'Guided wellness chat'  },
  { label: 'Breathe',       icon: Wind,          to: '/breathing', bg: 'bg-emerald-100',text: 'text-emerald-700',desc: '2-min nervous reset' },
  { label: 'Grounding',     icon: Leaf,          to: '/grounding', bg: 'bg-teal-100',   text: 'text-teal-700',   desc: '5-4-3-2-1 technique'  },
  { label: 'Signals',       icon: Activity,      to: '/signals',   bg: 'bg-orange-100', text: 'text-orange-700', desc: 'EEG & GSR indicators'  },
  { label: 'Summary',       icon: BarChart2,     to: '/summary',   bg: 'bg-indigo-100', text: 'text-indigo-700', desc: 'Trends & progress'    },
  { label: 'History',       icon: Clock,         to: '/history',   bg: 'bg-rose-100',   text: 'text-rose-700',   desc: 'Activity log'         },
]

function greeting(name: string) {
  const h = new Date().getHours()
  const time = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${time}, ${name || 'Friend'}`
}

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
    <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-3xl mx-auto w-full">

      {/* ── Greeting Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-600 mb-1">
            <Sun size={14} className="text-amber-500" /> Daily Wellness Space
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            {greeting(profile.name)} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            How can FeelSync support your well-being today?
          </p>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm hover:bg-violet-200 transition-colors"
          title="Profile settings"
        >
          {profile.name ? profile.name.slice(0, 2).toUpperCase() : 'ME'}
        </button>
      </div>

      {/* ── Prominent "Talk to FeelSync" Voice Hero Banner ── */}
      <div className="mb-6 bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-violet-200/50 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm mb-2">
              <Mic size={14} /> Voice Agent Experience
            </div>
            <h2 className="text-xl font-bold tracking-tight">Talk to FeelSync</h2>
            <p className="text-violet-100 text-xs md:text-sm mt-1 leading-relaxed">
              Hands-free, real-time voice support powered by browser speech and secure AI backend.
            </p>
          </div>
          <button
            onClick={() => navigate('/voice')}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-violet-700 font-semibold text-sm hover:bg-violet-50 transition-all flex items-center justify-center gap-2 shadow-md shrink-0 active:scale-95"
          >
            <Mic size={18} className="text-violet-600 animate-pulse" />
            Start Voice Agent
          </button>
        </div>
      </div>

      {/* ── Today's Mood Banner ── */}
      {currentMood ? (
        <Card className="mb-6 flex items-center justify-between bg-white border-gray-150 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-2xl">
              💜
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Today's mood check-in</p>
              <div className="mt-1">
                <MoodBadge mood={currentMood.mood} />
              </div>
              {currentMood.note && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-1 italic">"{currentMood.note}"</p>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('/mood')}
            className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors"
          >
            Update <ChevronRight size={16} />
          </button>
        </Card>
      ) : (
        <Card
          className="mb-6 bg-gradient-to-r from-amber-50 via-violet-50 to-emerald-50 border-violet-100 hover:border-violet-300 transition-all cursor-pointer p-5"
          onClick={() => navigate('/mood')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">✨ How are you feeling right now?</p>
              <p className="text-xs text-gray-500 mt-0.5">Take 30 seconds to log your emotional state.</p>
            </div>
            <button className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold shadow-sm hover:bg-violet-700 transition-colors">
              Check in
            </button>
          </div>
        </Card>
      )}

      {/* ── Today's Overview Stats ── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-violet-600">{moodHistory.length}</p>
          <p className="text-xs text-gray-400 mt-0.5 font-medium">Check-ins</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{activities.length}</p>
          <p className="text-xs text-gray-400 mt-0.5 font-medium">Activities</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{currentStreak}</p>
          <p className="text-xs text-gray-400 mt-0.5 font-medium">Day streak 🔥</p>
        </Card>
      </div>

      {/* ── Daily Intention / Reflection Section ── */}
      <Card className="mb-6 bg-white border border-gray-150 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Heart size={20} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Gentle Reminder</h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              "Small consistent moments of mindful self-check-in compound over time. Be patient with your emotional journey."
            </p>
          </div>
        </div>
      </Card>

      {/* ── Quick Support Actions Grid ── */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Quick Support Actions
        </h2>
        <span className="text-xs text-gray-400">8 tools available</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map(({ label, icon: Icon, to, bg, text, desc }) => (
          <Card
            key={to}
            onClick={() => navigate(to)}
            className="flex flex-col gap-2 p-4 cursor-pointer hover:-translate-y-0.5 transition-all shadow-sm hover:shadow-md"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon size={20} className={text} />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800 leading-tight">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
          </Card>
        ))}
      </div>

    </div>
  )
}


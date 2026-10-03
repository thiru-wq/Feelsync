import { useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { Card } from '../components/Card'
import { MoodBadge, moodConfig } from '../components/MoodBadge'
import { Button } from '../components/Button'
import type { Mood } from '../types'
import { TrendingUp, Wind, MessageCircle, Smile, Flame, Plus } from 'lucide-react'

const moodScore: Record<Mood, number> = { great: 5, good: 4, okay: 3, low: 2, difficult: 1 }
const moodLabel: Record<number, string> = { 5: 'Great', 4: 'Good', 3: 'Okay', 2: 'Low', 1: 'Difficult' }

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

export function Summary() {
  const navigate = useNavigate()
  const { moodHistory, activities } = useApp()

  const recent     = moodHistory.slice(0, 7)
  const avgScore   = recent.length
    ? recent.reduce((s, e) => s + moodScore[e.mood], 0) / recent.length
    : null
  const avgRounded = avgScore !== null ? Math.round(avgScore * 10) / 10 : null
  const avgLabel   = avgScore !== null ? moodLabel[Math.round(avgScore)] : null

  const moodCounts = moodHistory.reduce<Record<string, number>>((acc, e) => {
    acc[e.mood] = (acc[e.mood] ?? 0) + 1; return acc
  }, {})
  const topMood         = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as Mood | undefined
  const currentStreak   = streak(moodHistory.map(e => e.timestamp))
  const breathingSessions = activities.filter(a => a.type === 'breathing').length
  const chatSessions    = activities.filter(a => a.type === 'chat').length

  if (moodHistory.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <span className="text-5xl mb-4">📊</span>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No data yet</h2>
        <p className="text-gray-400 text-sm mb-8 max-w-xs">
          Complete your first mood check-in to start seeing your wellness summary and trends.
        </p>
        <Button onClick={() => navigate('/mood')} className="w-full max-w-xs">
          <Plus size={15} /> Start a mood check-in
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-28 md:pb-8 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Wellness Summary</h1>
      <p className="text-gray-400 text-sm mb-6">A snapshot of your recent wellness journey.</p>

      {/* ── Stats grid — reduced padding ── */}
      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
        <Card className="p-4">
          <TrendingUp size={17} className="text-violet-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900 leading-none">{avgRounded ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">Avg mood score</p>
          {avgLabel && <p className="text-xs text-violet-500 mt-0.5 font-medium">{avgLabel}</p>}
        </Card>
        <Card className="p-4">
          <Flame size={17} className="text-orange-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900 leading-none">{currentStreak}</p>
          <p className="text-xs text-gray-400 mt-1">Day streak 🔥</p>
        </Card>
        <Card className="p-4">
          <Wind size={17} className="text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900 leading-none">{breathingSessions}</p>
          <p className="text-xs text-gray-400 mt-1">Breathing sessions</p>
        </Card>
        <Card className="p-4">
          <MessageCircle size={17} className="text-pink-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900 leading-none">{chatSessions}</p>
          <p className="text-xs text-gray-400 mt-1">Sync chats</p>
        </Card>
      </div>

      {/* ── Most frequent mood ── */}
      {topMood && (
        <Card className="mb-6 p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-400 mb-1.5">Most frequent mood</p>
              <MoodBadge mood={topMood} />
            </div>
            <div className="text-right min-w-0">
              <p className="text-2xl font-bold text-gray-900">{moodCounts[topMood]}</p>
              <p className="text-xs text-gray-400">check-in{moodCounts[topMood] !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Mood trend sparkline ── */}
      <Card className="mb-6 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-700">Mood trend</p>
          <p className="text-xs text-gray-400">Last {recent.length} check-in{recent.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-end gap-1.5 h-20">
          {recent.slice().reverse().map((e) => {
            const heightPct = (moodScore[e.mood] / 5) * 100
            const c = moodConfig[e.mood]
            const dateStr = new Date(e.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            return (
              <div key={e.id} className="flex-1 flex flex-col items-center gap-1" title={`${c.label} — ${dateStr}`}>
                <div
                  className={`w-full rounded-t ${c.bg} transition-all`}
                  style={{ height: `${heightPct}%`, minHeight: '8px' }}
                />
                <span className="text-xs leading-none">{c.emoji}</span>
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-300">
          <span>Difficult</span>
          <span>Great</span>
        </div>
      </Card>

      {/* ── Total check-ins ── */}
      <Card className="p-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Smile size={19} className="text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold text-gray-900 leading-none">{moodHistory.length}</p>
            <p className="text-xs text-gray-400 mt-1">Total mood check-ins</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0"
            onClick={() => navigate('/mood')}
          >
            Check in
          </Button>
        </div>
      </Card>
    </div>
  )
}

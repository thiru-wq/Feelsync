import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { Button } from '../components/Button'
import { MoodBadge, moodConfig } from '../components/MoodBadge'
import type { Mood } from '../types'
import { CheckCircle, MessageCircle, Wind, ChevronRight } from 'lucide-react'

const MOODS: Mood[] = ['great', 'good', 'okay', 'low', 'difficult']

// Suggestions shown after saving, keyed by mood
const POST_SAVE_SUGGESTIONS: Record<Mood, { label: string; icon: typeof Wind; to: string }[]> = {
  great:     [{ label: 'Share with Sync', icon: MessageCircle, to: '/companion' }],
  good:      [{ label: 'Share with Sync', icon: MessageCircle, to: '/companion' }],
  okay:      [
    { label: 'Try a breathing exercise', icon: Wind,           to: '/breathing' },
    { label: 'Talk to Sync',             icon: MessageCircle, to: '/companion' },
  ],
  low:       [
    { label: 'Try a breathing exercise', icon: Wind,           to: '/breathing' },
    { label: 'Talk to Sync',             icon: MessageCircle, to: '/companion' },
  ],
  difficult: [
    { label: 'Try a breathing exercise', icon: Wind,           to: '/breathing' },
    { label: 'Talk to Sync',             icon: MessageCircle, to: '/companion' },
  ],
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d === 1 ? 'yesterday' : `${d}d ago`
}

// ── Confirmation screen ───────────────────────────────────────────────────────

function ConfirmationScreen({ mood, onDone }: { mood: Mood; onDone: () => void }) {
  const navigate = useNavigate()
  const cfg = moodConfig[mood]
  const suggestions = POST_SAVE_SUGGESTIONS[mood]

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in max-w-sm mx-auto w-full">
      <CheckCircle size={56} className="text-emerald-500 mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Check-in saved!</h2>
      <p className="text-gray-500 text-sm mb-6">
        You're feeling <span className={`font-semibold ${cfg.text}`}>{cfg.label.toLowerCase()}</span> right now.
        {' '}That's okay — every feeling is valid.
      </p>

      <div className={`w-16 h-16 rounded-full ${cfg.bg} flex items-center justify-center text-4xl mb-8`}>
        {cfg.emoji}
      </div>

      {/* Contextual suggestions */}
      {suggestions.length > 0 && (
        <div className="w-full mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            What would help right now?
          </p>
          <div className="flex flex-col gap-2">
            {suggestions.map(({ label, icon: Icon, to }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="flex items-center justify-between w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:border-violet-200 hover:bg-violet-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Icon size={16} className="text-violet-500" />
                  {label}
                </span>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      <Button variant="secondary" className="w-full" onClick={onDone}>
        Back to Dashboard
      </Button>
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function MoodCheckin() {
  const navigate = useNavigate()
  const { addMoodEntry, addActivity, moodHistory } = useApp()
  const [selected, setSelected] = useState<Mood | null>(null)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const recentMoods = moodHistory.slice(0, 3)

  function save() {
    if (!selected || saving) return
    setSaving(true)
    const now = new Date().toISOString()
    addMoodEntry({ id: now, mood: selected, note: note.trim(), timestamp: now })
    addActivity({
      id: `${now}_mood`,
      type: 'mood',
      label: `Mood check-in: ${moodConfig[selected].label}`,
      timestamp: now,
    })
    // Brief delay so the save feels intentional
    setTimeout(() => { setSaving(false); setSaved(true) }, 400)
  }

  if (saved && selected) {
    return (
      <ConfirmationScreen
        mood={selected}
        onDone={() => navigate('/dashboard')}
      />
    )
  }

  return (
    <div className="flex-1 p-5 md:p-8 pb-24 md:pb-8 max-w-lg mx-auto w-full">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">How are you feeling?</h1>
        <p className="text-gray-500 text-sm">
          Take a moment to check in with yourself. There are no right or wrong answers.
        </p>
      </div>

      {/* ── Mood selector ── */}
      <fieldset className="mb-8">
        <legend className="sr-only">Select your current mood</legend>
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {MOODS.map(m => {
            const c = moodConfig[m]
            const active = selected === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => setSelected(m)}
                aria-pressed={active}
                aria-label={`${c.label} — ${c.description}`}
                className={`flex flex-col items-center gap-2 py-4 px-1 rounded-2xl border-2 transition-all focus-visible:outline-2 focus-visible:outline-violet-500 ${
                  active
                    ? `${c.border} ${c.bg} scale-105 shadow-md`
                    : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <span className="text-3xl leading-none" role="img" aria-hidden="true">
                  {c.emoji}
                </span>
                <span className={`text-xs font-semibold leading-tight text-center ${active ? c.text : 'text-gray-600'}`}>
                  {c.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Selected mood description */}
        <div className="mt-3 min-h-[1.25rem] text-center">
          {selected && (
            <p className={`text-xs ${moodConfig[selected].text} animate-fade-in`}>
              {moodConfig[selected].description}
            </p>
          )}
        </div>
      </fieldset>

      {/* ── Optional note ── */}
      <div className="mb-8">
        <label htmlFor="mood-note" className="block text-sm font-medium text-gray-700 mb-2">
          Add a note{' '}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="mood-note"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="What's on your mind? What's contributing to this feeling?"
          rows={3}
          maxLength={500}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white transition-colors"
          onKeyDown={e => {
            if (e.key === 'Enter' && e.metaKey && selected) save()
          }}
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-400">
            {selected ? 'This note is private and stored locally.' : ''}
          </p>
          <p className="text-xs text-gray-400">{note.length}/500</p>
        </div>
      </div>

      {/* ── Save button ── */}
      <Button
        size="lg"
        className="w-full"
        disabled={!selected || saving}
        onClick={save}
        aria-label="Save mood check-in"
      >
        {saving ? 'Saving…' : 'Save Check-in'}
      </Button>

      <p className="text-center text-xs text-gray-400 mt-4">
        Mood check-ins are wellness self-reflection tools, not medical assessments.
      </p>

      {/* ── Recent check-ins ── */}
      {recentMoods.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Recent check-ins
          </h2>
          <div className="flex flex-col gap-2">
            {recentMoods.map(entry => (
              <div
                key={entry.id}
                className="flex items-start justify-between gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MoodBadge mood={entry.mood} size="sm" />
                  {entry.note && (
                    <p className="text-xs text-gray-500 truncate">{entry.note}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 shrink-0">{timeAgo(entry.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

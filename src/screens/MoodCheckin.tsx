import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { Button } from '../components/Button'
import { MoodBadge, moodConfig } from '../components/MoodBadge'
import type { Mood } from '../types'
import { CheckCircle, MessageCircle, Wind, ChevronRight, Mic, MicOff, ArrowLeft } from 'lucide-react'

const MOODS: Mood[] = ['great', 'good', 'okay', 'low', 'difficult']

const POST_SAVE_SUGGESTIONS: Record<Mood, { label: string; icon: typeof Wind; to: string }[]> = {
  great:     [{ label: 'Talk to Sync Voice', icon: Mic, to: '/voice' }, { label: 'Share with Sync', icon: MessageCircle, to: '/companion' }],
  good:      [{ label: 'Talk to Sync Voice', icon: Mic, to: '/voice' }, { label: 'Share with Sync', icon: MessageCircle, to: '/companion' }],
  okay:      [
    { label: 'Try 2-min Breathing', icon: Wind,           to: '/breathing' },
    { label: 'Talk with Voice Agent',    icon: Mic,            to: '/voice' },
  ],
  low:       [
    { label: 'Try 2-min Breathing', icon: Wind,           to: '/breathing' },
    { label: 'Talk with Voice Agent',    icon: Mic,            to: '/voice' },
  ],
  difficult: [
    { label: 'Try 2-min Breathing', icon: Wind,           to: '/breathing' },
    { label: 'Talk with Voice Agent',    icon: Mic,            to: '/voice' },
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

      <div className={`w-16 h-16 rounded-full ${cfg.bg} flex items-center justify-center text-4xl mb-8 shadow-sm`}>
        {cfg.emoji}
      </div>

      {suggestions.length > 0 && (
        <div className="w-full mb-6 text-left">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 text-center">
            Suggested next actions
          </p>
          <div className="flex flex-col gap-2">
            {suggestions.map(({ label, icon: Icon, to }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="flex items-center justify-between w-full bg-white border border-gray-150 rounded-2xl px-4 py-3 text-sm font-medium text-gray-700 hover:border-violet-300 hover:bg-violet-50 transition-colors shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <Icon size={16} className="text-violet-600" />
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

export function MoodCheckin() {
  const navigate = useNavigate()
  const { addMoodEntry, addActivity, moodHistory } = useApp()
  const [selected, setSelected] = useState<Mood | null>(null)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isDictating, setIsDictating] = useState(false)

  const recognitionRef = useRef<any>(null)
  const recentMoods = moodHistory.slice(0, 3)

  function toggleDictation() {
    if (isDictating) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
      setIsDictating(false)
      return
    }

    const w = window as any
    const SRClass = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SRClass) {
      alert('Speech recognition is not supported in this browser. Please type your note manually.')
      return
    }

    try {
      const rec = new SRClass()
      rec.lang = 'en-US'
      rec.interimResults = true
      recognitionRef.current = rec

      rec.onresult = (e: any) => {
        let text = ''
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript
        }
        setNote(prev => (prev ? prev + ' ' + text : text))
      }

      rec.onerror = () => setIsDictating(false)
      rec.onend = () => setIsDictating(false)

      setIsDictating(true)
      rec.start()
    } catch {
      setIsDictating(false)
    }
  }

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
    setTimeout(() => { setSaving(false); setSaved(true) }, 350)
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
    <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-lg mx-auto w-full">

      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs font-semibold text-gray-400 hover:text-gray-600"
        >
          Skip for now
        </button>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 tracking-tight">How are you feeling?</h1>
        <p className="text-gray-500 text-sm">
          Take a quiet moment to tune in with yourself.
        </p>
      </div>

      {/* ── Mood selector cards ── */}
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
                className={`flex flex-col items-center gap-2 py-4 px-1 rounded-2xl border-2 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-violet-500 ${
                  active
                    ? `${c.border} ${c.bg} scale-105 shadow-md`
                    : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <span className="text-3xl leading-none" role="img" aria-hidden="true">
                  {c.emoji}
                </span>
                <span className={`text-xs font-bold leading-tight text-center ${active ? c.text : 'text-gray-600'}`}>
                  {c.label}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-4 min-h-[1.5rem] text-center">
          {selected && (
            <p className={`text-xs font-medium ${moodConfig[selected].text} animate-fade-in`}>
              {moodConfig[selected].description}
            </p>
          )}
        </div>
      </fieldset>

      {/* ── Optional Note Field with "Speak Instead" Dictation ── */}
      <div className="mb-8 bg-white border border-gray-150 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="mood-note" className="block text-sm font-semibold text-gray-800">
            Add a reflection <span className="text-gray-400 font-normal text-xs">(optional)</span>
          </label>
          <button
            type="button"
            onClick={toggleDictation}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              isDictating
                ? 'bg-rose-100 text-rose-700 animate-pulse'
                : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
            }`}
          >
            {isDictating ? <MicOff size={13} /> : <Mic size={13} />}
            {isDictating ? 'Stop Speaking' : 'Speak instead'}
          </button>
        </div>

        <textarea
          id="mood-note"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="What's contributing to how you feel today?"
          rows={3}
          maxLength={500}
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50/50 focus:bg-white transition-colors"
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-[11px] text-gray-400">
            Stored locally &amp; kept private.
          </p>
          <p className="text-[11px] text-gray-400">{note.length}/500</p>
        </div>
      </div>

      {/* ── Save Action ── */}
      <Button
        size="lg"
        className="w-full shadow-md shadow-violet-200"
        disabled={!selected || saving}
        onClick={save}
        aria-label="Save mood check-in"
      >
        {saving ? 'Saving check-in…' : 'Continue'}
      </Button>

      {/* ── Recent Check-ins ── */}
      {recentMoods.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Recent Check-ins
          </h2>
          <div className="flex flex-col gap-2">
            {recentMoods.map(entry => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MoodBadge mood={entry.mood} size="sm" />
                  {entry.note && (
                    <p className="text-xs text-gray-500 truncate italic">"{entry.note}"</p>
                  )}
                </div>
                <span className="text-[11px] text-gray-400 shrink-0 font-medium">{timeAgo(entry.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


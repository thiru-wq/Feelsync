import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { Button } from '../components/Button'
import { Play, Pause, RotateCcw, CheckCircle, Wind, ArrowRight, Minus, Plus, Volume2, VolumeX } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'done'

interface Pattern {
  label: string
  description: string
  inhale: number
  hold: number
  exhale: number
  defaultRounds: number
  benefit: string
}

// ─── Patterns ─────────────────────────────────────────────────────────────────

const PATTERNS: Pattern[] = [
  { label: 'Box Breathing', description: '4 · 4 · 4', inhale: 4, hold: 4, exhale: 4, defaultRounds: 4, benefit: 'Reduces stress · improves focus' },
  { label: '4-7-8 Calm',    description: '4 · 7 · 8', inhale: 4, hold: 7, exhale: 8, defaultRounds: 3, benefit: 'Promotes relaxation · supports sleep' },
  { label: 'Quick Reset',   description: '3 · 0 · 5', inhale: 3, hold: 0, exhale: 5, defaultRounds: 5, benefit: 'Fast calm in under 2 minutes' },
  { label: 'Deep Calm',     description: '5 · 2 · 7', inhale: 5, hold: 2, exhale: 7, defaultRounds: 4, benefit: 'Deep nervous system reset' },
]

// ─── Phase UI config ──────────────────────────────────────────────────────────

const PHASE_CFG: Record<Phase, {
  label: string
  sublabel: string
  circleClass: string
  ringClass: string
  textClass: string
  borderAccent: string
}> = {
  idle:   { label: 'Ready',       sublabel: '',                                       circleClass: 'bg-violet-50',   ringClass: 'bg-violet-100',  textClass: 'text-violet-400', borderAccent: 'border-l-violet-200' },
  inhale: { label: 'Breathe In',  sublabel: 'Slow, steady inhale through your nose',  circleClass: 'bg-violet-200',  ringClass: 'bg-violet-100',  textClass: 'text-violet-700', borderAccent: 'border-l-violet-300' },
  hold:   { label: 'Hold',        sublabel: 'Gently hold your breath',                circleClass: 'bg-blue-200',    ringClass: 'bg-blue-100',    textClass: 'text-blue-700',   borderAccent: 'border-l-blue-300'   },
  exhale: { label: 'Breathe Out', sublabel: 'Slow exhale through your mouth',         circleClass: 'bg-emerald-200', ringClass: 'bg-emerald-100', textClass: 'text-emerald-700',borderAccent: 'border-l-emerald-300'},
  done:   { label: 'Complete',    sublabel: '',                                       circleClass: 'bg-emerald-100', ringClass: 'bg-emerald-50',  textClass: 'text-emerald-600', borderAccent: 'border-l-emerald-200'},
}

// ─── Completion screen ────────────────────────────────────────────────────────

function CompletionScreen({ pattern, rounds, onAgain, onDone }: {
  pattern: Pattern; rounds: number; onAgain: () => void; onDone: () => void
}) {
  const total = rounds * (pattern.inhale + pattern.hold + pattern.exhale)
  const mins  = Math.floor(total / 60)
  const secs  = total % 60

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
      <div className="animate-done-pop mb-5">
        <CheckCircle size={60} className="text-emerald-500 mx-auto" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Session complete 🎉</h2>
      <p className="text-gray-400 text-sm mb-8 max-w-xs">
        Well done. Take a moment to notice how you feel — calmer, more centred, more present.
      </p>

      <div className="flex gap-3 mb-10 flex-wrap justify-center">
        {[
          { value: rounds,                                             label: 'Rounds',  color: 'text-violet-600' },
          { value: mins > 0 ? `${mins}m ${secs}s` : `${secs}s`,      label: 'Duration',color: 'text-emerald-600'},
          { value: rounds * 3,                                         label: 'Breaths', color: 'text-blue-600'   },
        ].map(({ value, label, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 px-6 py-4 text-center shadow-xs min-w-[80px]">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onAgain}><RotateCcw size={15} /> Go again</Button>
        <Button onClick={onDone}>Done <ArrowRight size={15} /></Button>
      </div>

      <p className="text-xs text-gray-400 mt-8 max-w-xs">
        FeelSync breathing exercises are wellness support tools, not medical treatments.
      </p>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function Breathing() {
  const navigate = useNavigate()
  const { addActivity } = useApp()

  const [patternIdx, setPatternIdx]   = useState(0)
  const [rounds, setRounds]           = useState(PATTERNS[0].defaultRounds)
  const [phase, setPhase]             = useState<Phase>('idle')
  const [round, setRound]             = useState(0)
  const [countdown, setCountdown]     = useState(0)
  const [running, setRunning]         = useState(false)
  const [voiceGuided, setVoiceGuided] = useState(false)

  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const patternRef = useRef(PATTERNS[0])
  const roundsRef  = useRef(rounds)
  const phaseRef   = useRef<Phase>('idle')
  const roundRef   = useRef(0)

  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ).current

  useEffect(() => { patternRef.current = PATTERNS[patternIdx] }, [patternIdx])
  useEffect(() => { roundsRef.current  = rounds               }, [rounds])

  function selectPattern(i: number) {
    reset()
    setPatternIdx(i)
    setRounds(PATTERNS[i].defaultRounds)
  }

  function clearTimer() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }

  const speakCue = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 0.95
      window.speechSynthesis.speak(u)
    }
  }

  const advance = useCallback((p: Phase, r: number) => {
    const pat = patternRef.current
    phaseRef.current = p
    roundRef.current = r
    setPhase(p)
    setRound(r)

    if (voiceGuided) {
      if (p === 'inhale') speakCue('Breathe in')
      else if (p === 'hold') speakCue('Hold')
      else if (p === 'exhale') speakCue('Breathe out')
      else if (p === 'done') speakCue('Session complete')
    }

    const duration =
      p === 'inhale' ? pat.inhale :
      p === 'hold'   ? pat.hold   :
      p === 'exhale' ? pat.exhale : 0

    setCountdown(duration)
    let remaining = duration

    const tick = () => {
      remaining -= 1
      setCountdown(remaining)
      if (remaining > 0) {
        timerRef.current = setTimeout(tick, 1000)
        return
      }
      const cur    = phaseRef.current
      const curR   = roundRef.current
      const curPat = patternRef.current
      const maxR   = roundsRef.current

      if (cur === 'inhale') {
        advance(curPat.hold > 0 ? 'hold' : 'exhale', curR)
      } else if (cur === 'hold') {
        advance('exhale', curR)
      } else if (cur === 'exhale') {
        const next = curR + 1
        if (next >= maxR) {
          phaseRef.current = 'done'
          setPhase('done')
          setRunning(false)
          const now = new Date().toISOString()
          addActivity({
            id: now,
            type: 'breathing',
            label: curPat.label,
            duration: maxR * (curPat.inhale + curPat.hold + curPat.exhale),
            timestamp: now,
          })
        } else {
          advance('inhale', next)
        }
      }
    }
    timerRef.current = setTimeout(tick, 1000)
  }, [addActivity, voiceGuided])

  function start() { clearTimer(); setRunning(true); advance('inhale', 0) }
  function pause() { clearTimer(); setRunning(false) }
  function reset() {
    clearTimer(); setRunning(false); setPhase('idle'); setRound(0); setCountdown(0)
    phaseRef.current = 'idle'; roundRef.current = 0
  }

  useEffect(() => () => clearTimer(), [])

  const pat      = PATTERNS[patternIdx]
  const cfg      = PHASE_CFG[phase]
  const expanded = phase === 'inhale' || phase === 'hold'
  const transDur = expanded ? `${pat.inhale}s` : `${pat.exhale}s`

  const estimatedSecs = rounds * (pat.inhale + pat.hold + pat.exhale)
  const estMins = Math.floor(estimatedSecs / 60)
  const estSecs = estimatedSecs % 60
  const estLabel = estMins > 0 ? `~${estMins}m ${estSecs}s` : `~${estSecs}s`

  if (phase === 'done') {
    return <CompletionScreen pattern={pat} rounds={rounds} onAgain={reset} onDone={() => navigate('/dashboard')} />
  }

  return (
    <div className="flex-1 flex flex-col items-center p-5 md:p-8 pb-24 md:pb-8 max-w-lg mx-auto w-full" style={{ animation: 'page-enter 0.55s cubic-bezier(0.22,1,0.36,1) both' }}>

      {/* Header */}
      <div className="w-full flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Guided Breathing</h1>
          <p className="text-gray-400 text-sm">Follow the circle. Let your breath lead.</p>
        </div>
      </div>

      {/* ── Pattern selector ── */}
      <div className="grid grid-cols-2 gap-2 w-full mb-5 sm:grid-cols-4">
        {PATTERNS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => selectPattern(i)}
            disabled={running}
            aria-pressed={patternIdx === i}
            className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-colors disabled:opacity-50 ${
              patternIdx === i
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-gray-700 border-gray-100 hover:border-violet-200'
            }`}
          >
            <span className="text-xs font-semibold leading-tight">{p.label}</span>
            <span className={`text-[11px] mt-0.5 ${patternIdx === i ? 'text-violet-200' : 'text-gray-400'}`}>
              {p.description}
            </span>
          </button>
        ))}
      </div>

      {/* ── Session length picker ── */}
      <div className="flex items-center justify-between w-full bg-white rounded-2xl border border-gray-100 px-4 py-3 mb-8 shadow-xs">
        <div>
          <p className="text-sm font-medium text-gray-700">Session length</p>
          <p className="text-xs text-gray-400">{rounds} round{rounds !== 1 ? 's' : ''} · {estLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setRounds(r => Math.max(1, r - 1))}
            disabled={running || rounds <= 1}
            aria-label="Decrease rounds"
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <Minus size={13} />
          </button>
          <span className="text-lg font-bold text-gray-900 w-6 text-center tabular-nums">{rounds}</span>
          <button
            onClick={() => setRounds(r => Math.min(12, r + 1))}
            disabled={running || rounds >= 12}
            aria-label="Increase rounds"
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* ── Breathing circle ── */}
      <div
        className="relative flex items-center justify-center mb-6"
        aria-live="assertive"
        aria-atomic="true"
        aria-label={running ? `${cfg.label}${countdown > 0 ? `, ${countdown} seconds` : ''}` : cfg.label}
      >
        {/* Ambient glow ring */}
        {!prefersReducedMotion && running && (
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 288, height: 288,
              background: `radial-gradient(circle, ${phase === 'inhale' ? 'rgba(167,139,250,0.18)' : phase === 'hold' ? 'rgba(96,165,250,0.18)' : 'rgba(52,211,153,0.18)'} 0%, transparent 70%)`,
              filter: 'blur(16px)',
              animation: 'glow-ring 4s ease-in-out infinite',
              transition: 'background 1s ease',
            }}
          />
        )}
        {!prefersReducedMotion && running && (
          <div className={`absolute w-72 h-72 rounded-full ${cfg.ringClass} animate-pulse-ring`} aria-hidden="true" />
        )}
        <div
          className={`breathing-circle relative w-52 h-52 rounded-full ${cfg.circleClass} flex flex-col items-center justify-center shadow-md select-none`}
          style={prefersReducedMotion ? {} : {
            transition: `transform ${transDur} cubic-bezier(0.45,0,0.55,1), background-color 0.8s cubic-bezier(0.22,1,0.36,1)`,
            transform: expanded ? 'scale(1.22)' : 'scale(1)',
            boxShadow: running
              ? `0 0 40px 8px ${phase === 'inhale' ? 'rgba(167,139,250,0.25)' : phase === 'hold' ? 'rgba(96,165,250,0.20)' : 'rgba(52,211,153,0.20)'}, 0 8px 32px rgba(0,0,0,0.08)`
              : '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <span className={`text-5xl font-bold tabular-nums leading-none ${cfg.textClass}`}>
            {running && countdown > 0 ? countdown : ''}
          </span>
          <span className={`text-sm font-semibold mt-2 ${cfg.textClass}`}>
            {cfg.label}
          </span>
          {phase === 'idle' && (
            <Wind size={26} className="text-violet-300 mt-2" aria-hidden="true" />
          )}
        </div>
      </div>

      {/* Phase sublabel */}
      <p className="text-sm text-gray-400 text-center mb-5 min-h-[1.25rem] px-4">
        {phase === 'idle' ? pat.benefit : cfg.sublabel}
      </p>

      {/* ── Round progress ── */}
      {phase !== 'idle' && (
        <div
          className="flex gap-1 mb-7 flex-wrap justify-center"
          role="progressbar"
          aria-valuenow={round + 1}
          aria-valuemin={1}
          aria-valuemax={rounds}
          aria-label={`Round ${round + 1} of ${rounds}`}
        >
          {Array.from({ length: rounds }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i < round  ? 'w-2 bg-violet-300' :
                i === round ? 'w-6 bg-violet-600' :
                              'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}

      {/* ── Controls + voice toggle ── */}
      <div className="flex items-center gap-3 flex-wrap justify-center mb-3">
        {!running && phase === 'idle' && (
          <Button size="lg" onClick={start} aria-label="Start breathing exercise">
            <Play size={17} /> Start
          </Button>
        )}
        {running && (
          <Button size="lg" variant="secondary" onClick={pause} aria-label="Pause">
            <Pause size={17} /> Pause
          </Button>
        )}
        {!running && phase !== 'idle' && (
          <>
            <Button size="lg" onClick={start} aria-label="Resume">
              <Play size={17} /> Resume
            </Button>
            <Button size="lg" variant="ghost" onClick={reset} aria-label="Reset">
              <RotateCcw size={17} /> Reset
            </Button>
          </>
        )}
        {/* Voice guided toggle moved into controls row */}
        <button
          onClick={() => setVoiceGuided(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
            voiceGuided
              ? 'bg-violet-100 text-violet-700 border-violet-200'
              : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
          }`}
          title="Toggle spoken voice cues during session"
        >
          {voiceGuided ? <Volume2 size={13} /> : <VolumeX size={13} />}
          {voiceGuided ? 'Voice On' : 'Voice Off'}
        </button>
      </div>

      {/* ── Pattern detail card — left-border accent by phase ── */}
      <div className={`mt-6 w-full bg-white rounded-2xl border-l-4 border border-gray-100 p-4 shadow-xs ${cfg.borderAccent}`}>
        <p className="text-sm font-semibold text-gray-700 mb-1">{pat.label}</p>
        <p className="text-xs text-gray-400 mb-3">{pat.benefit}</p>
        <div className="flex gap-3 flex-wrap text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-300 inline-block" />
            Inhale {pat.inhale}s
          </span>
          {pat.hold > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-300 inline-block" />
              Hold {pat.hold}s
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-300 inline-block" />
            Exhale {pat.exhale}s
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-200 inline-block" />
            {rounds} round{rounds !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

    </div>
  )
}

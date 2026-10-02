import { useState, useEffect, useRef } from 'react'
import { Card } from '../components/Card'
import { Brain, Activity, AlertCircle, Wifi, Info } from 'lucide-react'
import { createSignalProvider } from '../services/signalProvider'
import type { SignalReading } from '../services/signalProvider'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChannelDef {
  key: keyof Omit<SignalReading, 'timestamp'>
  label: string
  sublabel: string
  description: string
  lowLabel: string
  highLabel: string
  color: string        // Tailwind text colour
  bg: string           // Tailwind bg for icon chip
  stroke: string       // SVG stroke colour (hex/CSS var)
  barColor: string     // Tailwind bg for progress bar
}

// ─── Channel definitions ──────────────────────────────────────────────────────

const EEG_CHANNELS: ChannelDef[] = [
  {
    key: 'eegCalmness',
    label: 'Calmness',
    sublabel: 'EEG · Wellness Indicator',
    description:
      'Reflects a general sense of mental quietness derived from brainwave activity patterns. Higher values suggest a calmer mental state.',
    lowLabel: 'Restless',
    highLabel: 'Calm',
    color: 'text-violet-600',
    bg: 'bg-violet-100',
    stroke: '#7c3aed',
    barColor: 'bg-violet-400',
  },
  {
    key: 'eegFocus',
    label: 'Engagement',
    sublabel: 'EEG · Wellness Indicator',
    description:
      'Reflects attentional engagement and mental alertness. Higher values suggest an active, engaged mental state.',
    lowLabel: 'Drifting',
    highLabel: 'Engaged',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    stroke: '#2563eb',
    barColor: 'bg-blue-400',
  },
]

const GSR_CHANNELS: ChannelDef[] = [
  {
    key: 'gsrArousal',
    label: 'Arousal',
    sublabel: 'GSR · Wellness Indicator',
    description:
      'Reflects physiological activation via skin conductance. Higher values suggest increased bodily arousal or alertness.',
    lowLabel: 'Low',
    highLabel: 'High',
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    stroke: '#ea580c',
    barColor: 'bg-orange-400',
  },
  {
    key: 'gsrRelaxation',
    label: 'Relaxation',
    sublabel: 'GSR · Wellness Indicator',
    description:
      'Reflects a calm physiological state via skin conductance. Higher values suggest a more relaxed bodily state.',
    lowLabel: 'Tense',
    highLabel: 'Relaxed',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    stroke: '#059669',
    barColor: 'bg-emerald-400',
  },
]

const HISTORY_LEN = 30

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ history, stroke }: { history: number[]; stroke: string }) {
  if (history.length < 2) return <div className="w-24 h-8" />
  const lo = Math.min(...history)
  const hi = Math.max(...history)
  const range = hi - lo || 1
  const W = 96, H = 32
  const pts = history
    .map((v, i) => `${(i / (history.length - 1)) * W},${H - ((v - lo) / range) * (H - 4) - 2}`)
    .join(' ')
  return (
    <svg width={W} height={H} aria-hidden="true" className="shrink-0">
      <polyline
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
    </svg>
  )
}

// ─── Single channel card ──────────────────────────────────────────────────────

function ChannelCard({
  def,
  value,
  history,
}: {
  def: ChannelDef
  value: number
  history: number[]
}) {
  const pct = Math.round(value)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${def.bg}`}>
            {def.key.startsWith('eeg')
              ? <Brain size={17} className={def.color} />
              : <Activity size={17} className={def.color} />
            }
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900 leading-tight">{def.label}</p>
            <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{def.sublabel}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-2xl font-bold tabular-nums leading-none ${def.color}`}>
            {pct}
            <span className="text-xs font-normal text-gray-400 ml-0.5">/ 100</span>
          </span>
          <Sparkline history={history} stroke={def.stroke} />
        </div>
      </div>

      {/* Progress bar with low/high labels */}
      <div className="mb-1.5">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${def.barColor}`}
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${def.label}: ${pct} out of 100`}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-400">{def.lowLabel}</span>
          <span className="text-[10px] text-gray-400">{def.highLabel}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 leading-relaxed">{def.description}</p>
    </div>
  )
}

// ─── Signal group (EEG or GSR) ────────────────────────────────────────────────

function SignalGroup({
  title,
  icon: Icon,
  iconBg,
  iconColor,
  channels,
  reading,
  histories,
}: {
  title: string
  icon: typeof Brain
  iconBg: string
  iconColor: string
  channels: ChannelDef[]
  reading: SignalReading | null
  histories: Record<string, number[]>
}) {
  return (
    <section aria-labelledby={`${title}-heading`} className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon size={14} className={iconColor} />
        </div>
        <h2 id={`${title}-heading`} className="text-sm font-semibold text-gray-700">
          {title}
        </h2>
      </div>
      <div className="flex flex-col gap-3">
        {channels.map(def => (
          <ChannelCard
            key={def.key}
            def={def}
            value={reading ? reading[def.key] : 0}
            history={histories[def.key] ?? []}
          />
        ))}
      </div>
    </section>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type HistoryMap = Record<string, number[]>

const ALL_CHANNELS = [...EEG_CHANNELS, ...GSR_CHANNELS]

function emptyHistories(): HistoryMap {
  return Object.fromEntries(ALL_CHANNELS.map(c => [c.key, []]))
}

export function Signals() {
  const [reading, setReading] = useState<SignalReading | null>(null)
  const [histories, setHistories] = useState<HistoryMap>(emptyHistories)
  const [updateCount, setUpdateCount] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const providerRef = useRef(createSignalProvider())

  useEffect(() => {
    const provider = providerRef.current
    provider.start(r => {
      setReading(r)
      setLastUpdated(new Date(r.timestamp))
      setUpdateCount(n => n + 1)
      setHistories(prev => {
        const next: HistoryMap = {}
        for (const ch of ALL_CHANNELS) {
          next[ch.key] = [...(prev[ch.key] ?? []).slice(-(HISTORY_LEN - 1)), r[ch.key]]
        }
        return next
      })
    })
    return () => provider.stop()
  }, [])

  const provider = providerRef.current

  return (
    <div className="flex-1 p-5 md:p-8 pb-24 md:pb-8 max-w-2xl mx-auto w-full">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Wellness Signals</h1>
          <p className="text-gray-500 text-sm">EEG &amp; GSR wellness indicators</p>
        </div>
        {/* Status badge */}
        <div className="flex flex-col items-end gap-1 shrink-0 mt-1">
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" aria-hidden="true" />
            {provider.sourceLabel} · Active
          </div>
          {lastUpdated && (
            <p className="text-[10px] text-gray-400 pr-0.5">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              {' · '}{updateCount} readings
            </p>
          )}
        </div>
      </div>

      {/* ── Demo disclaimer ── */}
      {provider.isSimulated && (
        <div
          role="note"
          className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-sm text-amber-800"
        >
          <AlertCircle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            <strong>Demo / Simulated Sensor Data.</strong>{' '}
            These values are generated for demonstration purposes only. They are not medical
            measurements and must not be used for diagnosis, treatment, or any clinical decision.
          </span>
        </div>
      )}

      {/* ── EEG group ── */}
      <SignalGroup
        title="EEG — Brainwave Wellness"
        icon={Brain}
        iconBg="bg-violet-100"
        iconColor="text-violet-600"
        channels={EEG_CHANNELS}
        reading={reading}
        histories={histories}
      />

      {/* ── GSR group ── */}
      <SignalGroup
        title="GSR — Skin Conductance Wellness"
        icon={Activity}
        iconBg="bg-orange-100"
        iconColor="text-orange-600"
        channels={GSR_CHANNELS}
        reading={reading}
        histories={histories}
      />

      {/* ── Legend ── */}
      <section aria-label="Signal legend" className="mb-6">
        <div className="flex items-center gap-1.5 mb-2">
          <Info size={13} className="text-gray-400" aria-hidden="true" />
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Legend</h2>
        </div>
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-start gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400 mt-0.5 shrink-0" />
            <span><strong>EEG (Electroencephalography)</strong> — measures brainwave patterns to derive wellness-oriented calmness and engagement indices.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 mt-0.5 shrink-0" />
            <span><strong>GSR (Galvanic Skin Response)</strong> — measures skin conductance to derive arousal and relaxation wellness indices.</span>
          </div>
          <div className="flex items-start gap-2 sm:col-span-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300 mt-0.5 shrink-0" />
            <span>All values are <strong>0–100 wellness indices</strong>, not raw sensor units. They are not diagnostic scores.</span>
          </div>
        </div>
      </section>

      {/* ── Connect hardware CTA ── */}
      <Card className="bg-violet-50 border-violet-100">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <Wifi size={17} className="text-violet-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-violet-700 mb-0.5">Connect a real sensor</p>
            <p className="text-xs text-violet-600 leading-relaxed">
              FeelSync is designed to integrate with compatible EEG and GSR hardware via the AWS IoT
              backend. When a real device is connected, simulated data is replaced automatically —
              no UI changes required.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

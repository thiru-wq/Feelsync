import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { Card } from '../components/Card'
import {
  Brain, Activity, Wifi, Info,
  Camera, Mic, Cpu, Sparkles, ArrowRight
} from 'lucide-react'
import { createSignalProvider } from '../services/signalProvider'
import type { SignalReading } from '../services/signalProvider'


interface ChannelDef {
  key: keyof Omit<SignalReading, 'timestamp'>
  label: string
  sublabel: string
  description: string
  lowLabel: string
  highLabel: string
  color: string
  bg: string
  stroke: string
  barColor: string
}

const EEG_CHANNELS: ChannelDef[] = [
  {
    key: 'eegCalmness',
    label: 'Calmness',
    sublabel: 'EEG · Sample Data',
    description: 'Reflects a sense of mental quietness derived from brainwave patterns. Higher values suggest a calmer state.',
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
    sublabel: 'EEG · Sample Data',
    description: 'Reflects attentional engagement and mental alertness. Higher values suggest an active, focused state.',
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
    sublabel: 'GSR · Sample Data',
    description: 'Reflects sympathetic activation via skin conductance. Higher values indicate elevated bodily arousal.',
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
    sublabel: 'GSR · Sample Data',
    description: 'Reflects parasympathetic balance via skin resistance. Higher values indicate a more relaxed bodily state.',
    lowLabel: 'Tense',
    highLabel: 'Relaxed',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    stroke: '#059669',
    barColor: 'bg-emerald-400',
  },
]

const HISTORY_LEN = 30

function Sparkline({ history, stroke }: { history: number[]; stroke: string }) {
  if (history.length < 2) return <div className="w-full h-8" />
  const lo = Math.min(...history)
  const hi = Math.max(...history)
  const range = hi - lo || 1
  const W = 200, H = 32
  const pts = history
    .map((v, i) => `${(i / (history.length - 1)) * W},${H - ((v - lo) / range) * (H - 4) - 2}`)
    .join(' ')
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
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

function ChannelCard({
  def, value, history,
}: {
  def: ChannelDef; value: number; history: number[]
}) {
  const pct = Math.round(value)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${def.bg}`}>
            {def.key.startsWith('eeg')
              ? <Brain size={16} className={def.color} />
              : <Activity size={16} className={def.color} />
            }
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900 leading-tight">{def.label}</p>
            <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{def.sublabel}</p>
          </div>
        </div>
        <span className={`text-2xl font-bold tabular-nums leading-none shrink-0 ${def.color}`}>
          {pct}
          <span className="text-xs font-normal text-gray-400 ml-0.5">/ 100</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
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

      {/* Sparkline — full width below bar */}
      <div className="w-full h-8 mt-1">
        <Sparkline history={history} stroke={def.stroke} />
      </div>

      <p className="text-xs text-gray-400 leading-relaxed mt-1">{def.description}</p>
    </div>
  )
}

type HistoryMap = Record<string, number[]>
const ALL_CHANNELS = [...EEG_CHANNELS, ...GSR_CHANNELS]

function emptyHistories(): HistoryMap {
  return Object.fromEntries(ALL_CHANNELS.map(c => [c.key, []]))
}

export function Signals() {
  const navigate = useNavigate()
  const { faceResult, voiceResult, fusionResult } = useApp()

  const [reading, setReading] = useState<SignalReading | null>(null)
  const [histories, setHistories] = useState<HistoryMap>(emptyHistories)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const providerRef = useRef(createSignalProvider())

  useEffect(() => {
    const provider = providerRef.current
    provider.start(r => {
      setReading(r)
      setLastUpdated(new Date(r.timestamp))
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

  return (
    <div className="flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-28 md:pb-8 max-w-3xl mx-auto w-full">

      {/* ── 1. Header ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 mb-1">
            <Sparkles size={13} /> 4-Signal Multimodal Architecture
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Multimodal Wellness</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Holistic assessment across Face, Voice, EEG brainwaves, and GSR skin response.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 mt-1">
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active Feed
          </div>
          {lastUpdated && (
            <p className="text-[10px] text-gray-400 tabular-nums font-mono">
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          )}
        </div>
      </div>

      {/* ── 2. Full Assessment CTA — solid violet to differentiate from Dashboard ── */}
      <div className="mb-6 bg-violet-600 rounded-3xl p-5 md:p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-2">
              <Sparkles size={13} /> Complete 4-Step Flow
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Start Multimodal Assessment
            </h2>
            <p className="text-violet-100 text-sm mt-1 max-w-md leading-relaxed">
              Step through Face → Voice → EEG → GSR, then view your integrated AI Fusion result.
            </p>
          </div>
          <button
            onClick={() => navigate('/signals/face')}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-violet-700 font-semibold text-sm hover:bg-violet-50 transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 active:scale-95"
          >
            Start Assessment <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* ── 3. Four Modality Cards ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Individual Signal Modalities
          </h2>
          <span className="text-xs text-gray-400">Select any to inspect or test</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 1. Face */}
          <div
            onClick={() => navigate('/signals/face')}
            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Camera size={19} />
                </div>
                <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border ${faceResult?.status === 'completed' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-gray-400 bg-gray-50 border-gray-100'}`}>
                  {faceResult?.status === 'completed' ? 'Completed' : 'Camera Ready'}
                </span>
              </div>
              <h3 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">1. Face Analysis</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Live webcam expression tracking, micro-tension detection, and emotional valence cues.
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 text-xs font-semibold text-blue-600">
              <span>{faceResult?.expression ?? 'Ready to analyze'}</span>
              <span className="flex items-center gap-1">Open <ArrowRight size={13} /></span>
            </div>
          </div>

          {/* 2. Voice */}
          <div
            onClick={() => navigate('/signals/voice')}
            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs hover:border-violet-200 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Mic size={19} />
                </div>
                <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border ${voiceResult?.status === 'completed' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-gray-400 bg-gray-50 border-gray-100'}`}>
                  {voiceResult?.status === 'completed' ? 'Completed' : 'Microphone Ready'}
                </span>
              </div>
              <h3 className="font-bold text-sm text-gray-900 group-hover:text-violet-600 transition-colors">2. Voice Acoustics</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Microphone speech acoustic analysis, pitch variance, vocal energy, and prosody warmth.
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 text-xs font-semibold text-violet-600">
              <span>{voiceResult?.tone ?? 'Ready to analyze'}</span>
              <span className="flex items-center gap-1">Open <ArrowRight size={13} /></span>
            </div>
          </div>

          {/* 3. EEG */}
          <div
            onClick={() => navigate('/signals/eeg')}
            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs hover:border-amber-200 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Brain size={19} />
                </div>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">
                  Sample Data
                </span>
              </div>
              <h3 className="font-bold text-sm text-gray-900 group-hover:text-amber-600 transition-colors">3. EEG Brainwaves</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Simulated Alpha and Beta waveband indices reflecting mental calmness and attentional focus.
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 text-xs font-semibold text-amber-600">
              <span>Calm: {reading ? Math.round(reading.eegCalmness) : 76}/100</span>
              <span className="flex items-center gap-1">Open <ArrowRight size={13} /></span>
            </div>
          </div>

          {/* 4. GSR */}
          <div
            onClick={() => navigate('/signals/gsr')}
            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Cpu size={19} />
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                  Sample Data
                </span>
              </div>
              <h3 className="font-bold text-sm text-gray-900 group-hover:text-emerald-600 transition-colors">4. GSR Skin Conductance</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Simulated galvanic skin resistance indicators reflecting sympathetic arousal and somatic ease.
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 text-xs font-semibold text-emerald-600">
              <span>Relax: {reading ? Math.round(reading.gsrRelaxation) : 78}/100</span>
              <span className="flex items-center gap-1">Open <ArrowRight size={13} /></span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. AI Fusion Engine Banner ── */}
      <div
        onClick={() => navigate('/signals/fusion')}
        className="mb-8 bg-white border border-violet-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
              <Sparkles size={17} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 group-hover:text-violet-700 transition-colors">
                AI Multimodal Fusion Engine
              </h3>
              <p className="text-xs text-gray-400">Integrated holistic synthesis of all 4 modalities</p>
            </div>
          </div>
          <span className="text-xs font-bold text-violet-700 bg-violet-50 border border-violet-100 rounded-full px-3 py-1 shrink-0">
            Demo Confidence: {fusionResult?.demoConfidence ?? 88}%
          </span>
        </div>

        <div className="bg-violet-50/60 rounded-2xl p-3.5 border border-violet-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Current Synthesized State</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{fusionResult?.combinedState ?? 'Harmonious Balance & Calm Alertness'}</p>
          </div>
          <span className="text-xs font-semibold text-violet-600 flex items-center gap-1 shrink-0">
            View <ArrowRight size={13} />
          </span>
        </div>
      </div>

      {/* ── 5. EEG & GSR Real-time Channels ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-violet-100">
            <Brain size={13} className="text-violet-600" />
          </div>
          <h2 className="text-sm font-semibold text-gray-700">EEG — Brainwave Wellness (Sample Data)</h2>
        </div>
        <div className="flex flex-col gap-3 mb-6">
          {EEG_CHANNELS.map(def => (
            <ChannelCard key={def.key} def={def} value={reading ? reading[def.key] : 0} history={histories[def.key] ?? []} />
          ))}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-orange-100">
            <Activity size={13} className="text-orange-600" />
          </div>
          <h2 className="text-sm font-semibold text-gray-700">GSR — Skin Conductance Wellness (Sample Data)</h2>
        </div>
        <div className="flex flex-col gap-3 mb-6">
          {GSR_CHANNELS.map(def => (
            <ChannelCard key={def.key} def={def} value={reading ? reading[def.key] : 0} history={histories[def.key] ?? []} />
          ))}
        </div>
      </div>

      {/* ── 6. Legend ── */}
      <section aria-label="Signal legend" className="mb-6">
        <div className="flex items-center gap-1.5 mb-2">
          <Info size={12} className="text-gray-400" aria-hidden="true" />
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Signal Legend &amp; Safety</h2>
        </div>
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-start gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 mt-0.5 shrink-0" />
            <span><strong>Face</strong> — analyzes non-invasive visual expression and tension landmarks.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400 mt-0.5 shrink-0" />
            <span><strong>Voice</strong> — analyzes acoustic prosody, harmonics, and energy cadence.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 mt-0.5 shrink-0" />
            <span><strong>EEG (Sample)</strong> — simulated Alpha/Beta calm and engagement indices.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-0.5 shrink-0" />
            <span><strong>GSR (Sample)</strong> — simulated autonomic skin arousal and relaxation.</span>
          </div>
          <div className="flex items-start gap-2 sm:col-span-2 pt-1 border-t border-gray-200">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400 mt-0.5 shrink-0" />
            <span>All values are <strong>0–100 wellness indicators</strong>. FeelSync does not diagnose or treat medical conditions.</span>
          </div>
        </div>
      </section>

      {/* ── 7. Hardware CTA ── */}
      <Card className="bg-violet-50 border-violet-100">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <Wifi size={16} className="text-violet-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-violet-700 mb-0.5">Hardware Integration Architecture</p>
            <p className="text-xs text-violet-600 leading-relaxed">
              FeelSync is engineered to integrate with EEG headbands and GSR Bluetooth sensors via the AWS IoT
              backend. When hardware connects, simulated streams are replaced seamlessly.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

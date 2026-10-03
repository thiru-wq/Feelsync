import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../store'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { StepBreadcrumb } from './StepBreadcrumb'
import {
  Brain, Sparkles, ArrowRight, ArrowLeft,
  CheckCircle2, AlertCircle, WifiOff
} from 'lucide-react'
import { createSignalProvider } from '../../services/signalProvider'
import type { EEGAnalysisResult } from '../../types'

function Sparkline({ history, stroke }: { history: number[]; stroke: string }) {
  if (history.length < 2) return <div className="w-28 h-8" />
  const lo = Math.min(...history)
  const hi = Math.max(...history)
  const range = hi - lo || 1
  const W = 112, H = 32
  const pts = history
    .map((v, i) => `${(i / (history.length - 1)) * W},${H - ((v - lo) / range) * (H - 4) - 2}`)
    .join(' ')
  return (
    <svg width={W} height={H} aria-hidden="true" className="shrink-0">
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  )
}

export function EEGScreen() {
  const navigate = useNavigate()
  const { eegResult, setEegResult, addActivity } = useApp()

  const [calmness, setCalmness] = useState(eegResult?.calmness ?? 76)
  const [engagement, setEngagement] = useState(eegResult?.engagement ?? 62)
  const [calmHistory, setCalmHistory] = useState<number[]>([70, 72, 74, 75, 76, 78, 76, 77, 76])
  const [focusHistory, setFocusHistory] = useState<number[]>([58, 60, 62, 65, 63, 62, 64, 62])
  const [selectedPreset, setSelectedPreset] = useState<'calm' | 'focused' | 'restless'>('calm')
  const [lastReadingTime, setLastReadingTime] = useState<Date>(new Date())
  const providerRef = useRef(createSignalProvider())

  useEffect(() => {
    const provider = providerRef.current
    provider.start(r => {
      setCalmness(Math.round(r.eegCalmness))
      setEngagement(Math.round(r.eegFocus))
      setLastReadingTime(new Date(r.timestamp))
      setCalmHistory(prev => [...prev.slice(-19), r.eegCalmness])
      setFocusHistory(prev => [...prev.slice(-19), r.eegFocus])
    })
    return () => provider.stop()
  }, [])

  const applyPreset = (preset: 'calm' | 'focused' | 'restless') => {
    setSelectedPreset(preset)
    let c = 78, e = 58, mentalState = 'Quiet Alertness & Receptive Mind', alpha = 'Alpha (8–12 Hz) Dominant'
    if (preset === 'focused') { c = 68; e = 84; mentalState = 'High Attentional Processing & Focus'; alpha = 'Low-Beta (13–20 Hz) Synchrony' }
    else if (preset === 'restless') { c = 42; e = 78; mentalState = 'High Cognitive Load / Restless Mind'; alpha = 'High-Beta Dispersal' }
    setCalmness(c); setEngagement(e)
    const result: EEGAnalysisResult = {
      status: 'completed', isSimulated: true, calmness: c, engagement: e,
      alphaDominance: alpha, mentalState, timestamp: new Date().toISOString(),
    }
    setEegResult(result)
    addActivity({ id: `eeg-${Date.now()}`, type: 'signal', label: `EEG Brainwave: ${c}/100 Calmness (Sample Data)`, timestamp: result.timestamp })
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-28 md:pb-8 max-w-2xl mx-auto w-full">
      <StepBreadcrumb currentStep="eeg" />

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">EEG Brainwaves</h1>
          <p className="text-gray-400 text-sm">
            Simulated electroencephalography wellness indicators for calmness and focus.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 shrink-0 ml-3">
          Sample Data
        </span>
      </div>

      {/* ── Hardware Disclaimer ── */}
      <div role="note" className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 mb-6 text-xs text-amber-900">
        <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-semibold">Simulated Sample Sensor Stream</p>
          <p className="mt-0.5 leading-relaxed">
            No physical EEG hardware is connected. This stream demonstrates how brainwave indices feed into the Multimodal Fusion engine. Not for clinical or diagnostic use.
          </p>
        </div>
      </div>

      {/* ── EEG Monitor Card ── */}
      <Card className="mb-6 p-5 bg-white border-gray-100 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700">
              <Brain size={17} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Live Simulated Waveband Feed</p>
              <p className="text-[11px] text-gray-400 tabular-nums font-mono">
                {lastReadingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Stream Active
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-violet-50/60 rounded-2xl p-4 border border-violet-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-violet-900">Calmness (Alpha)</span>
              <span className="text-xl font-bold text-violet-700 tabular-nums">{calmness}<span className="text-xs font-normal text-gray-400">/100</span></span>
            </div>
            <div className="h-2 bg-violet-100 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-violet-500 rounded-full transition-all duration-700" style={{ width: `${calmness}%` }} />
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>Restless</span>
              <Sparkline history={calmHistory} stroke="#7c3aed" />
              <span>Deep Calm</span>
            </div>
          </div>
          <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-900">Focus / Engagement</span>
              <span className="text-xl font-bold text-blue-700 tabular-nums">{engagement}<span className="text-xs font-normal text-gray-400">/100</span></span>
            </div>
            <div className="h-2 bg-blue-100 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${engagement}%` }} />
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>Drifting</span>
              <Sparkline history={focusHistory} stroke="#2563eb" />
              <span>High Focus</span>
            </div>
          </div>
        </div>

        {/* Preset Simulators — no emoji prefixes for consistency */}
        <div className="pt-3 border-t border-gray-100">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Simulate Cognitive State</p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'calm' as const,     label: 'Calm & Meditative', activeClass: 'bg-violet-600 text-white' },
              { id: 'focused' as const,  label: 'Active Focus',       activeClass: 'bg-blue-600 text-white'   },
              { id: 'restless' as const, label: 'Restless Mind',      activeClass: 'bg-amber-600 text-white'  },
            ].map(({ id, label, activeClass }) => (
              <button key={id} onClick={() => applyPreset(id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${selectedPreset === id ? activeClass : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ── EEG Analysis Output ── */}
      <section className="mb-6" aria-labelledby="eeg-output-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="eeg-output-heading" className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Sparkles size={15} className="text-violet-600" /> EEG Analysis Output (Sample Data)
          </h2>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 size={11} /> Stream Validated
          </span>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-start justify-between gap-4 pb-3 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Derived Mental State</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">
                {selectedPreset === 'calm' ? 'Quiet Alertness & Receptive Mind' : selectedPreset === 'focused' ? 'High Attentional Focus' : 'Mild Cognitive Overload'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Dominant Rhythm: <strong>{selectedPreset === 'calm' ? 'Alpha Waves (8–12 Hz)' : selectedPreset === 'focused' ? 'Beta Waves (13–25 Hz)' : 'High Beta'}</strong>
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xl font-bold text-violet-600">{calmness}/100</span>
              <p className="text-[10px] text-gray-400">Calmness Index</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="font-semibold text-gray-800">Alpha Synchrony</p>
              <p className="text-gray-400 mt-0.5">Optimal for grounding &amp; creative synthesis.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="font-semibold text-gray-800">Hardware Status</p>
              <p className="text-amber-700 flex items-center gap-1 mt-0.5"><WifiOff size={11} /> Simulated Demo Feed</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Navigation Footer ── */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button variant="ghost" onClick={() => navigate('/signals/voice')} className="text-xs">
          <ArrowLeft size={13} /> Back to Voice
        </Button>
        <Button onClick={() => navigate('/signals/gsr')} className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-4">
          Next: GSR Analysis <ArrowRight size={13} />
        </Button>
      </div>
    </div>
  )
}

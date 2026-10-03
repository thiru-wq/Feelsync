import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../store'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { StepBreadcrumb } from './StepBreadcrumb'
import {
  Cpu, Sparkles, ArrowRight, ArrowLeft,
  CheckCircle2, AlertCircle, WifiOff
} from 'lucide-react'
import { createSignalProvider } from '../../services/signalProvider'
import type { GSRAnalysisResult } from '../../types'

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

export function GSRScreen() {
  const navigate = useNavigate()
  const { gsrResult, setGsrResult, addActivity } = useApp()

  const [arousal, setArousal] = useState(gsrResult?.arousal ?? 32)
  const [relaxation, setRelaxation] = useState(gsrResult?.relaxation ?? 78)
  const [arousalHistory, setArousalHistory] = useState<number[]>([36, 34, 32, 33, 31, 32, 30, 32])
  const [relaxHistory, setRelaxHistory] = useState<number[]>([72, 74, 76, 77, 78, 79, 78, 80])
  const [selectedPreset, setSelectedPreset] = useState<'relaxed' | 'baseline' | 'aroused'>('relaxed')
  const [lastReadingTime, setLastReadingTime] = useState<Date>(new Date())
  const providerRef = useRef(createSignalProvider())

  useEffect(() => {
    const provider = providerRef.current
    provider.start(r => {
      setArousal(Math.round(r.gsrArousal))
      setRelaxation(Math.round(r.gsrRelaxation))
      setLastReadingTime(new Date(r.timestamp))
      setArousalHistory(prev => [...prev.slice(-19), r.gsrArousal])
      setRelaxHistory(prev => [...prev.slice(-19), r.gsrRelaxation])
    })
    return () => provider.stop()
  }, [])

  const applyPreset = (preset: 'relaxed' | 'baseline' | 'aroused') => {
    setSelectedPreset(preset)
    let a = 28, r = 82, tone = 'Parasympathetic Rest & Digest Dominant', state = 'Deep Somatic Relaxation'
    if (preset === 'baseline') { a = 44; r = 65; tone = 'Balanced Autonomic Equilibrium'; state = 'Resting Autonomic Baseline' }
    else if (preset === 'aroused') { a = 74; r = 38; tone = 'Sympathetic Arousal Activation'; state = 'Elevated Somatic Arousal' }
    setArousal(a); setRelaxation(r)
    const result: GSRAnalysisResult = {
      status: 'completed', isSimulated: true, arousal: a, relaxation: r,
      autonomicTone: tone, physiologicalState: state, timestamp: new Date().toISOString(),
    }
    setGsrResult(result)
    addActivity({ id: `gsr-${Date.now()}`, type: 'signal', label: `GSR Skin Conductance: ${r}/100 Relaxation (Sample Data)`, timestamp: result.timestamp })
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-28 md:pb-8 max-w-2xl mx-auto w-full">
      <StepBreadcrumb currentStep="gsr" />

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GSR Skin Conductance</h1>
          <p className="text-gray-400 text-sm">
            Simulated galvanic skin response indicators for sympathetic arousal and somatic ease.
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
            No physical GSR sensor is connected. This stream demonstrates how galvanic skin conductance feeds into the Multimodal Fusion engine. Not for clinical or diagnostic use.
          </p>
        </div>
      </div>

      {/* ── GSR Monitor Card ── */}
      <Card className="mb-6 p-5 bg-white border-gray-100 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Cpu size={17} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Live Simulated Conductance Feed</p>
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
          <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-900">Somatic Relaxation</span>
              <span className="text-xl font-bold text-emerald-700 tabular-nums">{relaxation}<span className="text-xs font-normal text-gray-400">/100</span></span>
            </div>
            <div className="h-2 bg-emerald-100 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${relaxation}%` }} />
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>Tense</span>
              <Sparkline history={relaxHistory} stroke="#059669" />
              <span>Deep Ease</span>
            </div>
          </div>
          <div className="bg-orange-50/60 rounded-2xl p-4 border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-orange-900">Sympathetic Arousal</span>
              <span className="text-xl font-bold text-orange-700 tabular-nums">{arousal}<span className="text-xs font-normal text-gray-400">/100</span></span>
            </div>
            <div className="h-2 bg-orange-100 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-700" style={{ width: `${arousal}%` }} />
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>Low</span>
              <Sparkline history={arousalHistory} stroke="#ea580c" />
              <span>Activated</span>
            </div>
          </div>
        </div>

        {/* Preset Simulators — no emoji prefixes */}
        <div className="pt-3 border-t border-gray-100">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Simulate Autonomic State</p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'relaxed' as const,  label: 'Parasympathetic Relax',  activeClass: 'bg-emerald-600 text-white' },
              { id: 'baseline' as const, label: 'Neutral Equilibrium',     activeClass: 'bg-blue-600 text-white'    },
              { id: 'aroused' as const,  label: 'Sympathetic Activation',  activeClass: 'bg-orange-600 text-white'  },
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

      {/* ── GSR Analysis Output ── */}
      <section className="mb-6" aria-labelledby="gsr-output-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="gsr-output-heading" className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Sparkles size={15} className="text-emerald-600" /> GSR Analysis Output (Sample Data)
          </h2>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 size={11} /> Stream Validated
          </span>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-start justify-between gap-4 pb-3 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Autonomic State</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">
                {selectedPreset === 'relaxed' ? 'Parasympathetic Rest & Digest Dominant'
                  : selectedPreset === 'baseline' ? 'Balanced Autonomic Equilibrium'
                  : 'Elevated Sympathetic Arousal'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Somatic State: <strong>{selectedPreset === 'relaxed' ? 'Low Skin Resistance Fluctuations'
                  : selectedPreset === 'baseline' ? 'Stable Tonic Conductance'
                  : 'Elevated Phasic Micro-bursts'}</strong>
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xl font-bold text-emerald-600">{relaxation}/100</span>
              <p className="text-[10px] text-gray-400">Relaxation Index</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="font-semibold text-gray-800">Tonic Skin Conductance</p>
              <p className="text-gray-400 mt-0.5">Indicative of calm parasympathetic tone.</p>
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
        <Button variant="ghost" onClick={() => navigate('/signals/eeg')} className="text-xs">
          <ArrowLeft size={13} /> Back to EEG
        </Button>
        <Button onClick={() => navigate('/signals/fusion')} className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-5 shadow-xs">
          Proceed to Fusion Engine <ArrowRight size={13} />
        </Button>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../store'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { StepBreadcrumb } from './StepBreadcrumb'
import { FusionCore } from '../../components/FusionCore'
import {
  Sparkles, Camera, Mic, Brain, Cpu,
  ShieldAlert, RotateCcw, Wind, Leaf,
  MessageCircle, Smile, ArrowDown, ShieldCheck
} from 'lucide-react'

import type { FusionResult } from '../../types'

export function FusionScreen() {
  const navigate = useNavigate()
  const {
    faceResult, voiceResult, eegResult, gsrResult,
    fusionResult, triggerFusion, addActivity
  } = useApp()

  const [fusion, setFusion] = useState<FusionResult | null>(() => {
    return fusionResult ?? triggerFusion()
  })
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    const res = triggerFusion()
    setFusion(res)
    addActivity({
      id: `fusion-${Date.now()}`,
      type: 'fusion',
      label: `Multimodal Fusion: ${res.combinedState}`,
      timestamp: res.timestamp,
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRecalculate = () => {
    setCalculating(true)
    setTimeout(() => {
      const res = triggerFusion()
      setFusion(res)
      setCalculating(false)
    }, 600)
  }

  const handleOpenVoiceAgent = () => {
    // Navigate to Voice Assistant with fusion context loaded in store
    navigate('/voice')
  }

  if (!fusion) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Sparkles size={40} className="text-violet-500 animate-spin-slow mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Synthesizing Signals…</h2>
      </div>
    )
  }

  const { signalContributions } = fusion

  return (
    <div className="flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-28 md:pb-8 max-w-2xl mx-auto w-full" style={{ animation: 'page-enter 0.55s cubic-bezier(0.22,1,0.36,1) both' }}>
      {/* ── Breadcrumb ── */}
      <StepBreadcrumb currentStep="fusion" />

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold mb-2">
            <Sparkles size={14} className="text-violet-600" /> AI Multimodal Synthesis Engine
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Wellness Fusion Result
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Integrated holistic analysis across facial, vocal, brainwave, and skin response signals.
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRecalculate}
          disabled={calculating}
          className="shrink-0 text-violet-700"
          title="Re-run AI synthesis"
        >
          <RotateCcw size={14} className={calculating ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* ── 1. Visual 4-Signal Synthesis Flow Pipeline ── */}
      <Card className="mb-6 p-4 sm:p-5 bg-gradient-to-b from-gray-50/80 to-white border-gray-150 shadow-xs">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">
          Multimodal Signal Ingestion
        </p>

        {/* Animated FusionCore showing signal convergence */}
        <div className="flex justify-center mb-4" aria-hidden="true">
          <FusionCore active={!calculating} completed={!calculating} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs mb-3">
          {/* Face Signal Input */}
          <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 ${
            signalContributions.face.status === 'active'
              ? 'bg-blue-50/80 border-blue-200 text-blue-900'
              : 'bg-gray-100/70 border-gray-200 text-gray-400'
          }`}>
            <Camera size={16} className={signalContributions.face.status === 'active' ? 'text-blue-600' : 'text-gray-400'} />
            <span className="font-bold">Face Output</span>
            <span className="text-[10px] text-gray-500 truncate max-w-full">
              {faceResult?.status === 'completed' ? faceResult.expression : 'Excluded'}
            </span>
          </div>

          {/* Voice Signal Input */}
          <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 ${
            signalContributions.voice.status === 'active'
              ? 'bg-violet-50/80 border-violet-200 text-violet-900'
              : 'bg-gray-100/70 border-gray-200 text-gray-400'
          }`}>
            <Mic size={16} className={signalContributions.voice.status === 'active' ? 'text-violet-600' : 'text-gray-400'} />
            <span className="font-bold">Voice Output</span>
            <span className="text-[10px] text-gray-500 truncate max-w-full">
              {voiceResult?.status === 'completed' ? voiceResult.tone : 'Excluded'}
            </span>
          </div>

          {/* EEG Signal Input */}
          <div className="p-2.5 rounded-xl border bg-amber-50/80 border-amber-200 text-amber-900 flex flex-col items-center justify-center gap-1">
            <Brain size={16} className="text-amber-600" />
            <span className="font-bold">EEG Output</span>
            <span className="text-[10px] text-amber-700 truncate max-w-full">
              {eegResult?.calmness ?? 76}/100 Calm*
            </span>
          </div>

          {/* GSR Signal Input */}
          <div className="p-2.5 rounded-xl border bg-emerald-50/80 border-emerald-200 text-emerald-900 flex flex-col items-center justify-center gap-1">
            <Cpu size={16} className="text-emerald-600" />
            <span className="font-bold">GSR Output</span>
            <span className="text-[10px] text-emerald-700 truncate max-w-full">
              {gsrResult?.relaxation ?? 78}/100 Relax*
            </span>
          </div>
        </div>

        {/* Down Arrow / Fusion Engine Node */}
        <div className="flex flex-col items-center justify-center my-1">
          <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 mb-1">
            <ArrowDown size={16} />
          </div>
          <div className="px-4 py-1.5 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm">
            <Sparkles size={14} /> AI Multimodal Fusion Engine
          </div>
        </div>

        <p className="text-[10px] text-gray-400 text-center mt-2">
          *EEG and GSR streams are simulated demo data. Weight is normalized dynamically.
        </p>
      </Card>

      {/* ── 2. Primary Combined Wellness State Card ── */}
      <div className="mb-6 bg-gradient-to-br from-violet-50 via-lavender-50 to-indigo-50 border border-violet-150 rounded-3xl p-6 shadow-sm relative overflow-hidden" style={{ animation: 'card-enter 0.5s cubic-bezier(0.22,1,0.36,1) 200ms both' }}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-xs text-violet-700 font-semibold uppercase tracking-wider">
              Combined Wellness State
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 tracking-tight">
              {fusion.combinedState}
            </h2>
          </div>

          {/* Confidence Badge */}
          <div className="flex flex-col items-end shrink-0">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-violet-600 text-white shadow-xs">
              Demo Fusion Confidence: {fusion.demoConfidence}%
            </span>
            <span className="text-[10px] text-violet-700 mt-0.5">Algorithm alignment</span>
          </div>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          {fusion.stateSummary}
        </p>

        {/* Synthesis Explanation Box */}
        <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 border border-violet-150 text-xs text-gray-700 leading-relaxed">
          <p className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" /> How this combined result was formed:
          </p>
          <p className="text-gray-600">{fusion.synthesisExplanation}</p>
        </div>

        {/* Excluded Signals Notice if any */}
        {fusion.excludedCount > 0 && (
          <div className="mt-3 text-xs bg-amber-50/90 border border-amber-200 rounded-xl p-2.5 text-amber-800 flex items-center gap-2">
            <ShieldAlert size={14} className="text-amber-600 shrink-0" />
            <span>
              {fusion.excludedCount} signal was unavailable/skipped. Fusion continued smoothly with available modalities.
            </span>
          </div>
        )}

        {/* Non-clinical disclaimer */}
        <p className="text-[11px] text-gray-400 mt-4 flex items-center gap-1.5">
          <ShieldAlert size={13} className="shrink-0 text-gray-400" />
          <strong>Wellness Guidance:</strong> For personal emotional awareness only; not a clinical diagnosis or medical evaluation.
        </p>
      </div>

      {/* ── 3. Signal Contribution Breakdown ── */}
      <section className="mb-6" aria-labelledby="contributions-heading">
        <h3 id="contributions-heading" className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Individual Signal Contributions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(signalContributions).map(([key, item]) => {
            const isExcluded = item.status !== 'active'
            const Icon = key === 'face' ? Camera : key === 'voice' ? Mic : key === 'eeg' ? Brain : Cpu
            const colorClass = key === 'face' ? 'text-blue-600' : key === 'voice' ? 'text-violet-600' : key === 'eeg' ? 'text-amber-600' : 'text-emerald-600'
            const bgClass = key === 'face' ? 'bg-blue-50' : key === 'voice' ? 'bg-violet-50' : key === 'eeg' ? 'bg-amber-50' : 'bg-emerald-50'

            return (
              <div
                key={key}
                className={`bg-white border rounded-2xl p-3.5 shadow-xs transition-all ${
                  isExcluded ? 'border-dashed border-gray-200 opacity-60' : 'border-gray-150'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${bgClass}`}>
                      <Icon size={14} className={colorClass} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{item.name}</p>
                      {item.isSimulated && (
                        <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-full">Sample Data</span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-bold tabular-nums ${isExcluded ? 'text-gray-400' : 'text-gray-900'}`}>
                    {item.weightPct}% weight
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 leading-snug">
                  {item.summary}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 4. Voice Agent Primary CTA Hero Card ── */}
      <div className="mb-6 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-5 md:p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold mb-2">
              <Mic size={12} /> Connected Voice Wellness Agent
            </div>
            <h3 className="text-lg md:text-xl font-bold tracking-tight">
              Talk to FeelSync Voice Agent
            </h3>
            <p className="text-violet-100 text-xs md:text-sm mt-1 max-w-md leading-relaxed">
              Your Voice Agent is ready with your multimodal fusion context (<strong>{fusion.combinedState}</strong>).
            </p>
          </div>
          <button
            onClick={handleOpenVoiceAgent}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-violet-700 font-bold text-sm hover:bg-violet-50 transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 active:scale-95"
          >
            <Mic size={16} />
            Start Voice Agent
          </button>
        </div>
      </div>

      {/* ── 5. Personalized Wellness Activities Grid ── */}
      <section className="mb-6" aria-labelledby="activities-heading">
        <div className="flex items-center justify-between mb-3">
          <h3 id="activities-heading" className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Personalized Wellness Activities
          </h3>
          <span className="text-xs text-gray-400">Tailored to your fusion state</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Breathing */}
          <Card
            onClick={() => navigate('/breathing')}
            className="p-4 cursor-pointer hover:-translate-y-0.5 transition-all shadow-xs hover:shadow-md bg-white border-gray-150 flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Wind size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm text-gray-900">Guided Breathing</p>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">2 min</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Box &amp; 4-7-8 nervous system pacing</p>
            </div>
          </Card>

          {/* Grounding */}
          <Card
            onClick={() => navigate('/grounding')}
            className="p-4 cursor-pointer hover:-translate-y-0.5 transition-all shadow-xs hover:shadow-md bg-white border-gray-150 flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Leaf size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm text-gray-900">5-4-3-2-1 Grounding</p>
                <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">Sensory</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Anchor attention to the present moment</p>
            </div>
          </Card>

          {/* Journaling / Companion */}
          <Card
            onClick={() => navigate('/companion')}
            className="p-4 cursor-pointer hover:-translate-y-0.5 transition-all shadow-xs hover:shadow-md bg-white border-gray-150 flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <MessageCircle size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm text-gray-900">Reflective Journaling</p>
                <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">Chat</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Explore feelings with FeelSync AI</p>
            </div>
          </Card>

          {/* Mood Check-in */}
          <Card
            onClick={() => navigate('/mood')}
            className="p-4 cursor-pointer hover:-translate-y-0.5 transition-all shadow-xs hover:shadow-md bg-white border-gray-150 flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Smile size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm text-gray-900">Log Daily Mood</p>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Streak</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Save this check-in to your history</p>
            </div>
          </Card>
        </div>
      </section>

      {/* ── Footer Navigation ── */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button variant="ghost" onClick={() => navigate('/signals')} className="text-xs">
          ← Back to Signals Overview
        </Button>

        <Button
          onClick={() => navigate('/dashboard')}
          className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs px-5 shadow-xs"
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  )
}

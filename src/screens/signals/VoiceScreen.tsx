import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../store'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { StepBreadcrumb } from './StepBreadcrumb'
import {
  Mic, MicOff, Sparkles, ArrowRight, ArrowLeft,
  CheckCircle2, AlertCircle, Activity, Volume2, ShieldCheck, Play, Clock
} from 'lucide-react'
import type { VoiceAnalysisResult } from '../../types'

const VOICE_PROMPTS = [
  "\"I am taking a mindful moment with FeelSync to check in with my well-being.\"",
  "\"Right now, I am feeling present and noticing how my mind and body feel.\"",
  "\"I am ready to find calm and balance throughout my day.\"",
]

const MAX_RECORDING_SECONDS = 7

export function VoiceScreen() {
  const navigate = useNavigate()
  const { voiceResult, setVoiceResult, addActivity } = useApp()

  const [recording, setRecording] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [recordingElapsed, setRecordingElapsed] = useState(0)
  const [audioLevel, setAudioLevel] = useState<number[]>([12, 18, 25, 16, 22, 14, 28])
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [liveData, setLiveData] = useState<VoiceAnalysisResult | null>(voiceResult)
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0)

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopAudio = useCallback(() => {
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null }
    if (autoStopTimeoutRef.current) { clearTimeout(autoStopTimeoutRef.current); autoStopTimeoutRef.current = null }
    if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()); mediaStreamRef.current = null }
    if (audioContextRef.current) { try { audioContextRef.current.close() } catch {}; audioContextRef.current = null }
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null }
    setRecording(false)
  }, [])

  useEffect(() => () => stopAudio(), [stopAudio])

  const completeVoiceAnalysis = useCallback((isSimulated = false) => {
    const tones = ['Warm & Grounded', 'Steady & Clear', 'Gently Relaxed', 'Calm & Melodic']
    const tone = tones[Math.floor(Math.random() * tones.length)]
    const vocalEnergy = 65 + Math.floor(Math.random() * 20)
    const pitchVariance = 70 + Math.floor(Math.random() * 18)
    const confidence = 86 + Math.floor(Math.random() * 8)
    const result: VoiceAnalysisResult = {
      status: 'completed', tone, pitchVariance, cadence: 'Balanced (114 wpm)',
      vocalEnergy, stressLevel: 'Low', confidence,
      transcript: VOICE_PROMPTS[selectedPromptIndex].replace(/^"|"$/g, ''),
      isSimulated, timestamp: new Date().toISOString(),
    }
    setLiveData(result); setVoiceResult(result)
    addActivity({ id: `voice-${Date.now()}`, type: 'signal', label: `Voice Analysis: ${result.tone}`, timestamp: result.timestamp })
  }, [selectedPromptIndex, setVoiceResult, addActivity])

  const finishRecordingAndAnalyze = useCallback(() => {
    stopAudio(); setAnalyzing(true)
    setTimeout(() => { setAnalyzing(false); completeVoiceAnalysis(false) }, 1100)
  }, [stopAudio, completeVoiceAnalysis])

  const startVoiceRecording = async () => {
    setPermissionError(null); setRecordingElapsed(0)
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone audio API not supported by browser.')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      audioContextRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 32
      source.connect(analyser)
      analyserRef.current = analyser
      setRecording(true)
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      const updateWaveform = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        const levels = Array.from(dataArray.slice(0, 7)).map(v => Math.max(8, Math.round((v / 255) * 48)))
        setAudioLevel(levels)
        animFrameRef.current = requestAnimationFrame(updateWaveform)
      }
      updateWaveform()
      const startTime = Date.now()
      timerIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000
        setRecordingElapsed(Math.min(MAX_RECORDING_SECONDS, elapsed))
      }, 100)
      autoStopTimeoutRef.current = setTimeout(() => { finishRecordingAndAnalyze() }, MAX_RECORDING_SECONDS * 1000)
    } catch (err: unknown) {
      console.warn('Microphone permission warning:', err)
      const msg = err instanceof Error ? err.message : 'Microphone access denied or unavailable.'
      setPermissionError(msg); setRecording(false)
    }
  }

  const runSimulatedScan = () => {
    setPermissionError(null); setAnalyzing(true)
    setTimeout(() => { setAnalyzing(false); completeVoiceAnalysis(true) }, 1200)
  }

  const handleSkip = () => {
    const skippedResult: VoiceAnalysisResult = {
      status: 'skipped', tone: 'Skipped by User', pitchVariance: 0,
      cadence: 'N/A', vocalEnergy: 0, stressLevel: 'Low', confidence: 0,
      timestamp: new Date().toISOString(),
    }
    setVoiceResult(skippedResult); navigate('/signals/eeg')
  }

  const recordingPct = Math.min(100, Math.round((recordingElapsed / MAX_RECORDING_SECONDS) * 100))
  const secondsRemaining = Math.max(0, Math.ceil(MAX_RECORDING_SECONDS - recordingElapsed))

  return (
    <div className="flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-28 md:pb-8 max-w-2xl mx-auto w-full">
      <StepBreadcrumb currentStep="voice" />

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voice Acoustics</h1>
          <p className="text-gray-400 text-sm">
            Analyzes vocal resonance, pitch stability, and speech prosody over a 6–7 second voice check.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100 shrink-0 ml-3">
          {liveData?.status === 'completed' ? 'Completed' : 'Ready to Record'}
        </span>
      </div>

      {/* ── Microphone Card ── */}
      <Card className="mb-6 p-5 bg-white border-gray-100 shadow-xs relative text-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Suggested Reading Prompt</p>
        <div className="bg-violet-50/70 border border-violet-100 rounded-2xl p-4 mb-5 text-center">
          <p className="text-sm font-medium text-violet-900 italic leading-relaxed">
            {VOICE_PROMPTS[selectedPromptIndex]}
          </p>
          <div className="flex justify-center gap-2 mt-3">
            {VOICE_PROMPTS.map((_, idx) => (
              <button key={idx} onClick={() => setSelectedPromptIndex(idx)} aria-label={`Prompt ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${selectedPromptIndex === idx ? 'w-5 bg-violet-600' : 'w-2 bg-violet-200'}`}
              />
            ))}
          </div>
        </div>

        {/* Orb */}
        <div className="flex flex-col items-center justify-center my-3">
          <div className="relative flex items-center justify-center mb-3">
            {recording && (
              <>
                <div className="absolute w-36 h-36 rounded-full bg-emerald-200/50 animate-ping" />
                <div className="absolute w-44 h-44 rounded-full bg-emerald-100/40 animate-pulse-ring" />
              </>
            )}
            <button
              onClick={() => { if (recording) finishRecordingAndAnalyze(); else startVoiceRecording() }}
              disabled={analyzing}
              className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-lg transition-all ${
                recording ? 'bg-emerald-500 text-white hover:bg-emerald-600 scale-105 shadow-emerald-200'
                  : analyzing ? 'bg-violet-400 text-white cursor-wait animate-pulse'
                  : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-200'
              }`}
            >
              {recording ? (
                <><MicOff size={26} /><span className="text-[10px] font-semibold mt-1">Tap to Finish</span></>
              ) : analyzing ? (
                <><Sparkles size={26} className="animate-spin" /><span className="text-[10px] font-semibold mt-1">Analyzing</span></>
              ) : (
                <><Mic size={26} /><span className="text-[10px] font-semibold mt-1">Start (7s)</span></>
              )}
            </button>
          </div>

          {/* 7-second progress — full width */}
          {recording && (
            <div className="w-full mx-auto mb-3 bg-gray-50 border border-emerald-100 rounded-2xl p-3 shadow-xs animate-fade-in">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Recording: {recordingElapsed.toFixed(1)}s / {MAX_RECORDING_SECONDS}s
                </span>
                <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-mono">
                  <Clock size={11} /> {secondsRemaining}s remaining
                </span>
              </div>
              <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-100 rounded-full" style={{ width: `${recordingPct}%` }} />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">Automatically finishes after {MAX_RECORDING_SECONDS} seconds.</p>
            </div>
          )}

          {/* Waveform */}
          <div className="flex items-center justify-center gap-1.5 h-12" aria-hidden="true">
            {audioLevel.map((lvl, i) => (
              <span key={i} className={`w-2 rounded-full transition-all duration-100 ${recording ? 'bg-emerald-500' : 'bg-violet-200'}`}
                style={{ height: `${lvl}px` }}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {recording ? 'Listening… speak naturally for 6–7 seconds'
              : analyzing ? 'Analyzing acoustic cadence, harmonics, and energy…'
              : 'Tap microphone to speak naturally for 6–7 seconds'}
          </p>
        </div>

        <div className="flex justify-center gap-2 pt-2 border-t border-gray-100 mt-4">
          <Button size="sm" variant="ghost" onClick={runSimulatedScan} className="text-xs text-violet-700">
            <Play size={13} /> Simulate Sample Voice Data
          </Button>
        </div>

        {permissionError && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2 text-left">
            <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-600" />
            <div className="flex-1">
              <p className="font-semibold">Microphone Notice</p>
              <p>{permissionError}</p>
              <p className="mt-1 text-[11px] text-amber-700">You can proceed with <strong>Demo Sample Data</strong> or skip.</p>
            </div>
            <Button size="sm" onClick={runSimulatedScan} className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
              Use Sample Data
            </Button>
          </div>
        )}
      </Card>

      {/* ── Voice Analysis Output ── */}
      <section className="mb-6" aria-labelledby="voice-output-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="voice-output-heading" className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Sparkles size={15} className="text-violet-600" /> Voice Analysis Output
          </h2>
          {liveData?.status === 'completed' && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 size={11} /> Analysis Ready
            </span>
          )}
        </div>
        {liveData?.status === 'completed' ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 animate-fade-in">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Acoustic Tone &amp; Valence</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{liveData.tone}</p>
                <p className="text-xs text-gray-400 mt-1">Cadence: <strong>{liveData.cadence}</strong> · Stress: <strong>{liveData.stressLevel}</strong></p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-2xl font-bold text-violet-600">{liveData.vocalEnergy}%</span>
                <p className="text-[10px] text-gray-400">Vocal Energy Index</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-violet-50/50 rounded-xl p-3 border border-violet-100/60">
                <div className="flex items-center gap-1.5 text-violet-700 mb-1"><Activity size={13} /><span className="text-xs font-semibold">Pitch Variance</span></div>
                <p className="text-sm font-bold text-gray-900">{liveData.pitchVariance}%</p>
                <p className="text-[10px] text-gray-400">Harmonic stability</p>
              </div>
              <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/60">
                <div className="flex items-center gap-1.5 text-emerald-700 mb-1"><Volume2 size={13} /><span className="text-xs font-semibold">Acoustic Stress</span></div>
                <p className="text-sm font-bold text-gray-900">{liveData.stressLevel} Stress</p>
                <p className="text-[10px] text-gray-400">Low micro-tremor</p>
              </div>
              <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100/60 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1.5 text-blue-700 mb-1"><ShieldCheck size={13} /><span className="text-xs font-semibold">Acoustic Score</span></div>
                <p className="text-sm font-bold text-gray-900">{liveData.confidence}%</p>
                <p className="text-[10px] text-gray-400">{liveData.isSimulated ? 'Sample mode' : '6–7s live audio'}</p>
              </div>
            </div>
            <p className="text-[11px] text-gray-400">
              🔒 <strong>Privacy:</strong> Raw voice audio is processed locally and discarded after acoustic extraction.
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center">
            <p className="text-sm text-gray-500">No voice analysis performed yet.</p>
            <p className="text-xs text-gray-400 mt-1">Record a 6–7s sample or use demo data above.</p>
          </div>
        )}
      </section>

      {/* ── Navigation Footer ── */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button variant="ghost" onClick={() => navigate('/signals/face')} className="text-xs">
          <ArrowLeft size={13} /> Back to Face
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleSkip} className="text-xs">Skip Modality</Button>
          <Button onClick={() => navigate('/signals/eeg')} className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-4">
            Next: EEG <ArrowRight size={13} />
          </Button>
        </div>
      </div>
    </div>
  )
}

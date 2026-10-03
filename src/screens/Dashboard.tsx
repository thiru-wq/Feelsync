import { useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { Card } from '../components/Card'
import { MoodBadge } from '../components/MoodBadge'
import { WellnessOrb } from '../components/WellnessOrb'
import {
  Smile, MessageCircle, Wind, Activity,
  Clock, ChevronRight, Mic, BarChart2, Leaf, Heart, Sun,
  Camera, Brain, Cpu, ArrowRight, ShieldAlert, Sparkles
} from 'lucide-react'

const quickActions = [
  { label: 'Voice Agent',   icon: Mic,           to: '/voice',     bg: 'bg-violet-100', text: 'text-violet-700', desc: 'Hands-free voice chat' },
  { label: 'Check Mood',    icon: Smile,         to: '/mood',      bg: 'bg-amber-100',  text: 'text-amber-700',  desc: 'Daily emotional check' },
  { label: 'AI Companion',  icon: MessageCircle, to: '/companion', bg: 'bg-blue-100',   text: 'text-blue-700',   desc: 'Guided wellness chat'  },
  { label: 'Breathe',       icon: Wind,          to: '/breathing', bg: 'bg-emerald-100',text: 'text-emerald-700',desc: '2-min nervous reset' },
  { label: 'Grounding',     icon: Leaf,          to: '/grounding', bg: 'bg-teal-100',   text: 'text-teal-700',   desc: '5-4-3-2-1 technique'  },
  { label: 'Signals',       icon: Activity,      to: '/signals',   bg: 'bg-orange-100', text: 'text-orange-700', desc: 'EEG & GSR indicators'  },
  { label: 'Summary',       icon: BarChart2,     to: '/summary',   bg: 'bg-indigo-100', text: 'text-indigo-700', desc: 'Trends & progress'    },
  { label: 'History',       icon: Clock,         to: '/history',   bg: 'bg-rose-100',   text: 'text-rose-700',   desc: 'Activity log'         },
]

function greeting(name: string) {
  const h = new Date().getHours()
  const time = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${time}, ${name || 'Friend'}`
}

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

export function Dashboard() {
  const navigate = useNavigate()
  const {
    profile, currentMood, moodHistory, activities,
    faceResult, voiceResult, fusionResult
  } = useApp()
  const currentStreak = streak(moodHistory.map(e => e.timestamp))

  const moodStateLabel = currentMood
    ? `${currentMood.mood.charAt(0).toUpperCase() + currentMood.mood.slice(1)}`
    : 'Calm / Neutral'

  return (
    <div className="flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-28 md:pb-8 max-w-3xl mx-auto w-full" style={{ animation: 'page-enter 0.55s cubic-bezier(0.22,1,0.36,1) both' }}>

      {/* ── 1. Greeting Header ── */}
      <div className="flex items-center justify-between mb-6" style={{ animation: 'card-enter 0.5s cubic-bezier(0.22,1,0.36,1) 80ms both' }}>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 mb-1">
            <Sun size={13} className="text-amber-500" /> Daily Wellness Space
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            {greeting(profile.name)} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            How can FeelSync support your well-being today?
          </p>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 font-bold text-sm hover:bg-violet-200 transition-colors shadow-xs"
          title="Profile settings"
        >
          {profile.name ? profile.name.slice(0, 2).toUpperCase() : 'ME'}
        </button>
      </div>

      {/* ── 2. Voice Agent Hero Card with WellnessOrb ── */}
      <div className="mb-6 bg-gradient-to-r from-violet-50 via-violet-50/40 to-indigo-50 border border-violet-200 rounded-3xl p-5 md:p-6 shadow-xs relative overflow-hidden" style={{ animation: 'card-enter 0.5s cubic-bezier(0.22,1,0.36,1) 160ms both' }}>
        {/* Ambient orb — decorative, right side */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-35 pointer-events-none hidden sm:block" aria-hidden="true">
          <WellnessOrb size="sm" showSignals={false} />
        </div>
        {/* Ambient background glow */}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)', filter: 'blur(20px)', animation: 'glow-ring 6s ease-in-out infinite' }} />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold mb-2">
              <Mic size={13} className="text-violet-600" /> FeelSync Voice Agent
            </div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Talk to FeelSync</h2>
            <p className="text-gray-500 text-sm mt-1 leading-relaxed">
              Talk naturally with your FeelSync wellness companion.
            </p>
          </div>
          <button
            onClick={() => navigate('/voice')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 active:scale-95"
          >
            <Mic size={16} />
            Start Voice Agent
          </button>
        </div>
      </div>

      {/* ── 3. Mood Check-in Card ── */}
      {currentMood ? (
        <Card className="mb-6 flex items-center justify-between bg-white border-gray-100 p-5 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-xl shadow-xs shrink-0">
              💜
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Today's mood check-in</p>
              <div className="mt-1 flex items-center gap-2">
                <MoodBadge mood={currentMood.mood} />
              </div>
              <p className="text-xs text-gray-400 mt-1 leading-normal">
                Your check-in helps personalise your wellness support.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/mood')}
            className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors shrink-0 ml-2"
          >
            Update <ChevronRight size={15} />
          </button>
        </Card>
      ) : (
        <Card
          className="mb-6 bg-white border-violet-100 hover:border-violet-300 transition-all cursor-pointer p-5 shadow-xs"
          onClick={() => navigate('/mood')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">✨ How are you feeling right now?</p>
              <p className="text-xs text-gray-400 mt-0.5">Your check-in helps personalise your wellness support.</p>
            </div>
            <button className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold shadow-xs hover:bg-violet-700 transition-colors shrink-0 ml-2">
              Check in
            </button>
          </div>
        </Card>
      )}

      {/* ── 4. Stats Section — numbers as dominant visual ── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="p-4 text-center bg-white border-gray-100 shadow-xs">
          <p className="text-2xl font-bold text-gray-900 leading-none">{moodHistory.length}</p>
          <div className="flex items-center justify-center gap-1 mt-1.5">
            <Smile size={13} className="text-violet-500" />
            <span className="text-xs font-medium text-gray-400">Check-ins</span>
          </div>
        </Card>
        <Card className="p-4 text-center bg-white border-gray-100 shadow-xs">
          <p className="text-2xl font-bold text-gray-900 leading-none">{activities.length}</p>
          <div className="flex items-center justify-center gap-1 mt-1.5">
            <Activity size={13} className="text-emerald-500" />
            <span className="text-xs font-medium text-gray-400">Activities</span>
          </div>
        </Card>
        <Card className="p-4 text-center bg-white border-gray-100 shadow-xs">
          <p className="text-2xl font-bold text-gray-900 leading-none">{currentStreak} <span className="text-sm font-normal text-gray-400">d</span></p>
          <div className="flex items-center justify-center gap-1 mt-1.5">
            <Heart size={13} className="text-amber-500" />
            <span className="text-xs font-medium text-gray-400">Streak</span>
          </div>
        </Card>
      </div>

      {/* ── 5. Multimodal Wellness Signal Cards ── */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 tracking-tight">Multimodal Wellness</h2>
            <p className="text-xs text-gray-400 mt-0.5">Understand your wellness through multiple signals.</p>
          </div>
          <button
            onClick={() => navigate('/signals')}
            className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors flex items-center gap-1"
          >
            Full Overview <ChevronRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Face */}
          <div
            onClick={() => navigate('/signals/face')}
            className="bg-white border border-gray-100 hover:border-blue-200 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            role="button" tabIndex={0} aria-label="Open Face Analysis"
            onKeyDown={e => e.key === 'Enter' && navigate('/signals/face')}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Camera size={15} />
                </div>
                <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${faceResult?.status === 'completed' ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-gray-500 bg-gray-50 border border-gray-100'}`}>
                  {faceResult?.status === 'completed' ? 'Ready' : 'Open'}
                </span>
              </div>
              <p className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Face</p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">Facial cues &amp; expression</p>
            </div>
            <p className="text-[10px] text-blue-600 font-semibold mt-2 flex items-center gap-0.5">
              Explore <ChevronRight size={11} />
            </p>
          </div>

          {/* Voice */}
          <div
            onClick={() => navigate('/signals/voice')}
            className="bg-white border border-gray-100 hover:border-violet-200 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            role="button" tabIndex={0} aria-label="Open Voice Acoustics Analysis"
            onKeyDown={e => e.key === 'Enter' && navigate('/signals/voice')}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Mic size={15} />
                </div>
                <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${voiceResult?.status === 'completed' ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-gray-500 bg-gray-50 border border-gray-100'}`}>
                  {voiceResult?.status === 'completed' ? 'Ready' : 'Open'}
                </span>
              </div>
              <p className="text-xs font-bold text-gray-900 group-hover:text-violet-600 transition-colors">Voice</p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">Speech tone &amp; acoustics</p>
            </div>
            <p className="text-[10px] text-violet-600 font-semibold mt-2 flex items-center gap-0.5">
              Explore <ChevronRight size={11} />
            </p>
          </div>

          {/* EEG */}
          <div
            onClick={() => navigate('/signals/eeg')}
            className="bg-white border border-gray-100 hover:border-amber-200 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            role="button" tabIndex={0} aria-label="Open EEG Brainwaves Analysis"
            onKeyDown={e => e.key === 'Enter' && navigate('/signals/eeg')}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Brain size={15} />
                </div>
                <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5">
                  Open
                </span>
              </div>
              <p className="text-xs font-bold text-gray-900 group-hover:text-amber-600 transition-colors">EEG</p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">Brainwave calm index</p>
            </div>
            <p className="text-[10px] text-amber-600 font-semibold mt-2 flex items-center gap-0.5">
              Explore <ChevronRight size={11} />
            </p>
          </div>

          {/* GSR */}
          <div
            onClick={() => navigate('/signals/gsr')}
            className="bg-white border border-gray-100 hover:border-emerald-200 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            role="button" tabIndex={0} aria-label="Open GSR Skin Response Analysis"
            onKeyDown={e => e.key === 'Enter' && navigate('/signals/gsr')}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Cpu size={15} />
                </div>
                <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5">
                  Open
                </span>
              </div>
              <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">GSR</p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">Skin arousal response</p>
            </div>
            <p className="text-[10px] text-emerald-600 font-semibold mt-2 flex items-center gap-0.5">
              Explore <ChevronRight size={11} />
            </p>
          </div>
        </div>
      </div>

      {/* ── 6. AI Fusion Insight Card ── */}
      <div
        onClick={() => navigate('/signals/fusion')}
        className="mb-6 bg-white border border-gray-100 hover:border-violet-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        role="button" tabIndex={0} aria-label="Open AI Multimodal Fusion Engine Results"
        onKeyDown={e => e.key === 'Enter' && navigate('/signals/fusion')}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">AI Fusion Insight</h3>
              <p className="text-[11px] text-gray-400">Integrated multimodal synthesis</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-1 shrink-0">
            Demo Confidence: {fusionResult?.demoConfidence ?? 88}%
          </span>
        </div>

        <div className="bg-gray-50 rounded-2xl p-3.5 mb-3 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Current wellness state</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{fusionResult?.combinedState ?? moodStateLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
              ● {fusionResult?.availableCount ?? 4}/4 Signals Active
            </p>
            <p className="text-[10px] text-indigo-500 font-medium">Click to view breakdown →</p>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
          <ShieldAlert size={12} className="text-gray-300 shrink-0" />
          Wellness insight, not a medical diagnosis.
        </p>
      </div>

      {/* ── 7. Multimodal Architecture — wellness-style flow ── */}
      <div className="mb-6 bg-violet-50/60 border border-violet-100 rounded-3xl p-4 md:p-5" aria-hidden="true">
        <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-4 text-center">
          How FeelSync Works
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center text-xs">
          <button
            onClick={() => navigate('/signals')}
            className="flex items-center gap-2 bg-white border border-violet-100 hover:border-violet-300 px-4 py-2.5 rounded-2xl text-gray-600 font-medium shadow-xs w-full sm:w-auto justify-center transition-colors"
          >
            <Camera size={13} className="text-blue-500 shrink-0" />
            <span>Face &amp; Voice</span>
            <span className="text-gray-300">·</span>
            <Brain size={13} className="text-amber-500 shrink-0" />
            <span>EEG &amp; GSR</span>
          </button>

          <ArrowRight size={14} className="text-violet-300 hidden sm:block shrink-0" />
          <ArrowRight size={14} className="text-violet-300 sm:hidden rotate-90" />

          <button
            onClick={() => navigate('/signals/fusion')}
            className="bg-violet-600 text-white px-4 py-2.5 rounded-2xl font-semibold shadow-sm w-full sm:w-auto justify-center transition-colors hover:bg-violet-700 flex items-center gap-1.5"
          >
            <Sparkles size={13} /> AI Fusion
          </button>

          <ArrowRight size={14} className="text-violet-300 hidden sm:block shrink-0" />
          <ArrowRight size={14} className="text-violet-300 sm:hidden rotate-90" />

          <button
            onClick={() => navigate('/signals/fusion')}
            className="bg-emerald-100 border border-emerald-200 hover:bg-emerald-200 text-emerald-800 px-4 py-2.5 rounded-2xl font-semibold shadow-xs w-full sm:w-auto justify-center transition-colors"
          >
            Personalised Support
          </button>
        </div>
        <p className="text-[10px] text-violet-300 text-center mt-3">
          *EEG &amp; GSR are simulated sample signals in the current prototype.
        </p>
      </div>

      {/* ── 8. Quick Support Actions Grid ── */}
      <div className="mb-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Quick Support Actions
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 card-stagger">
        {quickActions.map(({ label, icon: Icon, to, bg, text, desc }) => (
          <Card
            key={to}
            onClick={() => navigate(to)}
            className="flex flex-col gap-2 p-4 cursor-pointer hover-lift shadow-xs hover:shadow-md bg-white border-gray-100"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon size={18} className={text} />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800 leading-tight">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
          </Card>
        ))}
      </div>

    </div>
  )
}

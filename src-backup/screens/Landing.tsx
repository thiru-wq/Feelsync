import { useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { Button } from '../components/Button'
import { Sparkles, Wind, Activity, MessageCircle, Mic, BarChart2 } from 'lucide-react'

const features = [
  { icon: MessageCircle, label: 'AI Companion',     desc: 'Chat with Sync anytime',       color: 'bg-violet-100 text-violet-700' },
  { icon: Wind,          label: 'Guided Breathing', desc: 'Calm your nervous system',      color: 'bg-blue-100 text-blue-700'    },
  { icon: Activity,      label: 'Wellness Signals', desc: 'EEG/GSR demo indicators',       color: 'bg-emerald-100 text-emerald-700' },
  { icon: Sparkles,      label: 'Mood Tracking',    desc: 'Daily check-ins & trends',      color: 'bg-orange-100 text-orange-700' },
  { icon: Mic,           label: 'Voice Assistant',  desc: 'Speak hands-free',              color: 'bg-pink-100 text-pink-700'    },
  { icon: BarChart2,     label: 'Wellness Summary', desc: 'Insights at a glance',          color: 'bg-teal-100 text-teal-700'    },
]

export function Landing() {
  const navigate = useNavigate()
  const { profile } = useApp()

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 flex flex-col overflow-hidden">
      {/* Decorative orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-violet-200 opacity-20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-200 opacity-20 blur-3xl" />
      </div>

      {/* Top bar */}
      <header className="relative flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💜</span>
          <span className="font-bold text-violet-700 text-lg tracking-tight">FeelSync</span>
        </div>
        {profile.onboarded && (
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-violet-600 font-medium hover:underline"
          >
            Dashboard →
          </button>
        )}
      </header>

      {/* Hero */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="text-6xl mb-5 animate-fade-in">💜</div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 animate-fade-in leading-tight">
          Feel better,<br />
          <span className="text-violet-600">one moment at a time.</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-md mb-10 animate-fade-in">
          FeelSync is your AI-powered emotional wellness companion — check in, breathe, reflect, and feel supported every day.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-16 animate-fade-in">
          <Button size="lg" onClick={() => navigate(profile.onboarded ? '/dashboard' : '/onboarding')}>
            <Sparkles size={18} />
            {profile.onboarded ? 'Go to Dashboard' : 'Get Started — it\'s free'}
          </Button>
          {!profile.onboarded && (
            <Button size="lg" variant="secondary" onClick={() => navigate('/dashboard')}>
              Explore first
            </Button>
          )}
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl w-full">
          {features.map(({ icon: Icon, label, desc, color }) => (
            <div key={label} className={`flex flex-col items-start gap-2 p-4 rounded-2xl ${color.split(' ')[0]} bg-opacity-60`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={16} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative text-center text-xs text-gray-400 pb-6 px-4">
        FeelSync is a wellness support tool, not a medical diagnostic or treatment system.
      </footer>
    </div>
  )
}

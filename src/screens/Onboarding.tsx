import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { Button } from '../components/Button'
import { ChevronRight, Check } from 'lucide-react'

const GOALS = [
  'Manage stress', 'Improve sleep', 'Build resilience',
  'Practice mindfulness', 'Track my mood', 'Reduce anxiety',
]

const STEPS = ['Welcome', 'Your name', 'Your goals']

export function Onboarding() {
  const navigate = useNavigate()
  const { setProfile } = useApp()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [goals, setGoals] = useState<string[]>([])

  function toggleGoal(g: string) {
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  function finish() {
    setProfile({ name: name.trim() || 'Friend', onboarded: true, goals })
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center px-6 py-12">
      {/* Progress dots */}
      <div className="flex gap-2 mb-10" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
        {STEPS.map((_, i) => (
          <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-violet-500' : i < step ? 'w-2 bg-violet-300' : 'w-2 bg-gray-200'}`} />
        ))}
      </div>

      <div className="w-full max-w-sm animate-fade-in">
        {step === 0 && (
          <div className="text-center">
            {/* Brand mark */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-md mx-auto mb-5">
              <span className="text-white text-3xl">💜</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Hi there!</h2>
            <p className="text-gray-500 mb-8">
              FeelSync is your personal wellness companion. I'm here to help you check in, breathe, and feel supported — one small step at a time.
            </p>
            <Button size="lg" className="w-full" onClick={() => setStep(1)}>
              Let's begin <ChevronRight size={16} />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">What should I call you?</h2>
            <p className="text-gray-500 mb-6">This helps me personalise your experience.</p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white mb-6"
              onKeyDown={e => e.key === 'Enter' && setStep(2)}
            />
            <Button size="lg" className="w-full" onClick={() => setStep(2)}>
              Continue <ChevronRight size={16} />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">What are your wellness goals?</h2>
            <p className="text-gray-500 mb-6">Select all that apply — you can change these later.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {GOALS.map(g => {
                const selected = goals.includes(g)
                return (
                  <button
                    key={g}
                    onClick={() => toggleGoal(g)}
                    aria-pressed={selected}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      selected
                        ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:bg-violet-50'
                    }`}
                  >
                    {selected && <Check size={12} className="shrink-0" />}
                    {g}
                  </button>
                )
              })}
            </div>
            <Button size="lg" className="w-full mb-3" onClick={finish}>
              Start my journey 🌱
            </Button>
            <button
              onClick={finish}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
            >
              Skip this step →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

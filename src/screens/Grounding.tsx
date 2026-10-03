import { useState } from 'react'
import { useApp } from '../store'
import { Button } from '../components/Button'
import { CheckCircle, RotateCcw } from 'lucide-react'

const STEPS = [
  { count: 5, sense: 'See',   prompt: 'Name 5 things you can see right now.',          emoji: '👁️'  },
  { count: 4, sense: 'Touch', prompt: 'Notice 4 things you can physically feel.',       emoji: '✋'  },
  { count: 3, sense: 'Hear',  prompt: 'Listen for 3 sounds around you.',               emoji: '👂'  },
  { count: 2, sense: 'Smell', prompt: 'Identify 2 things you can smell (or imagine).', emoji: '👃'  },
  { count: 1, sense: 'Taste', prompt: 'Notice 1 thing you can taste right now.',       emoji: '👅'  },
]

export function Grounding() {
  const { addActivity } = useApp()
  const [stepIdx, setStepIdx] = useState(0)
  const [inputs, setInputs] = useState<string[][]>(STEPS.map(s => Array(s.count).fill('')))
  const [done, setDone] = useState(false)

  const step = STEPS[stepIdx]
  const stepInputs = inputs[stepIdx]
  const stepComplete = stepInputs.every(v => v.trim().length > 0)

  // Total items filled across all steps
  const totalFilled = inputs.flat().filter(v => v.trim().length > 0).length

  function setItem(i: number, val: string) {
    setInputs(prev => prev.map((arr, si) =>
      si === stepIdx ? arr.map((v, ii) => ii === i ? val : v) : arr
    ))
  }

  function next() {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx(s => s + 1)
    } else {
      const now = new Date().toISOString()
      addActivity({ id: now, type: 'grounding', label: '5-4-3-2-1 Grounding', timestamp: now })
      setDone(true)
    }
  }

  function restart() {
    setStepIdx(0)
    setInputs(STEPS.map(s => Array(s.count).fill('')))
    setDone(false)
  }

  if (done) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <CheckCircle size={52} className="text-emerald-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Grounding complete 🌿</h2>
        <p className="text-gray-400 text-sm max-w-xs mb-3">
          You've anchored yourself to the present moment. Take a slow breath and notice how you feel.
        </p>
        {/* Completion summary */}
        <p className="text-sm font-medium text-violet-700 bg-violet-50 border border-violet-100 rounded-2xl px-4 py-2 mb-8">
          You noticed {totalFilled} thing{totalFilled !== 1 ? 's' : ''} around you across 5 senses.
        </p>
        <Button variant="secondary" onClick={restart}>
          <RotateCcw size={15} /> Do it again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 p-5 md:p-8 pb-24 md:pb-8 max-w-lg mx-auto w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Grounding Exercise</h1>
      <p className="text-gray-400 text-sm mb-6">The 5-4-3-2-1 technique brings you back to the present moment.</p>

      {/* Progress bar — thicker */}
      <div className="flex gap-1.5 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full transition-colors ${
              i < stepIdx ? 'bg-violet-300' : i === stepIdx ? 'bg-violet-600' : 'bg-gray-100'
            }`}
          />
        ))}
      </div>

      {/* Step card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 animate-fade-in shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{step.emoji}</span>
          <div>
            <p className="text-xs font-semibold text-violet-500 uppercase tracking-wide">
              Step {stepIdx + 1} of {STEPS.length}
            </p>
            <p className="font-semibold text-gray-900">{step.prompt}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {stepInputs.map((val, i) => {
            const filled = val.trim().length > 0
            return (
              <input
                key={i}
                type="text"
                value={val}
                onChange={e => setItem(i, e.target.value)}
                placeholder={`${step.sense} ${i + 1}…`}
                autoFocus={i === 0}
                className={`w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all ${
                  filled
                    ? 'border border-emerald-200 bg-emerald-50/50 text-gray-800'
                    : 'border border-gray-100 bg-gray-50/50 text-gray-800'
                }`}
                onKeyDown={e => {
                  if (e.key === 'Enter' && stepComplete) next()
                }}
              />
            )
          })}
        </div>
      </div>

      <Button size="lg" className="w-full" disabled={!stepComplete} onClick={next}>
        {stepIdx < STEPS.length - 1 ? 'Next →' : 'Finish 🌿'}
      </Button>
    </div>
  )
}

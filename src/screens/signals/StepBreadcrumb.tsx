import { useNavigate } from 'react-router-dom'
import { Camera, Mic, Brain, Cpu, Sparkles } from 'lucide-react'

export type ModalityStep = 'face' | 'voice' | 'eeg' | 'gsr' | 'fusion'

interface StepBreadcrumbProps {
  currentStep: ModalityStep
}

const STEPS = [
  { id: 'face'   as const, label: 'Face',     icon: Camera,   path: '/signals/face'   },
  { id: 'voice'  as const, label: 'Voice',    icon: Mic,      path: '/signals/voice'  },
  { id: 'eeg'    as const, label: 'EEG',      icon: Brain,    path: '/signals/eeg',   note: 'Sample' },
  { id: 'gsr'    as const, label: 'GSR',      icon: Cpu,      path: '/signals/gsr',   note: 'Sample' },
  { id: 'fusion' as const, label: 'Fusion',   icon: Sparkles, path: '/signals/fusion' },
]

export function StepBreadcrumb({ currentStep }: StepBreadcrumbProps) {
  const navigate = useNavigate()
  const currentIndex = STEPS.findIndex(s => s.id === currentStep)

  return (
    <div className="w-full mb-6 bg-white border border-gray-100 rounded-2xl p-2.5 shadow-xs">
      <div className="flex items-center gap-1">
        {STEPS.map((step, idx) => {
          const Icon = step.icon
          const isActive = step.id === currentStep
          const isDone = idx < currentIndex

          return (
            <button
              key={step.id}
              onClick={() => navigate(step.path)}
              title={`Go to ${step.label} analysis`}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-violet-600 text-white shadow-xs'
                  : isDone
                  ? 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon
                size={13}
                className={isActive ? 'text-white' : isDone ? 'text-violet-500' : 'text-gray-400'}
              />
              <span className="text-[10px] sm:text-xs leading-none">{step.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

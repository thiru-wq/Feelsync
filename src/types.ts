export type Mood = 'great' | 'good' | 'okay' | 'low' | 'difficult'

export interface MoodEntry {
  id: string
  mood: Mood
  note: string
  timestamp: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface WellnessActivity {
  id: string
  type: 'breathing' | 'grounding' | 'chat' | 'mood' | 'fusion' | 'signal'
  label: string
  duration?: number
  timestamp: string
}

export interface UserProfile {
  name: string
  onboarded: boolean
  goals: string[]
}

// ─── Multimodal Signal Types ──────────────────────────────────────────────────

export interface FaceAnalysisResult {
  status: 'available' | 'analyzing' | 'completed' | 'unavailable' | 'skipped'
  expression: string
  valence: number // 0 - 100
  facialTension: 'Relaxed' | 'Mild' | 'Moderate' | 'High'
  eyeAttentiveness: number // 0 - 100
  confidence: number // 0 - 100
  notes: string
  isSimulated?: boolean
  timestamp: string
}

export interface VoiceAnalysisResult {
  status: 'available' | 'analyzing' | 'completed' | 'unavailable' | 'skipped'
  tone: string
  pitchVariance: number // 0 - 100
  cadence: string
  vocalEnergy: number // 0 - 100
  stressLevel: 'Low' | 'Moderate' | 'Elevated'
  confidence: number // 0 - 100
  transcript?: string
  isSimulated?: boolean
  timestamp: string
}

export interface EEGAnalysisResult {
  status: 'available' | 'analyzing' | 'completed' | 'unavailable' | 'skipped'
  isSimulated: true // Clearly marked as sample/simulated
  calmness: number // 0 - 100
  engagement: number // 0 - 100
  alphaDominance: string
  mentalState: string
  timestamp: string
}

export interface GSRAnalysisResult {
  status: 'available' | 'analyzing' | 'completed' | 'unavailable' | 'skipped'
  isSimulated: true // Clearly marked as sample/simulated
  arousal: number // 0 - 100
  relaxation: number // 0 - 100
  autonomicTone: string
  physiologicalState: string
  timestamp: string
}

export interface SignalContribution {
  name: string
  modality: 'face' | 'voice' | 'eeg' | 'gsr'
  status: 'active' | 'unavailable' | 'skipped'
  weightPct: number
  summary: string
  isSimulated?: boolean
}

export interface FusionResult {
  id: string
  combinedState: string
  stateCategory: 'balanced' | 'energized' | 'mild_stress' | 'deep_calm' | 'fatigued'
  stateSummary: string
  demoConfidence: number // Demo Fusion Confidence (not clinical accuracy)
  signalContributions: {
    face: SignalContribution
    voice: SignalContribution
    eeg: SignalContribution
    gsr: SignalContribution
  }
  availableCount: number
  excludedCount: number
  synthesisExplanation: string
  recommendedActivities: Array<{
    id: string
    title: string
    desc: string
    route: string
    icon: string
    tag: string
  }>
  timestamp: string
}


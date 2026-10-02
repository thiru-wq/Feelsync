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
  type: 'breathing' | 'grounding' | 'chat' | 'mood'
  label: string
  duration?: number
  timestamp: string
}

export interface UserProfile {
  name: string
  onboarded: boolean
  goals: string[]
}

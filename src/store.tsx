import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { MoodEntry, ChatMessage, WellnessActivity, UserProfile } from './types'

interface AppState {
  profile: UserProfile
  moodHistory: MoodEntry[]
  activities: WellnessActivity[]
  chatHistory: ChatMessage[]
  currentMood: MoodEntry | null
  setProfile: (p: UserProfile) => void
  addMoodEntry: (e: MoodEntry) => void
  addActivity: (a: WellnessActivity) => void
  addChatMessage: (m: ChatMessage) => void
  clearChat: () => void
}

const Ctx = createContext<AppState | null>(null)

function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? '') } catch { return fallback }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(() =>
    load('fs_profile', { name: '', onboarded: false, goals: [] }))
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>(() =>
    load('fs_moods', []))
  const [activities, setActivities] = useState<WellnessActivity[]>(() =>
    load('fs_activities', []))
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() =>
    load('fs_chat', []))

  useEffect(() => { localStorage.setItem('fs_profile', JSON.stringify(profile)) }, [profile])
  useEffect(() => { localStorage.setItem('fs_moods', JSON.stringify(moodHistory)) }, [moodHistory])
  useEffect(() => { localStorage.setItem('fs_activities', JSON.stringify(activities)) }, [activities])
  useEffect(() => { localStorage.setItem('fs_chat', JSON.stringify(chatHistory)) }, [chatHistory])

  const setProfile = (p: UserProfile) => setProfileState(p)
  const addMoodEntry = (e: MoodEntry) => setMoodHistory(h => [e, ...h])
  const addActivity = (a: WellnessActivity) => setActivities(h => [a, ...h])
  const addChatMessage = (m: ChatMessage) => setChatHistory(h => [...h, m])
  const clearChat = () => setChatHistory([])
  const currentMood = moodHistory[0] ?? null

  return (
    <Ctx.Provider value={{
      profile, moodHistory, activities, chatHistory, currentMood,
      setProfile, addMoodEntry, addActivity, addChatMessage, clearChat,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}

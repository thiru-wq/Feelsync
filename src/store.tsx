import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type {
  MoodEntry,
  ChatMessage,
  WellnessActivity,
  UserProfile,
  FaceAnalysisResult,
  VoiceAnalysisResult,
  EEGAnalysisResult,
  GSRAnalysisResult,
  FusionResult
} from './types'
import {
  getDefaultFaceResult,
  getDefaultVoiceResult,
  getDefaultEEGResult,
  getDefaultGSRResult,
  computeMultimodalFusion
} from './services/fusionEngine'

interface AppState {
  profile: UserProfile
  moodHistory: MoodEntry[]
  activities: WellnessActivity[]
  chatHistory: ChatMessage[]
  currentMood: MoodEntry | null
  faceResult: FaceAnalysisResult | null
  voiceResult: VoiceAnalysisResult | null
  eegResult: EEGAnalysisResult | null
  gsrResult: GSRAnalysisResult | null
  fusionResult: FusionResult | null
  setProfile: (p: UserProfile) => void
  addMoodEntry: (e: MoodEntry) => void
  addActivity: (a: WellnessActivity) => void
  addChatMessage: (m: ChatMessage) => void
  clearChat: () => void
  setFaceResult: (f: FaceAnalysisResult | null) => void
  setVoiceResult: (v: VoiceAnalysisResult | null) => void
  setEegResult: (e: EEGAnalysisResult | null) => void
  setGsrResult: (g: GSRAnalysisResult | null) => void
  setFusionResult: (r: FusionResult | null) => void
  triggerFusion: () => FusionResult
  resetMultimodalFlow: () => void
}

const Ctx = createContext<AppState | null>(null)

function load<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : fallback
  } catch {
    return fallback
  }
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

  // Multimodal Signals State with fallback defaults
  const [faceResult, setFaceResultState] = useState<FaceAnalysisResult | null>(() =>
    load('fs_face', getDefaultFaceResult()))
  const [voiceResult, setVoiceResultState] = useState<VoiceAnalysisResult | null>(() =>
    load('fs_voice', getDefaultVoiceResult()))
  const [eegResult, setEegResultState] = useState<EEGAnalysisResult | null>(() =>
    load('fs_eeg', getDefaultEEGResult()))
  const [gsrResult, setGsrResultState] = useState<GSRAnalysisResult | null>(() =>
    load('fs_gsr', getDefaultGSRResult()))
  const [fusionResult, setFusionResultState] = useState<FusionResult | null>(() =>
    load('fs_fusion', computeMultimodalFusion({
      face: getDefaultFaceResult(),
      voice: getDefaultVoiceResult(),
      eeg: getDefaultEEGResult(),
      gsr: getDefaultGSRResult()
    })))

  useEffect(() => { localStorage.setItem('fs_profile', JSON.stringify(profile)) }, [profile])
  useEffect(() => { localStorage.setItem('fs_moods', JSON.stringify(moodHistory)) }, [moodHistory])
  useEffect(() => { localStorage.setItem('fs_activities', JSON.stringify(activities)) }, [activities])
  useEffect(() => { localStorage.setItem('fs_chat', JSON.stringify(chatHistory)) }, [chatHistory])
  useEffect(() => { localStorage.setItem('fs_face', JSON.stringify(faceResult)) }, [faceResult])
  useEffect(() => { localStorage.setItem('fs_voice', JSON.stringify(voiceResult)) }, [voiceResult])
  useEffect(() => { localStorage.setItem('fs_eeg', JSON.stringify(eegResult)) }, [eegResult])
  useEffect(() => { localStorage.setItem('fs_gsr', JSON.stringify(gsrResult)) }, [gsrResult])
  useEffect(() => { localStorage.setItem('fs_fusion', JSON.stringify(fusionResult)) }, [fusionResult])

  const setProfile = (p: UserProfile) => setProfileState(p)
  const addMoodEntry = (e: MoodEntry) => setMoodHistory(h => [e, ...h])
  const addActivity = (a: WellnessActivity) => setActivities(h => [a, ...h])
  const addChatMessage = (m: ChatMessage) => setChatHistory(h => [...h, m])
  const clearChat = () => setChatHistory([])

  const setFaceResult = (f: FaceAnalysisResult | null) => setFaceResultState(f)
  const setVoiceResult = (v: VoiceAnalysisResult | null) => setVoiceResultState(v)
  const setEegResult = (e: EEGAnalysisResult | null) => setEegResultState(e)
  const setGsrResult = (g: GSRAnalysisResult | null) => setGsrResultState(g)
  const setFusionResult = (r: FusionResult | null) => setFusionResultState(r)

  const triggerFusion = () => {
    const res = computeMultimodalFusion({
      face: faceResult,
      voice: voiceResult,
      eeg: eegResult,
      gsr: gsrResult,
    })
    setFusionResultState(res)
    return res
  }

  const resetMultimodalFlow = () => {
    const defFace = getDefaultFaceResult()
    const defVoice = getDefaultVoiceResult()
    const defEeg = getDefaultEEGResult()
    const defGsr = getDefaultGSRResult()
    setFaceResultState(defFace)
    setVoiceResultState(defVoice)
    setEegResultState(defEeg)
    setGsrResultState(defGsr)
    const fused = computeMultimodalFusion({ face: defFace, voice: defVoice, eeg: defEeg, gsr: defGsr })
    setFusionResultState(fused)
  }

  const currentMood = moodHistory[0] ?? null

  return (
    <Ctx.Provider value={{
      profile, moodHistory, activities, chatHistory, currentMood,
      faceResult, voiceResult, eegResult, gsrResult, fusionResult,
      setProfile, addMoodEntry, addActivity, addChatMessage, clearChat,
      setFaceResult, setVoiceResult, setEegResult, setGsrResult, setFusionResult,
      triggerFusion, resetMultimodalFlow
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


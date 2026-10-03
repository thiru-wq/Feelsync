import type {
  FaceAnalysisResult,
  VoiceAnalysisResult,
  EEGAnalysisResult,
  GSRAnalysisResult,
  FusionResult,
  SignalContribution
} from '../types'

// ── Default Mock Baseline Modality Results ─────────────────────────────────────

export function getDefaultFaceResult(): FaceAnalysisResult {
  return {
    status: 'completed',
    expression: 'Calm & Attentive',
    valence: 78,
    facialTension: 'Relaxed',
    eyeAttentiveness: 88,
    confidence: 86,
    notes: 'Natural eye blink rate, relaxed brow, slight positive valence.',
    timestamp: new Date().toISOString(),
  }
}

export function getDefaultVoiceResult(): VoiceAnalysisResult {
  return {
    status: 'completed',
    tone: 'Warm & Grounded',
    pitchVariance: 72,
    cadence: 'Balanced (115 wpm)',
    vocalEnergy: 68,
    stressLevel: 'Low',
    confidence: 84,
    transcript: 'Taking a calm mindful moment to check in with FeelSync.',
    timestamp: new Date().toISOString(),
  }
}

export function getDefaultEEGResult(): EEGAnalysisResult {
  return {
    status: 'completed',
    isSimulated: true,
    calmness: 76,
    engagement: 62,
    alphaDominance: 'Alpha Rhythm (8–12 Hz) Dominant',
    mentalState: 'Quiet Alertness & Receptive Mind',
    timestamp: new Date().toISOString(),
  }
}

export function getDefaultGSRResult(): GSRAnalysisResult {
  return {
    status: 'completed',
    isSimulated: true,
    arousal: 32,
    relaxation: 78,
    autonomicTone: 'Parasympathetic Rest & Digest Dominant',
    physiologicalState: 'Relaxed Baseline, Low Somatic Stress',
    timestamp: new Date().toISOString(),
  }
}

// ── Multimodal Fusion Calculation ─────────────────────────────────────────────

export interface FusionInputs {
  face: FaceAnalysisResult | null
  voice: VoiceAnalysisResult | null
  eeg: EEGAnalysisResult | null
  gsr: GSRAnalysisResult | null
}

export function computeMultimodalFusion(inputs: FusionInputs): FusionResult {
  const { face, voice, eeg, gsr } = inputs

  // Determine active vs unavailable/skipped modalities
  const faceActive = face && face.status === 'completed'
  const voiceActive = voice && voice.status === 'completed'
  const eegActive = eeg && eeg.status === 'completed'
  const gsrActive = gsr && gsr.status === 'completed'

  const activeModalities: string[] = []
  if (faceActive) activeModalities.push('Face')
  if (voiceActive) activeModalities.push('Voice')
  if (eegActive) activeModalities.push('EEG')
  if (gsrActive) activeModalities.push('GSR')

  const availableCount = activeModalities.length
  const excludedCount = 4 - availableCount

  // Equal weight distribution dynamically normalized across available signals
  const baseWeight = availableCount > 0 ? Math.round(100 / availableCount) : 0

  // Signal Contributions
  const faceContribution: SignalContribution = {
    name: 'Face Expression & Tension',
    modality: 'face',
    status: faceActive ? 'active' : face?.status === 'skipped' ? 'skipped' : 'unavailable',
    weightPct: faceActive ? baseWeight : 0,
    summary: faceActive
      ? `${face.expression} · Tension: ${face.facialTension} (${face.valence}% valence)`
      : face?.status === 'skipped'
      ? 'Modality skipped by user'
      : 'Camera unavailable / permission denied',
    isSimulated: face?.isSimulated ?? false,
  }

  const voiceContribution: SignalContribution = {
    name: 'Voice Acoustics & Tone',
    modality: 'voice',
    status: voiceActive ? 'active' : voice?.status === 'skipped' ? 'skipped' : 'unavailable',
    weightPct: voiceActive ? baseWeight : 0,
    summary: voiceActive
      ? `${voice.tone} · Stress: ${voice.stressLevel} (${voice.vocalEnergy}% energy)`
      : voice?.status === 'skipped'
      ? 'Modality skipped by user'
      : 'Microphone unavailable / permission denied',
    isSimulated: voice?.isSimulated ?? false,
  }

  const eegContribution: SignalContribution = {
    name: 'EEG Brainwave Calm Index',
    modality: 'eeg',
    status: eegActive ? 'active' : eeg?.status === 'skipped' ? 'skipped' : 'unavailable',
    weightPct: eegActive ? baseWeight : 0,
    summary: eegActive
      ? `Calmness: ${eeg.calmness}/100 · ${eeg.mentalState} (Sample Data)`
      : 'EEG signal stream not active',
    isSimulated: true,
  }

  const gsrContribution: SignalContribution = {
    name: 'GSR Skin Conductance Arousal',
    modality: 'gsr',
    status: gsrActive ? 'active' : gsr?.status === 'skipped' ? 'skipped' : 'unavailable',
    weightPct: gsrActive ? (100 - baseWeight * (availableCount - 1)) : 0,
    summary: gsrActive
      ? `Relaxation: ${gsr.relaxation}/100 · ${gsr.autonomicTone} (Sample Data)`
      : 'GSR signal stream not active',
    isSimulated: true,
  }

  // Aggregate Composite Score (0–100 Calmness/Wellness)
  let totalScore = 0
  let scorePoints = 0

  if (faceActive) {
    // Face score: combination of valence and relaxation
    const faceScore = face.facialTension === 'Relaxed' ? (face.valence * 0.6 + 40) : (face.valence * 0.4 + 20)
    totalScore += faceScore
    scorePoints++
  }

  if (voiceActive) {
    const voiceScore = voice.stressLevel === 'Low' ? (voice.vocalEnergy * 0.4 + 60) : (voice.vocalEnergy * 0.3 + 30)
    totalScore += voiceScore
    scorePoints++
  }

  if (eegActive) {
    totalScore += eeg.calmness
    scorePoints++
  }

  if (gsrActive) {
    totalScore += gsr.relaxation
    scorePoints++
  }

  const compositeWellness = scorePoints > 0 ? Math.round(totalScore / scorePoints) : 75

  // Determine Categorical Combined State
  let combinedState = 'Harmonious Balance & Calm Alertness'
  let stateCategory: FusionResult['stateCategory'] = 'balanced'
  let stateSummary = 'Your multimodal physiological and behavioral cues reflect balanced calm with steady focus.'
  let synthesisExplanation = ''

  if (compositeWellness >= 82) {
    combinedState = 'Deep Calm & Restorative Harmony'
    stateCategory = 'deep_calm'
    stateSummary = 'Strong alignment between somatic relaxation and mental quietness across your wellness signals.'
  } else if (compositeWellness >= 68) {
    combinedState = 'Harmonious Balance & Calm Alertness'
    stateCategory = 'balanced'
    stateSummary = 'Steady emotional tone, relaxed musculature, and stable autonomic rhythms.'
  } else if (compositeWellness >= 52) {
    combinedState = 'Active Focus & Gentle Engagement'
    stateCategory = 'energized'
    stateSummary = 'High cognitive focus with mild physiological activation. A great state for focused tasks.'
  } else {
    combinedState = 'Mild Somatic Tension · Reset Recommended'
    stateCategory = 'mild_stress'
    stateSummary = 'Signs of mild sympathetic arousal or cognitive fatigue detected across signals.'
  }

  // Build Synthesis Explanation Text
  const parts: string[] = []
  if (faceActive) parts.push(`Face indicates ${face.expression.toLowerCase()} with ${face.facialTension.toLowerCase()} facial muscles`)
  if (voiceActive) parts.push(`Voice reveals ${voice.tone.toLowerCase()} with ${voice.stressLevel.toLowerCase()} acoustic stress`)
  if (eegActive) parts.push(`EEG brainwaves show ${eeg.calmness}/100 calm index with ${eeg.alphaDominance.toLowerCase()}`)
  if (gsrActive) parts.push(`GSR skin response reflects ${gsr.relaxation}/100 somatic relaxation`)

  if (excludedCount > 0) {
    synthesisExplanation = `Synthesized dynamically from ${availableCount} available modalities (${activeModalities.join(', ')}). ${parts.join(', ')}. ${excludedCount} modality (${[
      !faceActive && 'Face',
      !voiceActive && 'Voice',
      !eegActive && 'EEG',
      !gsrActive && 'GSR',
    ].filter(Boolean).join(', ')}) was excluded without interrupting your assessment.`
  } else {
    synthesisExplanation = `Synthesized from all 4 multimodal signals: ${parts.join(', ')}. Together, they converge to indicate a ${combinedState.toLowerCase()} wellness state.`
  }

  // Recommended Activities tailored to state
  const recommendedActivities: FusionResult['recommendedActivities'] = [
    {
      id: 'voice-agent',
      title: 'Talk to FeelSync Voice Agent',
      desc: 'Discuss your multimodal fusion results hands-free with your AI wellness companion.',
      route: '/voice',
      icon: 'Mic',
      tag: 'Recommended Primary',
    },
    {
      id: 'breathing',
      title: stateCategory === 'mild_stress' ? 'Box Breathing Reset' : '4-7-8 Calm Breathing',
      desc: 'Regulate your autonomic nervous system with guided pacing visualizer.',
      route: '/breathing',
      icon: 'Wind',
      tag: '2 min practice',
    },
    {
      id: 'grounding',
      title: '5-4-3-2-1 Sensory Grounding',
      desc: 'Anchor your attention to the present moment through five sensory steps.',
      route: '/grounding',
      icon: 'Leaf',
      tag: 'Mindful practice',
    },
    {
      id: 'journaling',
      title: 'Reflective Journaling & Chat',
      desc: 'Deep dive into your emotional reflections with your text companion.',
      route: '/companion',
      icon: 'MessageCircle',
      tag: 'Self-reflection',
    },
    {
      id: 'mood',
      title: 'Log Today\'s Mood Check-in',
      desc: 'Record your verified wellness state into your daily streak calendar.',
      route: '/mood',
      icon: 'Smile',
      tag: 'Daily tracker',
    },
  ]

  // Demo Confidence calculation (clearly labeled as Demo Fusion Confidence)
  const baseConfidence = availableCount === 4 ? 88 : availableCount === 3 ? 82 : availableCount === 2 ? 74 : 65
  const demoConfidence = Math.min(94, baseConfidence + Math.floor(Math.random() * 5))

  return {
    id: `fusion-${Date.now()}`,
    combinedState,
    stateCategory,
    stateSummary,
    demoConfidence,
    signalContributions: {
      face: faceContribution,
      voice: voiceContribution,
      eeg: eegContribution,
      gsr: gsrContribution,
    },
    availableCount,
    excludedCount,
    synthesisExplanation,
    recommendedActivities,
    timestamp: new Date().toISOString(),
  }
}

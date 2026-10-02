import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { getAIResponse } from '../services/aiService'
import {
  Mic, MicOff, Volume2, Pause, Play, RotateCcw,
  ArrowLeft, Sparkles, MessageCircle, AlertCircle, RefreshCw, Send
} from 'lucide-react'
import { Button } from '../components/Button'
import type { ChatMessage } from '../types'

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'paused' | 'ready' | 'error'

interface SR {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

const DEMO_PHRASES = [
  "I'm feeling a bit anxious about my day.",
  "Can you guide me through a 2-minute breathing exercise?",
  "I had a busy morning and want to feel more grounded.",
  "What's a good way to manage stress right now?",
]

export function VoiceAssistant() {
  const navigate = useNavigate()
  const { addChatMessage, addActivity, chatHistory, currentMood, profile } = useApp()

  const [state, setState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [manualText, setManualText] = useState('')
  const [autoSpeak, setAutoSpeak] = useState(true)

  const recognitionRef = useRef<SR | null>(null)
  const synthUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const stateRef = useRef<VoiceState>('idle')

  useEffect(() => {
    stateRef.current = state
  }, [state])



  // Clean up SpeechSynthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // Ignore abort errors
        }
      }
    }
  }, [])

  // Get Speech Recognition Constructor
  function getSRClass(): (new () => SR) | null {
    const w = window as unknown as Record<string, unknown>
    return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => SR) | null
  }

  // Request Mic Permission & Start Listening
  const startListening = useCallback(async () => {
    setErrorMessage('')
    setTranscript('')
    setInterimTranscript('')
    setResponse('')

    // Cancel any ongoing speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    // Check Microphone Permission via getUserMedia
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true })
      }
    } catch (err) {
      console.warn('Microphone permission warning:', err)
      setErrorMessage('Microphone access was denied. Please allow microphone access in your browser or type below.')
      setState('error')
      return
    }

    const SRClass = getSRClass()
    if (SRClass) {
      try {
        const recognition = new SRClass()
        recognition.lang = 'en-US'
        recognition.continuous = false
        recognition.interimResults = true
        recognitionRef.current = recognition

        recognition.onresult = (e: SpeechRecognitionEvent) => {
          let currentFinal = ''
          let currentInterim = ''

          for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i]
            if (res.isFinal) {
              currentFinal += res[0].transcript
            } else {
              currentInterim += res[0].transcript
            }
          }

          if (currentInterim) {
            setInterimTranscript(currentInterim)
          }

          if (currentFinal) {
            const cleanText = currentFinal.trim()
            setTranscript(cleanText)
            setInterimTranscript('')
            processVoiceInput(cleanText)
          }
        }

        recognition.onerror = (e) => {
          console.warn('Speech recognition error:', e.error)
          if (e.error === 'not-allowed' || e.error === 'permission-denied') {
            setErrorMessage('Microphone access denied. You can still type your message below.')
            setState('error')
          } else if (e.error !== 'no-speech') {
            setErrorMessage(`Speech recognition notice (${e.error}). Trying simulated input…`)
            fallbackToDemoPhrase()
          } else {
            setState('idle')
          }
        }

        recognition.onend = () => {
          if (stateRef.current === 'listening' && !transcript) {
            setState('idle')
          }
        }

        setState('listening')
        recognition.start()
      } catch (err) {
        console.error('Failed to initialize speech recognition:', err)
        fallbackToDemoPhrase()
      }
    } else {
      fallbackToDemoPhrase()
    }
  }, [transcript])

  // Fallback phrase helper for unsupported browsers or speech errors
  function fallbackToDemoPhrase() {
    setState('listening')
    const sample = DEMO_PHRASES[Math.floor(Math.random() * DEMO_PHRASES.length)]
    setTimeout(() => {
      setTranscript(sample)
      processVoiceInput(sample)
    }, 1800)
  }

  // Process user speech transcript -> call aiService / AWS API Gateway
  async function processVoiceInput(text: string) {
    if (!text.trim()) return

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
    }

    setState('thinking')

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    addChatMessage(userMsg)

    try {
      const reply = await getAIResponse([...chatHistory, userMsg], currentMood?.mood ?? null)
      setResponse(reply)

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      }
      addChatMessage(assistantMsg)
      addActivity({
        id: assistantMsg.id,
        type: 'chat',
        label: 'Voice response from FeelSync',
        timestamp: assistantMsg.timestamp,
      })

      if (autoSpeak && 'speechSynthesis' in window) {
        speakResponse(reply)
      } else {
        setState('ready')
      }
    } catch (err) {
      console.error('Voice assistant error:', err)
      setErrorMessage('Unable to connect to FeelSync service. Please check network connection and try again.')
      setState('error')
    }
  }

  // Text-to-Speech Output
  function speakResponse(textToSpeak: string) {
    if (!('speechSynthesis' in window)) {
      setState('ready')
      return
    }

    window.speechSynthesis.cancel()

    // Strip markdown formatting for natural speech
    const cleanSpeech = textToSpeak
      .replace(/\*\*/g, '')
      .replace(/#/g, '')
      .replace(/•/g, '')
      .replace(/\n+/g, ' ')

    const utterance = new SpeechSynthesisUtterance(cleanSpeech)
    utterance.rate = 0.92
    utterance.pitch = 1.05
    utterance.lang = 'en-US'

    utterance.onstart = () => setState('speaking')
    utterance.onend = () => setState('ready')
    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e)
      setState('ready')
    }

    synthUtteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  // Speech controls
  function pauseSpeaking() {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause()
      setState('paused')
    }
  }

  function resumeSpeaking() {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setState('speaking')
    } else if (response) {
      speakResponse(response)
    }
  }

  function stopAll() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setState('idle')
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!manualText.trim() || state === 'thinking') return
    const text = manualText.trim()
    setManualText('')
    setTranscript(text)
    processVoiceInput(text)
  }

  // UI state configurations matching Figma design system
  const stateLabels: Record<VoiceState, string> = {
    idle: 'Tap microphone to speak',
    listening: 'Listening to you…',
    thinking: 'FeelSync is thinking…',
    speaking: 'FeelSync is speaking',
    paused: 'Speech paused',
    ready: 'Ready to respond',
    error: 'Connection or permission issue',
  }

  const containerBg: Record<VoiceState, string> = {
    idle: 'bg-violet-50/80 border-violet-100',
    listening: 'bg-emerald-50/80 border-emerald-200',
    thinking: 'bg-blue-50/80 border-blue-200',
    speaking: 'bg-lavender-50/80 border-lavender-200',
    paused: 'bg-amber-50/80 border-amber-200',
    ready: 'bg-emerald-50/80 border-emerald-100',
    error: 'bg-rose-50/80 border-rose-200',
  }

  const micBtnClasses: Record<VoiceState, string> = {
    idle: 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-200',
    listening: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200 scale-105',
    thinking: 'bg-blue-500 text-white opacity-80 cursor-wait shadow-blue-200',
    speaking: 'bg-violet-700 text-white shadow-violet-300',
    paused: 'bg-amber-500 text-white shadow-amber-200',
    ready: 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-200',
    error: 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-200',
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-4 md:p-8 pb-24 md:pb-8 max-w-2xl mx-auto w-full min-h-[calc(100svh-4rem)]">

      {/* ── Top Header ── */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors py-2 px-3 rounded-xl hover:bg-gray-100"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Auto-speak</span>
          <button
            onClick={() => setAutoSpeak(a => !a)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              autoSpeak ? 'bg-violet-600' : 'bg-gray-200'
            }`}
            aria-label="Toggle auto-speak responses"
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
              autoSpeak ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* ── Main Voice Card ── */}
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold mb-2">
            <Sparkles size={14} /> FeelSync Voice Companion
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            {profile.name ? `Hello, ${profile.name}` : 'Voice Assistant'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Speak naturally. FeelSync listens and responds aloud.
          </p>
        </div>

        {/* ── Central Voice Orb / Button ── */}
        <div className="relative flex flex-col items-center justify-center my-6">

          {/* Pulse Rings during Listening / Speaking */}
          {state === 'listening' && (
            <>
              <div className="absolute w-44 h-44 rounded-full bg-emerald-200/60 animate-ping opacity-75" />
              <div className="absolute w-56 h-56 rounded-full bg-emerald-100/50 animate-pulse-ring" />
            </>
          )}

          {state === 'speaking' && (
            <>
              <div className="absolute w-44 h-44 rounded-full bg-violet-200/60 animate-pulse-ring" />
              <div className="absolute w-56 h-56 rounded-full bg-violet-100/40 animate-pulse" />
            </>
          )}

          {state === 'thinking' && (
            <div className="absolute w-44 h-44 rounded-full bg-blue-200/50 animate-spin-slow" />
          )}

          <button
            onClick={() => {
              if (state === 'idle' || state === 'ready' || state === 'error') {
                startListening()
              } else if (state === 'listening') {
                if (recognitionRef.current) recognitionRef.current.stop()
                setState('idle')
              } else if (state === 'speaking') {
                pauseSpeaking()
              } else if (state === 'paused') {
                resumeSpeaking()
              }
            }}
            disabled={state === 'thinking'}
            aria-label={stateLabels[state]}
            className={`relative z-10 w-32 h-32 md:w-36 md:h-36 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl ${micBtnClasses[state]} focus-ring`}
          >
            {state === 'listening' ? (
              <>
                <MicOff size={42} />
                <span className="text-[11px] font-medium mt-1">Tap to Stop</span>
              </>
            ) : state === 'thinking' ? (
              <>
                <RefreshCw size={42} className="animate-spin" />
                <span className="text-[11px] font-medium mt-1">Thinking</span>
              </>
            ) : state === 'speaking' ? (
              <>
                <Volume2 size={42} className="animate-pulse" />
                <span className="text-[11px] font-medium mt-1">Pause</span>
              </>
            ) : state === 'paused' ? (
              <>
                <Play size={42} />
                <span className="text-[11px] font-medium mt-1">Resume</span>
              </>
            ) : (
              <>
                <Mic size={42} />
                <span className="text-[11px] font-medium mt-1">Tap to Speak</span>
              </>
            )}
          </button>
        </div>

        {/* State Banner */}
        <div className={`px-4 py-2 rounded-full border text-xs font-semibold mb-6 transition-all ${containerBg[state]}`}>
          {stateLabels[state]}
        </div>

        {/* ── Audio Waveform Visualizer Bar ── */}
        {(state === 'listening' || state === 'speaking') && (
          <div className="flex items-center justify-center gap-1.5 h-8 mb-6" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <span
                key={i}
                className={`w-1.5 rounded-full transition-all ${
                  state === 'listening' ? 'bg-emerald-500' : 'bg-violet-600'
                } animate-wave`}
                style={{
                  height: `${12 + (i % 3) * 10}px`,
                  animationDelay: `${i * 0.12}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* ── Transcript Card ── */}
        {(transcript || interimTranscript) && (
          <div className="w-full bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-3 animate-fade-in text-left">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <Mic size={12} className="text-violet-500" /> You said
            </p>
            <p className="text-sm font-medium text-gray-800 leading-relaxed">
              {transcript}
              {interimTranscript && <span className="text-gray-400 italic"> {interimTranscript}</span>}
            </p>
          </div>
        )}

        {/* ── AI Response Card ── */}
        {response && (
          <div className="w-full bg-violet-50/80 border border-violet-150 rounded-2xl p-4 shadow-sm mb-4 animate-fade-in text-left">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles size={12} className="text-violet-600" /> FeelSync replied
              </p>
              <div className="flex items-center gap-1">
                {state === 'speaking' ? (
                  <button
                    onClick={pauseSpeaking}
                    className="p-1 text-violet-600 hover:bg-violet-100 rounded-lg text-xs flex items-center gap-1"
                    title="Pause speech"
                  >
                    <Pause size={14} /> Pause
                  </button>
                ) : (
                  <button
                    onClick={() => speakResponse(response)}
                    className="p-1 text-violet-600 hover:bg-violet-100 rounded-lg text-xs flex items-center gap-1"
                    title="Replay response"
                  >
                    <Volume2 size={14} /> Replay
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-violet-950 leading-relaxed whitespace-pre-line">
              {response}
            </p>
          </div>
        )}

        {/* Error / Warning Alert */}
        {errorMessage && (
          <div className="w-full bg-rose-50 border border-rose-200 rounded-2xl p-3.5 mb-4 text-xs text-rose-700 flex items-start gap-2 animate-fade-in">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1">
              <p className="font-semibold">Notice</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Voice Control Toolbar */}
        {(state !== 'idle' || response || transcript) && (
          <div className="flex items-center gap-2 mb-4 flex-wrap justify-center">
            {state === 'speaking' && (
              <Button size="sm" variant="secondary" onClick={pauseSpeaking}>
                <Pause size={14} /> Pause Voice
              </Button>
            )}
            {state === 'paused' && (
              <Button size="sm" variant="secondary" onClick={resumeSpeaking}>
                <Play size={14} /> Resume Voice
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={stopAll}>
              <RotateCcw size={14} /> Clear / Reset
            </Button>
            <Button size="sm" variant="secondary" onClick={() => navigate('/companion')}>
              <MessageCircle size={14} /> Continue in Chat
            </Button>
          </div>
        )}

        {/* ── Text Fallback Input (For noisy environments or mic issues) ── */}
        <form onSubmit={handleManualSubmit} className="w-full mt-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={manualText}
              onChange={e => setManualText(e.target.value)}
              placeholder="Or type a question for voice response…"
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <Button
              type="submit"
              disabled={!manualText.trim() || state === 'thinking'}
              size="sm"
              className="h-10 px-4"
            >
              <Send size={16} />
            </Button>
          </div>
        </form>

        {/* Suggested voice prompts */}
        <div className="w-full mt-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 text-center">
            Suggested Voice Prompts
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {DEMO_PHRASES.slice(0, 3).map(phrase => (
              <button
                key={phrase}
                onClick={() => {
                  setTranscript(phrase)
                  processVoiceInput(phrase)
                }}
                disabled={state === 'thinking'}
                className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full hover:border-violet-300 hover:bg-violet-50 transition-colors text-left"
              >
                "{phrase}"
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Footer Disclaimer */}
      <p className="text-center text-[11px] text-gray-400 mt-6">
        FeelSync Voice Assistant uses browser speech APIs and connects securely to AWS AI Gateway.
      </p>
    </div>
  )
}


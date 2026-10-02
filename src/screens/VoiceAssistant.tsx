import { useState, useRef } from 'react'
import { useApp } from '../store'
import { getAIResponse } from '../services/aiService'
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react'
import { Button } from '../components/Button'
import type { ChatMessage } from '../types'

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking'

interface SR {
  lang: string
  interimResults: boolean
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

const DEMO_PHRASES = [
  "I'm feeling a bit anxious today.",
  "Can you guide me through a breathing exercise?",
  "I had a rough morning but I'm trying to stay positive.",
  "What can I do to feel more grounded?",
]

export function VoiceAssistant() {
  const { addChatMessage, chatHistory, currentMood } = useApp()
  const [state, setState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef<SR | null>(null)

  function getSRClass(): (new () => SR) | null {
    const w = window as unknown as Record<string, unknown>
    return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => SR) | null
  }

  function startListening() {
    setError('')
    setTranscript('')
    setResponse('')

    const SRClass = getSRClass()
    if (SRClass) {
      const recognition = new SRClass()
      recognition.lang = 'en-US'
      recognition.interimResults = false
      recognitionRef.current = recognition

      recognition.onresult = (e: SpeechRecognitionEvent) => {
        const text = e.results[0][0].transcript
        setTranscript(text)
        processTranscript(text)
      }
      recognition.onerror = () => {
        const phrase = DEMO_PHRASES[Math.floor(Math.random() * DEMO_PHRASES.length)]
        setTranscript(phrase + ' (demo)')
        processTranscript(phrase)
      }
      recognition.onend = () => setState(prev => prev === 'listening' ? 'processing' : prev)
      setState('listening')
      recognition.start()
    } else {
      setState('listening')
      setTimeout(() => {
        const phrase = DEMO_PHRASES[Math.floor(Math.random() * DEMO_PHRASES.length)]
        setTranscript(phrase + ' (simulated — Amazon Transcribe in production)')
        processTranscript(phrase)
      }, 2000)
    }
  }

  async function processTranscript(text: string) {
    setState('processing')
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
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      })
      setState('speaking')

      if ('speechSynthesis' in window) {
        const utt = new SpeechSynthesisUtterance(reply.replace(/\*\*/g, '').replace(/\n/g, ' '))
        utt.rate = 0.9
        utt.pitch = 1.05
        utt.onend = () => setState('idle')
        window.speechSynthesis.speak(utt)
      } else {
        setTimeout(() => setState('idle'), 3000)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setState('idle')
    }
  }

  function stop() {
    recognitionRef.current?.stop()
    window.speechSynthesis?.cancel()
    setState('idle')
  }

  const stateLabel: Record<VoiceState, string> = {
    idle: 'Tap to speak',
    listening: 'Listening…',
    processing: 'Thinking…',
    speaking: 'Sync is speaking…',
  }
  const ringColor: Record<VoiceState, string> = {
    idle: 'bg-violet-100',
    listening: 'bg-rose-100',
    processing: 'bg-blue-100',
    speaking: 'bg-emerald-100',
  }
  const iconColor: Record<VoiceState, string> = {
    idle: 'text-violet-600',
    listening: 'text-rose-600',
    processing: 'text-blue-600',
    speaking: 'text-emerald-600',
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 pb-24 md:pb-6 max-w-lg mx-auto w-full text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Voice Assistant</h1>
      <p className="text-gray-500 text-sm mb-2">Speak with Sync hands-free.</p>
      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-10">
        Demo mode — uses browser speech APIs. Production uses Amazon Transcribe + Polly.
      </p>

      <div className="relative flex items-center justify-center mb-8">
        {state === 'listening' && (
          <div className="absolute w-36 h-36 rounded-full bg-rose-100 animate-pulse-ring" />
        )}
        <button
          onClick={state === 'idle' ? startListening : stop}
          aria-label={state === 'idle' ? 'Start listening' : 'Stop'}
          className={`w-28 h-28 rounded-full flex items-center justify-center transition-all shadow-lg ${ringColor[state]} hover:opacity-90`}
        >
          {state === 'processing' ? (
            <Loader2 size={40} className={`${iconColor[state]} animate-spin`} />
          ) : state === 'speaking' ? (
            <Volume2 size={40} className={iconColor[state]} />
          ) : state === 'listening' ? (
            <MicOff size={40} className={iconColor[state]} />
          ) : (
            <Mic size={40} className={iconColor[state]} />
          )}
        </button>
      </div>

      <p className="text-sm font-medium text-gray-600 mb-6">{stateLabel[state]}</p>

      {transcript && (
        <div className="w-full bg-white border border-gray-100 rounded-2xl p-4 mb-3 text-left animate-fade-in">
          <p className="text-xs text-gray-400 mb-1">You said</p>
          <p className="text-sm text-gray-700">{transcript}</p>
        </div>
      )}

      {response && (
        <div className="w-full bg-violet-50 border border-violet-100 rounded-2xl p-4 text-left animate-fade-in">
          <p className="text-xs text-violet-400 mb-1">Sync replied</p>
          <p className="text-sm text-violet-800">{response}</p>
        </div>
      )}

      {error && <p className="text-sm text-red-500 mt-4">{error}</p>}

      {state !== 'idle' && (
        <Button variant="ghost" className="mt-6" onClick={stop}>Stop</Button>
      )}
    </div>
  )
}

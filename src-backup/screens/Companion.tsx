import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { Button } from '../components/Button'
import { MoodBadge } from '../components/MoodBadge'
import { getAIResponse } from '../services/aiService'
import { Send, Trash2, Loader2, Wind, Leaf, Sparkles, BookOpen, AlertCircle } from 'lucide-react'
import type { ChatMessage } from '../types'

// ── Quick-action chips shown above the input ──────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Help me relax',              icon: Sparkles, text: 'Help me relax'                        },
  { label: 'Guide me through breathing', icon: Wind,     text: 'Guide me through a breathing exercise' },
  { label: 'Grounding exercise',         icon: Leaf,     text: 'Give me a grounding exercise'          },
  { label: 'Help me reflect',            icon: BookOpen, text: 'Help me reflect on my day'             },
]

// ── Inline bold markdown renderer ─────────────────────────────────────────────
function renderContent(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  )
}

// ── Formats HH:MM ──────────────────────────────────────────────────────────────
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const BREATHING_KEYWORDS = ['breathing', 'breathe', 'breath', 'inhale', 'exhale', '4-7-8', 'box breathing']
const GROUNDING_KEYWORDS = ['5-4-3-2-1', 'grounding screen', 'grounding exercise']

function MessageBubble({ msg, onNavigate }: { msg: ChatMessage; onNavigate: (to: string) => void }) {
  const isUser = msg.role === 'user'
  const lower  = msg.content.toLowerCase()
  const showBreathing = !isUser && BREATHING_KEYWORDS.some(k => lower.includes(k))
  const showGrounding = !isUser && !showBreathing && GROUNDING_KEYWORDS.some(k => lower.includes(k))

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-base mr-2 shrink-0 mt-0.5 select-none">
          💜
        </div>
      )}
      <div className="flex flex-col gap-1 max-w-[80%]">
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-violet-600 text-white rounded-br-sm'
            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
        }`}>
          {renderContent(msg.content)}
        </div>
        {showBreathing && (
          <button
            onClick={() => onNavigate('/breathing')}
            className="self-start flex items-center gap-1.5 mt-0.5 px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 text-xs font-medium hover:bg-violet-200 transition-colors"
          >
            <Wind size={12} /> Open Breathing Exercise →
          </button>
        )}
        {showGrounding && (
          <button
            onClick={() => onNavigate('/grounding')}
            className="self-start flex items-center gap-1.5 mt-0.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200 transition-colors"
          >
            <Leaf size={12} /> Open Grounding Exercise →
          </button>
        )}
        <span className={`text-[10px] text-gray-400 ${isUser ? 'text-right' : 'text-left'} px-1`}>
          {formatTime(msg.timestamp)}
        </span>
      </div>
    </div>
  )
}

// ── Typing indicator ───────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 mb-4 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-base shrink-0">💜</div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-violet-300 animate-wave inline-block"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Error banner ───────────────────────────────────────────────────────────────
function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="mx-4 mb-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700 animate-fade-in">
      <AlertCircle size={15} className="shrink-0 mt-0.5" />
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-600 text-xs font-medium shrink-0">
        Dismiss
      </button>
    </div>
  )
}

// ── Main screen ────────────────────────────────────────────────────────────────
export function Companion() {
  const navigate = useNavigate()
  const { chatHistory, addChatMessage, clearChat, currentMood, addActivity } = useApp()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const greeted = useRef(false)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, loading])

  // Send greeting once on first mount when chat is empty
  useEffect(() => {
    if (greeted.current || chatHistory.length > 0) return
    greeted.current = true
    addChatMessage({
      id: 'greeting',
      role: 'assistant',
      content: currentMood
        ? `Hi there! 💜 I can see you checked in feeling **${currentMood.mood}** today. I'm here to support you — what's on your mind?`
        : "Hi there! 💜 I'm Sync, your FeelSync wellness companion. I'm here to listen and support you. How are you feeling today?",
      timestamp: new Date().toISOString(),
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Core send function — accepts optional override text (used by quick-action chips)
  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || loading) return

    setInput('')
    setError(null)
    textareaRef.current?.focus()

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    addChatMessage(userMsg)
    setLoading(true)

    try {
      const reply = await getAIResponse([...chatHistory, userMsg], currentMood?.mood ?? null)
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
        label: 'Chat with Sync',
        timestamp: assistantMsg.timestamp,
      })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [input, loading, chatHistory, currentMood, addChatMessage, addActivity])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function handleClear() {
    clearChat()
    greeted.current = false
    setError(null)
  }

  const showQuickActions = chatHistory.length <= 1 && !loading

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto" style={{ height: 'calc(100svh - 3.5rem)' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-base select-none">
            💜
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">Sync</p>
            <p className="text-xs text-emerald-500 leading-tight">● Online · FeelSync AI</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {currentMood && <MoodBadge mood={currentMood.mood} size="sm" />}
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 bg-[#faf9f7]">

        {/* Empty state — only shown before greeting fires */}
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-60">
            <span className="text-4xl">💜</span>
            <p className="text-sm text-gray-500">Starting your session…</p>
          </div>
        )}

        {chatHistory.map(msg => <MessageBubble key={msg.id} msg={msg} onNavigate={navigate} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ── Quick-action chips ── */}
      {showQuickActions && (
        <div className="px-4 pt-3 pb-1 bg-white border-t border-gray-50 shrink-0">
          <p className="text-xs text-gray-400 mb-2">Quick actions</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map(({ label, icon: Icon, text }) => (
              <button
                key={label}
                onClick={() => send(text)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700 text-xs font-medium hover:bg-violet-100 transition-colors disabled:opacity-50"
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* ── Disclaimer ── */}
      <p className="text-center text-[11px] text-gray-400 bg-white px-4 pt-2 shrink-0">
        Sync provides wellness support, not medical advice.{' '}
        <button
          onClick={() => navigate('/signals')}
          className="underline hover:text-gray-600"
        >
          View wellness signals
        </button>
      </p>

      {/* ── Input bar ── */}
      <div className="shrink-0 bg-white px-4 pt-2 pb-20 md:pb-4 border-t border-gray-100">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Sync…"
            rows={1}
            disabled={loading}
            aria-label="Message input"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 max-h-32 disabled:opacity-60 bg-gray-50 focus:bg-white transition-colors"
          />
          <Button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="shrink-0 h-10 w-10 p-0"
          >
            {loading
              ? <Loader2 size={16} className="animate-spin" />
              : <Send size={16} />
            }
          </Button>
        </div>
      </div>
    </div>
  )
}

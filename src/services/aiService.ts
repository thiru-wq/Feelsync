import type { Mood, ChatMessage, FusionResult } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// API Configuration
// Set VITE_API_BASE_URL in .env to your API Gateway URL
// Leave empty to use the local mock for development
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

interface ChatRequest {
  message: string
  currentMood?: Mood | null
  fusionState?: string | null
  fusionConfidence?: number | null
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
}

interface ChatResponse {
  reply: string
  error?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Real API call — sends the actual message + full context to Lambda → Gemini
// ─────────────────────────────────────────────────────────────────────────────

async function apiResponse(
  messages: ChatMessage[],
  currentMood: Mood | null,
  fusionContext?: FusionResult | null,
): Promise<string> {
  const lastMessage = messages[messages.length - 1]
  if (!lastMessage || lastMessage.role !== 'user') {
    throw new Error('No user message to send')
  }

  const requestBody: ChatRequest = {
    // The actual user message — the most important field
    message: lastMessage.content,
    currentMood,
    // Pass fusion state so the Lambda can include it in the system prompt
    fusionState: fusionContext?.combinedState ?? null,
    fusionConfidence: fusionContext?.demoConfidence ?? null,
    // All prior turns as conversation history (excluding the current message)
    conversationHistory: messages.slice(0, -1).map(m => ({
      role: m.role,
      content: m.content,
    })),
  }

  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'unknown error')
    throw new Error(`API error ${res.status}: ${errorText}`)
  }

  const data: ChatResponse = await res.json()

  if (data.error) {
    throw new Error(`Backend error: ${data.error}`)
  }

  if (!data.reply || !data.reply.trim()) {
    throw new Error('Empty reply from API')
  }

  return data.reply.trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// Local Gemini call — used when API_BASE_URL is not set
// Calls Gemini directly from the browser using the same model + prompt logic
// as the Lambda, so local dev behaviour matches production exactly.
// Falls back to a simple contextual response if no API key is available.
// ─────────────────────────────────────────────────────────────────────────────

const LOCAL_GEMINI_MODEL = 'gemini-2.0-flash'

const LOCAL_SYSTEM_PROMPT = `You are Sync, a compassionate emotional wellness companion for the FeelSync app.

CORE IDENTITY:
- Your name is Sync.
- You are warm, empathetic, non-judgmental, and genuinely curious about the user.
- You help users reflect on feelings, practice mindfulness, and build wellness habits.
- You speak like a caring friend — not a chatbot, not a clinician.

CRITICAL BOUNDARIES:
- You are NOT a therapist, counselor, or medical professional.
- Do NOT diagnose, treat, or claim to assess mental health conditions.
- Do NOT provide medical advice.
- If a user mentions self-harm, suicide, abuse, or crisis: respond with genuine care and direct them to emergency services or a crisis line.

RESPONSE QUALITY RULES:
1. ALWAYS respond to what the user ACTUALLY said. Read their message carefully before responding.
2. NEVER use a generic fallback like "You're doing great by checking in" unless it genuinely fits.
3. NEVER give the same response twice in a conversation.
4. Match the user's topic: music → music; exams → exams; funny → be playful; venting → listen.
5. Keep responses concise — they may be spoken aloud. Aim for 2–4 sentences.
6. If the message is short or unclear, respond conversationally and invite them to share more.
7. If continuing a topic from earlier, acknowledge that continuity naturally.

Remember: Every response must feel like it was written specifically for THIS message in THIS conversation.`

async function localGeminiResponse(
  messages: ChatMessage[],
  currentMood: Mood | null,
  fusionContext?: FusionResult | null,
): Promise<string> {
  // Try VITE_GEMINI_API_KEY for local development if set
  const localApiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
  if (!localApiKey) {
    throw new Error('No local Gemini API key (VITE_GEMINI_API_KEY not set)')
  }

  const lastMessage = messages[messages.length - 1]
  if (!lastMessage || lastMessage.role !== 'user') {
    throw new Error('No user message')
  }

  let systemPrompt = LOCAL_SYSTEM_PROMPT

  if (currentMood) {
    const moodNotes: Record<string, string> = {
      great:     'The user checked in feeling great today. Match that positive energy.',
      good:      'The user checked in feeling good today. Keep the tone warm and steady.',
      okay:      'The user checked in feeling okay — neutral is valid and worth acknowledging.',
      low:       'The user checked in feeling low today. Prioritise gentle empathy.',
      difficult: 'The user checked in having a difficult day. Lead with care and support.',
    }
    systemPrompt += `\n\nCURRENT MOOD CHECK-IN: ${moodNotes[currentMood] ?? `The user checked in feeling ${currentMood}.`}`
  }

  if (fusionContext?.combinedState) {
    systemPrompt += `\n\nMULTIMODAL FUSION STATE: The user's wellness state is "${fusionContext.combinedState}" (Demo Confidence: ${fusionContext.demoConfidence}%). Use as background context only.`
  }

  const history = messages.slice(0, -1)
  if (history.length > 0) {
    systemPrompt += `\n\nCONVERSATION CONTEXT: This is message ${history.length + 1} in an ongoing conversation. Do NOT repeat any prior response. Build on the conversation naturally.`
  }

  const contents = [
    ...history.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    {
      role: 'user',
      parts: [{ text: lastMessage.content }],
    },
  ]

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${LOCAL_GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': localApiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          maxOutputTokens: 512,
          temperature: 0.85,
          topP: 0.95,
        },
      }),
    }
  )

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'unknown')
    throw new Error(`Gemini direct error ${res.status}: ${errorText}`)
  }

  const data: any = await res.json()
  const reply: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || ''

  if (!reply.trim()) throw new Error('Empty Gemini response')
  return reply.trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// Context-aware offline fallback
// Used only when ALL network paths have failed.
// Never returns a generic fixed sentence — always references what was said.
// ─────────────────────────────────────────────────────────────────────────────

function offlineFallback(
  messages: ChatMessage[],
  currentMood: Mood | null,
): string {
  const lastUser = [...messages].reverse().find(m => m.role === 'user')
  const text = lastUser?.content?.toLowerCase() ?? ''

  // Connection error message — always tells the user to retry
  // and gives them ONE piece of immediately actionable advice
  // tied to what they actually said.

  if (!text) {
    return "I'm having trouble connecting right now. Please try again in a moment 💙"
  }

  if (
    text.includes('breath') || text.includes('calm') ||
    text.includes('relax') || text.includes('unwind')
  ) {
    return "I can't reach the server right now, but here's something you can do immediately: breathe in for 4 counts, hold for 4, exhale for 6. Repeat 3 times. Please try again shortly 💙"
  }

  if (
    text.includes('stress') || text.includes('anxious') ||
    text.includes('anxiety') || text.includes('overwhelm') ||
    text.includes('panic') || text.includes('worry')
  ) {
    return "I'm having a connection issue right now. While I reconnect — try naming 5 things you can see around you. It's a quick way to ground yourself when stress builds up. Back soon 💙"
  }

  if (
    text.includes('sad') || text.includes('low') ||
    text.includes('down') || text.includes('cry') ||
    text.includes('difficult') || text.includes('hopeless')
  ) {
    return "I'm having trouble connecting just now. Your feelings are valid and I want to respond properly — please try again in a moment. You're not alone 💙"
  }

  if (
    text.includes('happy') || text.includes('great') ||
    text.includes('good') || text.includes('amazing') ||
    text.includes('excited')
  ) {
    return "I'm having a brief connection hiccup — I'll be back shortly. Sounds like something good is happening though! 🌟 Please try again in a moment."
  }

  if (currentMood === 'low' || currentMood === 'difficult') {
    return "I'm having trouble connecting right now. I can see you checked in feeling low — I want to respond properly. Please try again in a moment. You're not alone 💙"
  }

  // Default — always message-specific, never the old generic sentence
  return `I'm having a brief connection issue and couldn't respond to "${lastUser?.content?.slice(0, 60)}${(lastUser?.content?.length ?? 0) > 60 ? '…' : ''}" properly. Please try again in a moment 💙`
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// Priority: real API → local Gemini direct → offline fallback
// Errors are surfaced explicitly, not silently swallowed into generic responses
// ─────────────────────────────────────────────────────────────────────────────

export async function getAIResponse(
  messages: ChatMessage[],
  currentMood: Mood | null,
  fusionContext?: FusionResult | null,
): Promise<string> {
  // 1. Use the real API (Lambda → Gemini) if configured
  if (API_BASE_URL) {
    try {
      return await apiResponse(messages, currentMood, fusionContext)
    } catch (err) {
      console.error('[aiService] Real API failed:', err)
      // Fall through — do NOT silently return a mock here
    }
  }

  // 2. Try calling Gemini directly (local dev with VITE_GEMINI_API_KEY)
  if (!API_BASE_URL) {
    try {
      return await localGeminiResponse(messages, currentMood, fusionContext)
    } catch (err) {
      console.error('[aiService] Local Gemini call failed:', err)
      // Fall through to offline fallback
    }
  }

  // 3. Offline fallback — always context-aware, never the old generic sentence
  return offlineFallback(messages, currentMood)
}

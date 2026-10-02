import type { Mood, ChatMessage } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// API Configuration
// Set VITE_API_BASE_URL in .env to your API Gateway URL
// Leave empty to use mock responses for local development
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

interface ChatRequest {
  message: string
  currentMood?: Mood | null
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
}

interface ChatResponse {
  reply: string
  error?: string
}

// ── Real API call ─────────────────────────────────────────────────────────────

async function apiResponse(
  messages: ChatMessage[],
  currentMood: Mood | null,
): Promise<string> {
  const requestBody: ChatRequest = {
    message: messages[messages.length - 1]?.content || '',
    currentMood,
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
    throw new Error(`API error: ${res.status}`)
  }

  const data: ChatResponse = await res.json()
  if (data.error) {
    throw new Error(data.error)
  }
  return data.reply
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Response (fallback for local development)
// ─────────────────────────────────────────────────────────────────────────────

const moodResponses: Record<Mood, string[]> = {
  great: [
    "That's wonderful to hear! 🌟 Your positive energy is something to celebrate. What's been contributing to this great feeling?",
    "Fantastic! When we feel great, it's a perfect time to reflect on what's working well. Would you like to try a short gratitude exercise?",
  ],
  good: [
    "Glad you're feeling good today! 😊 Small positive moments add up. Is there anything you'd like to explore or work on?",
    "Good is a great place to be. Would you like a gentle breathing exercise to carry this feeling forward?",
  ],
  okay: [
    "Thanks for checking in. 'Okay' is perfectly valid — sometimes neutral is exactly where we need to be. How can I support you right now?",
    "I hear you. Sometimes okay is enough. Would a short grounding exercise or a breathing break help you feel more centered?",
  ],
  low: [
    "I'm glad you shared that with me. Feeling low happens to everyone, and reaching out is a meaningful step. Would you like to try a calming breathing exercise?",
    "Thank you for being honest about how you're feeling. Let's take this gently — a breathing exercise can help ease tension. Want to try it?",
  ],
  difficult: [
    "I'm really glad you're here. Difficult days are hard, and you don't have to face them alone. Let's start with something simple — just a few slow breaths together. Ready?",
    "Thank you for trusting me with this. When things feel difficult, small steps matter most. Would a grounding exercise help you feel a bit more settled right now?",
  ],
}

const generalResponses = [
  "That's a thoughtful reflection. How does sitting with that feel for you?",
  "I appreciate you sharing that. Would you like to explore this further, or would a short breathing break feel more helpful right now?",
  "You're doing great by checking in with yourself. What would feel most supportive to you in this moment?",
  "I hear you. Sometimes just naming what we're experiencing is a powerful first step. Is there anything specific you'd like to work through?",
  "Thank you for sharing. Remember, small consistent steps toward wellness add up over time. What feels manageable for you today?",
]

const suggestions = [
  "\n\n💨 **Try a breathing exercise** — even 2 minutes can shift your state.",
  "\n\n🌿 **Grounding check:** Name 5 things you can see right now.",
  "\n\n☕ **Take a short break** — step away from screens for 5 minutes.",
  "\n\n📝 **Reflection prompt:** What's one small thing that went well today?",
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function mockResponse(messages: ChatMessage[], currentMood: Mood | null): Promise<string> {
  // Simulate network latency
  await new Promise(r => setTimeout(r, 700 + Math.random() * 700))

  const lastUser = [...messages].reverse().find(m => m.role === 'user')
  if (!lastUser) return "Hello! I'm Sync, your FeelSync wellness companion. How are you feeling today?"

  const t = lastUser.content.toLowerCase()

  // ── Intent: relax / calm ──
  if (t.includes('relax') || t.includes('calm') || t.includes('unwind') || t.includes('tension')) {
    return "Let's help you relax. 🌿 Start by taking a slow breath in through your nose for 4 counts, hold for 4, then exhale through your mouth for 6 counts. Repeat this 3–4 times.\n\nYou can also try the **Guided Breathing** exercise in the app for a fully guided session. Would that help?"
  }

  // ── Intent: breathing ──
  if (t.includes('breath') || t.includes('breathing') || t.includes('breathe')) {
    return "Breathing exercises are one of the most effective tools for regulating your nervous system. 💨\n\nI'd recommend **Box Breathing**: inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat 4 times.\n\nHead to the **Breathe** screen for a guided, animated session whenever you're ready."
  }

  // ── Intent: grounding ──
  if (t.includes('ground') || t.includes('grounding') || t.includes('present') || t.includes('anchor')) {
    return "The **5-4-3-2-1 grounding technique** is great for this. 🌿\n\nNotice:\n**5** things you can see\n**4** things you can touch\n**3** things you can hear\n**2** things you can smell\n**1** thing you can taste\n\nThis anchors you to the present moment. You can also use the **Grounding** screen for a guided walkthrough."
  }

  // ── Intent: reflect / journal ──
  if (t.includes('reflect') || t.includes('journal') || t.includes('think') || t.includes('process')) {
    return "Reflection is a powerful wellness practice. 📝 Here are a few prompts to get you started:\n\n• What's one thing that went well today, however small?\n• What's one thing you're grateful for right now?\n• What would feel like a small win tomorrow?\n\nTake your time — there's no right or wrong answer."
  }

  // ── Intent: anxiety / stress ──
  if (t.includes('anxious') || t.includes('anxiety') || t.includes('stress') || t.includes('overwhelm') || t.includes('panic')) {
    return "I hear you — anxiety and stress can feel really overwhelming. You're not alone in this. 💙\n\nA few things that can help right now:\n• **Slow your breath** — try exhaling longer than you inhale\n• **Ground yourself** — name 5 things you can see around you\n• **Move your body** — even a short walk can shift your state\n\nIf these feelings persist or feel unmanageable, speaking with a mental health professional is always a good step. Would you like to try a breathing exercise together?"
  }

  // ── Intent: sleep / tired ──
  if (t.includes('sleep') || t.includes('tired') || t.includes('exhaust') || t.includes('insomnia')) {
    return "Rest is foundational to emotional wellness. 🌙 A few evidence-based wind-down tips:\n\n• Dim lights 30–60 minutes before bed\n• Avoid screens or use night mode\n• Try the **4-7-8 breathing** pattern — it's specifically designed to promote sleep\n• Keep a consistent sleep and wake time\n\nWould you like to try the 4-7-8 breathing exercise now?"
  }

  // ── Intent: sad / low ──
  if (t.includes('sad') || t.includes('unhappy') || t.includes('down') || t.includes('hopeless') || t.includes('depress')) {
    return "I'm really glad you shared that with me. Feeling sad or low is a valid human experience, and it takes courage to acknowledge it. 💙\n\nI'm here to support you. While I'm a wellness companion and not a substitute for professional care, I can help you with small grounding steps right now.\n\nWould a breathing exercise or a short reflection prompt feel helpful? And if these feelings are persistent or intense, please consider reaching out to a mental health professional."
  }

  // ── Intent: happy / positive ──
  if (t.includes('happy') || t.includes('great') || t.includes('amazing') || t.includes('wonderful') || t.includes('excited')) {
    return "That's genuinely wonderful to hear! 🌟 Positive moments are worth savoring and anchoring.\n\nTry this: take a slow breath and really let yourself feel this moment. Notice where in your body you feel the positivity.\n\nWould you like a short gratitude reflection to make this feeling last a little longer?"
  }

  // ── Mood-based opener for first 2 messages ──
  const userMsgCount = messages.filter(m => m.role === 'user').length
  if (userMsgCount <= 2 && currentMood) {
    return pick(moodResponses[currentMood]) + pick(suggestions)
  }

  return pick(generalResponses)
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Entry Point
// Uses real API if VITE_API_BASE_URL is configured, otherwise falls back to mock
// ─────────────────────────────────────────────────────────────────────────────

export async function getAIResponse(
  messages: ChatMessage[],
  currentMood: Mood | null,
): Promise<string> {
  // Use real API if configured
  if (API_BASE_URL) {
    try {
      return await apiResponse(messages, currentMood)
    } catch (err) {
      console.error('API call failed, falling back to mock:', err)
      // Fall through to mock response
    }
  }

  // Mock fallback for local development or API failure
  return mockResponse(messages, currentMood)
}

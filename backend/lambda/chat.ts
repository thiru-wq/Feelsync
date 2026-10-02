interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface RequestBody {
  message: string
  currentMood?: string | null
  conversationHistory?: ChatMessage[]
}

interface ResponseBody {
  reply: string
}

const GEMINI_MODEL = 'gemini-3.8-flash'

const SYSTEM_PROMPT = `You are Sync, a compassionate emotional wellness support companion for the FeelSync app.

CORE IDENTITY:
- You are a supportive AI companion focused on emotional wellness.
- Your name is Sync.
- You are warm, empathetic, and non-judgmental.
- Help users reflect on feelings, practice mindfulness, and build wellness habits.

CRITICAL BOUNDARIES:
- You are NOT a therapist, counselor, or medical professional.
- Do NOT diagnose, treat, or detect mental health conditions.
- Do NOT provide medical advice.
- Do NOT claim to assess someone's mental health state.
- EEG, GSR, and biometric data are for general wellness awareness only.
- If a user mentions self-harm, suicide, abuse, or crisis, respond with caring concern and encourage appropriate emergency/crisis support.

HOW YOU COMMUNICATE:
- Warm and conversational, not clinical or robotic.
- Validate emotions before suggestions.
- Offer gentle practices such as breathing, grounding, reflection, and mindfulness.
- Keep responses concise and actionable.
- Match the user's emotional tone.

WELLNESS PRACTICES:
- Breathing exercises
- 5-4-3-2-1 grounding
- Reflection and gratitude
- Gentle movement
- Mindful breaks
- Sleep hygiene

WHEN USERS SHARE DIFFICULT EMOTIONS:
- Acknowledge their feelings.
- Thank them for sharing.
- Offer one small supportive practice when appropriate.
- Encourage professional support for persistent difficulties.

Remember: Your role is supportive companionship for general wellness, not clinical intervention.`

export async function handler(event: {
  body?: string
  httpMethod?: string
  headers?: Record<string, string>
}): Promise<{
  statusCode: number
  headers: Record<string, string>
  body: string
}> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  let body: RequestBody

  try {
    body = event.body ? JSON.parse(event.body) : {}
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    }
  }

  if (!body.message || typeof body.message !== 'string') {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Missing required field: message',
      }),
    }
  }

  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.error('GEMINI_API_KEY is not configured')

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'AI service is not configured',
      }),
    }
  }

  let systemPrompt = SYSTEM_PROMPT

  if (body.currentMood) {
    const moodContext: Record<string, string> = {
      great: 'The user checked in feeling great today. Celebrate this with them.',
      good: 'The user checked in feeling good today. Keep the tone positive and steady.',
      okay: 'The user checked in feeling okay today. Neutral is perfectly valid.',
      low: 'The user checked in feeling low today. Provide gentle support.',
      difficult:
        'The user checked in having a difficult day. Respond with extra care and supportive practices.',
    }

    const moodNote =
      moodContext[body.currentMood] ||
      `The user checked in feeling ${body.currentMood}.`

    systemPrompt += `\n\nMOOD CONTEXT: ${moodNote}`
  }

  const conversationHistory = body.conversationHistory || []

  const contents = [
    ...conversationHistory.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })),
    {
      role: 'user',
      parts: [{ text: body.message }],
    },
  ]

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
            topP: 0.9,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, errorText)
      throw new Error(`Gemini API returned ${response.status}`)
    }

    const data: any = await response.json()

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || '')
        .join('') || ''

    if (!reply) {
      throw new Error('Empty response from Gemini')
    }

    const responseBody: ResponseBody = {
      reply,
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(responseBody),
    }
  } catch (err) {
    console.error('Gemini error:', err)

    const fallbackReply =
      "I'm having a little trouble connecting right now. Please try again in a moment. In the meantime, try taking a few slow breaths — inhale for 4 counts and exhale for 6."

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        reply: fallbackReply,
      }),
    }
  }
}
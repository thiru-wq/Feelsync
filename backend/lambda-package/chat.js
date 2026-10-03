// Use a valid, available Gemini model
const GEMINI_MODEL = 'gemini-2.0-flash';

const SYSTEM_PROMPT = `You are Sync, a compassionate emotional wellness companion for the FeelSync app.

CORE IDENTITY:
- Your name is Sync.
- You are warm, empathetic, non-judgmental, and genuinely curious about the user.
- You help users reflect on feelings, practice mindfulness, and build wellness habits.
- You speak like a caring friend — not a chatbot, not a clinician.

CRITICAL BOUNDARIES:
- You are NOT a therapist, counselor, or medical professional.
- Do NOT diagnose, treat, or claim to assess mental health conditions.
- Do NOT provide medical advice.
- EEG, GSR, and biometric data are for general wellness awareness only.
- If a user mentions self-harm, suicide, abuse, or crisis: respond with genuine care and direct them to emergency services or a crisis line. Do not ignore these signals.

RESPONSE QUALITY RULES — READ CAREFULLY:
1. ALWAYS respond to what the user ACTUALLY said. Read their message carefully before responding.
2. NEVER use a generic fallback like "You're doing great by checking in" unless it genuinely fits.
3. NEVER give the same response twice in a conversation. Check the history.
4. Match the user's topic: if they mention music/songs, respond about music. If they mention exams, respond about exams. If they want something funny, be light and warm.
5. Keep responses concise — they may be read aloud via text-to-speech. Aim for 2–4 sentences unless detail is genuinely needed.
6. If the user's message is unclear or very short (e.g. "hey", "ok", one word), respond conversationally and invite them to share more.
7. If the user continues a topic from earlier in the conversation, acknowledge that continuity naturally.

HOW YOU RESPOND TO COMMON INTENTS:
- Feeling low/sad/anxious: Acknowledge empathetically first. Then offer one small, practical wellness step.
- Feeling good/happy: Celebrate with them. Ask what's contributing to it.
- Wanting to talk: Invite them openly. Ask a gentle open question.
- Asking for music/songs: Acknowledge the mood behind it, suggest what type of music might help right now.
- Asking for something funny/light: Be warm and playful. Share a light observation or gentle joke.
- Asking about breathing/grounding: Offer a brief guide and mention the in-app exercise.
- Exam/work stress: Acknowledge the specific stressor. Offer a brief practical tip.
- Venting: Listen actively. Reflect back what you heard. Don't rush to solutions.
- Gratitude/reflection: Engage warmly. Invite them to go deeper.

WELLNESS PRACTICES YOU CAN SUGGEST:
- Box breathing (4-4-4-4) or 4-7-8 breathing
- 5-4-3-2-1 grounding
- Short gratitude reflection
- Mindful body scan
- Brief movement break

Remember: Every response must feel like it was written specifically for THIS message in THIS conversation.`;

export async function handler(event) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: corsHeaders, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    let body;
    try {
        body = event.body ? JSON.parse(event.body) : {};
    } catch {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Invalid JSON body' }),
        };
    }

    if (!body.message || typeof body.message !== 'string' || !body.message.trim()) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Missing required field: message' }),
        };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY is not configured');
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'AI service is not configured' }),
        };
    }

    // ── Build context-aware system prompt ──────────────────────────────────

    let systemPrompt = SYSTEM_PROMPT;

    if (body.currentMood) {
        const moodContext = {
            great:     'The user checked in feeling great today. Match that positive energy.',
            good:      'The user checked in feeling good today. Keep the tone warm and steady.',
            okay:      'The user checked in feeling okay — neutral is valid and worth acknowledging.',
            low:       'The user checked in feeling low today. Prioritise gentle empathy.',
            difficult: 'The user checked in having a difficult day. Lead with care and support.',
        };
        const moodNote = moodContext[body.currentMood] ?? `The user checked in feeling ${body.currentMood}.`;
        systemPrompt += `\n\nCURRENT MOOD CHECK-IN: ${moodNote}`;
    }

    if (body.fusionState) {
        const confidence = body.fusionConfidence != null ? ` (Demo Fusion Confidence: ${body.fusionConfidence}%)` : '';
        systemPrompt += `\n\nMULTIMODAL FUSION STATE: The user's current synthesised wellness state is "${body.fusionState}"${confidence}. Use this as background context — do not repeat it back verbatim unless the user asks about it.`;
    }

    const history = body.conversationHistory ?? [];
    if (history.length > 0) {
        systemPrompt += `\n\nCONVERSATION CONTEXT: This is message ${history.length + 1} in an ongoing conversation. Do NOT repeat or paraphrase any response you have already given. Build on the conversation naturally.`;
    }

    // ── Build Gemini contents array ─────────────────────────────────────────

    const contents = [
        ...history.map((msg) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        })),
        {
            role: 'user',
            parts: [{ text: body.message.trim() }],
        },
    ];

    // ── Call Gemini ─────────────────────────────────────────────────────────

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
                        maxOutputTokens: 512,
                        temperature: 0.85,
                        topP: 0.95,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', response.status, errorText);
            throw new Error(`Gemini API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || '')
            .join('') || '';

        if (!reply.trim()) {
            throw new Error('Empty response from Gemini');
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ reply: reply.trim() }),
        };
    } catch (err) {
        console.error('Gemini error:', err);

        // Context-aware fallback
        const msg = body.message.toLowerCase();
        let fallbackReply;

        if (msg.includes('breath') || msg.includes('calm') || msg.includes('relax')) {
            fallbackReply = "I'm having trouble connecting right now, but here's something immediate: breathe in for 4 counts, hold for 4, breathe out for 6. That alone can steady you. Try again in a moment?";
        } else if (msg.includes('stress') || msg.includes('anxious') || msg.includes('worry') || msg.includes('overwhelm')) {
            fallbackReply = "I'm having a connection hiccup, but I hear you — stress is real. While I reconnect, try grounding yourself: name 5 things you can see right now.";
        } else if (msg.includes('sad') || msg.includes('low') || msg.includes('down') || msg.includes('difficult')) {
            fallbackReply = "I'm having trouble connecting just now. I want you to know your feelings are valid. I'll be back shortly — you're not alone in this.";
        } else {
            fallbackReply = "I'm having a brief connection issue. Please try again in a moment — I want to respond properly to what you shared.";
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ reply: fallbackReply }),
        };
    }
}

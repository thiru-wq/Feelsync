# FeelSync — AI-Powered Emotional Wellness Support

FeelSync is a production-ready MVP web application that helps users check in with their mood, interact with an AI wellness companion, use guided breathing and grounding activities, and review their wellness history.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4
- **Routing:** React Router v7
- **Icons:** Lucide React
- **State:** React Context + localStorage

## AWS Architecture (production)

```
Frontend (S3 + CloudFront)
  → API Gateway
  → AWS Lambda
  → DynamoDB

AI Companion:
  Lambda → Amazon Bedrock (Claude)

Voice Assistant:
  Microphone → Amazon Transcribe → Bedrock → Amazon Polly → User
```

## Screens

1. Welcome / Landing
2. Onboarding
3. Home Dashboard
4. Mood Check-in
5. AI Wellness Companion (Sync)
6. Voice Assistant
7. Live Wellness Signals (EEG/GSR demo)
8. Guided Breathing
9. Wellness Summary
10. Wellness History
11. Profile / Settings

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Important

FeelSync is a wellness support tool, not a medical diagnostic or treatment system. Wellness Signals are simulated for demo purposes and are not medical measurements.

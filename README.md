# BookTalk AI

Turn any piece of classroom material into an interactive speaking experience.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file and add your OpenAI API key:

```bash
cp .env.local.example .env.local
```

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Flow

1. **Capture** — Upload a textbook photo or use the sample lesson
2. **Understand** — AI extracts text, grammar, and topic tags
3. **Listen** — Hear a 6-line AI-generated conversation with two voices
4. **Repeat** — Shadow each line with speech tips
5. **Role-play** — Pick a character and speak your lines with speech recognition

## Deploy

Deploy to Vercel:

```bash
npx vercel
```

Set `OPENAI_API_KEY` in your Vercel project environment variables.

## Tech Stack

- Next.js 15 (App Router)
- OpenAI GPT-4o (vision + dialogue), TTS, Whisper
- Vanilla CSS ported from the HTML prototype

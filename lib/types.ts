export type TransformExample = {
  textbook: string;
  natural: string;
};

export type LessonAnalysis = {
  extractedText: string;
  title: string;
  level: string;
  grammarTags: string[];
  topicTags: string[];
  transformExample: TransformExample;
};

export type DialogueLine = {
  speaker: string;
  text: string;
  tip: string;
  audioUrl?: string;
};

export type Dialogue = {
  title: string;
  lines: DialogueLine[];
  speakers: string[];
  grammarPatternCount?: number;
  everydayPhraseCount?: number;
};

export type TranscribeResult = {
  transcript: string;
  matchScore: number;
  matched: boolean;
};

export type AppScreen = 1 | 2 | 3 | 4 | 5;

export const SCREEN_LABELS: Record<AppScreen, string> = {
  1: "1 of 5 · Capture",
  2: "2 of 5 · Understand",
  3: "3 of 5 · Listen",
  4: "4 of 5 · Repeat",
  5: "5 of 5 · Role-play",
};

export const SAMPLE_LESSON: LessonAnalysis = {
  extractedText:
    "Tom missed the train because he left home too late. When he arrived at the station, the train had already gone. He called his friend Anna and asked if they could meet later.",
  title: "Tom missed the train",
  level: "B1",
  grammarTags: ["Past simple", "Past perfect"],
  topicTags: ["Travel", "Making plans"],
  transformExample: {
    textbook: "The train had already gone.",
    natural: "I got there too late — the train had already left.",
  },
};

export const VOICE_MAP: Record<string, "nova" | "onyx" | "shimmer" | "echo"> = {
  Anna: "nova",
  Tom: "onyx",
};

export function getVoiceForSpeaker(speaker: string): "nova" | "onyx" | "shimmer" | "echo" {
  if (VOICE_MAP[speaker]) return VOICE_MAP[speaker];
  const lower = speaker.toLowerCase();
  if (lower.includes("anna") || lower.includes("maria") || lower.includes("sarah")) return "nova";
  if (lower.includes("tom") || lower.includes("john") || lower.includes("david")) return "onyx";
  return lower.charCodeAt(0) % 2 === 0 ? "nova" : "onyx";
}

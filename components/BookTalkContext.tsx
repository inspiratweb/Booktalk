"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { AppScreen, Dialogue, LessonAnalysis } from "@/lib/types";
import { getVoiceForSpeaker, SAMPLE_LESSON } from "@/lib/types";
import { fetchTtsBlob } from "@/lib/audio";

type BookTalkContextValue = {
  screen: AppScreen;
  setScreen: (screen: AppScreen) => void;
  lesson: LessonAnalysis | null;
  setLesson: (lesson: LessonAnalysis | null) => void;
  dialogue: Dialogue | null;
  setDialogue: (dialogue: Dialogue | null) => void;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  userRole: string | null;
  setUserRole: (role: string | null) => void;
  reset: () => void;
  pregenerateAudio: (dialogue: Dialogue) => Promise<Dialogue>;
};

const BookTalkContext = createContext<BookTalkContextValue | null>(null);

export function BookTalkProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<AppScreen>(1);
  const [lesson, setLesson] = useState<LessonAnalysis | null>(null);
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const reset = useCallback(() => {
    setScreen(1);
    setLesson(null);
    setDialogue(null);
    setPreviewUrl(null);
    setUserRole(null);
  }, []);

  const pregenerateAudio = useCallback(async (d: Dialogue): Promise<Dialogue> => {
    const updatedLines = await Promise.all(
      d.lines.map(async (line) => {
        try {
          const voice = getVoiceForSpeaker(line.speaker);
          const blob = await fetchTtsBlob(line.text, voice);
          const audioUrl = URL.createObjectURL(blob);
          return { ...line, audioUrl };
        } catch {
          return line;
        }
      })
    );

    const updated = { ...d, lines: updatedLines };
    setDialogue(updated);
    return updated;
  }, []);

  const value = useMemo(
    () => ({
      screen,
      setScreen,
      lesson,
      setLesson,
      dialogue,
      setDialogue,
      previewUrl,
      setPreviewUrl,
      userRole,
      setUserRole,
      reset,
      pregenerateAudio,
    }),
    [screen, lesson, dialogue, previewUrl, userRole, reset, pregenerateAudio]
  );

  return <BookTalkContext.Provider value={value}>{children}</BookTalkContext.Provider>;
}

export function useBookTalk() {
  const ctx = useContext(BookTalkContext);
  if (!ctx) throw new Error("useBookTalk must be used within BookTalkProvider");
  return ctx;
}

export { SAMPLE_LESSON };

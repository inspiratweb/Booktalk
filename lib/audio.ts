export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function computeMatchScore(expected: string, spoken: string): number {
  const expectedWords = normalizeText(expected).split(" ").filter(Boolean);
  const spokenWords = new Set(normalizeText(spoken).split(" ").filter(Boolean));

  if (expectedWords.length === 0) return 0;

  let matches = 0;
  for (const word of expectedWords) {
    if (spokenWords.has(word)) matches++;
  }

  return matches / expectedWords.length;
}

export function isCloseEnoughMatch(expected: string, spoken: string, threshold = 0.55): boolean {
  return computeMatchScore(expected, spoken) >= threshold;
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function fetchTtsBlob(text: string, voice: string, speed = 1): Promise<Blob> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice, speed }),
  });

  if (!res.ok) {
    throw new Error("TTS request failed");
  }

  return res.blob();
}

export function playBlob(blob: Blob, playbackRate = 1): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.playbackRate = playbackRate;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Audio playback failed"));
    };

    audio.play().catch(reject);
  });
}

export function speakWithBrowser(text: string, rate = 1, pitch = 1): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) {
      resolve();
      return;
    }

    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    speechSynthesis.speak(utterance);
  });
}

export function stopBrowserSpeech(): void {
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }
}

export async function playLine(
  line: { text: string; audioUrl?: string },
  speaker: string,
  index: number,
  rate = 1
): Promise<void> {
  if (line.audioUrl) {
    const res = await fetch(line.audioUrl);
    const blob = await res.blob();
    await playBlob(blob, rate);
    return;
  }

  const pitch = index % 2 === 0 ? 1.08 : 0.92;
  await speakWithBrowser(line.text, rate, pitch);
}

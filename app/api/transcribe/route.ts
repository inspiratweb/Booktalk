import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { computeMatchScore, isCloseEnoughMatch } from "@/lib/audio";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;
    const expectedLine = formData.get("expectedLine") as string | null;

    if (!audio) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    const openai = getOpenAI();
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      language: "en",
    });

    const transcript = transcription.text.trim();
    const matchScore = expectedLine ? computeMatchScore(expectedLine, transcript) : 1;
    const matched = expectedLine ? isCloseEnoughMatch(expectedLine, transcript) : true;

    return NextResponse.json({ transcript, matchScore, matched });
  } catch (error) {
    console.error("Transcribe error:", error);
    const message = error instanceof Error ? error.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

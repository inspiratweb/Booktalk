import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const { text, voice = "nova", speed = 1 } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const openai = getOpenAI();
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice as "nova" | "onyx" | "shimmer" | "echo" | "alloy" | "fable",
      input: text,
      speed: Math.min(Math.max(speed, 0.25), 4),
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    const message = error instanceof Error ? error.message : "TTS failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { DIALOGUE_SYSTEM_PROMPT, buildDialogueUserPrompt } from "@/lib/prompts";
import type { Dialogue } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { extractedText, grammarTags, topicTags, level } = body;

    if (!extractedText) {
      return NextResponse.json({ error: "Missing extracted text" }, { status: 400 });
    }

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: DIALOGUE_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildDialogueUserPrompt(
            extractedText,
            grammarTags ?? [],
            topicTags ?? [],
            level ?? "B1"
          ),
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "No dialogue generated" }, { status: 500 });
    }

    const parsed = JSON.parse(content) as Dialogue;

    if (!parsed.lines || parsed.lines.length !== 6) {
      return NextResponse.json({ error: "Invalid dialogue format" }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Generate dialogue error:", error);
    const message = error instanceof Error ? error.message : "Dialogue generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

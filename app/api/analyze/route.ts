import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { ANALYZE_SYSTEM_PROMPT } from "@/lib/prompts";
import { SAMPLE_LESSON, type LessonAnalysis } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      if (body.useSample) {
        return NextResponse.json(SAMPLE_LESSON);
      }
    }

    const formData = await req.formData();
    const useSample = formData.get("useSample") === "true";
    const image = formData.get("image") as File | null;

    if (useSample) {
      return NextResponse.json(SAMPLE_LESSON);
    }

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = image.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: ANALYZE_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this textbook image and return the lesson analysis as JSON.",
            },
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "No analysis returned" }, { status: 500 });
    }

    const parsed = JSON.parse(content) as LessonAnalysis;

    if (!parsed.extractedText || parsed.extractedText.trim().length < 10) {
      return NextResponse.json(
        {
          error:
            "Could not read enough text from this photo. Try a clearer image or use the sample lesson.",
          canUseSample: true,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Analyze error:", error);
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

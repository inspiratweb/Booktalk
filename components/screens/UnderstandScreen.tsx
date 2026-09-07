"use client";

import { useState } from "react";
import { useBookTalk } from "@/components/BookTalkContext";
import type { Dialogue } from "@/lib/types";

export default function UnderstandScreen() {
  const { lesson, setScreen, setDialogue, pregenerateAudio } = useBookTalk();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!lesson) {
    return (
      <div className="panel">
        <p className="muted">No lesson loaded. Go back to capture a photo.</p>
        <button className="secondary" type="button" onClick={() => setScreen(1)}>
          Back
        </button>
      </div>
    );
  }

  const allTags = [...lesson.grammarTags, ...lesson.topicTags, lesson.level];

  async function handleCreateDialogue() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate-dialogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extractedText: lesson!.extractedText,
          grammarTags: lesson!.grammarTags,
          topicTags: lesson!.topicTags,
          level: lesson!.level,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to generate dialogue");
        setLoading(false);
        return;
      }

      const dialogue = data as Dialogue;
      setDialogue(dialogue);
      await pregenerateAudio(dialogue);
      setScreen(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="extract-grid">
      <div className="panel">
        <div className="eyebrow">AI understood the lesson</div>
        <h2>From page to practice</h2>
        <p className="muted">
          We keep the target language from the curriculum, but turn the textbook situation into
          spoken English.
        </p>
        <div className="ocr">{lesson.extractedText}</div>
        <div className="chips">
          {allTags.map((tag) => (
            <span key={tag} className="chip">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="panel">
        <div className="eyebrow">Conversation recipe</div>
        <h2>What AI will create</h2>
        <p className="muted">
          A realistic 6-line dialogue using the same vocabulary and grammar, with one useful
          everyday phrase added for transfer.
        </p>
        <div className="transform-card">
          <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.8, marginBottom: 8 }}>
            TEXTBOOK
          </div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            &ldquo;{lesson.transformExample.textbook}&rdquo;
          </div>
          <div style={{ fontSize: 26, textAlign: "center", margin: 13 }}>↓</div>
          <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.8, marginBottom: 8 }}>
            NATURAL SPEECH
          </div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            &ldquo;{lesson.transformExample.natural}&rdquo;
          </div>
        </div>
        <div className="actions">
          <button
            className="primary"
            type="button"
            onClick={handleCreateDialogue}
            disabled={loading}
          >
            {loading ? "Creating conversation…" : "Create conversation →"}
          </button>
          <button className="secondary" type="button" onClick={() => setScreen(1)} disabled={loading}>
            Back
          </button>
        </div>
        {error && <div className="error-text">{error}</div>}
        {loading && (
          <div className="status">Generating dialogue and preparing audio…</div>
        )}
      </div>
    </div>
  );
}

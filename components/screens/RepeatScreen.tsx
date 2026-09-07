"use client";

import { useEffect, useState } from "react";
import { useBookTalk } from "@/components/BookTalkContext";
import { playLine, stopBrowserSpeech } from "@/lib/audio";

export default function RepeatScreen() {
  const { dialogue, setScreen, reset } = useBookTalk();
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [repeatStatus, setRepeatStatus] = useState("");
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("booktalk-practice-index");
    if (stored) {
      setPracticeIndex(Number(stored));
      sessionStorage.removeItem("booktalk-practice-index");
    }
  }, []);

  if (!dialogue) {
    return (
      <div className="panel">
        <p className="muted">No conversation loaded.</p>
        <button className="secondary" type="button" onClick={() => setScreen(3)}>
          Back to listen
        </button>
      </div>
    );
  }

  const line = dialogue.lines[practiceIndex];
  const isLast = practiceIndex === dialogue.lines.length - 1;
  const grammarCount = dialogue.grammarPatternCount ?? dialogue.lines.length > 0 ? 2 : 0;
  const phraseCount = dialogue.everydayPhraseCount ?? 1;

  function renderPractice() {
    return {
      speaker: line.speaker,
      text: line.text,
      tip: line.tip,
      counter: `Line ${practiceIndex + 1} of ${dialogue!.lines.length}`,
      score: `${completed.size}/${dialogue!.lines.length}`,
      isDone: completed.has(practiceIndex),
    };
  }

  const view = renderPractice();

  async function handleHearLine() {
    stopBrowserSpeech();
    await playLine(line, line.speaker, practiceIndex);
  }

  function handleDidRepeat() {
    setCompleted((prev) => new Set(prev).add(practiceIndex));
    setRepeatStatus("Nice — line completed ✓");
  }

  function handleNext() {
    if (isLast) {
      setRepeatStatus("Practice complete — you shadowed the whole conversation.");
      setFinished(true);
    } else {
      setPracticeIndex((i) => i + 1);
      setRepeatStatus("");
    }
  }

  function handlePrev() {
    if (practiceIndex > 0) {
      setPracticeIndex((i) => i - 1);
      setRepeatStatus("");
    }
  }

  function handleStartOver() {
    stopBrowserSpeech();
    reset();
  }

  return (
    <div className="panel">
      <div className="practice-head">
        <div>
          <div className="eyebrow">Shadowing practice</div>
          <h2>Hear it. Copy it. Own it.</h2>
        </div>
        <div className="step-pill">{view.counter}</div>
      </div>
      <div className="practice-card">
        <div className="speaker">{view.speaker}</div>
        <div className="bigline">{view.text}</div>
        <div className="translation">
          Listen to the rhythm first. Then say the line out loud immediately after the model.
        </div>
        <div className="actions" style={{ justifyContent: "center" }}>
          <button className="secondary" type="button" onClick={handleHearLine}>
            🔊 Hear model
          </button>
          <button className="primary" type="button" onClick={handleDidRepeat}>
            ✓ I repeated it
          </button>
        </div>
        <div className="status">{view.isDone ? "Repeated ✓" : repeatStatus}</div>
        <div className="tip">
          <strong>💡 Speech tip</strong>
          <br />
          <span>{view.tip}</span>
        </div>
      </div>
      <div className="score-strip">
        <div className="score">
          <b>{view.score}</b>
          <span className="muted">Lines repeated</span>
        </div>
        <div className="score">
          <b>{grammarCount}</b>
          <span className="muted">Grammar patterns</span>
        </div>
        <div className="score">
          <b>{phraseCount}</b>
          <span className="muted">Everyday phrase</span>
        </div>
      </div>
      <div className="actions">
        <button
          className="secondary"
          type="button"
          onClick={handlePrev}
          disabled={practiceIndex === 0}
        >
          ← Previous
        </button>
        <button className="primary" type="button" onClick={handleNext}>
          {isLast ? "Finish ✓" : "Next line →"}
        </button>
        {finished && (
          <button className="primary" type="button" onClick={() => setScreen(5)}>
            Try role-play →
          </button>
        )}
        <button className="ghost" type="button" onClick={handleStartOver}>
          Start over
        </button>
      </div>
    </div>
  );
}

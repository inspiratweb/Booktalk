"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBookTalk } from "@/components/BookTalkContext";
import { playLine, stopBrowserSpeech } from "@/lib/audio";

type Phase = "pick" | "playing" | "complete";

export default function RolePlayScreen() {
  const { dialogue, setScreen, reset, userRole, setUserRole } = useBookTalk();
  const [phase, setPhase] = useState<Phase>("pick");
  const [turnIndex, setTurnIndex] = useState(0);
  const [status, setStatus] = useState("");
  const [recording, setRecording] = useState(false);
  const [completedTurns, setCompletedTurns] = useState<Set<number>>(new Set());

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const speakers = dialogue?.speakers ?? [];
  const aiRole = userRole
    ? speakers.find((s) => s !== userRole) ?? speakers[1]
    : null;

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      stopRecording();
      stopBrowserSpeech();
    };
  }, [stopRecording]);

  if (!dialogue) {
    return (
      <div className="panel">
        <p className="muted">Create a conversation first.</p>
        <button className="secondary" type="button" onClick={() => setScreen(2)}>
          Back
        </button>
      </div>
    );
  }

  function getUserLineIndex(index: number): boolean {
    const line = dialogue!.lines[index];
    return line.speaker === userRole;
  }

  async function playAiLine(index: number) {
    const line = dialogue!.lines[index];
    setStatus(`${line.speaker} is speaking…`);
    await playLine(line, line.speaker, index);
  }

  async function processTurn(index: number, role: string) {
    if (index >= dialogue!.lines.length) {
      setPhase("complete");
      setStatus("Role-play complete!");
      return;
    }

    setTurnIndex(index);
    const line = dialogue!.lines[index];

    if (line.speaker === role) {
      setStatus(`Your turn — say: "${line.text}"`);
    } else {
      await playAiLine(index);
      await processTurn(index + 1, role);
    }
  }

  async function advanceTurn(fromIndex: number) {
    setCompletedTurns((prev) => new Set(prev).add(fromIndex));
    if (!userRole) return;
    await processTurn(fromIndex + 1, userRole);
  }

  async function startRolePlay(role: string) {
    setUserRole(role);
    setTurnIndex(0);
    setCompletedTurns(new Set());
    setPhase("playing");
    setStatus("Starting role-play…");
    await processTurn(0, role);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await submitRecording(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setStatus("Listening… release to submit");
    } catch {
      setStatus("Microphone access denied. Use Skip line for demo.");
    }
  }

  function handleMicDown() {
    if (!recording) startRecording();
  }

  function handleMicUp() {
    stopRecording();
  }

  async function submitRecording(blob: Blob) {
    const line = dialogue!.lines[turnIndex];
    setStatus("Checking your speech…");

    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      formData.append("expectedLine", line.text);

      const res = await fetch("/api/transcribe", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error ?? "Transcription failed — try again");
        return;
      }

      if (data.matched) {
        setStatus(`Great! You said: "${data.transcript}"`);
        setTimeout(() => advanceTurn(turnIndex), 800);
      } else {
        setStatus(
          `Almost! You said: "${data.transcript}". Try again or skip this line.`
        );
      }
    } catch {
      setStatus("Could not check speech — try again or skip");
    }
  }

  function handleSkipLine() {
    advanceTurn(turnIndex);
  }

  if (phase === "pick") {
    return (
      <div className="panel">
        <div className="eyebrow">Role-play</div>
        <h2>Pick your character</h2>
        <p className="muted">
          Choose who you want to be. AI will speak the other role. Say your lines when it&apos;s
          your turn.
        </p>
        <div className="role-grid">
          {speakers.map((speaker) => (
            <button
              key={speaker}
              type="button"
              className={`role-card ${userRole === speaker ? "selected" : ""}`}
              onClick={() => startRolePlay(speaker)}
            >
              <b>{speaker}</b>
              <span className="muted">Play as {speaker}</span>
            </button>
          ))}
        </div>
        <div className="actions">
          <button className="secondary" type="button" onClick={() => setScreen(4)}>
            ← Back to shadowing
          </button>
        </div>
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div className="panel completion-card">
        <div className="eyebrow">Role-play complete</div>
        <h2>You did it!</h2>
        <p className="muted">
          You completed the full conversation as {userRole}. AI played {aiRole}.
        </p>
        <div className="score-strip" style={{ maxWidth: 400, margin: "24px auto" }}>
          <div className="score">
            <b>{completedTurns.size}</b>
            <span className="muted">Lines spoken</span>
          </div>
          <div className="score">
            <b>{dialogue.lines.length}</b>
            <span className="muted">Total lines</span>
          </div>
        </div>
        <div className="actions" style={{ justifyContent: "center" }}>
          <button className="primary" type="button" onClick={() => setPhase("pick")}>
            Play again
          </button>
          <button className="ghost" type="button" onClick={reset}>
            Start over
          </button>
        </div>
      </div>
    );
  }

  const currentLine = dialogue.lines[turnIndex];
  const isUserTurn = getUserLineIndex(turnIndex);

  return (
    <div className="panel">
      <div className="practice-head">
        <div>
          <div className="eyebrow">Role-play</div>
          <h2>
            You are {userRole}. AI is {aiRole}.
          </h2>
        </div>
        <div className="step-pill">
          Line {turnIndex + 1} of {dialogue.lines.length}
        </div>
      </div>

      <div className="practice-card">
        <div className="turn-badge">
          {isUserTurn ? "Your turn" : `${currentLine.speaker} is speaking`}
        </div>
        <div className="speaker">{currentLine.speaker}</div>
        <div className="bigline">{currentLine.text}</div>

        {isUserTurn && (
          <>
            <div className="translation">Hold the mic button and say this line out loud.</div>
            <button
              className={`mic-btn ${recording ? "recording" : ""}`}
              type="button"
              onMouseDown={handleMicDown}
              onMouseUp={handleMicUp}
              onMouseLeave={handleMicUp}
              onTouchStart={handleMicDown}
              onTouchEnd={handleMicUp}
            >
              🎤
            </button>
            <div className="actions" style={{ justifyContent: "center" }}>
              <button className="ghost mini" type="button" onClick={handleSkipLine}>
                Skip line
              </button>
            </div>
          </>
        )}

        <div className="status">{status}</div>
      </div>

      <div className="actions">
        <button className="secondary" type="button" onClick={() => setPhase("pick")}>
          Change character
        </button>
        <button className="ghost" type="button" onClick={() => setScreen(4)}>
          ← Back to shadowing
        </button>
      </div>
    </div>
  );
}

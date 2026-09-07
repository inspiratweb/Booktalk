"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBookTalk } from "@/components/BookTalkContext";
import { playLine, stopBrowserSpeech } from "@/lib/audio";

export default function ListenScreen() {
  const { lesson, dialogue, setScreen } = useBookTalk();
  const [rate, setRate] = useState(1);
  const [playingAll, setPlayingAll] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [playerStatus, setPlayerStatus] = useState("Ready to play");
  const [challengeMode, setChallengeMode] = useState(false);
  const playingAllRef = useRef(false);

  const stopSpeech = useCallback(() => {
    stopBrowserSpeech();
    setPlayingAll(false);
    playingAllRef.current = false;
    setPlayingIndex(null);
    setPlayerStatus("Ready to play");
  }, []);

  useEffect(() => {
    return () => stopSpeech();
  }, [stopSpeech]);

  if (!dialogue || !lesson) {
    return (
      <div className="panel">
        <p className="muted">No conversation yet.</p>
        <button className="secondary" type="button" onClick={() => setScreen(2)}>
          Back
        </button>
      </div>
    );
  }

  async function speakLine(index: number, onEnd?: () => void) {
    const line = dialogue!.lines[index];
    setPlayingIndex(index);
    setPlayerStatus(`${line.speaker} is speaking…`);

    try {
      await playLine(line, line.speaker, index, rate);
    } catch {
      setPlayerStatus("Playback failed — try again");
    }

    setPlayingIndex(null);
    onEnd?.();
  }

  async function playSequence(index: number) {
    if (!playingAllRef.current || index >= dialogue!.lines.length) {
      setPlayingAll(false);
      playingAllRef.current = false;
      setPlayerStatus("Conversation complete");
      return;
    }

    await speakLine(index, () => {
      if (playingAllRef.current) {
        playSequence(index + 1);
      }
    });
  }

  function handlePlayAll() {
    if (playingAll) {
      stopSpeech();
      setPlayerStatus("Paused");
      return;
    }

    setPlayingAll(true);
    playingAllRef.current = true;
    setPlayerStatus("Playing conversation…");
    playSequence(0);
  }

  function handlePracticeLine(index: number) {
    stopSpeech();
    setScreen(4);
    // RepeatScreen reads practiceIndex from sessionStorage for jump-to-line
    sessionStorage.setItem("booktalk-practice-index", String(index));
  }

  return (
    <>
      <div className="practice-head">
        <div>
          <div className="eyebrow">Your AI conversation</div>
          <h2>{dialogue.title}</h2>
          <p className="muted" style={{ margin: "5px 0 0" }}>
            Listen once like a mini-podcast. Then practise each role.
          </p>
        </div>
        <button className="secondary" type="button" onClick={() => { stopSpeech(); setScreen(2); }}>
          ← Edit source
        </button>
      </div>
      <div className="dialogue-layout">
        <div className={`conversation ${challengeMode ? "hidden-lines" : ""}`}>
          {dialogue.lines.map((line, i) => (
            <div
              key={i}
              className={`bubble ${i % 2 === 0 ? "a" : "b"} ${playingIndex === i ? "playing" : ""}`}
            >
              <div className="speaker">{line.speaker}</div>
              <div className="line">{line.text}</div>
              <div className="bubble-tools">
                <button
                  className="mini secondary"
                  type="button"
                  onClick={() => { stopSpeech(); speakLine(i); }}
                >
                  ▶ Hear
                </button>
                <button
                  className="mini ghost"
                  type="button"
                  onClick={() => handlePracticeLine(i)}
                >
                  Repeat
                </button>
              </div>
            </div>
          ))}
        </div>
        <aside className="panel player">
          <div className="eyebrow">Listen mode</div>
          <h2>Hear the whole scene</h2>
          <p className="muted">Two voices, one continuous conversation.</p>
          <button className="play-orb" type="button" onClick={handlePlayAll}>
            {playingAll ? "■" : "▶"}
          </button>
          <div className="status">{playerStatus}</div>
          <div className="speed">
            {[0.8, 1, 1.15].map((r) => (
              <button
                key={r}
                type="button"
                className={rate === r ? "selected" : ""}
                onClick={() => setRate(r)}
              >
                {r}×
              </button>
            ))}
          </div>
          <div className="toggle-row">
            <div style={{ textAlign: "left" }}>
              <strong>Challenge mode</strong>
              <div className="muted" style={{ fontSize: 12 }}>
                Blur the text and listen first
              </div>
            </div>
            <button
              className={`switch ${challengeMode ? "on" : ""}`}
              type="button"
              onClick={() => setChallengeMode(!challengeMode)}
            >
              <i />
            </button>
          </div>
          <div className="actions" style={{ justifyContent: "center" }}>
            <button
              className="primary"
              type="button"
              onClick={() => {
                stopSpeech();
                sessionStorage.setItem("booktalk-practice-index", "0");
                setScreen(4);
              }}
            >
              Practise line by line →
            </button>
            <button className="ghost" type="button" onClick={() => { stopSpeech(); setScreen(5); }}>
              Role-play →
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}

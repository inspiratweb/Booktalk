"use client";

import { useBookTalk } from "@/components/BookTalkContext";
import CaptureScreen from "@/components/screens/CaptureScreen";
import UnderstandScreen from "@/components/screens/UnderstandScreen";
import ListenScreen from "@/components/screens/ListenScreen";
import RepeatScreen from "@/components/screens/RepeatScreen";
import RolePlayScreen from "@/components/screens/RolePlayScreen";
import { SCREEN_LABELS } from "@/lib/types";

export default function BookTalkApp() {
  const { screen } = useBookTalk();

  return (
    <div id="booktalk-app" className="booktalk-app">
      <div className="shell">
        <div className="topbar">
          <div className="brand">
            <div className="brandmark">↗</div>
            <span>BookTalk AI</span>
          </div>
          <div className="step-pill">{SCREEN_LABELS[screen]}</div>
        </div>

        <div className="progress" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={n <= screen ? "active" : ""} />
          ))}
        </div>

        <section className={`screen ${screen === 1 ? "active" : ""}`}>
          <CaptureScreen />
        </section>
        <section className={`screen ${screen === 2 ? "active" : ""}`}>
          <UnderstandScreen />
        </section>
        <section className={`screen ${screen === 3 ? "active" : ""}`}>
          <ListenScreen />
        </section>
        <section className={`screen ${screen === 4 ? "active" : ""}`}>
          <RepeatScreen />
        </section>
        <section className={`screen ${screen === 5 ? "active" : ""}`}>
          <RolePlayScreen />
        </section>
      </div>
    </div>
  );
}

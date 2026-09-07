"use client";

import { useRef, useState } from "react";
import { useBookTalk } from "@/components/BookTalkContext";
import type { LessonAnalysis } from "@/lib/types";

export default function CaptureScreen() {
  const { setScreen, setLesson, setPreviewUrl } = useBookTalk();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasImage, setHasImage] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("Add a textbook photo");
  const [uploadHelp, setUploadHelp] = useState("Use an image from your device, or load the sample lesson.");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function analyzeImage(file: File | null, useSample = false) {
    setScanning(true);
    setStatus("AI is reading the page…");
    setError("");

    try {
      let res: Response;

      if (useSample) {
        res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ useSample: true }),
        });
      } else if (file) {
        const formData = new FormData();
        formData.append("image", file);
        res = await fetch("/api/analyze", { method: "POST", body: formData });
      } else {
        throw new Error("No image to analyze");
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Analysis failed");
        setStatus("");
        setScanning(false);
        return;
      }

      const lesson = data as LessonAnalysis;
      setLesson(lesson);
      setStatus("Text found · lesson context detected");
      setScanning(false);

      setTimeout(() => setScreen(2), 650);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("");
      setScanning(false);
    }
  }

  function handleSample() {
    setHasImage(true);
    setPreview(null);
    setPreviewUrl(null);
    setUploadTitle("Sample textbook page");
    setUploadHelp("Past events · train travel · making plans");
    analyzeImage(null, true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setPreview(url);
      setPreviewUrl(url);
      setHasImage(true);
      setUploadTitle("Textbook photo ready");
      setUploadHelp("Analyzing your page with AI…");
      analyzeImage(file, false);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="hero">
      <div>
        <div className="eyebrow">Turn your textbook into speaking practice</div>
        <h1>
          Take a photo.
          <br />
          Start a conversation.
        </h1>
        <p className="muted" style={{ fontSize: 18, maxWidth: 620 }}>
          Photograph a paragraph from your English book. AI extracts the language, understands the
          lesson, then rebuilds it as a natural short dialogue you can listen to and repeat.
        </p>
        <div className="sample-card">
          <div style={{ fontWeight: 800, marginBottom: 10 }}>Try the built-in textbook example</div>
          <div className="sample-book">
            Tom missed the train because he <strong>left home too late</strong>. When he arrived at
            the station, the train had already gone. He called his friend Anna and asked if they
            could meet later.
          </div>
        </div>
      </div>
      <div className="panel">
        <div className={`uploadbox ${hasImage ? "has-image" : ""} ${scanning ? "scanning" : ""}`}>
          <div className="scan" />
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Uploaded textbook page" />
          )}
          <div className="upload-content">
            {!hasImage && <div className="camera-icon">▣</div>}
            <h2>{uploadTitle}</h2>
            <p className="muted">{uploadHelp}</p>
            <div className="actions" style={{ justifyContent: "center" }}>
              <label className="filelabel primary">
                Choose photo
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  disabled={scanning}
                />
              </label>
              <button
                className="secondary"
                type="button"
                onClick={handleSample}
                disabled={scanning}
              >
                Use sample
              </button>
            </div>
            <div className="status">{status}</div>
            {error && (
              <div className="error-text">
                {error}
                {error.includes("sample") && (
                  <div style={{ marginTop: 8 }}>
                    <button className="ghost mini" type="button" onClick={handleSample}>
                      Use sample lesson
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="footer-note">
          Upload a clear photo of an English textbook paragraph for best results.
        </div>
      </div>
    </div>
  );
}
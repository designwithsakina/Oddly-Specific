"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A left-aligned sound toggle wrapped in a circular glassmorphism button
 * with animated orbiting light ring + outer bloom glow (like the reference).
 * Uses /ambient.mp3 from public/.
 */
export default function SoundToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio("/ambient.mp3");
    audio.loop = true;
    audio.volume = 0.35;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  return (
    <div className={`sound-toggle-wrap ${playing ? "active" : ""}`}>
      {/* Outer bloom glow — two offset radial blobs that rotate */}
      <span className="sound-glow-orb orb-1" />
      <span className="sound-glow-orb orb-2" />

      {/* The spinning light ring */}
      <span className="sound-light-ring" />

      {/* Main glass button */}
      <button
        onClick={toggle}
        aria-label={playing ? "Mute sound" : "Play sound"}
        className="sound-toggle-btn"
      >
        <span className="sound-bars-wrap">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={`sound-bar ${playing ? "playing" : ""}`}
              style={{ animationDelay: `${(i - 1) * 0.1}s` }}
            />
          ))}
        </span>
      </button>
    </div>
  );
}

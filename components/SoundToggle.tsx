"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A left-aligned sound toggle wrapped in a circular glassmorphism button.
 * Contains animated vertical equalizer bars that bounce when music is playing.
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
    <button
      onClick={toggle}
      aria-label={playing ? "Mute sound" : "Play sound"}
      className={`sound-toggle-btn ${playing ? "active" : ""}`}
    >
      {/* Rotating border glow ring */}
      <span className="sound-toggle-ring" />

      {/* The bars */}
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
  );
}

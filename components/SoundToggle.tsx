"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A left-aligned sound toggle with animated vertical bars.
 * Bars bounce when music is playing, freeze when muted.
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
      className="sound-toggle"
      style={{
        position: "fixed",
        left: "clamp(16px, 2.4vw, 32px)",
        bottom: "clamp(20px, 3vh, 36px)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        gap: "3px",
        padding: "12px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        opacity: 0.7,
        transition: "opacity 0.3s",
      }}
      onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = "1")}
      onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = "0.7")}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={playing ? "sound-bar playing" : "sound-bar"}
          style={{
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </button>
  );
}

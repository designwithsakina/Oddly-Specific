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
  const [showPrompt, setShowPrompt] = useState(true);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });

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

  useEffect(() => {
    if (!showPrompt) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleGlobalClick = (e: MouseEvent) => {
      setShowPrompt(false);
      
      // If the click was not on the button itself (which has its own toggle),
      // play the audio automatically.
      const isButton = (e.target as HTMLElement).closest('.sound-toggle-btn');
      if (!isButton) {
        const audio = audioRef.current;
        if (audio && !playing) {
          audio.play().catch(() => {});
          setPlaying(true);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleGlobalClick, { capture: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleGlobalClick, { capture: true });
    };
  }, [showPrompt, playing]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    setPlaying(!playing);
    if (showPrompt) setShowPrompt(false);
  };

  return (
    <>
      {/* The global custom cursor prompt */}
      {showPrompt && (
        <div 
          className="fixed pointer-events-none z-[9999] flex flex-col font-sans tracking-[0.2em] text-[0.65rem] uppercase text-white/90"
          style={{
            left: mousePos.x + 16,
            top: mousePos.y + 16,
            textShadow: "0 2px 8px rgba(0,0,0,0.8)"
          }}
        >
          <div className="flex items-center gap-2 leading-[1.4]">
            <span className="w-1.5 h-1.5 bg-white inline-block" />
            <span>Click to</span>
          </div>
          <div className="pl-3.5 leading-[1.4]">
            Enable Audio
          </div>
        </div>
      )}

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
    </>
  );
}

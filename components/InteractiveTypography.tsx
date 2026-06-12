"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";

const CYPHER_CHARS = "!<>-_\\/[]{}=+*^?#";

interface InteractiveTypographyProps {
  text: string;
  className?: string;
}

export default function InteractiveTypography({ text, className = "" }: InteractiveTypographyProps) {
  const [scrambledWords, setScrambledWords] = useState<Record<number, string>>({});
  const isHoveredRef = useRef(false);
  const [isHovered, setIsHovered] = useState(false);
  const activeScrambles = useRef(new Map<number, { original: string; current: string; framesLeft: number }>()).current;
  const containerRef = useRef<HTMLDivElement>(null);

  const words = useMemo(() => text.split(" "), [text]);

  // Clean up if unmounted or hover lost
  useEffect(() => {
    if (!isHovered) {
      activeScrambles.clear();
      setScrambledWords({});
    }
  }, [isHovered, activeScrambles]);

  useEffect(() => {
    let rafId: number;
    let lastTime = 0;

    const animate = (time: number) => {
      rafId = requestAnimationFrame(animate);

      // Throttle to roughly 30ms (33fps)
      if (time - lastTime < 30) return;
      lastTime = time;

      // Pick a new word to scramble aggressively ONLY if hovered
      if (isHoveredRef.current) { 
        // Try to spawn multiple scrambles per frame for a highly active effect
        for (let i = 0; i < 3; i++) {
          if (Math.random() < 0.4) {
            const validIndices = words
              .map((w, idx) => (w.length > 2 && !activeScrambles.has(idx) ? idx : -1))
              .filter((idx) => idx !== -1);

            if (validIndices.length > 0) {
              const targetIndex = validIndices[Math.floor(Math.random() * validIndices.length)];
              activeScrambles.set(targetIndex, {
                original: words[targetIndex],
                current: words[targetIndex],
                framesLeft: Math.floor(Math.random() * 15) + 5, // Scramble lasts 5-20 frames
              });
            }
          }
        }
      }

      // Update active scrambles
      const nextScrambledWords: Record<number, string> = {};
      let stateChanged = false;

      for (const [index, state] of activeScrambles.entries()) {
        state.framesLeft--;

        if (state.framesLeft <= 0) {
          // Finish scramble
          activeScrambles.delete(index);
          stateChanged = true;
        } else {
          // Generate cypher text
          let scrambled = "";
          for (let i = 0; i < state.original.length; i++) {
            if (i === state.original.length - 1 && /[.,;:!?]/.test(state.original[i])) {
              scrambled += state.original[i];
            } else {
              scrambled += CYPHER_CHARS[Math.floor(Math.random() * CYPHER_CHARS.length)];
            }
          }
          state.current = scrambled;
          nextScrambledWords[index] = scrambled;
          stateChanged = true;
        }
      }

      if (stateChanged) {
        setScrambledWords(nextScrambledWords);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafId);
  }, [words, activeScrambles]);

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const isInside = 
        e.clientX >= rect.left && 
        e.clientX <= rect.right && 
        e.clientY >= rect.top && 
        e.clientY <= rect.bottom;

      if (isInside && !isHoveredRef.current) {
        isHoveredRef.current = true;
        setIsHovered(true);
      } else if (!isInside && isHoveredRef.current) {
        isHoveredRef.current = false;
        setIsHovered(false);
      }
    };

    window.addEventListener("mousemove", handleGlobalMove);
    return () => window.removeEventListener("mousemove", handleGlobalMove);
  }, []);

  const renderWords = () => {
    return words.map((word, i) => {
      const isScrambled = scrambledWords[i] !== undefined;
      const displayWord = isScrambled ? scrambledWords[i] : word;
      
      return (
        <React.Fragment key={i}>
          <span className={isScrambled ? "opacity-80" : "transition-opacity duration-300"}>
            {displayWord}
          </span>
          {i < words.length - 1 && " "}
        </React.Fragment>
      );
    });
  };

  return (
    <div 
      ref={containerRef}
      className={`relative z-10 cursor-default ${className}`}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Background Ambient Glow Layer */}
      <p
        className={`absolute inset-0 blur-[4px] mix-blend-screen pointer-events-none select-none transition-opacity duration-500 ${
          isHovered ? "opacity-60 text-cyan-300" : "opacity-0 text-white"
        }`}
        aria-hidden="true"
      >
        {renderWords()}
      </p>

      {/* Foreground Crisp Text Layer */}
      <p 
        className={`relative drop-shadow-sm transition-colors duration-500 ${
          isHovered ? "text-cyan-100" : "text-white/95"
        }`}
      >
        {renderWords()}
      </p>
    </div>
  );
}

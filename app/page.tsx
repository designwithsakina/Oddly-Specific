"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import SmoothScroll from "@/components/SmoothScroll";
import HeroOverlay from "@/components/HeroOverlay";
import SmokeyCursor from "@/components/SmokeyCursor";
import LogoReveal from "@/components/LogoReveal";
import MorphSection from "@/components/MorphSection";
import ProjectsSection from "@/components/ProjectsSection";
import SoundToggle from "@/components/SoundToggle";
import SplashScreen from "@/components/SplashScreen";

// WebGL can't server-render — load the stage on the client only.
const HeroExperience = dynamic(() => import("@/components/HeroExperience"), {
  ssr: false,
});

export default function Page({ isAboutRoute = false, isWorkRoute = false }: { isAboutRoute?: boolean; isWorkRoute?: boolean }) {
  const [showSplash, setShowSplash] = useState(!isAboutRoute && !isWorkRoute);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    // Check if the user was already scrolled past the home/splash section before reload
    const wasScrolled = sessionStorage.getItem("wasScrolled") === "true" || isAboutRoute;
    const wasWorkScrolled = sessionStorage.getItem("wasWorkScrolled") === "true" || isWorkRoute;
    if (wasScrolled || wasWorkScrolled) {
      setShowSplash(false);
      document.documentElement.classList.remove("splash-active");
    }

    const hasWebGL = () => {
      try {
        const canvas = document.createElement("canvas");
        return !!(
          window.WebGLRenderingContext &&
          (canvas.getContext("webgl2") ||
           canvas.getContext("webgl") ||
           (canvas as any).getContext("experimental-webgl"))
        );
      } catch (e) {
        return false;
      }
    };
    setWebglSupported(hasWebGL());

    // Smoothly fade out the body on page refresh/unload to prevent laggy visual layout splits
    const handleBeforeUnload = () => {
      if (document.body) {
        document.body.style.transition = "opacity 0.2s ease-out";
        document.body.style.opacity = "0";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onEnter={() => setShowSplash(false)} />}
      
      <SmoothScroll>
        {/* fixed WebGL stage + typographic overlay */}
        {webglSupported && <HeroExperience />}
        {webglSupported && <SmokeyCursor />}
        <HeroOverlay isAboutRoute={isAboutRoute || isWorkRoute} />
        <ProjectsSection isWorkRoute={isWorkRoute} />
        {!showSplash && <SoundToggle />}

        <main className="relative z-40">
          {/* logo holds centre after the headline fades; section below covers it */}
          <LogoReveal />

          {/* hero descent scroll region — exactly 2.2vh (220vh) so it hits 1.0 at the end */}
          <section style={{ height: "220vh" }} aria-label="Hero" />

          {/* MorphSection remains opacity-0 until scroll.hero hits the flash threshold,
              then it jumps to opacity-1 seamlessly while the flash is solid. */}
          <MorphSection className="relative z-50 min-h-[600vh] bg-transparent" isAboutRoute={isAboutRoute} isWorkRoute={isWorkRoute} />
        </main>
      </SmoothScroll>
    </>
  );
}

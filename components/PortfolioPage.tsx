"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import SmoothScroll from "@/components/SmoothScroll";
import HeroOverlay from "@/components/HeroOverlay";
import SmokeyCursor from "@/components/SmokeyCursor";
import LogoReveal from "@/components/LogoReveal";
import MorphSection from "@/components/MorphSection";
import ProjectsSection from "@/components/ProjectsSection";
import ServicesSection from "@/components/ServicesSection";
import SoundToggle from "@/components/SoundToggle";
import SplashScreen from "@/components/SplashScreen";
import MantaRayCursor from "@/components/MantaRayCursor";

// WebGL can't server-render — load the stage on the client only.
const HeroExperience = dynamic(() => import("@/components/HeroExperience"), {
  ssr: false,
});

export function PortfolioPage({ isAboutRoute = false, isWorkRoute = false, isServicesRoute = false }: { isAboutRoute?: boolean; isWorkRoute?: boolean; isServicesRoute?: boolean }) {
  const [showSplash, setShowSplash] = useState(!isAboutRoute && !isWorkRoute && !isServicesRoute);
  const [webglSupported, setWebglSupported] = useState(true);
  const [video1, setVideo1] = useState<HTMLVideoElement | null>(null);
  const [video2, setVideo2] = useState<HTMLVideoElement | null>(null);

  const [currentSection, setCurrentSection] = useState(() => {
    return isServicesRoute ? "services" : isWorkRoute ? "work" : isAboutRoute ? "about" : "home";
  });

  useEffect(() => {
    // Check if the user was already scrolled past the home/splash section before reload
    const wasScrolled = sessionStorage.getItem("wasScrolled") === "true" || isAboutRoute;
    const wasWorkScrolled = sessionStorage.getItem("wasWorkScrolled") === "true" || isWorkRoute;
    const wasServicesScrolled = sessionStorage.getItem("wasServicesScrolled") === "true" || isServicesRoute;
    if (wasScrolled || wasWorkScrolled || wasServicesScrolled) {
      setShowSplash(false);
      document.documentElement.classList.remove("splash-active");
    }

    // Set correct initial section on client after hydration
    const isServices = window.location.pathname === "/services" || sessionStorage.getItem("wasServicesScrolled") === "true";
    const isWork = window.location.pathname === "/work" || sessionStorage.getItem("wasWorkScrolled") === "true";
    const isAbout = window.location.pathname === "/about" || sessionStorage.getItem("wasScrolled") === "true";
    if (isServices) {
      setCurrentSection("services");
    } else if (isWork) {
      setCurrentSection("work");
    } else if (isAbout) {
      setCurrentSection("about");
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

    const handleSectionChange = (e: Event) => {
      const section = (e as CustomEvent).detail;
      setCurrentSection(section);
    };
    window.addEventListener("section-changed", handleSectionChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("section-changed", handleSectionChange);
    };
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onEnter={() => setShowSplash(false)} />}
      
      <SmoothScroll>
        {/* fixed WebGL stage + typographic overlay */}
        {webglSupported && currentSection !== "services" && <HeroExperience video1={video1} video2={video2} />}
        {webglSupported && currentSection !== "services" && <SmokeyCursor />}
        <HeroOverlay isAboutRoute={isAboutRoute || isWorkRoute || isServicesRoute} />
        <ProjectsSection isWorkRoute={isWorkRoute || isServicesRoute} setVideo1={setVideo1} setVideo2={setVideo2} />
        <ServicesSection isServicesRoute={isServicesRoute} />
        {currentSection === "work" && <MantaRayCursor isWorkRoute={isWorkRoute || isServicesRoute} />}
        {!showSplash && <SoundToggle />}

        <main className="relative z-40">
          {/* logo holds centre after the headline fades; section below covers it */}
          <LogoReveal />

          {/* hero descent scroll region — exactly 2.2vh (220vh) so it hits 1.0 at the end */}
          <section style={{ height: "220vh" }} aria-label="Hero" />

          {/* MorphSection remains opacity-0 until scroll.hero hits the flash threshold,
              then it jumps to opacity-1 seamlessly while the flash is solid. */}
          <MorphSection className="relative z-50 min-h-[2800vh] bg-transparent" isAboutRoute={isAboutRoute} isWorkRoute={isWorkRoute} />
        </main>
      </SmoothScroll>
    </>
  );
}

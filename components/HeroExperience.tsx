"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import CameraRig from "./three/CameraRig";
import Backdrop from "./three/Backdrop";
import Monolith from "./three/Monolith";
import Atmosphere from "./three/Atmosphere";
import WaterfallBackdrop from "./three/WaterfallBackdrop";
import WorkSpiral from "./three/WorkSpiral";
import UnderwaterRipple from "./three/UnderwaterRipple";

interface HeroExperienceProps {
  video1: HTMLVideoElement | null;
  video2: HTMLVideoElement | null;
}

/**
 * Fixed full-viewport WebGL stage for the hero "descent". A tall scroll spacer
 * in the page drives `scroll.hero`, which the rig + monolith read each frame.
 */
export default function HeroExperience({ video1, video2 }: HeroExperienceProps) {
  return (
    <>
      {/* Solid background for Section 1 & 2 */}
      <div className="fixed inset-0 bg-[#0a0916] pointer-events-none" style={{ zIndex: 0 }} />

      {/* 3D Canvas stage (transparent background, overlays on top of video backgrounds) */}
      <div id="webgl-canvas-container" className="fixed inset-0 pointer-events-none" style={{ zIndex: 3, willChange: "filter, transform", transform: "translate3d(0, 0, 0)" }}>
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ fov: 42, near: 0.1, far: 140, position: [0, 2.4, 15] }}
          onCreated={({ gl, scene }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.05;
            scene.fog = new THREE.FogExp2("#0a0916", 0.03);
          }}
        >
          <ambientLight intensity={0.5} color="#5a6bdc" />

          <Suspense fallback={null}>
            <Backdrop />
            <Monolith />
            <Atmosphere />
            <WaterfallBackdrop />
          </Suspense>

          <Suspense fallback={null}>
            <WorkSpiral />
          </Suspense>

          <Suspense fallback={null}>
            <UnderwaterRipple video1={video1} video2={video2} activeThreshold={3.0 / 15.0} />
          </Suspense>

          <CameraRig />
        </Canvas>
      </div>
    </>
  );
}

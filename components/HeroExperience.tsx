"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import CameraRig from "./three/CameraRig";
import Backdrop from "./three/Backdrop";
import Monolith from "./three/Monolith";
import Atmosphere from "./three/Atmosphere";

/**
 * Fixed full-viewport WebGL stage for the hero "descent". A tall scroll spacer
 * in the page drives `scroll.hero`, which the rig + monolith read each frame.
 */
export default function HeroExperience() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ fov: 42, near: 0.1, far: 140, position: [0, 2.4, 15] }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          scene.fog = new THREE.FogExp2("#0a0916", 0.03);
        }}
      >
        <color attach="background" args={["#0a0916"]} />
        <ambientLight intensity={0.5} color="#5a6bdc" />

        <Suspense fallback={null}>
          <Backdrop />
          <Monolith />
          <Atmosphere />
        </Suspense>

        <CameraRig />
      </Canvas>
    </div>
  );
}

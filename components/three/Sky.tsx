"use client";

import * as THREE from "three";
import { useMemo } from "react";

/**
 * Back-side gradient dome — deep indigo zenith → violet midband → a pooled
 * blue-purple glow low and centred (behind the monolith). Reads as an ethereal
 * dusk and gives the scene its "pretty gradient" without any lighting cost.
 */
export default function Sky() {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTop: { value: new THREE.Color("#080616") },
        uMid: { value: new THREE.Color("#1b1545") },
        uHorizon: { value: new THREE.Color("#34246e") },
        uGlowBlue: { value: new THREE.Color("#3a55c0") },
        uGlowViolet: { value: new THREE.Color("#6b3fb0") },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vDir;
        uniform vec3 uTop;
        uniform vec3 uMid;
        uniform vec3 uHorizon;
        uniform vec3 uGlowBlue;
        uniform vec3 uGlowViolet;
        void main() {
          float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
          // three-stop vertical gradient
          vec3 col = mix(uHorizon, uMid, smoothstep(0.32, 0.6, h));
          col = mix(col, uTop, smoothstep(0.6, 0.98, h));

          float low = smoothstep(0.62, 0.05, h);
          // central blue pool behind the monolith
          float centre = smoothstep(0.7, 0.0, length(vDir.xy - vec2(0.0, -0.04)));
          col += uGlowBlue * centre * low * 0.85;
          // violet wash flanking it
          float flank = smoothstep(0.85, 0.1, abs(vDir.x) ) * (1.0 - centre);
          col += uGlowViolet * flank * low * 0.28;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }, []);

  return (
    <mesh scale={90} material={material}>
      <sphereGeometry args={[1, 48, 48]} />
    </mesh>
  );
}

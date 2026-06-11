"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * Slow-drifting cloud/mist layers in front of the (static) backdrop image, so
 * the valley fog reads as alive — wisps sliding sideways like clouds. Soft
 * additive planes at a few depths, each with animated fbm drifting horizontally.
 */
type Layer = {
  pos: [number, number, number];
  size: [number, number];
  color: string;
  intensity: number;
  speed: number;
  seed: number;
};

const LAYERS: Layer[] = [
  { pos: [0, 7, -24], size: [96, 26], color: "#9aa6e8", intensity: 0.16, speed: 0.010, seed: 1.0 },
  { pos: [-4, 5.5, -17], size: [80, 22], color: "#aeb8ee", intensity: 0.14, speed: 0.016, seed: 3.4 },
  { pos: [3, 4.5, -11], size: [66, 18], color: "#c2cbf5", intensity: 0.11, speed: 0.024, seed: 6.1 },
];

function fogMaterial(color: string, seed: number, speed: number, intensity: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uSeed: { value: seed },
      uSpeed: { value: speed },
      uIntensity: { value: intensity },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uSeed;
      uniform float uSpeed;
      uniform float uIntensity;
      uniform vec3 uColor;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p); vec2 f = fract(p);
        vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
                   mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
      }
      float fbm(vec2 p){
        float a = 0.5, s = 0.0;
        for(int i=0;i<5;i++){ s += a*noise(p); p *= 2.0; a *= 0.5; }
        return s;
      }

      void main(){
        // drift sideways like clouds; gentle vertical sway
        vec2 p = vUv * vec2(3.2, 1.7) + vec2(uTime * uSpeed + uSeed, sin(uTime * 0.05 + uSeed) * 0.1);
        float n = fbm(p);
        n = smoothstep(0.38, 0.92, n);
        // soft vertical band, faded at top/bottom edges
        float band = smoothstep(0.0, 0.4, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
        float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
        gl_FragColor = vec4(uColor, n * band * edge * uIntensity);
      }
    `,
  });
}

export default function DriftingFog() {
  const layers = useMemo(
    () =>
      LAYERS.map((l) => ({
        pos: l.pos,
        size: l.size,
        mat: fogMaterial(l.color, l.seed, l.speed, l.intensity),
      })),
    []
  );

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    layers.forEach((l) => (l.mat.uniforms.uTime.value += d * 12));
  });

  return (
    <group>
      {layers.map((l, i) => (
        <mesh key={i} position={l.pos} material={l.mat}>
          <planeGeometry args={l.size} />
        </mesh>
      ))}
    </group>
  );
}

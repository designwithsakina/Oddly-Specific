"use client";

import * as THREE from "three";
import { useMemo } from "react";

/* ---- smooth value-noise fbm → soft, rolling mountain silhouettes ---- */
function hash(n: number) {
  return ((Math.sin(n) * 43758.5453) % 1 + 1) % 1;
}
function vnoise(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}
function fbm(x: number, seed: number) {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  for (let o = 0; o < 4; o++) {
    sum += amp * vnoise(x * freq + seed * 13.1);
    freq *= 2;
    amp *= 0.5;
  }
  return sum / 0.9375; // → ~0..1
}

/** One soft mountain range: a vertical plane with an fbm top edge. */
function makeRidge(width: number, segments: number, amp: number, base: number, seed: number) {
  const geo = new THREE.PlaneGeometry(width, 12, segments, 1);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    if (pos.getY(i) > 0) pos.setY(i, base + amp * fbm(x * 0.11, seed));
    else pos.setY(i, -6);
  }
  return geo;
}

/** Painterly aerial material: noise-broken silhouette with fog pooling at the
 *  foot, a cool rim-light catching each crest, and the whole range melting
 *  toward a pale lavender with distance. */
function ridgeMaterial(ridge: string, haze: string, distant: string) {
  return new THREE.ShaderMaterial({
    fog: false,
    uniforms: {
      uRidge: { value: new THREE.Color(ridge) },
      uHaze: { value: new THREE.Color(haze) },
      uDistant: { value: new THREE.Color(distant) },
      uRim: { value: new THREE.Color("#aab6ff") },
    },
    vertexShader: /* glsl */ `
      varying float vWorldY;
      varying float vWorldX;
      varying float vDepth;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorldY = world.y;
        vWorldX = world.x;
        vec4 mv = viewMatrix * world;
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vWorldY;
      varying float vWorldX;
      varying float vDepth;
      varying vec2 vUv;
      uniform vec3 uRidge;
      uniform vec3 uHaze;
      uniform vec3 uDistant;
      uniform vec3 uRim;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p); vec2 f = fract(p);
        vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
                   mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
      }

      void main() {
        // fog pooled at the foot of the range, fading up into the silhouette
        float mist = 1.0 - smoothstep(-0.5, 4.5, vWorldY);
        vec3 col = mix(uRidge, uHaze, mist * 0.82);

        // painterly value variation so the ranges aren't flat fills
        float n = noise(vec2(vWorldX * 0.32, vWorldY * 0.34)) * 0.6
                + noise(vec2(vWorldX * 0.95, vWorldY * 0.8)) * 0.4;
        col *= 0.86 + 0.26 * n;

        // cool light catching the crest line
        float crest = smoothstep(0.8, 1.0, vUv.y);
        col += uRim * crest * 0.45;

        // distance haze — far ranges dissolve into pale lavender mist
        col = mix(col, uDistant, smoothstep(8.0, 44.0, vDepth));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

type Layer = {
  z: number;
  width: number;
  amp: number;
  base: number;
  seed: number;
  ridge: string;
};

// far → near. Distant ranges are paler (aerial perspective); the shared haze +
// distant tint give the misty, stacked look of the reference.
const LAYERS: Layer[] = [
  { z: -42, width: 120, amp: 5.0, base: 3.2, seed: 2.1, ridge: "#3b3a74" },
  { z: -34, width: 104, amp: 5.6, base: 2.6, seed: 5.7, ridge: "#332f64" },
  { z: -27, width: 92, amp: 6.2, base: 2.0, seed: 9.3, ridge: "#2b2856" },
  { z: -20, width: 80, amp: 6.6, base: 1.4, seed: 3.8, ridge: "#231f48" },
  { z: -14, width: 70, amp: 7.0, base: 0.8, seed: 7.2, ridge: "#1a1738" },
  { z: -9, width: 62, amp: 7.4, base: 0.2, seed: 1.4, ridge: "#120f2a" },
  { z: -5, width: 56, amp: 7.8, base: -0.4, seed: 6.6, ridge: "#0b0820" },
];

const HAZE = "#6f7ad6"; // luminous fog between ranges
const DISTANT = "#9aa0e2"; // pale lavender the far ranges melt into

export default function Terrain() {
  const ridges = useMemo(
    () =>
      LAYERS.map((l) => ({
        z: l.z,
        geo: makeRidge(l.width, 180, l.amp, l.base, l.seed),
        mat: ridgeMaterial(l.ridge, HAZE, DISTANT),
      })),
    []
  );

  return (
    <group>
      {ridges.map((l, i) => (
        <mesh key={i} geometry={l.geo} material={l.mat} position={[0, 0, l.z]} />
      ))}

      {/* dark valley floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -8]}>
        <planeGeometry args={[160, 100]} />
        <meshBasicMaterial color="#08071a" fog toneMapped={false} />
      </mesh>
    </group>
  );
}

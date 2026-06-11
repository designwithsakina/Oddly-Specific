"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * Soft, drifting banks of fog nestled at the foot of each mountain range. These
 * are what give the valley its layered, painterly, ethereal depth — the ranges
 * read as receding through mist rather than as stacked cut-outs.
 */
type Bank = {
  pos: [number, number, number];
  size: [number, number];
  color: string;
  intensity: number;
  seed: number;
  drift: number;
};

const BANKS: Bank[] = [
  { pos: [-2, 1.4, -36], size: [90, 12], color: "#8b93e6", intensity: 0.5, seed: 1.0, drift: 0.012 },
  { pos: [3, 1.1, -28], size: [78, 11], color: "#7a86df", intensity: 0.5, seed: 2.3, drift: 0.016 },
  { pos: [-4, 0.9, -21], size: [66, 10], color: "#6f7ad6", intensity: 0.48, seed: 3.7, drift: 0.02 },
  { pos: [2, 0.7, -14], size: [56, 8], color: "#6473cf", intensity: 0.42, seed: 5.1, drift: 0.026 },
  { pos: [-3, 0.6, -8], size: [48, 7], color: "#5566c4", intensity: 0.36, seed: 6.6, drift: 0.032 },
];

function bankMaterial(color: string, seed: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uSeed: { value: seed },
      uIntensity: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uSeed;
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
        for(int i=0;i<4;i++){ s += a*noise(p); p *= 2.0; a *= 0.5; }
        return s;
      }

      void main(){
        // elliptical soft falloff — wide and low, hugging the valley floor
        vec2 c = vUv - 0.5;
        float r = length(c * vec2(1.0, 2.4));
        float soft = smoothstep(0.5, 0.0, r);

        // rolling fbm so the bank breathes and has texture
        float n = fbm(vUv * vec2(5.0, 2.0) + vec2(uTime + uSeed, uSeed * 0.5));
        n = n * 0.7 + 0.3;

        float alpha = soft * n * uIntensity;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  });
}

export default function FogBanks() {
  const mats = useRef<THREE.ShaderMaterial[]>([]);

  const banks = useMemo(
    () =>
      BANKS.map((b) => {
        const mat = bankMaterial(b.color, b.seed);
        mat.uniforms.uIntensity.value = b.intensity;
        return { ...b, mat };
      }),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    banks.forEach((b) => (b.mat.uniforms.uTime.value = t * b.drift * 12));
  });

  return (
    <group>
      {banks.map((b, i) => (
        <mesh key={i} position={b.pos} material={b.mat}>
          <planeGeometry args={b.size} />
        </mesh>
      ))}
    </group>
  );
}

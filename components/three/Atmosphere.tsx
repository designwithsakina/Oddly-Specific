"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { scroll, smoothstep } from "@/lib/state";

/**
 * Ambient life: a field of slow-rising motes (soft additive points) plus two
 * broad bands of low ground mist. Keeps the scene breathing even when idle.
 */
export default function Atmosphere() {
  const points = useRef<THREE.Points>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);

  const COUNT = 520;
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);
    const size = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 44;
      pos[i * 3 + 1] = Math.random() * 14;
      pos[i * 3 + 2] = -34 + Math.random() * 40;
      seed[i] = Math.random() * 100;
      size[i] = 3 + Math.random() * 14;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uAlpha: { value: 1.0 },
          uColor: { value: new THREE.Color("#aec8ff") },
          uPixelRatio: { value: 1 },
        },
        vertexShader: /* glsl */ `
          attribute float aSeed;
          attribute float aSize;
          uniform float uTime;
          uniform float uPixelRatio;
          varying float vAlpha;
          void main() {
            vec3 p = position;
            p.y += mod(uTime * 0.25 + aSeed, 14.0) - position.y * 0.0; // drift up
            p.y = mod(p.y, 14.0);
            p.x += sin(uTime * 0.3 + aSeed) * 0.6;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = aSize * uPixelRatio * (12.0 / -mv.z);
            // fade in low, out high; fade with distance
            vAlpha = smoothstep(0.0, 2.0, p.y) * smoothstep(14.0, 8.0, p.y);
            vAlpha *= smoothstep(60.0, 12.0, -mv.z);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uAlpha;
          varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d);
            gl_FragColor = vec4(uColor, a * vAlpha * 0.34 * uAlpha);
          }
        `,
      }),
    []
  );

  const mistMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
        uniforms: { uTime: { value: 0 }, uAlpha: { value: 1.0 }, uColor: { value: new THREE.Color("#2b2f66") } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
        `,
        fragmentShader: /* glsl */ `
          varying vec2 vUv; uniform float uTime; uniform float uAlpha; uniform vec3 uColor;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
          float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*(3.0-2.0*f);
            return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
          void main(){
            float n = noise(vUv * vec2(6.0, 2.0) + vec2(uTime * 0.05, 0.0));
            n += noise(vUv * vec2(12.0, 4.0) - vec2(uTime * 0.08, 0.0)) * 0.5;
            float band = smoothstep(0.0, 0.4, vUv.y) * smoothstep(1.0, 0.5, vUv.y);
            float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
            gl_FragColor = vec4(uColor, n * band * edge * 0.28 * uAlpha);
          }
        `,
      }),
    []
  );

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const morphFadeOut = 1.0 - smoothstep(0.8, 1.0, scroll.hero);
    if (mat.current) {
      mat.current.uniforms.uTime.value = t;
      mat.current.uniforms.uAlpha.value = morphFadeOut;
      mat.current.uniforms.uPixelRatio.value = Math.min(state.gl.getPixelRatio(), 2);
    }
    mistMat.uniforms.uTime.value = t;
    mistMat.uniforms.uAlpha.value = morphFadeOut;

    if (groupRef.current) {
      groupRef.current.visible = scroll.hero <= 0.99;
    }
  });

  return (
    <group ref={groupRef}>
      <points ref={points} geometry={geometry}>
        <primitive object={material} ref={mat} attach="material" />
      </points>

      {/* low rolling mist bands */}
      <mesh position={[0, 0.8, -10]} material={mistMat}>
        <planeGeometry args={[70, 9]} />
      </mesh>
      <mesh position={[0, 0.3, -3]} material={mistMat}>
        <planeGeometry args={[60, 6]} />
      </mesh>
    </group>
  );
}

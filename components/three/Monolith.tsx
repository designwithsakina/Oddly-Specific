"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { scroll, lerp, smoothstep } from "@/lib/state";

/**
 * The hero object: a faceted crystalline shard floating at the head of the
 * river. It grows and quickens as `scroll.hero` rises — the feeling of
 * travelling toward it and falling in. A fresnel rim keeps it ethereal rather
 * than solid/techy, and a halo + core light bleed it into the surrounding mist.
 */
export default function Monolith() {
  const group = useRef<THREE.Group>(null);
  const shard = useRef<THREE.Mesh>(null);
  const fresnel = useRef<THREE.ShaderMaterial>(null);
  const light = useRef<THREE.PointLight>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 0).toNonIndexed();
    geo.scale(0.82, 1.35, 0.82);
    geo.computeVertexNormals(); // non-indexed → crisp flat facets
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        fog: true,
        uniforms: {
          uTime: { value: 0 },
          uCore: { value: new THREE.Color("#1a1746") },
          uRim: { value: new THREE.Color("#79e3ff") },
          uHot: { value: new THREE.Color("#b69bff") },
          ...THREE.UniformsLib.fog,
        },
        vertexShader: /* glsl */ `
          #include <fog_pars_vertex>
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vView = normalize(-mvPosition.xyz);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }
        `,
        fragmentShader: /* glsl */ `
          #include <fog_pars_fragment>
          varying vec3 vNormal;
          varying vec3 vView;
          uniform float uTime;
          uniform vec3 uCore;
          uniform vec3 uRim;
          uniform vec3 uHot;
          void main() {
            float f = 1.0 - max(dot(vNormal, vView), 0.0);
            float rim = pow(f, 2.0);
            float pulse = 0.5 + 0.5 * sin(uTime * 1.2);
            vec3 col = mix(uCore, uRim, rim);
            col += uHot * pow(f, 5.0) * (0.6 + 0.4 * pulse);
            float alpha = 0.34 + rim * 0.66;
            gl_FragColor = vec4(col, alpha);
            #include <fog_fragment>
          }
        `,
      }),
    []
  );

  const halo = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
        uniforms: { uColor: { value: new THREE.Color("#5b7bff") } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
        `,
        fragmentShader: /* glsl */ `
          varying vec2 vUv; uniform vec3 uColor;
          void main(){
            float d = length(vUv - 0.5) * 2.0;
            float a = smoothstep(1.0, 0.0, d);
            gl_FragColor = vec4(uColor, pow(a, 2.0) * 0.5);
          }
        `,
      }),
    []
  );

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const p = smoothstep(0, 1, scroll.hero);

    if (fresnel.current) fresnel.current.uniforms.uTime.value = t;

    if (group.current) {
      const s = lerp(0.7, 2.45, p);
      group.current.scale.setScalar(s);
      // gentle idle float + faster spin as you approach
      group.current.position.y = 1.45 + Math.sin(t * 0.6) * 0.06;
      group.current.rotation.y = t * (0.12 + p * 0.25);
      group.current.rotation.z = Math.sin(t * 0.3) * 0.05;
    }
    if (light.current) light.current.intensity = lerp(6, 16, p);
  });

  return (
    <group ref={group} position={[0, 1.45, 0]}>
      <mesh ref={shard} geometry={geometry}>
        <primitive object={material} ref={fresnel} attach="material" />
      </mesh>

      {/* billboard-ish halo behind the shard */}
      <mesh position={[0, 0, -0.6]} scale={[4.2, 4.6, 1]} material={halo}>
        <planeGeometry args={[1, 1]} />
      </mesh>

      <pointLight ref={light} color="#7fb4ff" intensity={6} distance={18} decay={2} />
    </group>
  );
}

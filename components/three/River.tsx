"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * A glowing ribbon of light lying on the valley floor, winding from the
 * foreground toward the monolith. This is the site's connective thread — in a
 * later phase it lifts off the ground and coils into the project spiral, so it
 * is built as a flat additive strip whose centre line is the "thread".
 */
export default function River() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    // long strip running along -z, lying flat; gentle S-curve baked into x
    const geo = new THREE.PlaneGeometry(3.4, 46, 24, 220);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i); // -23..23 along the river length
      const t = (y + 23) / 46;
      const sway = Math.sin(t * 6.0) * 1.6 + Math.sin(t * 2.3) * 1.1;
      // taper toward the monolith (far end) so it reads as receding
      const taper = 0.45 + 0.55 * t;
      pos.setX(i, pos.getX(i) * taper + sway);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
        uniforms: {
          uTime: { value: 0 },
          uCore: { value: new THREE.Color("#bfe9ff") },
          uEdge: { value: new THREE.Color("#2f6bff") },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec2 vUv;
          uniform float uTime;
          uniform vec3 uCore;
          uniform vec3 uEdge;

          float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
          float noise(vec2 p){
            vec2 i = floor(p); vec2 f = fract(p);
            vec2 u = f*f*(3.0-2.0*f);
            return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
                       mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
          }

          void main() {
            // bright down the centre line, soft at the banks
            float d = abs(vUv.x - 0.5) * 2.0;
            float core = smoothstep(1.0, 0.0, d);
            float glow = pow(core, 2.2);

            // flowing caustic shimmer travelling toward the monolith
            float flow = noise(vec2(vUv.x * 4.0, vUv.y * 10.0 - uTime * 0.6));
            flow += noise(vec2(vUv.x * 8.0, vUv.y * 22.0 - uTime * 1.1)) * 0.5;

            // fade the very near + very far ends so it dissolves into mist
            float ends = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.86, vUv.y);

            vec3 col = mix(uEdge, uCore, glow);
            float alpha = core * (0.35 + 0.65 * flow) * ends;
            gl_FragColor = vec4(col, alpha);
          }
        `,
      }),
    []
  );

  useFrame((_, dt) => {
    if (matRef.current) matRef.current.uniforms.uTime.value += dt;
  });

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.02, -4]}
    >
      <primitive object={material} ref={matRef} attach="material" />
    </mesh>
  );
}

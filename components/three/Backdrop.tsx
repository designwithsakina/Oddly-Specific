"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { scroll, smoothstep } from "@/lib/state";

/**
 * The valley backdrop — an AI-animated clip of mountains rendered on a large plane.
 * Uses dual video elements for a seamless GPU crossfade loop, 
 * but auto-pauses when out of view to save performance.
 */
export default function Backdrop() {
  const gl = useThree((s) => s.gl);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const activeRef = useRef<"A" | "B">("A");

  // Create two HTML video elements for crossfading
  const [videos] = useState(() => {
    if (typeof window === "undefined") return { videoA: null, videoB: null };
    const createVid = () => {
      const v = document.createElement("video");
      v.src = "/hero-video.mp4";
      v.loop = false; // We control the loop programmatically
      v.muted = true;
      v.playsInline = true;
      v.setAttribute("crossorigin", "anonymous");
      v.setAttribute("preload", "auto");
      return v;
    };
    return { videoA: createVid(), videoB: createVid() };
  });

  // Create two VideoTexture instances
  const textures = useMemo(() => {
    if (!videos.videoA || !videos.videoB) return null;
    const texA = new THREE.VideoTexture(videos.videoA);
    const texB = new THREE.VideoTexture(videos.videoB);
    texA.colorSpace = THREE.SRGBColorSpace;
    texB.colorSpace = THREE.SRGBColorSpace;
    return { texA, texB };
  }, [videos]);

  // Configure texture parameters
  useEffect(() => {
    if (textures) {
      const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
      [textures.texA, textures.texB].forEach((tex) => {
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.anisotropy = maxAnisotropy;
      });
    }
  }, [textures, gl]);

  // Start the first video on mount
  useEffect(() => {
    if (videos.videoA) {
      videos.videoA.play().catch((e) => console.log("Failed to play videoA:", e));
    }
    return () => {
      videos.videoA?.pause();
      videos.videoB?.pause();
    };
  }, [videos]);

  // Dynamic crossfade logic in the frame loop
  useFrame(() => {
    if (!videos.videoA || !videos.videoB || !textures) return;

    const vidA = videos.videoA;
    const vidB = videos.videoB;

    // Optimization: Pause the hero videos completely when invisible
    if (scroll.hero >= 0.99) {
      if (!vidA.paused) vidA.pause();
      if (!vidB.paused) vidB.pause();
      if (materialRef.current) {
        materialRef.current.uniforms.uOpacity.value = 0;
      }
      return;
    }

    if (isNaN(vidA.duration) || isNaN(vidB.duration) || vidA.duration === 0) return;

    const duration = vidA.duration;
    const crossfade = 1.0; // Duration of the crossfade in seconds
    const threshold = duration - crossfade;

    let mixVal = 0;

    if (activeRef.current === "A") {
      const t = vidA.currentTime;
      if (t >= threshold) {
        // Start video B if it's paused
        if (vidB.paused) {
          vidB.currentTime = 0;
          vidB.play().catch((e) => console.log("Failed to start videoB:", e));
        }
        // Fade A out and B in
        mixVal = (t - threshold) / crossfade;

        // Switch active role when A completes
        if (t >= duration - 0.05) {
          vidA.pause();
          vidA.currentTime = 0;
          activeRef.current = "B";
          mixVal = 1;
        }
      } else {
        // Guarantee B is reset and paused
        if (!vidB.paused) {
          vidB.pause();
          vidB.currentTime = 0;
        }
        mixVal = 0;
      }
    } else {
      const t = vidB.currentTime;
      if (t >= threshold) {
        // Start video A if it's paused
        if (vidA.paused) {
          vidA.currentTime = 0;
          vidA.play().catch((e) => console.log("Failed to start videoA:", e));
        }
        // Fade B out and A in
        mixVal = 1.0 - (t - threshold) / crossfade;

        // Switch active role when B completes
        if (t >= duration - 0.05) {
          vidB.pause();
          vidB.currentTime = 0;
          activeRef.current = "A";
          mixVal = 0;
        }
      } else {
        // Guarantee A is reset and paused
        if (!vidA.paused) {
          vidA.pause();
          vidA.currentTime = 0;
        }
        mixVal = 1;
      }
    }

    // Force frame update
    textures.texA.needsUpdate = true;
    textures.texB.needsUpdate = true;

    if (materialRef.current) {
      const morphProgress = smoothstep(0.8, 1.0, scroll.hero);
      
      materialRef.current.uniforms.uMix.value = THREE.MathUtils.clamp(mixVal, 0, 1);
      // Fade out seamlessly as the Waterfall fades in
      materialRef.current.uniforms.uOpacity.value = 0.6 * (1.0 - morphProgress);
      materialRef.current.uniforms.uBlurZoom.value = morphProgress;
    }
  });

  // Shader to blend the two video textures
  const shaderMaterial = useMemo(() => {
    if (!textures) return null;
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexA: { value: textures.texA },
        uTexB: { value: textures.texB },
        uMix: { value: 0.0 },
        uOpacity: { value: 0.6 },
        uBlurZoom: { value: 0.0 }, // 0.0 to 1.0 driving the radial blur during morph
      },
      transparent: true,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexA;
        uniform sampler2D uTexB;
        uniform float uMix;
        uniform float uOpacity;
        uniform float uBlurZoom;
        varying vec2 vUv;

        // Radial blur function for the hyperspeed woosh effect
        vec4 radialBlur(sampler2D tex, vec2 uv, float amount) {
            vec2 center = vec2(0.5, 0.5);
            vec2 dir = uv - center;
            vec4 color = vec4(0.0);
            float total = 0.0;
            const int samples = 12;
            
            for (int i = 0; i < samples; i++) {
                float scale = 1.0 - (float(i) * amount * 0.05);
                vec2 sampleUv = center + dir * scale;
                color += texture2D(tex, sampleUv);
                total += 1.0;
            }
            return color / total;
        }

        void main() {
            vec4 colA = radialBlur(uTexA, vUv, uBlurZoom);
            vec4 colB = radialBlur(uTexB, vUv, uBlurZoom);
            vec4 col = mix(colA, colB, uMix);
            
            // dark deep blue overlay at ~10% opacity
            vec3 tint = vec3(0.016, 0.016, 0.07); // #040412
            col.rgb = mix(col.rgb, tint, 0.10);
            col.a *= uOpacity;
            
            gl_FragColor = col;
        }
      `,
      fog: false,
      toneMapped: false,
      depthWrite: false,
    });
  }, [textures]);

  if (!shaderMaterial) return null;

  return (
    <mesh position={[0, 5.5, -30]} renderOrder={-10}>
      <planeGeometry args={[112, 64]} />
      <primitive object={shaderMaterial} ref={materialRef} attach="material" />
    </mesh>
  );
}

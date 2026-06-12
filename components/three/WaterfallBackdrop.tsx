import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { scroll, smoothstep } from "@/lib/state";

export default function WaterfallBackdrop() {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const viewport = useThree((s) => s.viewport);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const activeRef = useRef<"A" | "B">("A");

  // Calculate scale so the width exactly matches the viewport width
  const { width, height } = viewport.getCurrentViewport(camera, new THREE.Vector3(0, 0, -35));
  // We make it slightly wider than the screen (e.g. 1.05x) so when we pan, we don't see black edges.
  const scaleMultiplier = (width * 1.05) / 16;
  const finalWidth = 16 * scaleMultiplier;
  const finalHeight = 9 * scaleMultiplier;

  // Create two HTML video elements for crossfading
  const [videos] = useState(() => {
    if (typeof window === "undefined") return { videoA: null, videoB: null };
    const createVid = () => {
      const v = document.createElement("video");
      v.src = "/waterfall.mp4";
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
  useFrame((state) => {
    if (!videos.videoA || !videos.videoB || !textures) return;

    const vidA = videos.videoA;
    const vidB = videos.videoB;

    // Optimization: Pause the waterfall videos completely when invisible at the top
    if (scroll.hero < 0.01) {
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
      if (vidA.paused) vidA.play().catch(() => {});
      
      const t = vidA.currentTime;
      if (t >= threshold) {
        if (vidB.paused) {
          vidB.currentTime = 0;
          vidB.play().catch((e) => console.log("Failed to start videoB:", e));
        }
        mixVal = (t - threshold) / crossfade;
        if (t >= duration - 0.05) {
          vidA.pause();
          vidA.currentTime = 0;
          activeRef.current = "B";
          mixVal = 1;
        }
      } else {
        if (!vidB.paused) {
          vidB.pause();
          vidB.currentTime = 0;
        }
        mixVal = 0;
      }
    } else {
      if (vidB.paused) vidB.play().catch(() => {});

      const t = vidB.currentTime;
      if (t >= threshold) {
        if (vidA.paused) {
          vidA.currentTime = 0;
          vidA.play().catch((e) => console.log("Failed to start videoA:", e));
        }
        mixVal = 1.0 - (t - threshold) / crossfade;
        if (t >= duration - 0.05) {
          vidB.pause();
          vidB.currentTime = 0;
          activeRef.current = "A";
          mixVal = 0;
        }
      } else {
        if (!vidA.paused) {
          vidA.pause();
          vidA.currentTime = 0;
        }
        mixVal = 1;
      }
    }

    textures.texA.needsUpdate = true;
    textures.texB.needsUpdate = true;

    if (materialRef.current) {
      materialRef.current.uniforms.uMix.value = THREE.MathUtils.clamp(mixVal, 0, 1);
      // Fade in seamlessly at the end of the Hero scroll
      materialRef.current.uniforms.uOpacity.value = smoothstep(0.8, 1.0, scroll.hero);
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
        uOpacity: { value: 0.0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTexA;
        uniform sampler2D uTexB;
        uniform float uMix;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          vec4 colA = texture2D(uTexA, vUv);
          vec4 colB = texture2D(uTexB, vUv);
          vec4 video = mix(colA, colB, uMix);
          
          // Dark deep blue overlay at ~10% opacity
          vec3 tint = vec3(0.016, 0.016, 0.07); // #040412
          video.rgb = mix(video.rgb, tint, 0.10);
          
          gl_FragColor = vec4(video.rgb, uOpacity);
        }
      `,
      transparent: true,
      fog: false,
      toneMapped: false,
      depthWrite: false,
    });
  }, [textures]);

  if (!shaderMaterial) return null;

  useFrame((state) => {
    if (!materialRef.current || !activeRef.current) return;
    
    // Dynamically calculate the perfect scale for the current camera position
    const distance = Math.abs(-35 - state.camera.position.z);
    const viewHeight = 2 * Math.tan((state.camera.fov * Math.PI) / 360) * distance;
    const viewWidth = viewHeight * state.camera.aspect;
    
    // We use Math.max to ensure it covers the screen (no side gaps)
    const scaleMultiplier = Math.max(viewWidth / 16, viewHeight / 9);
    // Add 5% padding to the width to hide edges during pan/tilt
    const finalWidth = 16 * scaleMultiplier * 1.05; 
    const finalHeight = 9 * scaleMultiplier * 1.05;

    // Align the bottom of the video to the bottom of the camera view
    const baseYPos = state.camera.position.y + (finalHeight - viewHeight) / 2;

    // Pan / Tilt effect based on mouse movement
    const targetX = state.pointer.x * (viewWidth * 0.05); // Move horizontally by 5% of screen width
    const targetY = state.pointer.y * (viewHeight * 0.05); // Move vertically by 5% of screen height

    if (meshRef.current) {
      meshRef.current.scale.set(finalWidth, finalHeight, 1);
      meshRef.current.position.x += (targetX - meshRef.current.position.x) * 0.05;
      meshRef.current.position.y += ((baseYPos + targetY) - meshRef.current.position.y) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -35]}>
      <planeGeometry args={[1, 1]} />
      <primitive object={shaderMaterial} ref={materialRef} attach="material" />
    </mesh>
  );
}

"use client";

/**
 * UnderwaterRipple
 * ----------------
 * Section-3 water-surface ripple (intensity 3 / fineness 6 / viscosity 5,
 * approved tuning), mounted as a sibling of <WaterfallBackdrop /> and
 * <WorkSpiral /> inside the existing single <Canvas>. No new WebGL context,
 * no postprocessing dependency (gl.setRenderTarget(null) is safe).
 *
 * ── Dual-video crossfade ────────────────────────────────────────────────
 * #projects-section-bg renders two <video> elements (vRef1/vRef2) crossfaded
 * via CSS opacity for a seamless loop. This component samples BOTH video
 * elements as textures and blends them in-shader using the same opacity
 * values, so the refracted output always matches whichever video is
 * currently visible — no jump at the crossfade point.
 *
 * ── Lifecycle ────────────────────────────────────────────────────────────
 * - Gated by scroll.section3: zero sim work and the display quad is fully
 *   transparent (uOpacity = 0) outside Section 3.
 * - All three THREE.WebGLRenderTarget instances (via useFBO) and all
 *   ShaderMaterial/Geometry instances are explicitly disposed in useEffect
 *   cleanups on unmount, per the SmokeyCursor convention.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import * as THREE from "three";
import { scroll, pointer, clamp01 } from "@/lib/state";

const INTENSITY = 3;
const FINENESS = 6;
const VISCOSITY = 5;

const propVert = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`;

const propFrag = `
precision highp float; varying vec2 vUv; uniform sampler2D uCurr; uniform sampler2D uPrev;
uniform vec2 uTexel; uniform float uDamping;
void main(){
  float p=texture2D(uPrev,vUv).r;
  float l=texture2D(uCurr,vUv-vec2(uTexel.x,0.0)).r; float r=texture2D(uCurr,vUv+vec2(uTexel.x,0.0)).r;
  float t=texture2D(uCurr,vUv+vec2(0.0,uTexel.y)).r; float b=texture2D(uCurr,vUv-vec2(0.0,uTexel.y)).r;
  float next=((l+r+t+b)*0.5 - p)*uDamping;
  gl_FragColor=vec4(next,0.0,0.0,1.0);
}`;

const dropFrag = `
precision highp float; varying vec2 vUv; uniform sampler2D uCurr;
uniform vec2 uA; uniform vec2 uB; uniform float uRadius; uniform float uStrength; uniform float uAspect;
float segDist(vec2 p, vec2 a, vec2 b){ vec2 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/max(dot(ba,ba),1e-6),0.0,1.0); return length(pa-ba*h); }
void main(){
  float h=texture2D(uCurr,vUv).r;
  vec2 p=vUv, a=uA, b=uB; p.x*=uAspect; a.x*=uAspect; b.x*=uAspect;
  float d=segDist(p,a,b);
  float add=exp(-(d*d)/(uRadius*uRadius));
  gl_FragColor=vec4(h + add*uStrength, 0.0,0.0,1.0);
}`;

// Composite: blends the two crossfading video textures by their live opacity,
// refracts the result by the height-field gradient, outputs with Section-3 fade.
const displayVert = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;

const displayFrag = `
precision highp float; varying vec2 vUv;
uniform sampler2D uHeight;
uniform sampler2D uVideo1; uniform sampler2D uVideo2;
uniform float uVideo1Opacity; uniform float uVideo2Opacity;
uniform vec2 uTexel;
uniform float uAspectCanvas; uniform float uAspectVideo; uniform float uRefract; uniform float uOpacity;
void main(){
  float hl=texture2D(uHeight,vUv-vec2(uTexel.x,0.0)).r; float hr=texture2D(uHeight,vUv+vec2(uTexel.x,0.0)).r;
  float ht=texture2D(uHeight,vUv+vec2(0.0,uTexel.y)).r; float hb=texture2D(uHeight,vUv-vec2(0.0,uTexel.y)).r;
  vec2 grad=vec2(hr-hl, ht-hb);
  vec2 uv=vUv; float ar=uAspectCanvas/uAspectVideo;
  if(ar>1.0){ uv.y=(uv.y-0.5)/ar+0.5; } else { uv.x=(uv.x-0.5)*ar+0.5; }
  vec2 refr=uv-grad*uRefract;
  vec3 c1=texture2D(uVideo1,refr).rgb;
  vec3 c2=texture2D(uVideo2,refr).rgb;
  float total = max(uVideo1Opacity + uVideo2Opacity, 0.0001);
  vec3 col = (c1*uVideo1Opacity + c2*uVideo2Opacity) / total;
  vec3 tintCol = vec3(0.015686, 0.015686, 0.070588);
  col = mix(col, tintCol, 0.20);
  float spec=clamp(dot(normalize(vec3(grad,0.04)),normalize(vec3(0.4,0.6,1.0))),0.0,1.0);
  col+=pow(spec,3.0)*0.14;
  gl_FragColor=vec4(col, uOpacity);
}`;

type Props = {
  video1: HTMLVideoElement | null;
  video2: HTMLVideoElement | null;
  activeThreshold?: number;
};

export default function UnderwaterRipple({ video1, video2, activeThreshold = 0.001 }: Props) {
  const { gl, camera, size } = useThree();
  const meshRef = useRef<THREE.Mesh>(null!);

  const isMobile = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 768px), (pointer: coarse)").matches,
    []
  );
  const REDUCED = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
  const SIM = isMobile ? 256 : 512;

  const videoTex1Ref = useRef<THREE.VideoTexture | null>(null);
  const videoTex2Ref = useRef<THREE.VideoTexture | null>(null);

  useEffect(() => {
    const tex1 = video1 ? new THREE.VideoTexture(video1) : null;
    const tex2 = video2 ? new THREE.VideoTexture(video2) : null;
    [tex1, tex2].forEach((t) => {
      if (!t) return;
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
    });
    videoTex1Ref.current = tex1;
    videoTex2Ref.current = tex2;
    return () => {
      tex1?.dispose();
      tex2?.dispose();
      videoTex1Ref.current = null;
      videoTex2Ref.current = null;
    };
  }, [video1, video2]);

  const fboOpts = useMemo(
    () => ({
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    }),
    []
  );
  const rtA = useFBO(SIM, SIM, fboOpts);
  const rtB = useFBO(SIM, SIM, fboOpts);
  const rtPrev = useFBO(SIM, SIM, fboOpts);
  const ringRef = useRef({ a: rtA, b: rtB, prev: rtPrev });

  useEffect(() => {
    return () => {
      ringRef.current.a.dispose();
      ringRef.current.b.dispose();
      ringRef.current.prev.dispose();
    };
  }, []);

  const simCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
  const quadGeo = useMemo(() => new THREE.PlaneGeometry(2, 2), []);

  const propMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uCurr: { value: null },
          uPrev: { value: null },
          uTexel: { value: new THREE.Vector2(1 / SIM, 1 / SIM) },
          uDamping: { value: 0.991 },
        },
        vertexShader: propVert,
        fragmentShader: propFrag,
        depthTest: false,
      }),
    [SIM]
  );
  const dropMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uCurr: { value: null },
          uA: { value: new THREE.Vector2(-1, -1) },
          uB: { value: new THREE.Vector2(-1, -1) },
          uRadius: { value: 0.016 },
          uStrength: { value: 0.05 },
          uAspect: { value: 1 },
        },
        vertexShader: propVert,
        fragmentShader: dropFrag,
        depthTest: false,
      }),
    []
  );
  const propScene = useMemo(() => {
    const s = new THREE.Scene();
    s.add(new THREE.Mesh(quadGeo, propMat));
    return s;
  }, [quadGeo, propMat]);
  const dropScene = useMemo(() => {
    const s = new THREE.Scene();
    s.add(new THREE.Mesh(quadGeo, dropMat));
    return s;
  }, [quadGeo, dropMat]);

  useEffect(() => {
    return () => {
      propMat.dispose();
      dropMat.dispose();
      quadGeo.dispose();
    };
  }, [propMat, dropMat, quadGeo]);

  const displayMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uHeight: { value: null },
          uVideo1: { value: null },
          uVideo2: { value: null },
          uVideo1Opacity: { value: 1 },
          uVideo2Opacity: { value: 0 },
          uTexel: { value: new THREE.Vector2(1 / SIM, 1 / SIM) },
          uAspectCanvas: { value: size.width / size.height },
          uAspectVideo: { value: 16 / 9 },
          uRefract: { value: 0.03 },
          uOpacity: { value: 0 },
        },
        vertexShader: displayVert,
        fragmentShader: displayFrag,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      }),
    [SIM, size.width, size.height]
  );

  useEffect(() => {
    return () => {
      displayMat.dispose();
    };
  }, [displayMat]);

  const pointerRef = useRef({ x: -1, y: -1, lastX: 0, lastY: 0, hasLast: false, moved: false });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const p = pointerRef.current;
      p.x = e.clientX / window.innerWidth;
      p.y = 1 - e.clientY / window.innerHeight;
      p.moved = true;
    };
    const onLeave = () => { pointerRef.current.hasLast = false; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // Priority 0: Billboard position + opacity (runs with normal useFrame, no GL state changes)
  useFrame((state) => {
    if (!meshRef.current) return;
    const cam = state.camera as THREE.PerspectiveCamera;
    const dist = 0.5;
    const vFov = (cam.fov * Math.PI) / 180;
    const height = 2 * Math.tan(vFov / 2) * dist;
    const width = height * cam.aspect;

    // Read scroll progress & calculate values matching ProjectsSection.tsx exactly
    const progress = scroll.section3;
    const plungeProgress = clamp01(progress / (2.0 / 17.0));
    const yWhipPx = (1.0 - plungeProgress) * size.height;

    let scrollZoom = 1.0;
    let shiftFactor = 0.0;
    
    if (progress > 3.0 / 17.0) {
      const tZoom = Math.min(Math.max((progress - 3.0 / 17.0) / (12.9 / 17.0), 0.0), 1.0);
      const easedT = tZoom * tZoom * (3 - 2 * tZoom);
      scrollZoom = 1.0 + easedT * 0.25;
      shiftFactor = easedT;
    }

    let exitOpacity = 1.0;
    let exitZoomFactor = 1.0;
    if (progress > 15.9 / 17.0) {
      const tExit = THREE.MathUtils.clamp((progress - 15.9 / 17.0) / (1.1 / 17.0), 0, 1);
      exitOpacity = 1.0 - tExit * tExit * (3 - 2 * tExit);
      exitZoomFactor = 1.0 + tExit * 0.28;
    }

    // Apply exit zoom factor
    scrollZoom *= exitZoomFactor;

    // Interactive mouse parallax shifts in pixels
    const xShift = -pointer.x * 24.0 * shiftFactor;
    const yShift = -pointer.y * 24.0 * shiftFactor;
    const xRot = -pointer.y * 2.5 * shiftFactor;
    const yRot = pointer.x * 2.5 * shiftFactor;

    // Convert pixel coordinates to WebGL units at dist=0.5.
    // Three.js Y-axis is inverted relative to CSS (positive is up, CSS positive is down).
    const pixelToWorld = height / size.height;
    const xShiftWorld = xShift * pixelToWorld;
    const yShiftWorld = -(yShift + yWhipPx) * pixelToWorld;

    // Scale billboard matching the zoom plus a tiny overdraw margin to prevent rotation edge leaks
    const overdraw = 1.02;
    meshRef.current.scale.set(width * scrollZoom * overdraw, height * scrollZoom * overdraw, 1);
    
    // Position/align the mesh in front of the camera, shifted in camera coordinates
    const localPos = new THREE.Vector3(xShiftWorld, yShiftWorld, -dist);
    const targetPos = localPos.applyQuaternion(cam.quaternion).add(cam.position);
    meshRef.current.position.copy(targetPos);

    // Rotate the billboard to match the CSS rotateX / rotateY tilt in camera space
    const localEuler = new THREE.Euler(
      (xRot * Math.PI) / 180,
      (yRot * Math.PI) / 180,
      0,
      "YXZ"
    );
    const localQuat = new THREE.Quaternion().setFromEuler(localEuler);
    meshRef.current.quaternion.copy(cam.quaternion).multiply(localQuat);

    // Opacity gating — safe here, no render target changes
    const active = progress > activeThreshold && progress < 0.995;
    displayMat.uniforms.uOpacity.value = active
      ? THREE.MathUtils.clamp((progress - activeThreshold) * 1.5, 0, 1) * exitOpacity
      : 0.0;
  });

  // Priority -1: FBO simulation — runs BEFORE R3F's own scene render.
  // This guarantees the render target is null again before R3F touches the main scene,
  // preventing the GL state race that was blanking all 3D assets.
  useFrame(() => {
    const active = scroll.section3 > activeThreshold && scroll.section3 < 0.995;
    if (!active) return;

    const v1 = video1, v2 = video2;
    const tex1 = videoTex1Ref.current, tex2 = videoTex2Ref.current;
    if (!v1 || !v2 || !tex1 || !tex2 || v1.readyState < 2 || v2.readyState < 2) return;

    if (v1.videoWidth && v1.videoHeight) {
      displayMat.uniforms.uAspectVideo.value = v1.videoWidth / v1.videoHeight;
    }
    displayMat.uniforms.uAspectCanvas.value = size.width / size.height;
    displayMat.uniforms.uVideo1.value = tex1;
    displayMat.uniforms.uVideo2.value = tex2;
    displayMat.uniforms.uVideo1Opacity.value = parseFloat(v1.style.opacity || "1");
    displayMat.uniforms.uVideo2Opacity.value = parseFloat(v2.style.opacity || "0");

    const aspect = size.width / size.height;
    const pr = pointerRef.current;
    const ring = ringRef.current;

    const injectStroke = (ax: number, ay: number, bx: number, by: number, strength: number, radius: number) => {
      dropMat.uniforms.uCurr.value = ring.a.texture;
      dropMat.uniforms.uA.value.set(ax, ay);
      dropMat.uniforms.uB.value.set(bx, by);
      dropMat.uniforms.uRadius.value = radius;
      dropMat.uniforms.uStrength.value = strength;
      dropMat.uniforms.uAspect.value = aspect;
      gl.setRenderTarget(ring.b);
      gl.render(dropScene, simCamera);
      const t = ring.a; ring.a = ring.b; ring.b = t;
    };

    if (pr.moved && pr.x >= 0) {
      if (!pr.hasLast) { pr.lastX = pr.x; pr.lastY = pr.y; pr.hasLast = true; }
      const dx = pr.x - pr.lastX, dy = pr.y - pr.lastY;
      const speed = Math.hypot(dx, dy);
      const radius = Math.max(0.012, 0.026 - (FINENESS / 10) * 0.016);
      const spacing = radius * 0.4;
      const steps = Math.max(1, Math.ceil(speed / spacing));
      const strength = ((0.022 + Math.min(speed * 0.6, 0.05)) * (INTENSITY / 4)) / Math.sqrt(steps);
      let px = pr.lastX, py = pr.lastY;
      for (let i = 1; i <= steps; i++) {
        const tt = i / steps;
        const sx = pr.lastX + dx * tt, sy = pr.lastY + dy * tt;
        injectStroke(px, py, sx, sy, strength, radius);
        px = sx; py = sy;
      }
      pr.lastX = pr.x; pr.lastY = pr.y; pr.moved = false;
    } else if (pr.x >= 0) {
      pr.hasLast = true; pr.lastX = pr.x; pr.lastY = pr.y;
    }

    propMat.uniforms.uDamping.value = 0.985 + (VISCOSITY / 10) * 0.012;
    const subSteps = REDUCED ? 1 : 2;
    for (let s = 0; s < subSteps; s++) {
      propMat.uniforms.uCurr.value = ring.a.texture;
      propMat.uniforms.uPrev.value = ring.prev.texture;
      gl.setRenderTarget(ring.b);
      gl.render(propScene, simCamera);
      const oldPrev = ring.prev; ring.prev = ring.a; ring.a = ring.b; ring.b = oldPrev;
    }

    displayMat.uniforms.uHeight.value = ring.a.texture;
    displayMat.uniforms.uRefract.value = 0.015 + (INTENSITY / 10) * 0.045;

    // CRITICAL: reset to screen target before R3F renders the main scene
    gl.setRenderTarget(null);
  }, -1);

  return (
    <mesh ref={meshRef} renderOrder={-1} material={displayMat} raycast={() => null}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

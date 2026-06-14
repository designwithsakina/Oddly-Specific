// Lightweight mutable state shared between the smooth-scroll layer, the pointer
// listener and the R3F render loop. Kept outside React so reading it inside
// useFrame never triggers re-renders — the scene stays buttery at 60fps.

let initialHero = 0;
let initialSection2 = 0;
let initialRaw = 0;

if (typeof window !== "undefined") {
  const path = window.location.pathname;
  const isAbout = path === "/about" || sessionStorage.getItem("wasScrolled") === "true";
  const isWork = path === "/work" || sessionStorage.getItem("wasWorkScrolled") === "true";

  if (isWork) {
    initialHero = 1.0;
    initialSection2 = 1.0;
    initialRaw = window.innerHeight * 5.6;
  } else if (isAbout) {
    initialHero = 1.0;
    initialRaw = window.innerHeight * 2.2;
  }
}

export const scroll = {
  /** 0..1 progress through the hero "descent" (grow + dolly). */
  hero: initialHero,
  /** 0..1 progress through the second section (waterfall). */
  section2: initialSection2,
  /** 0..1 progress through the third section (underwater projects). */
  section3: 0,
  /** raw pixels scrolled. */
  raw: initialRaw,
  /** global Lenis instance. */
  lenisInstance: null as any,
};

export const pointer = {
  // smoothed, -1..1
  x: 0,
  y: 0,
  // target, -1..1
  tx: 0,
  ty: 0,
};

/** Length of the hero descent in viewport-heights of scroll. */
export const HERO_SCROLL_VH = 2.2;

export function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Smoothstep ease — soft in/out, used for the descent + overlay fade. */
export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Frame-rate independent damping toward a target. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

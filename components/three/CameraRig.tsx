"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { scroll, pointer, damp, lerp, smoothstep } from "@/lib/state";

/**
 * Drives the camera every frame from two global signals:
 *  - scroll.hero  → dollies the camera forward + slightly down (the "descent"
 *                   into the valley) so the monolith fills more of the frame.
 *  - pointer.x/y  → a small yaw/pitch parallax so the layered land shifts by
 *                   perspective as the cursor moves, like looking through glass.
 */
export default function CameraRig() {
  const { camera } = useThree();
  const lookAt = useRef(new THREE.Vector3(0, 1.4, 0));

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);

    // smooth the raw pointer target
    pointer.x = damp(pointer.x, pointer.tx, 4, d);
    pointer.y = damp(pointer.y, pointer.ty, 4, d);

    const p = smoothstep(0, 1, scroll.hero);

    // dolly forward + descend as we travel toward the monolith
    const baseZ = lerp(15, 4.5, p);
    const baseY = lerp(2.4, 1.15, p);

    // cursor parallax — stronger sideways than vertical
    const targetX = pointer.x * lerp(1.1, 0.5, p);
    const targetY = baseY + pointer.y * 0.35;

    camera.position.x = damp(camera.position.x, targetX, 3, d);
    camera.position.y = damp(camera.position.y, targetY, 3, d);
    camera.position.z = damp(camera.position.z, baseZ, 3, d);

    // look toward the monolith, nudged by the cursor for the perspective shift
    lookAt.current.x = damp(lookAt.current.x, pointer.x * 0.6, 3, d);
    lookAt.current.y = damp(lookAt.current.y, lerp(1.4, 1.9, p) + pointer.y * 0.25, 3, d);
    lookAt.current.z = 0;
    camera.lookAt(lookAt.current);
  });

  return null;
}

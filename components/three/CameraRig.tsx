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
  const { camera, scene } = useThree();
  const lookAt = useRef(new THREE.Vector3(0, 1.4, 0));

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);

    // smooth the raw pointer target
    pointer.x = damp(pointer.x, pointer.tx, 4, d);
    pointer.y = damp(pointer.y, pointer.ty, 4, d);

    const p = smoothstep(0, 1, scroll.hero);

    let targetX = 0;
    let targetY = 0;
    let lookTargetY = 0;
    let baseZ = 0;
    let baseY = 0;

    if (p <= 0.98) {
      // SECTION 1 (HERO)
      // dolly forward + descend as we travel toward the monolith
      baseZ = lerp(15, 4.5, p);
      baseY = lerp(2.4, 1.15, p);

      // cursor parallax
      targetX = pointer.x * lerp(1.1, 0.5, p);
      targetY = baseY + pointer.y * 0.35;
      lookTargetY = lerp(1.4, 1.9, p) + pointer.y * 0.25;
      lookAt.current.x = damp(lookAt.current.x, pointer.x * 0.6, 3, d);

    } else {
      // SECTION 2 (WATERFALL) & SECTION 3 (UNDERWATER PROJECTS)
      baseZ = 4.5;
      
      const s3 = smoothstep(0.0, 2.0 / 15.0, scroll.section3);
      
      // Plunge the camera from 1.15 to -6.5 as s3 goes 0 -> 1
      baseY = lerp(1.15, -6.5, s3);

      // Pitch camera down during the plunge and level off at the bottom
      // Using a parabolic pitch offset that peaks at s3 = 0.5
      const pitchOffset = -2.5 * s3 * (1.0 - s3);
      const targetLookY = lerp(1.15, -6.5, s3) + pitchOffset;

      // Cursor parallax
      targetX = pointer.x * 0.8;
      targetY = baseY + pointer.y * 0.4;
      lookTargetY = targetLookY + pointer.y * 0.3;
      lookAt.current.x = damp(lookAt.current.x, pointer.x * 0.8, 3, d);

      // Update scene fog dynamically — reduce density in Section 3 so cards
      // render cleanly against the transparent canvas (HTML underwater bg shows through)
      if (scene.fog && (scene.fog as any).color) {
        const cStart = new THREE.Color("#0a0916");
        const cEnd = new THREE.Color("#040a1d");
        cStart.lerp(cEnd, s3);
        (scene.fog as any).color.copy(cStart);
        // Fade fog density from 0.03 to 0.0 as camera plunges into section 3
        (scene.fog as THREE.FogExp2).density = lerp(0.03, 0.0, s3);
      }
    }

    camera.position.x = damp(camera.position.x, targetX, 3, d);
    camera.position.y = damp(camera.position.y, targetY, 3, d);
    camera.position.z = damp(camera.position.z, baseZ, 3, d);

    // look toward the active subject
    lookAt.current.y = damp(lookAt.current.y, lookTargetY, 3, d);
    lookAt.current.z = p <= 0.98 ? 0 : -100; // Look deep into the scene
    camera.lookAt(lookAt.current);
  });

  return null;
}

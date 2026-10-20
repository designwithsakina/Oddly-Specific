# Implementation Plan - Testimonials Fish Video Scroll-Trigger & Seamless Crossfade Loop

## User Requirements
1. **Scroll-Triggered Video Playback:**
   - The fish video (`testimonial.mp4` in `TestimonialsSection.tsx`) must only start playing once the blur fades in (as the user scrolls past the Services cards towards Step 16).
   - When resting on Step 15 (Services cards visible), the fish video remains paused at `currentTime = 0` so it doesn't run ahead in the background.
2. **Continuous Seamless Crossfade Loop:**
   - The dual-video crossfade (`v1` and `v2`) must loop seamlessly with zero stutter, freeze, or black frames.
   - Smooth cubic crossfade ratio over 2.0 seconds.
   - Pre-warm metadata on mount (`preload="auto"` and `.load()`).
   - Fail-safe `onEnded` event handlers so playback can never stall under any browser throttling condition.
3. **Preserve Previous Work:**
   - Zero changes to `ProjectsSection.tsx`, `ServicesSection.tsx`, or `TestimonialsBlurOverlay.tsx`.
   - Cards display, blur sequence, and butter scroll easing remain 100% untouched.
4. **Clarification on Video Assets:**
   - Explain how videos are hosted and served in the portfolio (Cloudflare R2 links vs. local uploads).

## Technical Implementation in `components/TestimonialsSection.tsx`

### 1. Scroll-Trigger Condition
Update the active playback trigger from:
```typescript
const active = isTestimonialsRoute || rawScroll >= (section5Start - 100) || p4 > 0.42;
```
to:
```typescript
const active = isTestimonialsRoute || rawScroll >= (section5Start - 100) || p4 >= 0.70;
```
- At Step 15 (`p4 = 0.40`): `active` is `false`. The video stays paused at `currentTime = 0`.
- As the user scrolls towards Step 16 (`p4 >= 0.70`), the blur fades in and the fish video begins playing in sync with the scene.

### 2. Bulletproof Dual-Video Crossfade
- Set `preload="auto"` on both `<video>` elements.
- Pre-warm buffers on mount:
  ```typescript
  if (v1) v1.load();
  if (v2) v2.load();
  ```
- Use a 2.0s cubic-eased crossfade window (`crossfadeTime = 2.0`).
- When switching active video at `duration - 0.15s`:
  - Reset the inactive video's `currentTime = 0` and pause it.
  - Set active video to next.
- Add fail-safe `onended` callbacks to both video elements to instantly switch and restart if an edge-case frame skip occurs.

## Verification Plan
1. Dev server cache clearing & restart on port 3000.
2. At Step 15: Verify Services cards are sharp and the fish video is paused.
3. Scroll towards Step 16: Verify the fish video starts playing as the atmospheric blur fades in.
4. Observe through video duration: Verify `v1` and `v2` crossfade seamlessly with no pause or freeze.
5. Scroll back up to Step 15: Verify video pauses and resets cleanly.

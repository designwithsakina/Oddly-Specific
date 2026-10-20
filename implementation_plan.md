# Implementation Plan - Buttery 2-Scroll Blur Transition Between Services and Testimonials

## User Requirement
- Restore the cinematic blur fade-out transition effect between Services and Testimonials.
- Ensure the blur effect **does not overlap the Services cards** while they are fully visible.
- Make the transition trigger **2 scrolls after the cards are fully visible**:
  - **Cards Visible (Step 15 at 24.2vh):** 6 liquid glass cards are 100% visible, sharp, and interactive (zero blur overlap).
  - **Scroll 1 (Step 16 at 27.2vh):** Cards smoothly dissolve out into the **atmospheric blurry landing scene** (underwater ocean with 20px blur and dark vignette).
  - **Scroll 2 (Step 17 at 30.2vh):** The blur smoothly lifts and dissolves away to 0px, revealing the crisp Testimonials intro text (*"THE WORK SPEAKS FOR ITSELF. Fortunately, other people decided to speak too."*).
  - **Scroll 3+ (Step 18-21):** The Tarot Cards Grid zoom entrance and 3-column parallax scroll.
- The scroll motion must feel **"like butter"** using Lenis smooth scrolling with refined cubic easing and durations.

## Architecture & Step Mapping

### Snap Targets in `components/ProjectsSection.tsx`
```typescript
section3Start + 17.0 * vh, // Step 13: 22.2 * vh (Services start / zoom completes)
section3Start + 18.0 * vh, // Step 14: 23.2 * vh (Services methodology text visible)
section3Start + 19.0 * vh, // Step 15: 24.2 * vh (Services cards fully visible & interactive)
section3Start + 22.0 * vh, // Step 16: 27.2 * vh (NEW: Blurry Atmospheric Ocean Landing Page)
section3Start + 25.0 * vh, // Step 17: 30.2 * vh (Testimonials text visible, blur lifted)
section3Start + 27.5 * vh, // Step 18: 32.7 * vh (Tarot Cards Grid zoom entry completes)
section3Start + 30.5 * vh, // Step 19: 35.7 * vh (Tarot Cards Grid - Scroll 1)
section3Start + 33.5 * vh, // Step 20: 38.7 * vh (Tarot Cards Grid - Scroll 2)
section3Start + 36.5 * vh, // Step 21: 41.7 * vh (Tarot Cards Grid - Scroll 3)
section3Start + 37.5 * vh  // Step 22: 42.7 * vh (Testimonials exit)
```
Total step count: **22 steps (0 to 22)**.

### Easing & Motion ("Like Butter")
- Upgrade transition easing for snap steps 16 and 17 to a buttery smooth cubic in-out curve:
  `easing: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2`
  with a 1.4s duration for a silky, gliding momentum.

### Component Updates

1. **`components/ProjectsSection.tsx`:**
   - Insert Step 16 at `section3Start + 22.0 * vh` (`27.2 * vh`).
   - Shift subsequent steps (17, 18, 19, 20, 21, 22).
   - Update `initialStep`, `triggerStepTransition`, wheel handler, touch handler, keyboard handler, and scroll sync listeners for 22 total steps.

2. **`components/ServicesSection.tsx`:**
   - Keep cards 100% visible and interactive while at Step 15 (`scroll.section4 = 0.40`).
   - As the user scrolls from Step 15 to Step 16 (`scroll.section4` from `0.42` to `1.0`), smoothly crossfade `exitOpacity` from 1.0 to 0.0 with subtle zoom factor.

3. **`components/TestimonialsSection.tsx`:**
   - Crossfade the background video in smoothly as the user scrolls from Step 15 to Step 16 (`scroll.section4` from `0.42` to `1.0`), reaching full opacity at Step 16 (`27.2 * vh`).

4. **`components/TestimonialsBlurOverlay.tsx`:**
   - Activate the overlay at Step 16 (`rawScroll >= section5Start - 20`).
   - At Step 16 (`27.2 * vh`), display the atmospheric 20px blur with `containerOpacity: 0` (no cards, no text, pure atmospheric blur).
   - As scroll glides from Step 16 to Step 17 (`27.2 * vh` to `30.2 * vh`), smoothly lift the blur from 20px to 0px while fading in the intro text.

5. **`components/SparkleCursor.tsx`:**
   - Smoothly fade out the stardust trail and sparkle cursor as the user leaves Step 15 towards Step 16.

## Verification Plan
1. Restart the dev server on port 3000 with cache cleared (`.next`).
2. Scroll to Step 15: Verify 6 cards are sharp, unblurred, and 100% interactive.
3. Scroll 1 tick down: Verify smooth glide to Step 16 (cards dissolve, blurry deep-ocean atmosphere appears).
4. Scroll 1 tick down: Verify smooth glide to Step 17 (blur lifts cleanly to 0px, *"THE WORK SPEAKS FOR ITSELF"* text fades in).
5. Scroll 1 tick down: Verify Tarot cards zoom in smoothly.
6. Test reverse scrolling (upwards): Verify smooth reverse transition without stutter or jump.

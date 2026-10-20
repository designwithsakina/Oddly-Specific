# Implementation Plan - Fix Premature Blur Transition Between Services and Testimonials

## Problem Summary
When scrolling to Step 15 (Services Cards screen, at `24.2 * vh`), the page gets completely blurred with a 20px backdrop filter and a dark blue film (`rgba(6, 12, 36, 0.4)`), as seen in the user's second image. The six liquid glass cards become blurred out, and mouse hover interactions are completely blocked.

## Root Cause Analysis
1. **Trigger Threshold Set at Step 15:**
   - Step 15 is at `24.2 * vh` (where Section 4 started at `22.2 * vh` and spans `5.0 * vh`).
   - At Step 15, normalized `scroll.section4` is exactly `(24.2 - 22.2) / 5.0 = 2.0 / 5.0 = 0.4`.
   - In `components/TestimonialsBlurOverlay.tsx` (line 119) and `components/ServicesSection.tsx` (line 245), the transition was set to trigger whenever `scroll.section4 > 2.0 / 5.0`.
   - Due to floating-point precision (`2.0000000000000018 / 5.0 = 0.40000000000000036`), as soon as the user arrives at Step 15, `scroll.section4 > 2.0 / 5.0` immediately evaluates to `true`.
2. **Premature 20px Blur Overlay:**
   - Section 5 (Testimonials) does not begin until `27.2 * vh` (300vh further down).
   - While the user is at Step 15 (`24.2 * vh`), `scroll.section5` (`p`) is `0.0`.
   - In `TestimonialsBlurOverlay.tsx`, when `p = 0.0`, the blur amount is calculated as `blurAmount = (1.0 - 0.0) * 20.0 = 20px`.
   - The overlay drops a `backdrop-filter: blur(20px)` and `pointer-events: auto` directly on top of the Services cards, blurring them into oblivion and disabling all hover interactions.
3. **Premature Services Exit:**
   - `ServicesSection.tsx` begins reducing `exitOpacity` as soon as `scroll.section4 > 2.0 / 5.0`, causing the cards to prematurely begin fading away right as they are supposed to be presented.

## Proposed Changes

### 1. Update `components/TestimonialsBlurOverlay.tsx`
- Change `isTransitionActive` so that the Testimonials blur overlay only activates when actually entering Section 5 (`rawScroll >= section5Start - 50` or `scroll.section4 >= 1.0` or `scroll.section5 > 0.001`).
- Ensure that at Step 15 (`24.2 * vh`), `TestimonialsBlurOverlay` is strictly `display: "none"` with `opacity: "0"` and `pointerEvents: "none"`.
- When transitioning from Step 15 (`24.2 * vh`) to Step 16 (`30.2 * vh`), the blur will engage smoothly only as Section 5 enters, lifting cleanly to 0px at Step 16.

### 2. Update `components/ServicesSection.tsx`
- Adjust `exitOpacity` and `exitZoomFactor` trigger from `scroll.section4 > 2.0 / 5.0` to `scroll.section4 > 3.9 / 5.0` (matching `TestimonialsSection.tsx` and `SparkleCursor.tsx` which begin their crossfade at `3.9 / 5.0` = `26.1 * vh`).
- This guarantees the Services cards stay 100% visible, sharp, and interactive through the entire duration of Step 15.

## Verification Plan
1. Start the dev server on port 3000 (with `.next` cache cleared).
2. Scroll to Step 14 (Services methodology text) -> verify smooth text display.
3. Scroll to Step 15 (Services cards) -> verify:
   - Six liquid glass cards are 100% visible, sharp, and centered.
   - No blur overlay or dark veil is active.
   - Hovering over cards triggers 3D tilt, 180° flip, and text scramble.
   - "THE DARKNESS ISN'T EMPTY. IT'S WAITING. HOVER TO DISCOVER." is crisp.
4. Scroll from Step 15 to Step 16 -> verify smooth transition into Testimonials ("THE WORK SPEAKS FOR ITSELF") without premature blurring of Step 15.

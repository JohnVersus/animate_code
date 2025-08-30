# Video Export Timing Fix

## Issue

The video export was showing slides 2 and 3 animating simultaneously instead of sequentially, even though the Animation Preview worked correctly.

## Root Cause

**Unit Mismatch in Time Calculations**

The animation engine calculates timing in **milliseconds**, but the video export service was mixing milliseconds and seconds:

### Animation Engine (`animationEngine.ts`):

```typescript
// All timing is in milliseconds
accumulatedTime += slide.duration; // slide.duration is in milliseconds
steps.push({
  startTime: accumulatedTime, // milliseconds
  duration: slide.duration, // milliseconds
  // ...
});
```

### Video Export Service (BEFORE fix):

```typescript
// BUG: Mixed units!
const stepStartTime = step.startTime; // milliseconds (from animation engine)
const stepEndTime = stepStartTime + step.duration / 1000; // milliseconds + seconds = WRONG!

if (timeInSeconds >= stepStartTime && timeInSeconds < stepEndTime) {
  // Comparing seconds with milliseconds = WRONG!
}
```

## Solution

**Convert all timing to seconds consistently**

### Video Export Service (AFTER fix):

```typescript
// FIXED: Convert everything to seconds
const stepStartTime = step.startTime / 1000; // Convert milliseconds to seconds
const stepEndTime = stepStartTime + step.duration / 1000; // Both in seconds

if (timeInSeconds >= stepStartTime && timeInSeconds < stepEndTime) {
  // Now comparing seconds with seconds = CORRECT!
}
```

## Changes Made

### 1. Fixed `findAnimationStepAtTime()`:

```typescript
// BEFORE
const stepStartTime = step.startTime; // milliseconds
const stepEndTime = stepStartTime + step.duration / 1000; // mixed units

// AFTER
const stepStartTime = step.startTime / 1000; // seconds
const stepEndTime = stepStartTime + step.duration / 1000; // seconds
```

### 2. Fixed step progress calculation in `renderFrameAtTime()`:

```typescript
// BEFORE
(timeInSeconds - currentStep.startTime) / (currentStep.duration / 1000);
// Subtracting seconds from milliseconds = WRONG!

// AFTER
const stepStartTimeInSeconds = currentStep.startTime / 1000;
(timeInSeconds - stepStartTimeInSeconds) / (currentStep.duration / 1000);
// Now all in seconds = CORRECT!
```

## Testing

Added debug utility `debugVideoTiming.ts` to help verify timing calculations:

- Shows slide durations and start times
- Tests timing at various points in the animation
- Helps identify timing issues during development

## Result

✅ Each slide now animates sequentially as expected
✅ Video export timing now matches Animation Preview behavior
✅ No more simultaneous slide animations

## Example Timeline (3 slides, 2s each):

- **Slide 1**: 0.0s - 2.0s
- **Slide 2**: 2.0s - 4.0s
- **Slide 3**: 4.0s - 6.0s
- **Buffer**: 6.0s - 6.5s (shows final state)

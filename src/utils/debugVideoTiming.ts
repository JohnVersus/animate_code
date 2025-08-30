import { Slide } from "../types";
import { animationEngine } from "../services/animationEngine";

export function debugVideoTiming(slides: Slide[], code: string) {
  console.log("=== Video Timing Debug ===");

  const animationSteps = animationEngine.createAnimatedScene(
    code,
    "javascript",
    slides
  ).animationSteps;

  console.log(
    "Slides:",
    slides.map((s) => ({
      name: s.name,
      duration: s.duration,
      order: s.order,
    }))
  );

  console.log("Animation Steps:");
  animationSteps.forEach((step, index) => {
    console.log(`Step ${index}:`, {
      slideIndex: step.slideIndex,
      startTime: step.startTime, // milliseconds
      startTimeSeconds: step.startTime / 1000, // seconds
      duration: step.duration, // milliseconds
      durationSeconds: step.duration / 1000, // seconds
      endTimeSeconds: (step.startTime + step.duration) / 1000,
      animationStyle: step.animationStyle,
      linesToAdd: step.linesToAdd,
    });
  });

  const totalDuration = slides.reduce((sum, slide) => sum + slide.duration, 0);
  console.log("Total Duration:", {
    milliseconds: totalDuration,
    seconds: totalDuration / 1000,
  });

  // Test timing at various points
  console.log("\nTiming Tests:");
  for (let i = 0; i <= totalDuration / 1000; i += 0.5) {
    const step = findStepAtTime(animationSteps, i);
    console.log(
      `At ${i}s: Step ${step?.slideIndex ?? "none"} (${
        step?.animationStyle ?? "N/A"
      })`
    );
  }
}

function findStepAtTime(animationSteps: any[], timeInSeconds: number) {
  for (const step of animationSteps) {
    const stepStartTime = step.startTime / 1000; // Convert from milliseconds to seconds
    const stepEndTime = stepStartTime + step.duration / 1000;

    if (timeInSeconds >= stepStartTime && timeInSeconds < stepEndTime) {
      return step;
    }
  }
  return null;
}

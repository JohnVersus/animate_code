"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { canvasRenderer } from "../../services/canvasRenderer";
import { animationEngine } from "../../services/animationEngine";
import { themeExtractor } from "../../services/themeExtractor";
import { Slide } from "../../types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PauseIcon, PlayIcon } from "lucide-react";

interface AnimationPreviewProps {
  code: string;
  language: string;
  slides: Slide[];
  currentSlide: number;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
  onCurrentSlideChange?: (slideIndex: number) => void;
  globalSpeed?: number;
  onGlobalSpeedChange?: (speed: number) => void;
}

export const AnimationPreview: React.FC<AnimationPreviewProps> = ({
  code,
  language,
  slides,
  currentSlide,
  isPlaying,
  onPlayStateChange,
  onCurrentSlideChange,
  globalSpeed = 1.0,
  onGlobalSpeedChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastActiveSlideRef = useRef<number>(0);
  const onCurrentSlideChangeRef = useRef(onCurrentSlideChange);
  const onPlayStateChangeRef = useRef(onPlayStateChange);

  const [isRendering, setIsRendering] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState("#111827");
  const [previewMode, setPreviewMode] = useState<"static" | "animated">(
    "static"
  );
  const [animationProgress, setAnimationProgress] = useState(0); // 0-1 for current slide
  const [totalProgress, setTotalProgress] = useState(0); // 0-1 for entire animation
  const [currentTime, setCurrentTime] = useState(0); // Current time in seconds
  const [totalDuration, setTotalDuration] = useState(0); // Total duration in seconds

  // Update the refs when the callbacks change
  useEffect(() => {
    onCurrentSlideChangeRef.current = onCurrentSlideChange;
    onPlayStateChangeRef.current = onPlayStateChange;
  }, [onCurrentSlideChange, onPlayStateChange]);

  // Initialize theme extraction when component mounts
  useEffect(() => {
    // Delay theme extraction to ensure theme CSS is loaded
    const initializeTheme = () => {
      try {
        // Clear any cached theme to ensure fresh extraction
        themeExtractor.clearCache();

        // Update canvas renderer with extracted theme colors
        canvasRenderer.updateTheme();

        // Debug: Log the extracted background color
        const bgColor = themeExtractor.getBackgroundColor();
        console.log("Theme extraction initialized for AnimationPreview");
        console.log("Extracted background color:", bgColor);

        // Update the canvas background color state
        setCanvasBackgroundColor(bgColor);

        // Mark theme as ready to trigger re-render
        setThemeReady(true);
      } catch (error) {
        console.warn("Failed to initialize theme extraction:", error);
        setCanvasBackgroundColor("#111827"); // Use fallback color matching bg-gray-900
        setThemeReady(true); // Still mark as ready to avoid blocking
      }
    };

    // Use setTimeout to ensure CSS is loaded and applied
    const timeoutId = setTimeout(initializeTheme, 500);

    return () => clearTimeout(timeoutId);
  }, []); // Run only once on mount

  // Render code to canvas when dependencies change
  useEffect(() => {
    if (!canvasRef.current || !code.trim() || !themeReady) return;

    setIsRendering(true);

    try {
      // Ensure canvas renderer has the latest theme colors before rendering
      canvasRenderer.updateTheme();

      if (previewMode === "animated" && slides.length > 0) {
        // For animated mode, render animation frame
        const fromSlide = currentSlide > 0 ? slides[currentSlide - 1] : null;
        const toSlide = slides[currentSlide];

        if (toSlide) {
          const animationFrame = animationEngine.renderAnimationFrame(
            code,
            language,
            fromSlide,
            toSlide,
            animationProgress,
            globalSpeed
          );
          canvasRenderer.renderAnimationFrame(
            canvasRef.current,
            animationFrame
          );
        }
      } else if (slides.length > 0) {
        // For static mode, show current slide with scrolling window applied
        const currentSlideData = slides[currentSlide];
        if (currentSlideData) {
          // Get the windowed line ranges for this slide
          const windowedLineRanges = animationEngine.getWindowedLineRanges(
            currentSlideData,
            code
          );

          canvasRenderer.renderCodeToCanvas(
            canvasRef.current,
            code,
            language,
            windowedLineRanges
          );
        }
      } else {
        // Show all code if no slides
        canvasRenderer.renderCodeToCanvas(canvasRef.current, code, language);
      }
    } catch (error) {
      console.error("Failed to render code to canvas:", error);
    } finally {
      setIsRendering(false);
    }
  }, [
    code,
    language,
    slides,
    currentSlide,
    previewMode,
    themeReady,
    animationProgress,
    globalSpeed,
  ]);

  // Calculate total duration when slides change (convert from milliseconds to seconds and apply global speed)
  useEffect(() => {
    const duration =
      slides.reduce((sum, slide) => sum + slide.duration / globalSpeed, 0) /
      1000;
    setTotalDuration(duration);
  }, [slides, globalSpeed]);

  // Animation loop for timing and progress
  const animationLoop = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = (timestamp - startTimeRef.current) / 1000; // Convert to seconds
      setCurrentTime(elapsed);

      // Calculate which slide should be active based on elapsed time
      let accumulatedTime = 0;
      let activeSlideIndex = 0;
      let slideProgress = 0;
      let foundActiveSlide = false;

      for (let i = 0; i < slides.length; i++) {
        const slideDurationInSeconds = slides[i].duration / globalSpeed / 1000; // Convert ms to seconds and apply global speed
        const slideEndTime = accumulatedTime + slideDurationInSeconds;

        if (elapsed >= accumulatedTime && elapsed < slideEndTime) {
          activeSlideIndex = i;
          slideProgress = (elapsed - accumulatedTime) / slideDurationInSeconds;
          foundActiveSlide = true;
          break;
        }

        accumulatedTime = slideEndTime;
      }

      // If we've gone past all slides, stop the animation
      if (!foundActiveSlide && elapsed >= accumulatedTime) {
        activeSlideIndex = slides.length - 1;
        slideProgress = 1;
        onPlayStateChangeRef.current(false);
        return;
      }

      // Update progress states
      setAnimationProgress(slideProgress);
      setTotalProgress(totalDuration > 0 ? elapsed / totalDuration : 0);

      // Update current slide if it changed (use a ref to avoid dependency issues)
      if (
        activeSlideIndex !== lastActiveSlideRef.current &&
        onCurrentSlideChangeRef.current
      ) {
        lastActiveSlideRef.current = activeSlideIndex;
        onCurrentSlideChangeRef.current(activeSlideIndex);
      }

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(animationLoop);
      }
    },
    [slides, totalDuration, isPlaying, globalSpeed]
  );

  // Handle play/pause state changes
  useEffect(() => {
    if (isPlaying && slides.length > 0) {
      setPreviewMode("animated");
      // Adjust startTimeRef to resume from currentTime
      startTimeRef.current = performance.now() - currentTime * 1000;
      animationRef.current = requestAnimationFrame(animationLoop);
    } else {
      setPreviewMode("static");
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      // When pausing, we don't need to do anything to startTimeRef.
      // The currentTime is already captured in the state.
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, slides.length, animationLoop]);

  // Timeline scrubbing handler
  const handleTimelineSeek = (seekTime: number) => {
    setCurrentTime(seekTime);
    // Also update startTimeRef so the animation loop continues from the new time
    startTimeRef.current = performance.now() - seekTime * 1000;

    // Find which slide corresponds to this time
    let accumulatedTime = 0;
    let targetSlideIndex = 0;
    let foundSlide = false;

    for (let i = 0; i < slides.length; i++) {
      const slideDurationInSeconds = slides[i].duration / globalSpeed / 1000; // Convert ms to seconds and apply global speed
      const slideEndTime = accumulatedTime + slideDurationInSeconds;

      if (seekTime >= accumulatedTime && seekTime < slideEndTime) {
        targetSlideIndex = i;
        const slideProgress =
          (seekTime - accumulatedTime) / slideDurationInSeconds;
        setAnimationProgress(slideProgress);
        foundSlide = true;
        break;
      }

      accumulatedTime = slideEndTime;
    }

    // If seeking beyond all slides, go to the last slide
    if (!foundSlide && seekTime >= accumulatedTime) {
      targetSlideIndex = slides.length - 1;
      setAnimationProgress(1);
    }

    setTotalProgress(totalDuration > 0 ? seekTime / totalDuration : 0);

    if (targetSlideIndex !== currentSlide && onCurrentSlideChange) {
      onCurrentSlideChange(targetSlideIndex);
    }
  };

  // Manual slide navigation
  const goToSlide = (slideIndex: number) => {
    if (slideIndex < 0 || slideIndex >= slides.length) return;

    // Calculate the start time of the target slide (convert ms to seconds)
    let accumulatedTime = 0;
    for (let i = 0; i < slideIndex; i++) {
      accumulatedTime += slides[i].duration / globalSpeed / 1000;
    }

    handleTimelineSeek(accumulatedTime);

    if (onCurrentSlideChange) {
      onCurrentSlideChange(slideIndex);
    }
  };

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Reset animation to beginning
  const resetAnimation = () => {
    // Stop animation first
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    setCurrentTime(0);
    setAnimationProgress(0);
    setTotalProgress(0);
    startTimeRef.current = null;
    lastActiveSlideRef.current = 0;

    if (onCurrentSlideChange) {
      onCurrentSlideChange(0);
    }

    // Stop playing
    onPlayStateChange(false);
  };

  if (!code.trim()) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
        <div className="text-center">
          <div className="text-lg mb-2">No code to preview</div>
          <div className="text-sm">
            Paste some code in the editor to see the animation preview
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 relative overflow-auto">
      <style jsx>{`
        .slider {
          background: transparent;
        }

        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }

        .slider::-webkit-slider-thumb:hover {
          background: #2563eb;
          transform: scale(1.1);
        }

        .slider::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }

        .slider::-moz-range-thumb:hover {
          background: #2563eb;
          transform: scale(1.1);
        }

        .slider::-webkit-slider-track {
          height: 8px;
          border-radius: 4px;
        }

        .slider::-moz-range-track {
          height: 8px;
          border-radius: 4px;
          border: none;
        }
      `}</style>
      {/* Static Canvas Preview */}
      {previewMode === "static" && (
        <div className="w-full h-full flex items-center-safe justify-center pt-2 pb-32 px-4">
          <div className="w-full max-w-4xl aspect-video flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full border border-gray-700 rounded-lg shadow-lg"
              style={{
                backgroundColor: canvasBackgroundColor,
              }}
            />
          </div>
        </div>
      )}

      {/* Animated Preview */}
      {previewMode === "animated" && (
        <div className="w-full h-full flex items-center justify-center pt-2 pb-32 px-4">
          <div className="w-full max-w-4xl aspect-video flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full border border-gray-700 rounded-lg shadow-lg"
              style={{
                backgroundColor: canvasBackgroundColor,
              }}
            />
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <div className="text-white">Rendering preview...</div>
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute bottom-2 left-4 right-4">
        <div className="bg-black/80 backdrop-blur-sm rounded-lg border border-gray-700 p-3 shadow-xl">
          {/* Timeline scrubber */}
          {slides.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-[10px] text-gray-300 mb-1.5">
                <span className="font-mono">{formatTime(currentTime)}</span>
                <span className="font-mono">{formatTime(totalDuration)}</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max={totalDuration}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) =>
                    handleTimelineSeek(parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                      totalProgress * 100
                    }%, #374151 ${totalProgress * 100}%, #374151 100%)`,
                  }}
                />
                {/* Slide markers on timeline */}
                <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none">
                  {slides.map((_, index) => {
                    let accumulatedTime = 0;
                    for (let i = 0; i < index; i++) {
                      accumulatedTime +=
                        slides[i].duration / globalSpeed / 1000;
                    }
                    const position =
                      totalDuration > 0
                        ? (accumulatedTime / totalDuration) * 100
                        : 0;
                    return (
                      <div
                        key={index}
                        className="absolute w-0.5 h-2 bg-yellow-400 rounded-full"
                        style={{ left: `${position}%` }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Main controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Play/Pause button */}
              <Button
                onClick={() => onPlayStateChange(!isPlaying)}
                size="icon"
                className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700"
                disabled={slides.length === 0}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </Button>

              {/* Reset button */}
              {slides.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetAnimation}
                  className="h-8 w-8 text-gray-300 hover:text-white hover:bg-gray-700"
                  title="Reset to beginning"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              )}

              {/* Manual slide navigation */}
              {slides.length > 0 && (
                <div className="flex items-center space-x-1 bg-gray-800 rounded-md p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => goToSlide(currentSlide - 1)}
                    disabled={currentSlide === 0}
                    className="h-6 w-6 text-gray-300 hover:text-white hover:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                    title="Previous slide"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>

                  <div className="text-white text-sm font-mono px-2 min-w-[3rem] text-center">
                    {currentSlide + 1}/{slides.length}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => goToSlide(currentSlide + 1)}
                    disabled={currentSlide === slides.length - 1}
                    className="h-6 w-6 text-gray-300 hover:text-white hover:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                    title="Next slide"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>
                </div>
              )}

              {/* Global speed control */}
              {onGlobalSpeedChange && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300 text-sm">Speed:</span>
                  <Select
                    value={globalSpeed.toString()}
                    onValueChange={(value) =>
                      onGlobalSpeedChange(parseFloat(value))
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-25 bg-gray-800 border-gray-600 text-white"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.25">0.25x</SelectItem>
                      <SelectItem value="0.5">0.5x</SelectItem>
                      <SelectItem value="0.75">0.75x</SelectItem>
                      <SelectItem value="1">1x</SelectItem>
                      <SelectItem value="1.25">1.25x</SelectItem>
                      <SelectItem value="1.5">1.5x</SelectItem>
                      <SelectItem value="2">2x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {slides.length === 0 && (
                <div className="text-gray-400 text-sm">
                  Add slides to enable animation
                </div>
              )}
            </div>

            {/* Right side info */}
            <div className="flex items-center space-x-3">
              {/* Language indicator */}
              <div className="bg-gray-800 px-2 py-1 rounded text-white text-sm font-medium">
                {language.charAt(0).toUpperCase() + language.slice(1)}
              </div>

              {/* Preview mode indicator */}
              <div className="text-xs text-gray-400 font-mono">
                {previewMode === "static" ? "Static" : "Animated"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

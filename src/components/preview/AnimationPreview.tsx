"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { canvasRenderer } from "../../services/canvasRenderer";
import { animationEngine } from "../../services/animationEngine";
import { Slide } from "../../types";
import { Button } from "@/components/ui/button";

interface AnimationPreviewProps {
  code: string;
  language: string;
  slides: Slide[];
  currentSlide: number;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
  onCurrentSlideChange?: (slideIndex: number) => void;
}

export const AnimationPreview: React.FC<AnimationPreviewProps> = ({
  code,
  language,
  slides,
  currentSlide,
  isPlaying,
  onPlayStateChange,
  onCurrentSlideChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastActiveSlideRef = useRef<number>(0);
  const onCurrentSlideChangeRef = useRef(onCurrentSlideChange);
  const onPlayStateChangeRef = useRef(onPlayStateChange);

  const [isRendering, setIsRendering] = useState(false);
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

  // Render code to canvas when dependencies change
  useEffect(() => {
    if (!canvasRef.current || !code.trim()) return;

    setIsRendering(true);

    try {
      // Use cumulative lines for better preview
      if (slides.length > 0) {
        const cumulativeLines = animationEngine.getCumulativeLines(
          slides,
          currentSlide,
          code
        );

        // Convert cumulative lines to proper line ranges (preserve individual lines)
        const lineRanges =
          cumulativeLines.length > 0
            ? cumulativeLines.map((line) => ({
                start: line.lineNumber,
                end: line.lineNumber,
              }))
            : [];

        canvasRenderer.renderCodeToCanvas(
          canvasRef.current,
          code,
          language,
          lineRanges
        );
      } else {
        // Show all code if no slides
        canvasRenderer.renderCodeToCanvas(canvasRef.current, code, language);
      }
    } catch (error) {
      console.error("Failed to render code to canvas:", error);
    } finally {
      setIsRendering(false);
    }
  }, [code, language, slides, currentSlide, previewMode]);

  // Calculate total duration when slides change (convert from milliseconds to seconds)
  useEffect(() => {
    const duration =
      slides.reduce((sum, slide) => sum + slide.duration, 0) / 1000;
    setTotalDuration(duration);
  }, [slides]);

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
        const slideDurationInSeconds = slides[i].duration / 1000; // Convert ms to seconds
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
    [slides, totalDuration, isPlaying]
  );

  // Handle play/pause state changes
  useEffect(() => {
    if (isPlaying && slides.length > 0) {
      setPreviewMode("animated");
      startTimeRef.current = null;
      lastActiveSlideRef.current = 0; // Reset slide tracking
      animationRef.current = requestAnimationFrame(animationLoop);
    } else {
      setPreviewMode("static");
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      startTimeRef.current = null;
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

    // Find which slide corresponds to this time
    let accumulatedTime = 0;
    let targetSlideIndex = 0;
    let foundSlide = false;

    for (let i = 0; i < slides.length; i++) {
      const slideDurationInSeconds = slides[i].duration / 1000; // Convert ms to seconds
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
      accumulatedTime += slides[i].duration / 1000;
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
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
                backgroundColor: "#1e1e1e",
                objectFit: "contain",
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
                backgroundColor: "#1e1e1e",
                objectFit: "contain",
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
      <div className="absolute bottom-2 left-4 right-4 bg-orange-500/30 bg-opacity-75 rounded-lg p-3">
        {/* Timeline scrubber */}
        {slides.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max={totalDuration}
                step="0.1"
                value={currentTime}
                onChange={(e) => handleTimelineSeek(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                    totalProgress * 100
                  }%, #4b5563 ${totalProgress * 100}%, #4b5563 100%)`,
                }}
              />
              {/* Slide markers on timeline */}
              <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none">
                {slides.map((_, index) => {
                  let accumulatedTime = 0;
                  for (let i = 0; i < index; i++) {
                    accumulatedTime += slides[i].duration / 1000; // Convert ms to seconds
                  }
                  const position =
                    totalDuration > 0
                      ? (accumulatedTime / totalDuration) * 100
                      : 0;
                  return (
                    <div
                      key={index}
                      className="absolute w-0.5 h-2 bg-yellow-400"
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
              className="w-10 h-10 rounded-full"
              disabled={slides.length === 0}
            >
              {isPlaying ? (
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 ml-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </Button>

            {/* Reset button */}
            {slides.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={resetAnimation}
                className="w-8 h-8 text-gray-300 hover:text-white"
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
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => goToSlide(currentSlide - 1)}
                  disabled={currentSlide === 0}
                  className="text-white hover:text-blue-400 disabled:text-gray-500 disabled:cursor-not-allowed h-auto w-auto p-1"
                  title="Previous slide"
                >
                  <svg
                    className="w-5 h-5"
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

                <div className="text-white text-sm font-medium px-2">
                  {currentSlide + 1} / {slides.length}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => goToSlide(currentSlide + 1)}
                  disabled={currentSlide === slides.length - 1}
                  className="text-white hover:text-blue-400 disabled:text-gray-500 disabled:cursor-not-allowed h-auto w-auto p-1"
                  title="Next slide"
                >
                  <svg
                    className="w-5 h-5"
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

            {/* Current slide info */}
            {slides.length > 0 && slides[currentSlide] && (
              <div className="text-gray-300 text-sm">
                <span className="font-medium">{slides[currentSlide].name}</span>
                <span className="ml-2 text-xs">
                  ({formatTime(slides[currentSlide].duration / 1000)}s,{" "}
                  {slides[currentSlide].animationStyle})
                </span>
              </div>
            )}

            {slides.length === 0 && (
              <div className="text-gray-400 text-sm">
                Add slides to enable animation
              </div>
            )}
          </div>

          {/* Right side info */}
          <div className="flex items-center space-x-4">
            {/* Progress indicator */}
            {slides.length > 0 && (
              <div className="text-xs text-gray-300">
                <div>Slide: {Math.round(animationProgress * 100)}%</div>
                <div>Total: {Math.round(totalProgress * 100)}%</div>
              </div>
            )}

            {/* Language indicator */}
            <div className="text-white text-sm font-medium">
              {language.charAt(0).toUpperCase() + language.slice(1)}
            </div>

            {/* Preview mode indicator */}
            <div className="text-xs text-gray-300">
              {previewMode === "static" ? "Static" : "Animated"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

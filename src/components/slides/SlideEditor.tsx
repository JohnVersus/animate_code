"use client";

import React, { useState, useCallback } from "react";
import { Slide, AnimationStyle } from "@/types";
import {
  parseLineRanges,
  validateSlide,
  formatLineRanges,
} from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SlideEditorProps {
  slide?: Slide;
  totalLines: number;
  onSave: (slideData: Omit<Slide, "id" | "order">) => void;
  onCancel: () => void;
}

const ANIMATION_STYLES: {
  value: AnimationStyle;
  label: string;
  description: string;
}[] = [
  {
    value: "fade",
    label: "Fade",
    description: "Smooth fade in/out transitions",
  },
  {
    value: "slide",
    label: "Slide",
    description: "Lines slide in from different directions",
  },
  {
    value: "typewriter",
    label: "Typewriter",
    description: "Characters appear one by one",
  },
  {
    value: "highlight",
    label: "Highlight",
    description: "Emphasize changes with background colors",
  },
];

export function SlideEditor({
  slide,
  totalLines,
  onSave,
  onCancel,
}: SlideEditorProps) {
  const [name, setName] = useState(slide?.name || "");
  const [lineRangesText, setLineRangesText] = useState(
    slide ? formatLineRanges(slide.lineRanges) : ""
  );
  const [duration, setDuration] = useState(slide?.duration || 2000);
  const [animationStyle, setAnimationStyle] = useState<AnimationStyle>(
    slide?.animationStyle || "fade"
  );
  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = useCallback(() => {
    const newErrors: string[] = [];

    // Validate name
    if (!name.trim()) {
      newErrors.push("Slide name is required");
    }

    // Validate line ranges
    if (!lineRangesText.trim()) {
      newErrors.push("Line ranges are required");
    } else {
      try {
        const ranges = parseLineRanges(lineRangesText);
        const tempSlide: Slide = {
          id: "temp",
          name: name.trim(),
          lineRanges: ranges,
          duration,
          animationStyle,
          order: 0,
        };

        const validation = validateSlide(tempSlide, totalLines);
        if (!validation.isValid) {
          newErrors.push(...validation.errors);
        }
      } catch (error) {
        newErrors.push(
          error instanceof Error ? error.message : "Invalid line range format"
        );
      }
    }

    // Validate duration
    if (duration <= 0) {
      newErrors.push("Duration must be greater than 0");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }, [name, lineRangesText, duration, animationStyle, totalLines]);

  const handleSave = useCallback(() => {
    if (!validateForm()) {
      return;
    }

    try {
      const lineRanges = parseLineRanges(lineRangesText);
      const slideData: Omit<Slide, "id" | "order"> = {
        name: name.trim(),
        lineRanges,
        duration,
        animationStyle,
      };

      onSave(slideData);
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : "Failed to save slide",
      ]);
    }
  }, [name, lineRangesText, duration, animationStyle, validateForm, onSave]);

  const handleLineRangesChange = useCallback(
    (value: string) => {
      setLineRangesText(value);
      // Clear errors when user starts typing
      if (errors.length > 0) {
        setErrors([]);
      }
    },
    [errors.length]
  );

  const handlePreviewRanges = useCallback(() => {
    try {
      const ranges = parseLineRanges(lineRangesText);
      const preview = ranges
        .map((range) =>
          range.start === range.end
            ? `Line ${range.start}`
            : `Lines ${range.start}-${range.end}`
        )
        .join(", ");

      alert(`Preview: ${preview}`);
    } catch (error) {
      alert(
        `Invalid format: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [lineRangesText]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-medium text-gray-900">
          {slide ? "Edit Slide" : "New Slide"}
        </h3>
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm font-medium text-red-800 mb-1">
            Please fix the following errors:
          </div>
          <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Slide name */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Slide Name
        </label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter slide name..."
        />
      </div>

      {/* Line ranges */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-gray-700">
            Line Ranges
          </label>
          <Button
            variant="link"
            size="sm"
            onClick={handlePreviewRanges}
            disabled={!lineRangesText.trim()}
            className="text-xs h-auto p-0"
          >
            Preview
          </Button>
        </div>
        <Input
          type="text"
          value={lineRangesText}
          onChange={(e) => handleLineRangesChange(e.target.value)}
          placeholder="e.g., 1-5, 12-15, 20"
          className="font-mono"
        />
        <p className="text-xs text-gray-500 mt-1">
          Use ranges (1-5) or single lines (10). Separate multiple ranges with
          commas. Total lines available: {totalLines}
        </p>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Duration (milliseconds)
        </label>
        <Input
          type="number"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
          min="100"
          step="100"
        />
        <p className="text-xs text-gray-500 mt-1">
          {(duration / 1000).toFixed(1)} seconds
        </p>
      </div>

      {/* Animation style */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Animation Style
        </label>
        <select
          value={animationStyle}
          onChange={(e) => setAnimationStyle(e.target.value as AnimationStyle)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {ANIMATION_STYLES.map((style) => (
            <option key={style.value} value={style.value}>
              {style.label} - {style.description}
            </option>
          ))}
        </select>
      </div>

      {/* Action buttons at bottom */}
      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-200">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave}>
          {slide ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}

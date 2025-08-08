import { LineRange, Slide, Project, AnimationStyle } from "@/types";

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Parse line range string (e.g., "1-5, 12-15") into LineRange array
 */
export function parseLineRanges(rangeString: string): LineRange[] {
  if (!rangeString.trim()) {
    return [];
  }

  const ranges: LineRange[] = [];
  const parts = rangeString.split(",").map((part) => part.trim());

  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-").map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid range format: ${part}`);
      }

      if (start > end) {
        throw new Error(
          `Invalid range: start (${start}) cannot be greater than end (${end})`
        );
      }

      ranges.push({ start, end });
    } else {
      // Single line number
      const lineNum = parseInt(part, 10);
      if (isNaN(lineNum)) {
        throw new Error(`Invalid line number: ${part}`);
      }
      ranges.push({ start: lineNum, end: lineNum });
    }
  }

  return ranges;
}

/**
 * Convert LineRange array back to string format
 */
export function formatLineRanges(ranges: LineRange[]): string {
  return ranges
    .map((range) =>
      range.start === range.end
        ? range.start.toString()
        : `${range.start}-${range.end}`
    )
    .join(", ");
}

/**
 * Validate line ranges against code bounds
 */
export function validateLineRanges(
  ranges: LineRange[],
  totalLines: number
): ValidationResult {
  const errors: string[] = [];

  if (ranges.length === 0) {
    errors.push("At least one line range is required");
  }

  for (const range of ranges) {
    if (range.start < 1) {
      errors.push(`Line range start (${range.start}) must be at least 1`);
    }

    if (range.end > totalLines) {
      errors.push(
        `Line range end (${range.end}) exceeds total lines (${totalLines})`
      );
    }

    if (range.start > range.end) {
      errors.push(
        `Line range start (${range.start}) cannot be greater than end (${range.end})`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if two line ranges overlap
 */
export function rangesOverlap(range1: LineRange, range2: LineRange): boolean {
  return range1.start <= range2.end && range2.start <= range1.end;
}

/**
 * Find overlapping ranges in a slide
 */
export function findOverlappingRanges(ranges: LineRange[]): LineRange[][] {
  const overlaps: LineRange[][] = [];

  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      if (rangesOverlap(ranges[i], ranges[j])) {
        overlaps.push([ranges[i], ranges[j]]);
      }
    }
  }

  return overlaps;
}

/**
 * Validate slide configuration
 */
export function validateSlide(
  slide: Slide,
  totalLines: number
): ValidationResult {
  const errors: string[] = [];

  // Validate slide name
  if (!slide.name.trim()) {
    errors.push("Slide name is required");
  }

  // Validate duration
  if (slide.duration <= 0) {
    errors.push("Slide duration must be greater than 0");
  }

  // Validate line ranges
  const rangeValidation = validateLineRanges(slide.lineRanges, totalLines);
  if (!rangeValidation.isValid) {
    errors.push(...rangeValidation.errors);
  }

  // Check for overlapping ranges within the slide
  const overlaps = findOverlappingRanges(slide.lineRanges);
  if (overlaps.length > 0) {
    errors.push(
      `Slide contains overlapping line ranges: ${overlaps
        .map(
          (pair) =>
            `${formatLineRanges([pair[0]])} and ${formatLineRanges([pair[1]])}`
        )
        .join(", ")}`
    );
  }

  // Validate animation style
  const validStyles: AnimationStyle[] = [
    "fade",
    "slide",
    "typewriter",
    "highlight",
  ];
  if (!validStyles.includes(slide.animationStyle)) {
    errors.push(`Invalid animation style: ${slide.animationStyle}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate project configuration
 */
export function validateProject(
  project: Omit<Project, "id" | "createdAt" | "updatedAt">
): ValidationResult {
  const errors: string[] = [];

  // Validate project name
  if (!project.name.trim()) {
    errors.push("Project name is required");
  }

  // Validate code
  if (!project.code.trim()) {
    errors.push("Code is required");
  }

  // Validate language
  if (!project.language.trim()) {
    errors.push("Programming language is required");
  }

  // Count total lines in code
  const totalLines = project.code.split("\n").length;

  // Validate slides
  if (project.slides.length === 0) {
    errors.push("At least one slide is required");
  }

  // Validate each slide
  for (let i = 0; i < project.slides.length; i++) {
    const slide = project.slides[i];
    const slideValidation = validateSlide(slide, totalLines);

    if (!slideValidation.isValid) {
      errors.push(
        `Slide ${i + 1} (${slide.name}): ${slideValidation.errors.join(", ")}`
      );
    }
  }

  // Validate settings
  if (project.settings.globalSpeed <= 0) {
    errors.push("Global speed must be greater than 0");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get total lines count from code string
 */
export function getTotalLines(code: string): number {
  return code.split("\n").length;
}

/**
 * Extract lines from code based on line ranges
 */
export function extractLinesFromRanges(
  code: string,
  ranges: LineRange[]
): string[] {
  const lines = code.split("\n");
  const extractedLines: string[] = [];

  for (const range of ranges) {
    for (let i = range.start - 1; i < range.end; i++) {
      if (i >= 0 && i < lines.length) {
        extractedLines.push(lines[i]);
      }
    }
  }

  return extractedLines;
}

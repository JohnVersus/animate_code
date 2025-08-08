import {
  parseLineRanges,
  formatLineRanges,
  validateLineRanges,
  rangesOverlap,
  findOverlappingRanges,
  validateSlide,
  validateProject,
  getTotalLines,
  extractLinesFromRanges,
} from "../validation";
import { LineRange, Slide, Project, AnimationStyle } from "@/types";

describe("parseLineRanges", () => {
  it("should parse single line range", () => {
    const result = parseLineRanges("1-5");
    expect(result).toEqual([{ start: 1, end: 5 }]);
  });

  it("should parse multiple line ranges", () => {
    const result = parseLineRanges("1-5, 12-15");
    expect(result).toEqual([
      { start: 1, end: 5 },
      { start: 12, end: 15 },
    ]);
  });

  it("should parse single line numbers", () => {
    const result = parseLineRanges("3, 7, 10");
    expect(result).toEqual([
      { start: 3, end: 3 },
      { start: 7, end: 7 },
      { start: 10, end: 10 },
    ]);
  });

  it("should parse mixed ranges and single lines", () => {
    const result = parseLineRanges("1-3, 5, 8-10");
    expect(result).toEqual([
      { start: 1, end: 3 },
      { start: 5, end: 5 },
      { start: 8, end: 10 },
    ]);
  });

  it("should handle whitespace", () => {
    const result = parseLineRanges(" 1 - 5 , 12 - 15 ");
    expect(result).toEqual([
      { start: 1, end: 5 },
      { start: 12, end: 15 },
    ]);
  });

  it("should return empty array for empty string", () => {
    const result = parseLineRanges("");
    expect(result).toEqual([]);
  });

  it("should throw error for invalid range format", () => {
    expect(() => parseLineRanges("1-abc")).toThrow(
      "Invalid range format: 1-abc"
    );
  });

  it("should throw error for invalid line number", () => {
    expect(() => parseLineRanges("abc")).toThrow("Invalid line number: abc");
  });

  it("should throw error when start > end", () => {
    expect(() => parseLineRanges("5-3")).toThrow(
      "Invalid range: start (5) cannot be greater than end (3)"
    );
  });
});

describe("formatLineRanges", () => {
  it("should format single line range", () => {
    const result = formatLineRanges([{ start: 1, end: 5 }]);
    expect(result).toBe("1-5");
  });

  it("should format multiple line ranges", () => {
    const result = formatLineRanges([
      { start: 1, end: 5 },
      { start: 12, end: 15 },
    ]);
    expect(result).toBe("1-5, 12-15");
  });

  it("should format single line numbers", () => {
    const result = formatLineRanges([
      { start: 3, end: 3 },
      { start: 7, end: 7 },
    ]);
    expect(result).toBe("3, 7");
  });

  it("should format mixed ranges", () => {
    const result = formatLineRanges([
      { start: 1, end: 3 },
      { start: 5, end: 5 },
      { start: 8, end: 10 },
    ]);
    expect(result).toBe("1-3, 5, 8-10");
  });
});

describe("validateLineRanges", () => {
  it("should validate correct ranges", () => {
    const ranges = [
      { start: 1, end: 5 },
      { start: 8, end: 10 },
    ];
    const result = validateLineRanges(ranges, 15);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should reject empty ranges", () => {
    const result = validateLineRanges([], 10);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("At least one line range is required");
  });

  it("should reject ranges starting before line 1", () => {
    const ranges = [{ start: 0, end: 5 }];
    const result = validateLineRanges(ranges, 10);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Line range start (0) must be at least 1");
  });

  it("should reject ranges exceeding total lines", () => {
    const ranges = [{ start: 1, end: 15 }];
    const result = validateLineRanges(ranges, 10);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Line range end (15) exceeds total lines (10)"
    );
  });

  it("should reject ranges where start > end", () => {
    const ranges = [{ start: 8, end: 5 }];
    const result = validateLineRanges(ranges, 10);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Line range start (8) cannot be greater than end (5)"
    );
  });
});

describe("rangesOverlap", () => {
  it("should detect overlapping ranges", () => {
    const range1 = { start: 1, end: 5 };
    const range2 = { start: 3, end: 8 };
    expect(rangesOverlap(range1, range2)).toBe(true);
  });

  it("should detect adjacent ranges as non-overlapping", () => {
    const range1 = { start: 1, end: 5 };
    const range2 = { start: 6, end: 10 };
    expect(rangesOverlap(range1, range2)).toBe(false);
  });

  it("should detect touching ranges as overlapping", () => {
    const range1 = { start: 1, end: 5 };
    const range2 = { start: 5, end: 10 };
    expect(rangesOverlap(range1, range2)).toBe(true);
  });

  it("should detect non-overlapping ranges", () => {
    const range1 = { start: 1, end: 3 };
    const range2 = { start: 5, end: 8 };
    expect(rangesOverlap(range1, range2)).toBe(false);
  });
});

describe("findOverlappingRanges", () => {
  it("should find overlapping ranges", () => {
    const ranges = [
      { start: 1, end: 5 },
      { start: 3, end: 8 },
      { start: 10, end: 15 },
    ];
    const overlaps = findOverlappingRanges(ranges);
    expect(overlaps).toEqual([
      [
        { start: 1, end: 5 },
        { start: 3, end: 8 },
      ],
    ]);
  });

  it("should return empty array when no overlaps", () => {
    const ranges = [
      { start: 1, end: 3 },
      { start: 5, end: 7 },
      { start: 10, end: 15 },
    ];
    const overlaps = findOverlappingRanges(ranges);
    expect(overlaps).toEqual([]);
  });

  it("should find multiple overlaps", () => {
    const ranges = [
      { start: 1, end: 5 },
      { start: 3, end: 8 },
      { start: 7, end: 12 },
    ];
    const overlaps = findOverlappingRanges(ranges);
    expect(overlaps).toEqual([
      [
        { start: 1, end: 5 },
        { start: 3, end: 8 },
      ],
      [
        { start: 3, end: 8 },
        { start: 7, end: 12 },
      ],
    ]);
  });
});

describe("validateSlide", () => {
  const createValidSlide = (): Slide => ({
    id: "1",
    name: "Test Slide",
    lineRanges: [{ start: 1, end: 5 }],
    duration: 2000,
    animationStyle: "fade" as AnimationStyle,
    order: 1,
  });

  it("should validate correct slide", () => {
    const slide = createValidSlide();
    const result = validateSlide(slide, 10);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should reject slide with empty name", () => {
    const slide = { ...createValidSlide(), name: "" };
    const result = validateSlide(slide, 10);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Slide name is required");
  });

  it("should reject slide with zero duration", () => {
    const slide = { ...createValidSlide(), duration: 0 };
    const result = validateSlide(slide, 10);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Slide duration must be greater than 0");
  });

  it("should reject slide with invalid line ranges", () => {
    const slide = {
      ...createValidSlide(),
      lineRanges: [{ start: 1, end: 15 }],
    };
    const result = validateSlide(slide, 10);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Line range end (15) exceeds total lines (10)"
    );
  });

  it("should reject slide with overlapping ranges", () => {
    const slide = {
      ...createValidSlide(),
      lineRanges: [
        { start: 1, end: 5 },
        { start: 3, end: 8 },
      ],
    };
    const result = validateSlide(slide, 10);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("overlapping line ranges");
  });

  it("should reject slide with invalid animation style", () => {
    const slide = {
      ...createValidSlide(),
      animationStyle: "invalid" as AnimationStyle,
    };
    const result = validateSlide(slide, 10);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid animation style: invalid");
  });
});

describe("validateProject", () => {
  const createValidProject = () => ({
    name: "Test Project",
    code: 'console.log("hello");\nconsole.log("world");',
    language: "javascript",
    slides: [
      {
        id: "1",
        name: "Slide 1",
        lineRanges: [{ start: 1, end: 2 }],
        duration: 2000,
        animationStyle: "fade" as AnimationStyle,
        order: 1,
      },
    ],
    settings: {
      globalSpeed: 1,
      defaultAnimationStyle: "fade" as AnimationStyle,
      videoSettings: {
        resolution: "1080p" as const,
        frameRate: 30 as const,
        format: "mp4" as const,
      },
    },
  });

  it("should validate correct project", () => {
    const project = createValidProject();
    const result = validateProject(project);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should reject project with empty name", () => {
    const project = { ...createValidProject(), name: "" };
    const result = validateProject(project);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Project name is required");
  });

  it("should reject project with empty code", () => {
    const project = { ...createValidProject(), code: "" };
    const result = validateProject(project);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Code is required");
  });

  it("should reject project with empty language", () => {
    const project = { ...createValidProject(), language: "" };
    const result = validateProject(project);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Programming language is required");
  });

  it("should reject project with no slides", () => {
    const project = { ...createValidProject(), slides: [] };
    const result = validateProject(project);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("At least one slide is required");
  });

  it("should reject project with invalid global speed", () => {
    const project = {
      ...createValidProject(),
      settings: {
        ...createValidProject().settings,
        globalSpeed: 0,
      },
    };
    const result = validateProject(project);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Global speed must be greater than 0");
  });
});

describe("getTotalLines", () => {
  it("should count lines correctly", () => {
    const code = "line 1\nline 2\nline 3";
    expect(getTotalLines(code)).toBe(3);
  });

  it("should handle single line", () => {
    const code = "single line";
    expect(getTotalLines(code)).toBe(1);
  });

  it("should handle empty string", () => {
    const code = "";
    expect(getTotalLines(code)).toBe(1);
  });

  it("should handle trailing newline", () => {
    const code = "line 1\nline 2\n";
    expect(getTotalLines(code)).toBe(3);
  });
});

describe("extractLinesFromRanges", () => {
  const code = "line 1\nline 2\nline 3\nline 4\nline 5";

  it("should extract single range", () => {
    const ranges = [{ start: 2, end: 4 }];
    const result = extractLinesFromRanges(code, ranges);
    expect(result).toEqual(["line 2", "line 3", "line 4"]);
  });

  it("should extract multiple ranges", () => {
    const ranges = [
      { start: 1, end: 2 },
      { start: 4, end: 5 },
    ];
    const result = extractLinesFromRanges(code, ranges);
    expect(result).toEqual(["line 1", "line 2", "line 4", "line 5"]);
  });

  it("should extract single line", () => {
    const ranges = [{ start: 3, end: 3 }];
    const result = extractLinesFromRanges(code, ranges);
    expect(result).toEqual(["line 3"]);
  });

  it("should handle out of bounds ranges gracefully", () => {
    const ranges = [{ start: 1, end: 10 }];
    const result = extractLinesFromRanges(code, ranges);
    expect(result).toEqual(["line 1", "line 2", "line 3", "line 4", "line 5"]);
  });

  it("should return empty array for empty ranges", () => {
    const ranges: LineRange[] = [];
    const result = extractLinesFromRanges(code, ranges);
    expect(result).toEqual([]);
  });
});

import { Slide, LineRange, AnimationStyle } from "../types";
import {
  animationViewport,
  ScrollingWindowManager,
  ScrollAnimation,
} from "./viewportConfig";

/**
 * Decides whether to use actual line numbers or sequential numbering (1, 2, 3...).
 * Uses a density-based heuristic. If the visible lines are "dense" enough within their range,
 * it returns true, indicating that actual line numbers should be used.
 * @param lines - A sorted array of line objects, each with a `lineNumber` property.
 * @returns `true` if actual line numbers should be used, `false` otherwise.
 */
function shouldUseActualLineNumbers(lines: { lineNumber: number }[]): boolean {
  if (lines.length <= 1) {
    return true; // Single lines or empty arrays should use their actual number
  }

  const minLine = lines[0].lineNumber;
  const maxLine = lines[lines.length - 1].lineNumber;
  const lineRange = maxLine - minLine + 1;

  // If the number of lines is very close to the span of the range, they are dense.
  // This handles cases like `1-20, 23` where there's a small gap.
  // A density of 0.8 means that at least 80% of the lines in the range are present.
  const density = lines.length / lineRange;
  console.log({ density, lines: lines.length, lineRange });
  return density >= 0.8;
}

// Typewriter animation configuration
export interface TypewriterAnimationConfig {
  characterDelay: number; // milliseconds between characters
  lineDelay: number; // additional delay between lines
  sequentialOrder: boolean; // enforce left-to-right ordering
}

// Typewriter renderer for sequential character animation
export class TypewriterRenderer {
  private config: TypewriterAnimationConfig;

  constructor(
    config: TypewriterAnimationConfig = {
      characterDelay: 50,
      lineDelay: 200,
      sequentialOrder: true,
    }
  ) {
    this.config = config;
  }

  /**
   * Calculate which characters should be visible at a given progress
   * for proper left-to-right, top-to-bottom sequencing
   */
  calculateVisibleCharacters(
    lines: string[],
    progress: number,
    globalSpeed: number = 1.0
  ): Array<{
    lineIndex: number;
    visibleLength: number;
    isComplete: boolean;
  }> {
    if (!this.config.sequentialOrder) {
      // Fallback to simple per-line progress
      return lines.map((line, index) => ({
        lineIndex: index,
        visibleLength: Math.floor(line.length * progress),
        isComplete: progress >= 1,
      }));
    }

    // Adjust timing based on global speed
    const adjustedCharacterDelay = this.config.characterDelay / globalSpeed;
    const adjustedLineDelay = this.config.lineDelay / globalSpeed;

    // For sequential typing, we want each line to complete before the next starts
    // Calculate progress for each line individually

    const result: Array<{
      lineIndex: number;
      visibleLength: number;
      isComplete: boolean;
    }> = [];

    // Each line gets equal time in the animation
    const timePerLine = 1.0 / lines.length;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineStartProgress = lineIndex * timePerLine;
      const lineEndProgress = (lineIndex + 1) * timePerLine;

      if (progress <= lineStartProgress) {
        // Haven't reached this line yet
        result.push({
          lineIndex,
          visibleLength: 0,
          isComplete: false,
        });
      } else if (progress >= lineEndProgress) {
        // This line is complete
        result.push({
          lineIndex,
          visibleLength: line.length,
          isComplete: true,
        });
      } else {
        // Calculate progress within this line
        const lineProgress = (progress - lineStartProgress) / timePerLine;
        const visibleLength = Math.floor(line.length * lineProgress);

        result.push({
          lineIndex,
          visibleLength: Math.max(0, visibleLength),
          isComplete: false,
        });
      }
    }

    return result;
  }

  /**
   * Calculate typewriter progress for a specific line
   * ensuring each line completes before the next begins
   */
  calculateLineProgress(
    lineIndex: number,
    totalLines: number,
    globalProgress: number
  ): number {
    if (!this.config.sequentialOrder) {
      return globalProgress;
    }

    // Each line gets an equal portion of the animation time
    const lineProgressStep = 1 / totalLines;
    const lineStartProgress = lineIndex * lineProgressStep;
    const lineEndProgress = (lineIndex + 1) * lineProgressStep;

    if (globalProgress <= lineStartProgress) {
      return 0;
    } else if (globalProgress >= lineEndProgress) {
      return 1;
    } else {
      // Map global progress to line-specific progress
      return (globalProgress - lineStartProgress) / lineProgressStep;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TypewriterAnimationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): TypewriterAnimationConfig {
    return { ...this.config };
  }
}

/**
 * ScrollingRenderer class that handles 15-line window display
 * Implements requirements 12.1, 12.2, 12.3, 12.4, 12.6, 12.7
 */
export class ScrollingRenderer {
  private scrollingWindow: ScrollingWindowManager;

  constructor(maxLines: number = 15) {
    this.scrollingWindow = new ScrollingWindowManager(maxLines);
  }

  /**
   * Render lines within the scrolling window
   */
  renderWithScrolling(
    allLines: { lineNumber: number; content: string }[],
    targetLines?: number[]
  ): {
    visibleLines: {
      displayLineNumber: number;
      actualLineNumber: number;
      content: string;
    }[];
    scrollAnimation: ScrollAnimation;
    windowInfo: { startLine: number; endLine: number };
  } {
    if (allLines.length === 0) {
      return {
        visibleLines: [],
        scrollAnimation: {
          type: "none",
          duration: 0,
          fromWindow: { startLine: 1, endLine: 15 },
          toWindow: { startLine: 1, endLine: 15 },
        },
        windowInfo: { startLine: 1, endLine: 15 },
      };
    }

    // Get the highest line number to determine total lines
    const totalLines = Math.max(...allLines.map((line) => line.lineNumber));

    // Update scrolling window based on target lines or all lines
    const linesToConsider =
      targetLines && targetLines.length > 0
        ? targetLines
        : allLines.map((line) => line.lineNumber);

    const result = this.scrollingWindow.setWindowForLines(
      linesToConsider,
      totalLines
    );
    const window = this.scrollingWindow.getCurrentWindow();

    // Filter lines that are within the visible window
    const filteredLines = allLines
      .filter((line) => this.scrollingWindow.isLineVisible(line.lineNumber))
      .sort((a, b) => a.lineNumber - b.lineNumber);

    // Decide on numbering strategy based on line density
    const useActualNumbers = shouldUseActualLineNumbers(filteredLines);
    const visibleLines = filteredLines.map((line, index) => ({
      displayLineNumber: useActualNumbers ? line.lineNumber : index + 1,
      actualLineNumber: line.lineNumber,
      content: line.content,
    }));

    return {
      visibleLines,
      scrollAnimation: result.scrollAnimation,
      windowInfo: window,
    };
  }

  /**
   * Update window for slide transition
   */
  updateWindowForSlide(
    slide: Slide,
    allCodeLines: string[]
  ): {
    visibleLines: {
      displayLineNumber: number;
      actualLineNumber: number;
      content: string;
    }[];
    scrollAnimation: ScrollAnimation;
    windowInfo: { startLine: number; endLine: number };
  } {
    // Get all lines that should be visible for this slide
    const slideLines: { lineNumber: number; content: string }[] = [];

    for (const range of slide.lineRanges) {
      for (
        let i = range.start;
        i <= range.end && i <= allCodeLines.length;
        i++
      ) {
        slideLines.push({
          lineNumber: i,
          content: allCodeLines[i - 1] || "",
        });
      }
    }

    // Remove duplicates and sort
    const uniqueSlideLines = slideLines
      .filter(
        (line, index, array) =>
          array.findIndex((l) => l.lineNumber === line.lineNumber) === index
      )
      .sort((a, b) => a.lineNumber - b.lineNumber);

    // Get target line numbers for window positioning
    const targetLines = uniqueSlideLines.map((line) => line.lineNumber);

    // Use the scrolling window to determine which lines are visible
    const result = this.scrollingWindow.setWindowForLines(
      targetLines,
      allCodeLines.length
    );
    const window = this.scrollingWindow.getCurrentWindow();

    // Filter lines that are within the visible window
    const filteredLines = uniqueSlideLines
      .filter((line) => this.scrollingWindow.isLineVisible(line.lineNumber))
      .sort((a, b) => a.lineNumber - b.lineNumber);

    // Decide on numbering strategy based on line density
    const useActualNumbers = shouldUseActualLineNumbers(filteredLines);
    const visibleLines = filteredLines.map((line, index) => ({
      displayLineNumber: useActualNumbers ? line.lineNumber : index + 1,
      actualLineNumber: line.lineNumber,
      content: line.content,
    }));

    return {
      visibleLines,
      scrollAnimation: result.scrollAnimation,
      windowInfo: window,
    };
  }

  /**
   * Get current window information
   */
  getCurrentWindow(): { startLine: number; endLine: number } {
    return this.scrollingWindow.getCurrentWindow();
  }

  /**
   * Check if a line is currently visible
   */
  isLineVisible(lineNumber: number): boolean {
    return this.scrollingWindow.isLineVisible(lineNumber);
  }

  /**
   * Reset scrolling window to default position
   */
  reset(): void {
    this.scrollingWindow.reset();
  }

  /**
   * Get display line number for an actual line number
   */
  getDisplayLineNumber(actualLineNumber: number): number | null {
    return this.scrollingWindow.getDisplayLineNumber(actualLineNumber);
  }
}

export interface AnimationEngineService {
  createScene(code: string, language: string): any;
  renderStaticFrame(
    code: string,
    language: string,
    lineRanges: LineRange[]
  ): any;
  createAnimatedScene(
    code: string,
    language: string,
    slides: Slide[],
    globalSpeed?: number
  ): any;
  getSlideLines(
    slide: Slide,
    code: string
  ): { lineNumber: number; content: string }[];
  getCumulativeLines(
    slides: Slide[],
    upToSlideIndex: number,
    code?: string
  ): { lineNumber: number; content: string }[];
  getLineDiff(
    prevLines: { lineNumber: number; content: string }[],
    nextLines: { lineNumber: number; content: string }[]
  ): {
    added: { lineNumber: number; content: string }[];
    removed: { lineNumber: number; content: string }[];
    kept: { lineNumber: number; content: string }[];
  };
  getCodeLines(code: string): string[];
  getVisibleLines(
    code: string,
    lineRanges: LineRange[]
  ): { lineNumber: number; content: string }[];
  renderAnimationFrame(
    code: string,
    language: string,
    fromSlide: Slide | null,
    toSlide: Slide,
    progress: number,
    globalSpeed?: number
  ): any;
  // New methods for typewriter configuration
  updateTypewriterConfig(config: Partial<TypewriterAnimationConfig>): void;
  getTypewriterConfig(): TypewriterAnimationConfig;
  // Method to access scrolling renderer
  getScrollingRenderer(): ScrollingRenderer;
  // Method to get windowed line ranges for static preview
  getWindowedLineRanges(slide: Slide, code: string): LineRange[];
  // New method to get visible lines for a slide with correct display numbers
  getVisibleLinesForSlide(
    slide: Slide,
    code: string
  ): {
    displayLineNumber: number;
    actualLineNumber: number;
    content: string;
  }[];
}

export class MotionCanvasAnimationEngine implements AnimationEngineService {
  private readonly backgroundColor = "#1e1e1e";
  private readonly textColor = "#d4d4d4";
  private readonly typewriterRenderer: TypewriterRenderer;
  private readonly scrollingRenderer: ScrollingRenderer;

  // Syntax highlighting color scheme (VS Code Dark+ theme)
  private readonly colorScheme = {
    plain: "#d4d4d4",
    comment: "#6a9955",
    keyword: "#569cd6",
    string: "#ce9178",
    number: "#b5cea8",
    operator: "#d4d4d4",
    punctuation: "#d4d4d4",
    function: "#dcdcaa",
    "class-name": "#4ec9b0",
    variable: "#9cdcfe",
    property: "#9cdcfe",
    tag: "#569cd6",
    "attr-name": "#92c5f8",
    "attr-value": "#ce9178",
    regex: "#d16969",
    important: "#569cd6",
    bold: "#d4d4d4",
    italic: "#d4d4d4",
  };

  constructor() {
    this.typewriterRenderer = new TypewriterRenderer({
      characterDelay: 50,
      lineDelay: 200,
      sequentialOrder: true,
    });
    this.scrollingRenderer = new ScrollingRenderer(15);
  }

  createScene(code: string, language: string) {
    const lines = this.getCodeLines(code);
    const fontSettings = animationViewport.getFontSettings();
    const { width, height } = animationViewport.calculateDimensions();

    return {
      type: "code-scene",
      code,
      language,
      lines,
      config: {
        fontSize: fontSettings.fontSize,
        lineHeight: fontSettings.lineHeight,
        fontFamily: fontSettings.fontFamily,
        backgroundColor: this.backgroundColor,
        colorScheme: this.colorScheme,
        width,
        height,
      },
    };
  }

  renderStaticFrame(code: string, language: string, lineRanges: LineRange[]) {
    const visibleLines = this.getVisibleLines(code, lineRanges);

    // Use scrolling renderer for consistent 15-line window display
    const scrollingResult = this.scrollingRenderer.renderWithScrolling(
      visibleLines,
      visibleLines.map((line) => line.lineNumber)
    );

    const fontSettings = animationViewport.getFontSettings();
    const { width, height } = animationViewport.calculateDimensions();

    return {
      type: "static-frame",
      code,
      language,
      visibleLines: scrollingResult.visibleLines,
      visibleLinesSequential: scrollingResult.visibleLines, // Same as visibleLines now with scrolling
      lineRanges,
      scrollingInfo: {
        windowInfo: scrollingResult.windowInfo,
        scrollAnimation: scrollingResult.scrollAnimation,
      },
      config: {
        fontSize: fontSettings.fontSize,
        lineHeight: fontSettings.lineHeight,
        fontFamily: fontSettings.fontFamily,
        backgroundColor: this.backgroundColor,
        colorScheme: this.colorScheme,
        width,
        height,
      },
    };
  }

  createAnimatedScene(
    code: string,
    language: string,
    slides: Slide[],
    globalSpeed: number = 1.0
  ) {
    // Reset the scrolling renderer to ensure a clean state for each new animation
    this.scrollingRenderer.reset();

    // Return animation configuration with slide transitions
    const animationSteps = this.calculateAnimationSteps(
      code,
      slides,
      globalSpeed
    );
    const fontSettings = animationViewport.getFontSettings();
    const { width, height } = animationViewport.calculateDimensions();

    return {
      type: "animated-scene",
      code,
      language,
      slides,
      animationSteps,
      totalDuration: slides.reduce(
        (sum, slide) => sum + slide.duration / globalSpeed,
        0
      ),
      globalSpeed,
      config: {
        fontSize: fontSettings.fontSize,
        lineHeight: fontSettings.lineHeight,
        fontFamily: fontSettings.fontFamily,
        backgroundColor: this.backgroundColor,
        colorScheme: this.colorScheme,
        width,
        height,
      },
    };
  }

  private calculateAnimationSteps(
    code: string,
    slides: Slide[],
    globalSpeed: number = 1.0
  ) {
    const steps = [];
    let currentVisibleActualLines: Set<number> = new Set();
    let accumulatedTime = 0;

    for (let slideIndex = 0; slideIndex < slides.length; slideIndex++) {
      const slide = slides[slideIndex];
      // Use per-slide absolute display logic instead of cumulative
      const slideLines = this.getSlideLines(slide, code);
      const slideLinesSequential = this.getSlideLinesSequential(slide, code);
      const nextVisibleActualLines = new Set(
        slideLines.map((l) => l.lineNumber)
      );

      // Calculate what actual lines to add/remove
      const actualLinesToAdd = Array.from(nextVisibleActualLines).filter(
        (line) => !currentVisibleActualLines.has(line)
      );
      const actualLinesToRemove = Array.from(currentVisibleActualLines).filter(
        (line) => !nextVisibleActualLines.has(line)
      );

      const adjustedDuration = slide.duration / globalSpeed;

      steps.push({
        slideIndex,
        startTime: accumulatedTime,
        duration: adjustedDuration,
        animationStyle: slide.animationStyle,
        linesToAdd: actualLinesToAdd,
        linesToRemove: actualLinesToRemove,
        visibleLines: Array.from(nextVisibleActualLines).sort((a, b) => a - b),
        slideLines,
        slideLinesSequential,
      });

      currentVisibleActualLines = nextVisibleActualLines;
      accumulatedTime += adjustedDuration;
    }

    return steps;
  }

  getSlideLines(
    slide: Slide,
    code: string
  ): { lineNumber: number; content: string }[] {
    // Get lines for a specific slide only (absolute display logic)
    return this.getVisibleLines(code, slide.lineRanges);
  }

  /**
   * Get slide lines with sequential numbering for display
   * This ensures line numbers are shown as 1, 2, 3... instead of actual line numbers
   */
  getSlideLinesSequential(
    slide: Slide,
    code: string
  ): {
    displayLineNumber: number;
    actualLineNumber: number;
    content: string;
  }[] {
    const visibleLines = this.getVisibleLines(code, slide.lineRanges);
    // Use sequential numbering (1, 2, 3...) for display
    return visibleLines.map((line, index) => ({
      displayLineNumber: index + 1, // Sequential numbering
      actualLineNumber: line.lineNumber,
      content: line.content,
    }));
  }

  getCumulativeLines(
    slides: Slide[],
    upToSlideIndex: number,
    code?: string
  ): { lineNumber: number; content: string }[] {
    // This method is kept for preview purposes only
    // For actual animations, use getSlideLines for per-slide absolute display
    const allLineNumbers = new Set<number>();

    // Collect all line numbers from slides up to the specified index
    for (let i = 0; i <= upToSlideIndex && i < slides.length; i++) {
      const slide = slides[i];
      for (const range of slide.lineRanges) {
        for (let lineNum = range.start; lineNum <= range.end; lineNum++) {
          allLineNumbers.add(lineNum);
        }
      }
    }

    // Convert to sorted array with content
    const sortedLineNumbers = Array.from(allLineNumbers).sort((a, b) => a - b);
    const allLines = code ? this.getCodeLines(code) : [];

    return sortedLineNumbers.map((lineNumber) => ({
      lineNumber,
      content: allLines[lineNumber - 1] || "",
    }));
  }

  getLineDiff(
    prevLines: { lineNumber: number; content: string }[],
    nextLines: { lineNumber: number; content: string }[]
  ) {
    const prevSet = new Set(prevLines.map((l) => l.lineNumber));
    const nextSet = new Set(nextLines.map((l) => l.lineNumber));

    const added = nextLines.filter((line) => !prevSet.has(line.lineNumber));
    const removed = prevLines.filter((line) => !nextSet.has(line.lineNumber));
    const kept = nextLines.filter((line) => prevSet.has(line.lineNumber));

    return { added, removed, kept };
  }

  private getTokenColor(tokenType: string): string {
    return (
      this.colorScheme[tokenType as keyof typeof this.colorScheme] ||
      this.colorScheme.plain
    );
  }

  getCodeLines(code: string): string[] {
    return code.split("\n");
  }

  getVisibleLines(
    code: string,
    lineRanges: LineRange[]
  ): { lineNumber: number; content: string }[] {
    const lines = this.getCodeLines(code);
    const visibleLines: { lineNumber: number; content: string }[] = [];

    for (const range of lineRanges) {
      for (
        let i = range.start - 1;
        i < Math.min(range.end, lines.length);
        i++
      ) {
        if (i >= 0) {
          visibleLines.push({
            lineNumber: i + 1,
            content: lines[i] || "",
          });
        }
      }
    }

    // Sort by line number and remove duplicates
    const uniqueLines = visibleLines
      .filter(
        (line, index, array) =>
          array.findIndex((l) => l.lineNumber === line.lineNumber) === index
      )
      .sort((a, b) => a.lineNumber - b.lineNumber);

    return uniqueLines;
  }

  /**
   * Convert lines with actual line numbers to sequential display format
   */
  getSequentialLines(lines: { lineNumber: number; content: string }[]): {
    displayLineNumber: number;
    actualLineNumber: number;
    content: string;
  }[] {
    return lines.map((line, index) => ({
      displayLineNumber: index + 1,
      actualLineNumber: line.lineNumber,
      content: line.content,
    }));
  }

  /**
   * Get visible lines with sequential numbering for display
   * This ensures line numbers are shown as 1, 2, 3... instead of actual line numbers
   */
  getVisibleLinesSequential(
    code: string,
    lineRanges: LineRange[]
  ): {
    displayLineNumber: number;
    actualLineNumber: number;
    content: string;
  }[] {
    const visibleLines = this.getVisibleLines(code, lineRanges);
    // Use sequential numbering (1, 2, 3...) for display
    return visibleLines.map((line, index) => ({
      displayLineNumber: index + 1, // Sequential numbering
      actualLineNumber: line.lineNumber,
      content: line.content,
    }));
  }

  renderAnimationFrame(
    code: string,
    language: string,
    fromSlide: Slide | null,
    toSlide: Slide,
    progress: number,
    globalSpeed: number = 1.0
  ): any {
    const fromLines = fromSlide ? this.getSlideLines(fromSlide, code) : [];
    const toLines = this.getSlideLines(toSlide, code);
    const diff = this.getLineDiff(fromLines, toLines);

    // Use scrolling renderer to get properly windowed lines
    const allCodeLines = this.getCodeLines(code);
    const scrollingResult = this.scrollingRenderer.updateWindowForSlide(
      toSlide,
      allCodeLines
    );

    // Apply global speed to animation timing
    const adjustedProgress = Math.min(1, progress * globalSpeed);

    const fontSettings = animationViewport.getFontSettings();
    const { width, height } = animationViewport.calculateDimensions();

    // Calculate rendered lines with scrolling window applied
    const renderedLines = this.calculateRenderedLinesWithScrolling(
      diff,
      scrollingResult.visibleLines,
      toSlide.animationStyle,
      adjustedProgress,
      globalSpeed
    );

    return {
      type: "animation-frame",
      code,
      language,
      fromSlide,
      toSlide,
      progress: adjustedProgress,
      animationStyle: toSlide.animationStyle,
      diff,
      renderedLines,
      scrollingInfo: {
        windowInfo: scrollingResult.windowInfo,
        scrollAnimation: scrollingResult.scrollAnimation,
      },
      config: {
        fontSize: fontSettings.fontSize,
        lineHeight: fontSettings.lineHeight,
        fontFamily: fontSettings.fontFamily,
        backgroundColor: this.backgroundColor,
        colorScheme: this.colorScheme,
        width,
        height,
      },
    };
  }

  private calculateRenderedLines(
    diff: {
      added: { lineNumber: number; content: string }[];
      removed: { lineNumber: number; content: string }[];
      kept: { lineNumber: number; content: string }[];
    },
    animationStyle: AnimationStyle,
    progress: number
  ): Array<{
    lineNumber: number;
    content: string;
    opacity: number;
    animationState: "entering" | "leaving" | "stable";
    animationProgress: number;
    lineNumberOpacity: number;
    lineNumberAnimationState: "entering" | "leaving" | "stable";
    lineNumberAnimationProgress: number;
  }> {
    const renderedLines: Array<{
      lineNumber: number;
      content: string;
      opacity: number;
      animationState: "entering" | "leaving" | "stable";
      animationProgress: number;
      lineNumberOpacity: number;
      lineNumberAnimationState: "entering" | "leaving" | "stable";
      lineNumberAnimationProgress: number;
    }> = [];

    // Handle kept lines (always visible)
    diff.kept.forEach((line) => {
      renderedLines.push({
        ...line,
        opacity: 1,
        animationState: "stable",
        animationProgress: 1,
        lineNumberOpacity: 1,
        lineNumberAnimationState: "stable",
        lineNumberAnimationProgress: 1,
      });
    });

    // Handle removed lines (fade out)
    diff.removed.forEach((line) => {
      const codeOpacity = this.calculateLineOpacity(
        animationStyle,
        progress,
        "leaving"
      );
      const lineNumberOpacity = this.calculateLineNumberOpacity(
        progress,
        "leaving"
      );

      if (codeOpacity > 0 || lineNumberOpacity > 0) {
        renderedLines.push({
          ...line,
          opacity: codeOpacity,
          animationState: "leaving",
          animationProgress: progress,
          lineNumberOpacity,
          lineNumberAnimationState: "leaving",
          lineNumberAnimationProgress: progress,
        });
      }
    });

    // Handle added lines (fade in with style)
    diff.added.forEach((line) => {
      const codeOpacity = this.calculateLineOpacity(
        animationStyle,
        progress,
        "entering"
      );
      const lineNumberOpacity = this.calculateLineNumberOpacity(
        progress,
        "entering"
      );

      if (codeOpacity > 0 || lineNumberOpacity > 0) {
        renderedLines.push({
          ...line,
          opacity: codeOpacity,
          animationState: "entering",
          animationProgress: progress,
          lineNumberOpacity,
          lineNumberAnimationState: "entering",
          lineNumberAnimationProgress: progress,
        });
      }
    });

    // Sort by line number
    return renderedLines.sort((a, b) => a.lineNumber - b.lineNumber);
  }

  private calculateRenderedLinesSequential(
    diff: {
      added: { lineNumber: number; content: string }[];
      removed: { lineNumber: number; content: string }[];
      kept: { lineNumber: number; content: string }[];
    },
    fromLinesSequential: {
      displayLineNumber: number;
      actualLineNumber: number;
      content: string;
    }[],
    toLinesSequential: {
      displayLineNumber: number;
      actualLineNumber: number;
      content: string;
    }[],
    animationStyle: AnimationStyle,
    progress: number,
    globalSpeed: number = 1.0
  ): Array<{
    displayLineNumber: number;
    actualLineNumber: number;
    content: string;
    opacity: number;
    animationState: "entering" | "leaving" | "stable";
    animationProgress: number;
    lineNumberOpacity: number;
    lineNumberAnimationState: "entering" | "leaving" | "stable";
    lineNumberAnimationProgress: number;
    typewriterProgress?: number; // Add typewriter-specific progress
  }> {
    const renderedLines: Array<{
      displayLineNumber: number;
      actualLineNumber: number;
      content: string;
      opacity: number;
      animationState: "entering" | "leaving" | "stable";
      animationProgress: number;
      lineNumberOpacity: number;
      lineNumberAnimationState: "entering" | "leaving" | "stable";
      lineNumberAnimationProgress: number;
      typewriterProgress?: number; // Add typewriter-specific progress
    }> = [];

    // For typewriter animation, calculate sequential character visibility
    let typewriterVisibility: Array<{
      lineIndex: number;
      visibleLength: number;
      isComplete: boolean;
    }> = [];

    if (animationStyle === "typewriter" && diff.added.length > 0) {
      const addedLines = diff.added.map((line) => line.content);
      typewriterVisibility = this.typewriterRenderer.calculateVisibleCharacters(
        addedLines,
        progress,
        globalSpeed || 1.0
      );
    }

    // Create mapping from actual line numbers to sequential display numbers
    const actualToDisplayMap = new Map<number, number>();
    toLinesSequential.forEach((line) => {
      actualToDisplayMap.set(line.actualLineNumber, line.displayLineNumber);
    });

    // Handle kept lines (always visible) - use sequential numbering
    diff.kept.forEach((line) => {
      const displayLineNumber =
        actualToDisplayMap.get(line.lineNumber) || line.lineNumber;
      renderedLines.push({
        displayLineNumber,
        actualLineNumber: line.lineNumber,
        content: line.content,
        opacity: 1,
        animationState: "stable",
        animationProgress: 1,
        lineNumberOpacity: 1,
        lineNumberAnimationState: "stable",
        lineNumberAnimationProgress: 1,
      });
    });

    // Handle removed lines (fade out) - use sequential numbering from previous state
    const fromActualToDisplayMap = new Map<number, number>();
    fromLinesSequential.forEach((line) => {
      fromActualToDisplayMap.set(line.actualLineNumber, line.displayLineNumber);
    });

    diff.removed.forEach((line) => {
      const codeOpacity = this.calculateLineOpacity(
        animationStyle,
        progress,
        "leaving"
      );
      const lineNumberOpacity = this.calculateLineNumberOpacity(
        progress,
        "leaving"
      );

      if (codeOpacity > 0 || lineNumberOpacity > 0) {
        const displayLineNumber =
          fromActualToDisplayMap.get(line.lineNumber) || line.lineNumber;
        renderedLines.push({
          displayLineNumber,
          actualLineNumber: line.lineNumber,
          content: line.content,
          opacity: codeOpacity,
          animationState: "leaving",
          animationProgress: progress,
          lineNumberOpacity,
          lineNumberAnimationState: "leaving",
          lineNumberAnimationProgress: progress,
        });
      }
    });

    // Handle added lines (fade in with style) - use sequential numbering
    diff.added.forEach((line, addedIndex) => {
      const codeOpacity = this.calculateLineOpacity(
        animationStyle,
        progress,
        "entering"
      );
      const lineNumberOpacity = this.calculateLineNumberOpacity(
        progress,
        "entering"
      );

      if (codeOpacity > 0 || lineNumberOpacity > 0) {
        const displayLineNumber =
          actualToDisplayMap.get(line.lineNumber) || line.lineNumber;

        // Calculate typewriter progress for this specific line
        let typewriterProgress = progress;
        if (
          animationStyle === "typewriter" &&
          typewriterVisibility[addedIndex]
        ) {
          const visibility = typewriterVisibility[addedIndex];
          typewriterProgress =
            visibility.visibleLength / Math.max(1, line.content.length);
        }

        renderedLines.push({
          displayLineNumber,
          actualLineNumber: line.lineNumber,
          content: line.content,
          opacity: codeOpacity,
          animationState: "entering",
          animationProgress: progress,
          lineNumberOpacity,
          lineNumberAnimationState: "entering",
          lineNumberAnimationProgress: progress,
          typewriterProgress,
        });
      }
    });

    // Sort by display line number for proper sequential display
    return renderedLines.sort(
      (a, b) => a.displayLineNumber - b.displayLineNumber
    );
  }

  /**
   * Update typewriter animation configuration
   */
  updateTypewriterConfig(config: Partial<TypewriterAnimationConfig>): void {
    this.typewriterRenderer.updateConfig(config);
  }

  /**
   * Get current typewriter animation configuration
   */
  getTypewriterConfig(): TypewriterAnimationConfig {
    return this.typewriterRenderer.getConfig();
  }

  /**
   * Get the scrolling renderer instance for external use
   */
  getScrollingRenderer(): ScrollingRenderer {
    return this.scrollingRenderer;
  }

  /**
   * Get windowed line ranges for a slide (respects 15-line scrolling window)
   * This is used for static preview to match animation behavior
   */
  getWindowedLineRanges(slide: Slide, code: string): LineRange[] {
    const allCodeLines = this.getCodeLines(code);
    const slideLines = this.getSlideLines(slide, code);

    // Use the scrolling renderer to get the windowed lines
    const scrollingResult = this.scrollingRenderer.renderWithScrolling(
      slideLines,
      slideLines.map((line) => line.lineNumber)
    );

    // Convert to line ranges for the canvas renderer
    return scrollingResult.visibleLines.map((line) => ({
      start: line.actualLineNumber,
      end: line.actualLineNumber,
    }));
  }

  /**
   * Get visible lines for a slide with correct display numbers, respecting the scrolling window.
   * This is used for rendering static previews.
   */
  getVisibleLinesForSlide(
    slide: Slide,
    code: string
  ): {
    displayLineNumber: number;
    actualLineNumber: number;
    content: string;
  }[] {
    const slideLines = this.getSlideLines(slide, code);

    // Use the scrolling renderer to get the windowed and correctly numbered lines
    const scrollingResult = this.scrollingRenderer.renderWithScrolling(
      slideLines,
      slideLines.map((line) => line.lineNumber)
    );

    return scrollingResult.visibleLines;
  }

  /**
   * Render animation frame using a specific viewport configuration
   * Used for video export with different dimensions than preview
   */
  renderAnimationFrameWithViewport(
    code: string,
    language: string,
    fromSlide: Slide | null,
    toSlide: Slide,
    progress: number,
    viewport: any,
    globalSpeed: number = 1.0
  ): any {
    const fromLines = fromSlide ? this.getSlideLines(fromSlide, code) : [];
    const toLines = this.getSlideLines(toSlide, code);
    const diff = this.getLineDiff(fromLines, toLines);

    // Use scrolling renderer to get properly windowed lines
    const allCodeLines = this.getCodeLines(code);
    const scrollingResult = this.scrollingRenderer.updateWindowForSlide(
      toSlide,
      allCodeLines
    );

    // Apply global speed to animation timing
    const adjustedProgress = Math.min(1, progress * globalSpeed);

    const fontSettings = viewport.getFontSettings();
    const { width, height } = viewport.calculateDimensions();

    // Calculate rendered lines with scrolling window applied
    const renderedLines = this.calculateRenderedLinesWithScrolling(
      diff,
      scrollingResult.visibleLines,
      toSlide.animationStyle,
      adjustedProgress,
      globalSpeed
    );

    return {
      type: "animation-frame",
      code,
      language,
      fromSlide,
      toSlide,
      progress: adjustedProgress,
      animationStyle: toSlide.animationStyle,
      diff,
      renderedLines,
      scrollingInfo: {
        windowInfo: scrollingResult.windowInfo,
        scrollAnimation: scrollingResult.scrollAnimation,
      },
      config: {
        fontSize: fontSettings.fontSize,
        lineHeight: fontSettings.lineHeight,
        fontFamily: fontSettings.fontFamily,
        backgroundColor: this.backgroundColor,
        colorScheme: this.colorScheme,
        width,
        height,
      },
    };
  }

  private calculateLineOpacity(
    animationStyle: AnimationStyle,
    progress: number,
    state: "entering" | "leaving"
  ): number {
    // Line numbers appear first (100-200ms), then code content follows
    const lineNumberPhase = 0.15; // First 15% of animation is for line numbers
    const codePhase = 1 - lineNumberPhase; // Remaining 85% for code content

    // Adjust progress for code content phase
    const codeProgress = Math.max(0, (progress - lineNumberPhase) / codePhase);

    switch (animationStyle) {
      case "fade":
        return state === "entering" ? codeProgress : 1 - codeProgress;

      case "slide":
        // Slide animation with fade
        return state === "entering"
          ? Math.min(1, codeProgress * 1.5)
          : Math.max(0, 1 - codeProgress * 1.5);

      case "typewriter":
        // Typewriter effect - smooth opacity for sequential character animation
        return state === "entering" ? codeProgress : 1 - codeProgress;

      case "highlight":
        // Highlight style with quick transitions
        return state === "entering"
          ? codeProgress > 0.2
            ? 1
            : codeProgress * 5
          : codeProgress < 0.8
          ? 1
          : (1 - codeProgress) * 5;

      default:
        return state === "entering" ? codeProgress : 1 - codeProgress;
    }
  }

  private calculateLineNumberOpacity(
    progress: number,
    state: "entering" | "leaving"
  ): number {
    // Line numbers have their own timing - appear in first 15% of animation
    const lineNumberPhase = 0.15;

    if (state === "entering") {
      // Line numbers fade in during first 15% of animation (100-200ms at typical speeds)
      const lineNumberProgress = Math.min(1, progress / lineNumberPhase);
      return lineNumberProgress;
    } else {
      // Line numbers fade out during last 15% of animation
      const lineNumberProgress = Math.max(
        0,
        (progress - (1 - lineNumberPhase)) / lineNumberPhase
      );
      return 1 - lineNumberProgress;
    }
  }

  /**
   * Calculate rendered lines with scrolling window applied
   * This method handles the 15-line window and ensures proper line numbering
   */
  private calculateRenderedLinesWithScrolling(
    diff: {
      added: { lineNumber: number; content: string }[];
      removed: { lineNumber: number; content: string }[];
      kept: { lineNumber: number; content: string }[];
    },
    visibleLines: {
      displayLineNumber: number;
      actualLineNumber: number;
      content: string;
    }[],
    animationStyle: AnimationStyle,
    progress: number,
    globalSpeed: number = 1.0
  ): Array<{
    displayLineNumber: number;
    actualLineNumber: number;
    content: string;
    opacity: number;
    animationState: "entering" | "leaving" | "stable";
    animationProgress: number;
    lineNumberOpacity: number;
    lineNumberAnimationState: "entering" | "leaving" | "stable";
    lineNumberAnimationProgress: number;
    typewriterProgress?: number;
  }> {
    const renderedLines: Array<{
      displayLineNumber: number;
      actualLineNumber: number;
      content: string;
      opacity: number;
      animationState: "entering" | "leaving" | "stable";
      animationProgress: number;
      lineNumberOpacity: number;
      lineNumberAnimationState: "entering" | "leaving" | "stable";
      lineNumberAnimationProgress: number;
      typewriterProgress?: number;
    }> = [];

    // Create sets for quick lookup
    const addedLineNumbers = new Set(diff.added.map((line) => line.lineNumber));
    const removedLineNumbers = new Set(
      diff.removed.map((line) => line.lineNumber)
    );
    const keptLineNumbers = new Set(diff.kept.map((line) => line.lineNumber));

    // For typewriter animation, calculate sequential character visibility
    let typewriterVisibility: Array<{
      lineIndex: number;
      visibleLength: number;
      isComplete: boolean;
    }> = [];

    if (animationStyle === "typewriter" && diff.added.length > 0) {
      const addedLines = diff.added.map((line) => line.content);
      typewriterVisibility = this.typewriterRenderer.calculateVisibleCharacters(
        addedLines,
        progress,
        globalSpeed || 1.0
      );
    }

    // Process each visible line in the scrolling window
    visibleLines.forEach((line) => {
      let animationState: "entering" | "leaving" | "stable" = "stable";
      let codeOpacity = 1;
      let lineNumberOpacity = 1;
      let typewriterProgress = progress;

      // Determine animation state based on diff
      if (addedLineNumbers.has(line.actualLineNumber)) {
        animationState = "entering";
        codeOpacity = this.calculateLineOpacity(
          animationStyle,
          progress,
          "entering"
        );
        lineNumberOpacity = this.calculateLineNumberOpacity(
          progress,
          "entering"
        );

        // Calculate typewriter progress for this specific line
        if (animationStyle === "typewriter") {
          const addedIndex = diff.added.findIndex(
            (addedLine) => addedLine.lineNumber === line.actualLineNumber
          );
          if (addedIndex >= 0 && typewriterVisibility[addedIndex]) {
            const visibility = typewriterVisibility[addedIndex];
            typewriterProgress =
              visibility.visibleLength / Math.max(1, line.content.length);
          }
        }
      } else if (removedLineNumbers.has(line.actualLineNumber)) {
        animationState = "leaving";
        codeOpacity = this.calculateLineOpacity(
          animationStyle,
          progress,
          "leaving"
        );
        lineNumberOpacity = this.calculateLineNumberOpacity(
          progress,
          "leaving"
        );
      } else if (keptLineNumbers.has(line.actualLineNumber)) {
        animationState = "stable";
        codeOpacity = 1;
        lineNumberOpacity = 1;
      }

      // Only add lines that have some opacity (visible)
      if (codeOpacity > 0 || lineNumberOpacity > 0) {
        renderedLines.push({
          displayLineNumber: line.displayLineNumber,
          actualLineNumber: line.actualLineNumber,
          content: line.content,
          opacity: codeOpacity,
          animationState,
          animationProgress: progress,
          lineNumberOpacity,
          lineNumberAnimationState: animationState,
          lineNumberAnimationProgress: progress,
          typewriterProgress,
        });
      }
    });

    // Sort by display line number for proper sequential display
    return renderedLines.sort(
      (a, b) => a.displayLineNumber - b.displayLineNumber
    );
  }
}

// Export singleton instance
export const animationEngine = new MotionCanvasAnimationEngine();

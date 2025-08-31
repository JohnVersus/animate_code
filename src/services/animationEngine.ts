import { syntaxHighlightingService, Token } from "./syntaxHighlighting";
import { Slide, LineRange, AnimationStyle } from "../types";

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
}

export class MotionCanvasAnimationEngine implements AnimationEngineService {
  private readonly fontSize = 16;
  private readonly lineHeight = 24;
  private readonly fontFamily = "JetBrains Mono, Monaco, Consolas, monospace";
  private readonly backgroundColor = "#1e1e1e";
  private readonly textColor = "#d4d4d4";

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

  createScene(code: string, language: string) {
    const lines = this.getCodeLines(code);

    return {
      type: "code-scene",
      code,
      language,
      lines,
      config: {
        fontSize: this.fontSize,
        lineHeight: this.lineHeight,
        fontFamily: this.fontFamily,
        backgroundColor: this.backgroundColor,
        colorScheme: this.colorScheme,
      },
    };
  }

  renderStaticFrame(code: string, language: string, lineRanges: LineRange[]) {
    const visibleLines = this.getVisibleLines(code, lineRanges);
    const visibleLinesSequential = this.getVisibleLinesSequential(
      code,
      lineRanges
    );

    return {
      type: "static-frame",
      code,
      language,
      visibleLines,
      visibleLinesSequential,
      lineRanges,
      config: {
        fontSize: this.fontSize,
        lineHeight: this.lineHeight,
        fontFamily: this.fontFamily,
        backgroundColor: this.backgroundColor,
        colorScheme: this.colorScheme,
      },
    };
  }

  createAnimatedScene(
    code: string,
    language: string,
    slides: Slide[],
    globalSpeed: number = 1.0
  ) {
    // Return animation configuration with slide transitions
    const animationSteps = this.calculateAnimationSteps(
      code,
      slides,
      globalSpeed
    );

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
        fontSize: this.fontSize,
        lineHeight: this.lineHeight,
        fontFamily: this.fontFamily,
        backgroundColor: this.backgroundColor,
        colorScheme: this.colorScheme,
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
    return this.getSequentialLines(visibleLines);
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
    return this.getSequentialLines(visibleLines);
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

    // Get sequential lines for proper display numbering
    const fromLinesSequential = fromSlide
      ? this.getSlideLinesSequential(fromSlide, code)
      : [];
    const toLinesSequential = this.getSlideLinesSequential(toSlide, code);

    // Apply global speed to animation timing
    const adjustedProgress = Math.min(1, progress * globalSpeed);

    return {
      type: "animation-frame",
      code,
      language,
      fromSlide,
      toSlide,
      progress: adjustedProgress,
      animationStyle: toSlide.animationStyle,
      diff,
      renderedLines: this.calculateRenderedLinesSequential(
        diff,
        fromLinesSequential,
        toLinesSequential,
        toSlide.animationStyle,
        adjustedProgress
      ),
      config: {
        fontSize: this.fontSize,
        lineHeight: this.lineHeight,
        fontFamily: this.fontFamily,
        backgroundColor: this.backgroundColor,
        colorScheme: this.colorScheme,
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
    progress: number
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
    }> = [];

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
        const displayLineNumber =
          actualToDisplayMap.get(line.lineNumber) || line.lineNumber;
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
        });
      }
    });

    // Sort by display line number for proper sequential display
    return renderedLines.sort(
      (a, b) => a.displayLineNumber - b.displayLineNumber
    );
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
        // Typewriter effect - lines appear/disappear more abruptly
        return state === "entering"
          ? codeProgress > 0.3
            ? 1
            : 0
          : codeProgress < 0.7
          ? 1
          : 0;

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
}

// Export singleton instance
export const animationEngine = new MotionCanvasAnimationEngine();

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

    return {
      type: "static-frame",
      code,
      language,
      visibleLines,
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
    let currentVisibleLines: Set<number> = new Set();
    let accumulatedTime = 0;

    for (let slideIndex = 0; slideIndex < slides.length; slideIndex++) {
      const slide = slides[slideIndex];
      // Use per-slide absolute display logic instead of cumulative
      const slideLines = this.getSlideLines(slide, code);
      const nextVisibleLines = new Set(slideLines.map((l) => l.lineNumber));

      // Calculate what lines to add/remove
      const linesToAdd = Array.from(nextVisibleLines).filter(
        (line) => !currentVisibleLines.has(line)
      );
      const linesToRemove = Array.from(currentVisibleLines).filter(
        (line) => !nextVisibleLines.has(line)
      );

      const adjustedDuration = slide.duration / globalSpeed;

      steps.push({
        slideIndex,
        startTime: accumulatedTime,
        duration: adjustedDuration,
        animationStyle: slide.animationStyle,
        linesToAdd,
        linesToRemove,
        visibleLines: Array.from(nextVisibleLines).sort((a, b) => a - b),
        slideLines,
      });

      currentVisibleLines = nextVisibleLines;
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
      renderedLines: this.calculateRenderedLines(
        diff,
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
  }> {
    const renderedLines: Array<{
      lineNumber: number;
      content: string;
      opacity: number;
      animationState: "entering" | "leaving" | "stable";
      animationProgress: number;
    }> = [];

    // Handle kept lines (always visible)
    diff.kept.forEach((line) => {
      renderedLines.push({
        ...line,
        opacity: 1,
        animationState: "stable",
        animationProgress: 1,
      });
    });

    // Handle removed lines (fade out)
    diff.removed.forEach((line) => {
      const opacity = this.calculateLineOpacity(
        animationStyle,
        progress,
        "leaving"
      );
      if (opacity > 0) {
        renderedLines.push({
          ...line,
          opacity,
          animationState: "leaving",
          animationProgress: progress,
        });
      }
    });

    // Handle added lines (fade in with style)
    diff.added.forEach((line) => {
      const opacity = this.calculateLineOpacity(
        animationStyle,
        progress,
        "entering"
      );
      if (opacity > 0) {
        renderedLines.push({
          ...line,
          opacity,
          animationState: "entering",
          animationProgress: progress,
        });
      }
    });

    // Sort by line number
    return renderedLines.sort((a, b) => a.lineNumber - b.lineNumber);
  }

  private calculateLineOpacity(
    animationStyle: AnimationStyle,
    progress: number,
    state: "entering" | "leaving"
  ): number {
    switch (animationStyle) {
      case "fade":
        return state === "entering" ? progress : 1 - progress;

      case "slide":
        // Slide animation with fade
        return state === "entering"
          ? Math.min(1, progress * 1.5)
          : Math.max(0, 1 - progress * 1.5);

      case "typewriter":
        // Typewriter effect - lines appear/disappear more abruptly
        return state === "entering"
          ? progress > 0.3
            ? 1
            : 0
          : progress < 0.7
          ? 1
          : 0;

      case "highlight":
        // Highlight style with quick transitions
        return state === "entering"
          ? progress > 0.2
            ? 1
            : progress * 5
          : progress < 0.8
          ? 1
          : (1 - progress) * 5;

      default:
        return state === "entering" ? progress : 1 - progress;
    }
  }
}

// Export singleton instance
export const animationEngine = new MotionCanvasAnimationEngine();

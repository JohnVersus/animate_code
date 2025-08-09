import { syntaxHighlightingService, Token } from "./syntaxHighlighting";
import { Slide, LineRange, AnimationStyle } from "../types";

export interface AnimationEngineService {
  createScene(code: string, language: string): any;
  renderStaticFrame(
    code: string,
    language: string,
    lineRanges: LineRange[]
  ): any;
  createAnimatedScene(code: string, language: string, slides: Slide[]): any;
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

  createAnimatedScene(code: string, language: string, slides: Slide[]) {
    // Return animation configuration with slide transitions
    const animationSteps = this.calculateAnimationSteps(code, slides);

    return {
      type: "animated-scene",
      code,
      language,
      slides,
      animationSteps,
      totalDuration: slides.reduce((sum, slide) => sum + slide.duration, 0),
      config: {
        fontSize: this.fontSize,
        lineHeight: this.lineHeight,
        fontFamily: this.fontFamily,
        backgroundColor: this.backgroundColor,
        colorScheme: this.colorScheme,
      },
    };
  }

  private calculateAnimationSteps(code: string, slides: Slide[]) {
    const steps = [];
    let currentVisibleLines: Set<number> = new Set();
    let accumulatedTime = 0;

    for (let slideIndex = 0; slideIndex < slides.length; slideIndex++) {
      const slide = slides[slideIndex];
      const cumulativeLines = this.getCumulativeLines(slides, slideIndex, code);
      const nextVisibleLines = new Set(
        cumulativeLines.map((l) => l.lineNumber)
      );

      // Calculate what lines to add/remove
      const linesToAdd = Array.from(nextVisibleLines).filter(
        (line) => !currentVisibleLines.has(line)
      );
      const linesToRemove = Array.from(currentVisibleLines).filter(
        (line) => !nextVisibleLines.has(line)
      );

      steps.push({
        slideIndex,
        startTime: accumulatedTime,
        duration: slide.duration,
        animationStyle: slide.animationStyle,
        linesToAdd,
        linesToRemove,
        visibleLines: Array.from(nextVisibleLines).sort((a, b) => a - b),
        cumulativeLines,
      });

      currentVisibleLines = nextVisibleLines;
      accumulatedTime += slide.duration;
    }

    return steps;
  }

  getCumulativeLines(
    slides: Slide[],
    upToSlideIndex: number,
    code?: string
  ): { lineNumber: number; content: string }[] {
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
}

// Export singleton instance
export const animationEngine = new MotionCanvasAnimationEngine();

import { syntaxHighlightingService } from "./syntaxHighlighting";
import { prismThemeExtractor, ThemeColorScheme } from "./prismThemeExtractor";
import { LineRange } from "../types";
import { MotionCanvasAnimationEngine } from "./animationEngine";

export interface CanvasRendererService {
  renderCodeToCanvas(
    canvas: HTMLCanvasElement,
    code: string,
    language: string,
    lineRanges?: LineRange[]
  ): void;
  renderAnimationFrame(canvas: HTMLCanvasElement, animationFrame: any): void;
  getCanvasSize(code: string): { width: number; height: number };
  updateTheme(): void;
}

export class CodeCanvasRenderer implements CanvasRendererService {
  private readonly fontSize = 14;
  private readonly lineHeight = 20;
  private readonly fontFamily = "JetBrains Mono, Monaco, Consolas, monospace";
  private readonly padding = 20;
  private readonly lineNumberWidth = 20;

  // Dynamic theme colors extracted from Prism.js
  private themeColors: ThemeColorScheme | null = null;

  /**
   * Update theme colors from Prism.js theme extractor
   */
  updateTheme(): void {
    try {
      this.themeColors = prismThemeExtractor.extractThemeColors();
    } catch (error) {
      console.warn("Failed to update canvas renderer theme:", error);
      // Keep existing theme or use null to trigger fallback
      this.themeColors = null;
    }
  }

  /**
   * Get current theme colors, extracting them if not already cached
   */
  private getThemeColors(): ThemeColorScheme {
    if (!this.themeColors) {
      try {
        this.themeColors = prismThemeExtractor.extractThemeColors();
      } catch (error) {
        console.warn("Failed to extract theme colors, using fallback:", error);
        // Return a basic fallback theme matching CodeEditor's bg-gray-900
        return {
          background: "#111827", // Tailwind's gray-900
          text: "#d1d5db", // Tailwind's gray-300
          lineNumber: "#6b7280", // Tailwind's gray-500
          tokens: {
            plain: "#ccc",
            comment: "#999",
            keyword: "#cc99cd",
            string: "#7ec699",
            number: "#f08d49",
            operator: "#67cdcc",
            punctuation: "#ccc",
            function: "#f08d49",
            "class-name": "#f8c555",
            variable: "#7ec699",
            property: "#f8c555",
            tag: "#e2777a",
            "attr-name": "#e2777a",
            "attr-value": "#7ec699",
            regex: "#7ec699",
            important: "#cc99cd",
            bold: "#ccc",
            italic: "#ccc",
          },
        };
      }
    }
    return this.themeColors;
  }

  renderCodeToCanvas(
    canvas: HTMLCanvasElement,
    code: string,
    language: string,
    lineRanges?: LineRange[]
  ): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get current theme colors
    const theme = this.getThemeColors();

    // Set up canvas with proper pixel density
    const { width, height } = this.getCanvasSize(code);
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Set the actual canvas size in memory (scaled for high DPI)
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;

    // Set the display size (CSS pixels)
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    // Scale the context to match device pixel ratio
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // Clear canvas with theme background color - ensure dark background
    const backgroundColor =
      theme.background === "#111827" ? "#111827" : "#111827"; // Force dark background
    console.log("Canvas background color being used:", backgroundColor);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Set font with better rendering
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textBaseline = "top";

    // Enable better text rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Debug: Log the theme colors being used
    console.log("Canvas renderer using theme:", {
      background: theme.background,
      text: theme.text,
      lineNumber: theme.lineNumber,
      sampleTokens: {
        keyword: theme.tokens.keyword,
        string: theme.tokens.string,
        function: theme.tokens.function,
      },
    });

    // Get lines to render with sequential numbering
    const lines = code.split("\n");
    let visibleLines: {
      displayLineNumber: number;
      actualLineNumber: number;
      content: string;
    }[];

    if (lineRanges) {
      // Use animation engine to get sequential numbering for line ranges
      const engine = new MotionCanvasAnimationEngine();
      visibleLines = engine.getVisibleLinesSequential(code, lineRanges);
    } else {
      // Show all lines with sequential numbering (1, 2, 3...)
      visibleLines = lines.map((line, index) => ({
        displayLineNumber: index + 1,
        actualLineNumber: index + 1,
        content: line,
      }));
    }

    // Render each line using display line numbers
    let yOffset = this.padding;
    for (const { displayLineNumber, content } of visibleLines) {
      this.renderLine(
        ctx,
        content,
        language,
        displayLineNumber,
        yOffset,
        theme
      );
      yOffset += this.lineHeight;
    }
  }

  private renderLine(
    ctx: CanvasRenderingContext2D,
    line: string,
    language: string,
    lineNumber: number,
    y: number,
    theme: ThemeColorScheme
  ): void {
    // Render line number with theme color
    ctx.fillStyle = theme.lineNumber;
    ctx.textAlign = "right";
    ctx.fillText(
      String(lineNumber).padStart(3, " "),
      this.padding + this.lineNumberWidth - 10,
      y
    );

    // Render code content
    ctx.textAlign = "left";
    const tokens =
      syntaxHighlightingService.getLineTokens(line, language)[0] || [];

    let xOffset = this.padding + this.lineNumberWidth;
    for (const token of tokens) {
      ctx.fillStyle = this.getTokenColor(token.type, theme);
      ctx.fillText(token.content, xOffset, y);
      xOffset += ctx.measureText(token.content).width;
    }
  }

  private getTokenColor(tokenType: string, theme: ThemeColorScheme): string {
    // Try to get the specific token color from the theme
    const tokenColor = theme.tokens[tokenType];
    if (tokenColor) {
      return tokenColor;
    }

    // Fallback to plain text color if token type not found
    return theme.tokens.plain || theme.text;
  }

  private getVisibleLines(
    code: string,
    lineRanges: LineRange[]
  ): { lineNumber: number; content: string }[] {
    const lines = code.split("\n");
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

  renderAnimationFrame(canvas: HTMLCanvasElement, animationFrame: any): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get current theme colors
    const theme = this.getThemeColors();

    // Set up canvas with proper pixel density
    const { width, height } = this.getCanvasSize(animationFrame.code);
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Set the actual canvas size in memory (scaled for high DPI)
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;

    // Set the display size (CSS pixels)
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    // Scale the context to match device pixel ratio
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // Clear canvas with theme background color
    const backgroundColor = "#111827"; // Force dark background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Set font with better rendering
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textBaseline = "top";

    // Enable better text rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Render each line with animation effects
    let yOffset = this.padding;
    for (const line of animationFrame.renderedLines) {
      // Use displayLineNumber for rendering, actualLineNumber for highlighting context
      const displayLineNumber = line.displayLineNumber || line.lineNumber;
      this.renderAnimatedLine(
        ctx,
        line.content,
        animationFrame.language,
        displayLineNumber,
        yOffset,
        theme,
        line.opacity,
        line.animationState,
        line.animationProgress,
        animationFrame.animationStyle,
        line.lineNumberOpacity,
        line.lineNumberAnimationState,
        line.lineNumberAnimationProgress
      );
      yOffset += this.lineHeight;
    }
  }

  private renderAnimatedLine(
    ctx: CanvasRenderingContext2D,
    line: string,
    language: string,
    lineNumber: number,
    y: number,
    theme: ThemeColorScheme,
    opacity: number,
    animationState: "entering" | "leaving" | "stable",
    animationProgress: number,
    animationStyle: string,
    lineNumberOpacity?: number,
    lineNumberAnimationState?: "entering" | "leaving" | "stable",
    lineNumberAnimationProgress?: number
  ): void {
    // Render line number with separate animation
    this.renderLineNumber(
      ctx,
      lineNumber,
      y,
      theme,
      lineNumberOpacity ?? opacity,
      lineNumberAnimationState ?? animationState,
      lineNumberAnimationProgress ?? animationProgress
    );

    // Render code content with its own animation
    this.renderCodeContent(
      ctx,
      line,
      language,
      y,
      theme,
      opacity,
      animationState,
      animationProgress,
      animationStyle
    );
  }

  private renderLineNumber(
    ctx: CanvasRenderingContext2D,
    lineNumber: number,
    y: number,
    theme: ThemeColorScheme,
    opacity: number,
    animationState: "entering" | "leaving" | "stable",
    animationProgress: number
  ): void {
    // Save context for line number animation
    ctx.save();

    // Apply line number specific transforms (subtle fade-in effect)
    if (animationState === "entering") {
      // Slight scale effect for line numbers appearing
      const scale = 0.8 + animationProgress * 0.2;
      ctx.translate(
        this.padding + this.lineNumberWidth - 10,
        y + this.fontSize / 2
      );
      ctx.scale(scale, scale);
      ctx.translate(
        -(this.padding + this.lineNumberWidth - 10),
        -(y + this.fontSize / 2)
      );
    }

    // Apply line number opacity
    ctx.globalAlpha = opacity;

    // Render line number with theme color
    ctx.fillStyle = theme.lineNumber;
    ctx.textAlign = "right";
    ctx.fillText(
      String(lineNumber).padStart(3, " "),
      this.padding + this.lineNumberWidth - 10,
      y
    );

    // Restore context
    ctx.restore();
  }

  private renderCodeContent(
    ctx: CanvasRenderingContext2D,
    line: string,
    language: string,
    y: number,
    theme: ThemeColorScheme,
    opacity: number,
    animationState: "entering" | "leaving" | "stable",
    animationProgress: number,
    animationStyle: string
  ): void {
    // Save context for code content animation
    ctx.save();

    // Apply animation-specific transforms for code content
    this.applyAnimationTransform(
      ctx,
      animationState,
      animationProgress,
      animationStyle,
      y
    );

    // Apply code content opacity
    ctx.globalAlpha = opacity;

    // Render code content with animation effects
    ctx.textAlign = "left";
    const tokens =
      syntaxHighlightingService.getLineTokens(line, language)[0] || [];

    let xOffset = this.padding + this.lineNumberWidth;

    // Apply highlight background for highlight animation style
    if (animationStyle === "highlight" && animationState === "entering") {
      const highlightOpacity = Math.min(0.3, animationProgress * 0.6);
      ctx.save();
      ctx.globalAlpha = highlightOpacity;
      ctx.fillStyle = "#fbbf24"; // Yellow highlight
      ctx.fillRect(
        xOffset - 4,
        y - 2,
        ctx.measureText(line).width + 8,
        this.lineHeight
      );
      ctx.restore();
      ctx.globalAlpha = opacity; // Restore line opacity
    }

    for (const token of tokens) {
      const tokenColor = this.getTokenColor(token.type, theme);
      ctx.fillStyle = tokenColor;

      // Apply typewriter effect character by character
      if (animationStyle === "typewriter" && animationState === "entering") {
        const visibleChars = Math.floor(
          token.content.length * animationProgress
        );
        const visibleContent = token.content.substring(0, visibleChars);
        if (visibleContent) {
          ctx.fillText(visibleContent, xOffset, y);
        }
        xOffset += ctx.measureText(visibleContent).width;
      } else {
        ctx.fillText(token.content, xOffset, y);
        xOffset += ctx.measureText(token.content).width;
      }
    }

    // Restore context
    ctx.restore();
  }

  private applyAnimationTransform(
    ctx: CanvasRenderingContext2D,
    animationState: "entering" | "leaving" | "stable",
    animationProgress: number,
    animationStyle: string,
    y: number
  ): void {
    if (animationState === "stable") return;

    switch (animationStyle) {
      case "slide":
        // Slide in from right or slide out to left
        const slideOffset =
          animationState === "entering"
            ? (1 - animationProgress) * 50
            : animationProgress * -50;
        ctx.translate(slideOffset, 0);
        break;

      case "typewriter":
        // No transform needed, handled in character rendering
        break;

      case "highlight":
        // Slight scale effect for highlight
        if (animationState === "entering") {
          const scale = 0.95 + animationProgress * 0.05;
          ctx.translate(0, y);
          ctx.scale(scale, scale);
          ctx.translate(0, -y);
        }
        break;

      case "fade":
      default:
        // No transform for fade, just opacity
        break;
    }
  }

  getCanvasSize(code: string): { width: number; height: number } {
    const lines = code.split("\n");
    const maxLineLength = Math.max(...lines.map((line) => line.length));

    // Estimate width based on character count (approximate)
    const estimatedCharWidth = this.fontSize * 0.6;
    const contentWidth =
      this.padding * 2 +
      this.lineNumberWidth +
      maxLineLength * estimatedCharWidth;
    const contentHeight = this.padding * 2 + lines.length * this.lineHeight;

    // Use a 16:9 aspect ratio as base, but ensure content fits - revert to original sizing
    const aspectRatio = 16 / 9;
    const minWidth = Math.max(800, contentWidth);
    const minHeight = Math.max(450, contentHeight);

    // Calculate dimensions maintaining aspect ratio while fitting content
    let width = minWidth;
    let height = width / aspectRatio;

    // If height is too small for content, adjust width accordingly
    if (height < minHeight) {
      height = minHeight;
      width = height * aspectRatio;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }
}

// Export singleton instance
export const canvasRenderer = new CodeCanvasRenderer();

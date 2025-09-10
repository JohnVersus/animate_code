import { syntaxHighlightingService } from "./syntaxHighlighting";
import { themeExtractor, ThemeColorScheme } from "./themeExtractor";
import { LineRange } from "../types";
import { MotionCanvasAnimationEngine } from "./animationEngine";
import {
  AnimationViewport,
  animationViewport,
  ViewportConfig,
} from "./viewportConfig";

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
  // Dynamic theme colors extracted from the theme
  private themeColors: ThemeColorScheme | null = null;

  /**
   * Update theme colors from the theme extractor
   */
  updateTheme(): void {
    try {
      this.themeColors = themeExtractor.extractThemeColors();
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
        this.themeColors = themeExtractor.extractThemeColors();
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
    lineRanges?: LineRange[],
    viewport: AnimationViewport = animationViewport
  ): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get current theme colors
    const theme = this.getThemeColors();

    // Use fixed viewport dimensions
    const { width, height } = viewport.calculateDimensions();
    const fontSettings = viewport.getFontSettings();
    const layoutSettings = viewport.getLayoutSettings();
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

    // Set font with better rendering using viewport config
    ctx.font = `${fontSettings.fontSize}px ${fontSettings.fontFamily}`;
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

    // Render each line using display line numbers (now with scrolling support)
    let yOffset = layoutSettings.padding;
    for (const { displayLineNumber, content } of visibleLines) {
      // Only render lines that are within the visible area (scrolling window)
      if (
        yOffset >= -fontSettings.lineHeight &&
        yOffset < height + fontSettings.lineHeight
      ) {
        this.renderLine(
          ctx,
          content,
          language,
          displayLineNumber,
          yOffset,
          theme,
          fontSettings,
          layoutSettings
        );
      }
      yOffset += fontSettings.lineHeight;
    }
  }

  private renderLine(
    ctx: CanvasRenderingContext2D,
    line: string,
    language: string,
    lineNumber: number,
    y: number,
    theme: ThemeColorScheme,
    fontSettings: { fontSize: number; lineHeight: number; fontFamily: string },
    layoutSettings: {
      padding: number;
      lineNumberWidth: number;
      contentWidth: number;
      contentHeight: number;
    }
  ): void {
    // Render line number with theme color
    ctx.fillStyle = theme.lineNumber;
    ctx.textAlign = "right";
    ctx.fillText(
      String(lineNumber).padStart(3, " "),
      layoutSettings.padding + layoutSettings.lineNumberWidth - 10,
      y
    );

    // Render code content
    ctx.textAlign = "left";
    const tokens =
      syntaxHighlightingService.getLineTokens(line, language)[0] || [];

    let xOffset = layoutSettings.padding + layoutSettings.lineNumberWidth;
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

  renderAnimationFrame(
    canvas: HTMLCanvasElement,
    animationFrame: any,
    viewport: AnimationViewport = animationViewport
  ): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get current theme colors
    const theme = this.getThemeColors();

    // Use fixed viewport dimensions
    const { width, height } = viewport.calculateDimensions();
    const fontSettings = viewport.getFontSettings();
    const layoutSettings = viewport.getLayoutSettings();
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

    // Set font with better rendering using viewport config
    ctx.font = `${fontSettings.fontSize}px ${fontSettings.fontFamily}`;
    ctx.textBaseline = "top";

    // Enable better text rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Handle scrolling animation if present
    let scrollOffset = 0;
    if (animationFrame.scrollingInfo?.scrollAnimation?.type !== "none") {
      const scrollAnim = animationFrame.scrollingInfo.scrollAnimation;
      // Apply smooth scrolling offset based on animation progress
      // This could be enhanced with easing functions
      const scrollProgress = Math.min(1, animationFrame.progress || 0);
      if (scrollAnim.type === "scroll-up") {
        scrollOffset = -fontSettings.lineHeight * scrollProgress;
      } else if (scrollAnim.type === "scroll-down") {
        scrollOffset = fontSettings.lineHeight * scrollProgress;
      }
    }

    // Render each line with animation effects and scrolling
    let yOffset = layoutSettings.padding + scrollOffset;
    for (const line of animationFrame.renderedLines) {
      // Use displayLineNumber for rendering (sequential 1, 2, 3...)
      const displayLineNumber = line.displayLineNumber || line.lineNumber;

      // Only render lines that are within the visible area
      if (
        yOffset >= -fontSettings.lineHeight &&
        yOffset < height + fontSettings.lineHeight
      ) {
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
          line.lineNumberAnimationProgress,
          line.typewriterProgress,
          fontSettings,
          layoutSettings
        );
      }
      yOffset += fontSettings.lineHeight;
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
    lineNumberAnimationProgress?: number,
    typewriterProgress?: number,
    fontSettings?: { fontSize: number; lineHeight: number; fontFamily: string },
    layoutSettings?: {
      padding: number;
      lineNumberWidth: number;
      contentWidth: number;
      contentHeight: number;
    }
  ): void {
    const font = fontSettings || animationViewport.getFontSettings();
    const layout = layoutSettings || animationViewport.getLayoutSettings();

    // Render line number with separate animation
    this.renderLineNumber(
      ctx,
      lineNumber,
      y,
      theme,
      lineNumberOpacity ?? opacity,
      lineNumberAnimationState ?? animationState,
      lineNumberAnimationProgress ?? animationProgress,
      font,
      layout
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
      animationStyle,
      typewriterProgress,
      font,
      layout
    );
  }

  private renderLineNumber(
    ctx: CanvasRenderingContext2D,
    lineNumber: number,
    y: number,
    theme: ThemeColorScheme,
    opacity: number,
    animationState: "entering" | "leaving" | "stable",
    animationProgress: number,
    fontSettings: { fontSize: number; lineHeight: number; fontFamily: string },
    layoutSettings: {
      padding: number;
      lineNumberWidth: number;
      contentWidth: number;
      contentHeight: number;
    }
  ): void {
    // Save context for line number animation
    ctx.save();

    // Apply line number specific transforms (subtle fade-in effect)
    if (animationState === "entering") {
      // Slight scale effect for line numbers appearing
      const scale = 0.8 + animationProgress * 0.2;
      ctx.translate(
        layoutSettings.padding + layoutSettings.lineNumberWidth - 10,
        y + fontSettings.fontSize / 2
      );
      ctx.scale(scale, scale);
      ctx.translate(
        -(layoutSettings.padding + layoutSettings.lineNumberWidth - 10),
        -(y + fontSettings.fontSize / 2)
      );
    }

    // Apply line number opacity
    ctx.globalAlpha = opacity;

    // Render line number with theme color
    ctx.fillStyle = theme.lineNumber;
    ctx.textAlign = "right";
    ctx.fillText(
      String(lineNumber).padStart(3, " "),
      layoutSettings.padding + layoutSettings.lineNumberWidth - 10,
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
    animationStyle: string,
    typewriterProgress?: number,
    fontSettings?: { fontSize: number; lineHeight: number; fontFamily: string },
    layoutSettings?: {
      padding: number;
      lineNumberWidth: number;
      contentWidth: number;
      contentHeight: number;
    }
  ): void {
    const font = fontSettings || animationViewport.getFontSettings();
    const layout = layoutSettings || animationViewport.getLayoutSettings();

    // Save context for code content animation
    ctx.save();

    // Apply animation-specific transforms for code content
    this.applyAnimationTransform(
      ctx,
      animationState,
      animationProgress,
      animationStyle,
      y,
      font
    );

    // Apply code content opacity
    ctx.globalAlpha = opacity;

    // Render code content with animation effects
    ctx.textAlign = "left";
    const tokens =
      syntaxHighlightingService.getLineTokens(line, language)[0] || [];

    let xOffset = layout.padding + layout.lineNumberWidth;

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
        font.lineHeight
      );
      ctx.restore();
      ctx.globalAlpha = opacity; // Restore line opacity
    }

    // For typewriter animation, calculate total visible characters for the entire line
    let totalVisibleChars = 0;
    if (
      animationStyle === "typewriter" &&
      animationState === "entering" &&
      typewriterProgress !== undefined
    ) {
      totalVisibleChars = Math.floor(line.length * typewriterProgress);
    }

    let currentCharIndex = 0;
    for (const token of tokens) {
      const tokenColor = this.getTokenColor(token.type, theme);
      ctx.fillStyle = tokenColor;

      // Apply typewriter effect with proper sequential character rendering
      if (
        animationStyle === "typewriter" &&
        animationState === "entering" &&
        typewriterProgress !== undefined
      ) {
        // Calculate how many characters of this token should be visible
        const tokenStartIndex = currentCharIndex;
        const tokenEndIndex = currentCharIndex + token.content.length;

        let visibleContent = "";
        if (totalVisibleChars > tokenStartIndex) {
          const visibleInToken = Math.min(
            token.content.length,
            totalVisibleChars - tokenStartIndex
          );
          visibleContent = token.content.substring(
            0,
            Math.max(0, visibleInToken)
          );
        }

        if (visibleContent) {
          ctx.fillText(visibleContent, xOffset, y);
        }
        xOffset += ctx.measureText(visibleContent).width;
        currentCharIndex = tokenEndIndex;
      } else {
        ctx.fillText(token.content, xOffset, y);
        xOffset += ctx.measureText(token.content).width;
        currentCharIndex += token.content.length;
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
    y: number,
    fontSettings?: { fontSize: number; lineHeight: number; fontFamily: string }
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
    // Always return fixed dimensions from viewport config
    return animationViewport.calculateDimensions();
  }

  /**
   * Get canvas size using a specific viewport configuration
   */
  getCanvasSizeWithViewport(viewport: any): { width: number; height: number } {
    return viewport.calculateDimensions();
  }

  /**
   * Render animation frame using a specific viewport configuration
   * Used for video export with different dimensions than preview
   */
  renderAnimationFrameWithViewport(
    canvas: HTMLCanvasElement,
    animationFrame: any,
    viewport: any
  ): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get current theme colors
    const theme = this.getThemeColors();

    // Use the specified viewport dimensions
    const { width, height } = viewport.calculateDimensions();
    const fontSettings = viewport.getFontSettings();
    const layoutSettings = viewport.getLayoutSettings();
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

    // Set font with better rendering using viewport config
    ctx.font = `${fontSettings.fontSize}px ${fontSettings.fontFamily}`;
    ctx.textBaseline = "top";

    // Enable better text rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Handle scrolling animation if present
    let scrollOffset = 0;
    if (animationFrame.scrollingInfo?.scrollAnimation?.type !== "none") {
      const scrollAnim = animationFrame.scrollingInfo.scrollAnimation;
      // Apply smooth scrolling offset based on animation progress
      const scrollProgress = Math.min(1, animationFrame.progress || 0);
      if (scrollAnim.type === "scroll-up") {
        scrollOffset = -fontSettings.lineHeight * scrollProgress;
      } else if (scrollAnim.type === "scroll-down") {
        scrollOffset = fontSettings.lineHeight * scrollProgress;
      }
    }

    // Render each line with animation effects and scrolling
    let yOffset = layoutSettings.padding + scrollOffset;
    for (const line of animationFrame.renderedLines) {
      // Use displayLineNumber for rendering (sequential 1, 2, 3...)
      const displayLineNumber = line.displayLineNumber || line.lineNumber;

      // Only render lines that are within the visible area
      if (
        yOffset >= -fontSettings.lineHeight &&
        yOffset < height + fontSettings.lineHeight
      ) {
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
          line.lineNumberAnimationProgress,
          line.typewriterProgress,
          fontSettings,
          layoutSettings
        );
      }
      yOffset += fontSettings.lineHeight;
    }
  }
}

// Export singleton instance
export const canvasRenderer = new CodeCanvasRenderer();

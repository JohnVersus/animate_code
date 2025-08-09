import { syntaxHighlightingService, Token } from "./syntaxHighlighting";
import { LineRange } from "../types";

export interface CanvasRendererService {
  renderCodeToCanvas(
    canvas: HTMLCanvasElement,
    code: string,
    language: string,
    lineRanges?: LineRange[]
  ): void;
  getCanvasSize(code: string): { width: number; height: number };
}

export class CodeCanvasRenderer implements CanvasRendererService {
  private readonly fontSize = 14;
  private readonly lineHeight = 20;
  private readonly fontFamily = "JetBrains Mono, Monaco, Consolas, monospace";
  private readonly backgroundColor = "#1e1e1e";
  private readonly textColor = "#d4d4d4";
  private readonly padding = 20;
  private readonly lineNumberWidth = 50;

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

  renderCodeToCanvas(
    canvas: HTMLCanvasElement,
    code: string,
    language: string,
    lineRanges?: LineRange[]
  ): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set up canvas
    const { width, height } = this.getCanvasSize(code);
    canvas.width = width;
    canvas.height = height;

    // Clear canvas with background color
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Set font
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textBaseline = "top";

    // Get lines to render
    const lines = code.split("\n");
    const visibleLines = lineRanges
      ? this.getVisibleLines(code, lineRanges)
      : lines.map((line, index) => ({ lineNumber: index + 1, content: line }));

    // Render each line
    let yOffset = this.padding;
    for (const { lineNumber, content } of visibleLines) {
      this.renderLine(ctx, content, language, lineNumber, yOffset);
      yOffset += this.lineHeight;
    }
  }

  private renderLine(
    ctx: CanvasRenderingContext2D,
    line: string,
    language: string,
    lineNumber: number,
    y: number
  ): void {
    // Render line number
    ctx.fillStyle = "#858585";
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
      ctx.fillStyle = this.getTokenColor(token.type);
      ctx.fillText(token.content, xOffset, y);
      xOffset += ctx.measureText(token.content).width;
    }
  }

  private getTokenColor(tokenType: string): string {
    return (
      this.colorScheme[tokenType as keyof typeof this.colorScheme] ||
      this.colorScheme.plain
    );
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

    // Use a 16:9 aspect ratio as base, but ensure content fits
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

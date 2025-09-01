/**
 * Fixed viewport system for consistent animation preview dimensions
 * Implements requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */

export interface ViewportConfig {
  fixedWidth: number;
  fixedHeight: number;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  padding: number;
  lineNumberWidth: number;
  maxVisibleLines: number;
}

export class AnimationViewport {
  private config: ViewportConfig;

  constructor(config?: Partial<ViewportConfig>) {
    // Default fixed viewport configuration
    this.config = {
      fixedWidth: 800,
      fixedHeight: 450,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: "JetBrains Mono, Monaco, Consolas, monospace",
      padding: 20,
      lineNumberWidth: 40,
      maxVisibleLines: 15,
      ...config,
    };
  }

  /**
   * Get the fixed viewport configuration
   */
  getConfig(): ViewportConfig {
    return { ...this.config };
  }

  /**
   * Update viewport configuration
   */
  updateConfig(config: Partial<ViewportConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Calculate canvas dimensions - always returns fixed dimensions
   * regardless of content length
   */
  calculateDimensions(codeLength?: number): {
    width: number;
    height: number;
    aspectRatio: number;
  } {
    // Always return fixed dimensions regardless of content
    return {
      width: this.config.fixedWidth,
      height: this.config.fixedHeight,
      aspectRatio: this.config.fixedWidth / this.config.fixedHeight,
    };
  }

  /**
   * Get consistent font settings
   */
  getFontSettings(): {
    fontSize: number;
    lineHeight: number;
    fontFamily: string;
  } {
    return {
      fontSize: this.config.fontSize,
      lineHeight: this.config.lineHeight,
      fontFamily: this.config.fontFamily,
    };
  }

  /**
   * Get layout settings
   */
  getLayoutSettings(): {
    padding: number;
    lineNumberWidth: number;
    contentWidth: number;
    contentHeight: number;
  } {
    const contentWidth = this.config.fixedWidth - this.config.padding * 2;
    const contentHeight = this.config.fixedHeight - this.config.padding * 2;

    return {
      padding: this.config.padding,
      lineNumberWidth: this.config.lineNumberWidth,
      contentWidth,
      contentHeight,
    };
  }

  /**
   * Calculate maximum lines that can fit in the viewport
   */
  getMaxVisibleLines(): number {
    return this.config.maxVisibleLines;
  }

  /**
   * Check if content should be scrolled based on line count
   */
  shouldScroll(totalLines: number): boolean {
    return totalLines > this.config.maxVisibleLines;
  }

  /**
   * Calculate which lines should be visible in a scrolling window
   */
  calculateVisibleWindow(
    totalLines: number,
    targetLines: number[]
  ): {
    startLine: number;
    endLine: number;
    visibleLines: number[];
  } {
    if (!this.shouldScroll(totalLines)) {
      // No scrolling needed, show all lines
      return {
        startLine: 1,
        endLine: totalLines,
        visibleLines: Array.from({ length: totalLines }, (_, i) => i + 1),
      };
    }

    // Find the optimal window to show the target lines
    const maxLines = this.config.maxVisibleLines;

    if (targetLines.length === 0) {
      // Default to showing the last 15 lines
      const startLine = Math.max(1, totalLines - maxLines + 1);
      const endLine = totalLines;
      return {
        startLine,
        endLine,
        visibleLines: Array.from(
          { length: endLine - startLine + 1 },
          (_, i) => startLine + i
        ),
      };
    }

    // Calculate window based on target lines
    const minTargetLine = Math.min(...targetLines);
    const maxTargetLine = Math.max(...targetLines);

    // Try to center the target lines in the window
    const targetCenter = Math.floor((minTargetLine + maxTargetLine) / 2);
    const windowStart = Math.max(1, targetCenter - Math.floor(maxLines / 2));
    const windowEnd = Math.min(totalLines, windowStart + maxLines - 1);

    // Adjust start if we hit the end boundary
    const adjustedStart = Math.max(1, windowEnd - maxLines + 1);

    return {
      startLine: adjustedStart,
      endLine: windowEnd,
      visibleLines: Array.from(
        { length: windowEnd - adjustedStart + 1 },
        (_, i) => adjustedStart + i
      ),
    };
  }

  /**
   * Get CSS styles for the preview container
   */
  getContainerStyles(): React.CSSProperties {
    return {
      width: `${this.config.fixedWidth}px`,
      height: `${this.config.fixedHeight}px`,
      minWidth: `${this.config.fixedWidth}px`,
      minHeight: `${this.config.fixedHeight}px`,
      maxWidth: `${this.config.fixedWidth}px`,
      maxHeight: `${this.config.fixedHeight}px`,
      aspectRatio: `${this.config.fixedWidth} / ${this.config.fixedHeight}`,
    };
  }

  /**
   * Get responsive container styles that maintain aspect ratio
   */
  getResponsiveContainerStyles(): React.CSSProperties {
    return {
      width: "100%",
      maxWidth: `${this.config.fixedWidth}px`,
      aspectRatio: `${this.config.fixedWidth} / ${this.config.fixedHeight}`,
    };
  }
}

// Export singleton instance with default configuration
export const animationViewport = new AnimationViewport();

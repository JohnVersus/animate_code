/**
 * Fixed viewport system for consistent animation preview dimensions
 * Implements requirements 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.6, 12.7
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
  verticalAlignment?: "top" | "center";
}

export interface ScrollingWindow {
  maxLines: number;
  currentWindow: {
    startLine: number;
    endLine: number;
  };

  updateWindow(
    totalLines: number,
    newLines: number[]
  ): {
    visibleLines: number[];
    scrollAnimation: ScrollAnimation;
  };
}

export interface ScrollAnimation {
  type: "none" | "scroll-up" | "scroll-down";
  duration: number; // milliseconds
  fromWindow: { startLine: number; endLine: number };
  toWindow: { startLine: number; endLine: number };
}

export class AnimationViewport {
  private config: ViewportConfig;

  constructor(config?: Partial<ViewportConfig>) {
    // Default fixed viewport configuration - optimized for better video export compatibility
    // Increased dimensions to properly display 15 lines with padding below
    // Calculated: 15 lines * 24px line height + 60px top/bottom padding + extra space = 780px height
    // Width increased proportionally to maintain 16:9 aspect ratio: 780 * (16/9) = 1387px
    this.config = {
      fixedWidth: 1387,
      fixedHeight: 780,
      fontSize: 14, // Reverted to original size for better readability in preview
      lineHeight: 20, // Reverted to original spacing
      fontFamily: "JetBrains Mono, Monaco, Consolas, monospace",
      padding: 30, // Top and bottom padding
      lineNumberWidth: 40, // Reverted to original width
      maxVisibleLines: 15,
      verticalAlignment: "center",
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
   * Now uses the ScrollingWindowManager for consistent behavior
   */
  calculateVisibleWindow(
    totalLines: number,
    targetLines: number[]
  ): {
    startLine: number;
    endLine: number;
    visibleLines: number[];
    scrollAnimation?: ScrollAnimation;
  } {
    if (!this.shouldScroll(totalLines)) {
      // No scrolling needed, show all lines
      return {
        startLine: 1,
        endLine: totalLines,
        visibleLines: Array.from({ length: totalLines }, (_, i) => i + 1),
      };
    }

    // Create a temporary scrolling window manager for this calculation
    const tempScrollingWindow = new ScrollingWindowManager(
      this.config.maxVisibleLines
    );
    const result = tempScrollingWindow.setWindowForLines(
      targetLines,
      totalLines
    );
    const window = tempScrollingWindow.getCurrentWindow();

    return {
      startLine: window.startLine,
      endLine: window.endLine,
      visibleLines: result.visibleLines,
      scrollAnimation: result.scrollAnimation,
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

export class ScrollingWindowManager implements ScrollingWindow {
  maxLines: number;
  currentWindow: { startLine: number; endLine: number };

  constructor(maxLines: number = 15) {
    this.maxLines = maxLines;
    this.currentWindow = { startLine: 1, endLine: maxLines };
  }

  /**
   * Update the scrolling window based on new lines being added
   * Implements smart window shifting that hides oldest lines when adding new ones
   */
  updateWindow(
    totalLines: number,
    newLines: number[]
  ): {
    visibleLines: number[];
    scrollAnimation: ScrollAnimation;
  } {
    const previousWindow = { ...this.currentWindow };

    // If total lines fit within max lines, show all lines
    if (totalLines <= this.maxLines) {
      this.currentWindow = { startLine: 1, endLine: totalLines };

      return {
        visibleLines: Array.from({ length: totalLines }, (_, i) => i + 1),
        scrollAnimation: {
          type: "none",
          duration: 0,
          fromWindow: previousWindow,
          toWindow: this.currentWindow,
        },
      };
    }

    // Determine optimal window position based on new lines
    if (newLines.length > 0) {
      const maxNewLine = Math.max(...newLines);
      const minNewLine = Math.min(...newLines);

      // If new lines are beyond current window, shift window to show them
      if (maxNewLine > this.currentWindow.endLine) {
        // Shift window to show the new lines, preferring to show the most recent lines
        const newEndLine = Math.min(totalLines, maxNewLine);
        const newStartLine = Math.max(1, newEndLine - this.maxLines + 1);

        this.currentWindow = { startLine: newStartLine, endLine: newEndLine };
      } else if (minNewLine < this.currentWindow.startLine) {
        // New lines are before current window, shift to show them
        const newStartLine = Math.max(1, minNewLine);
        const newEndLine = Math.min(
          totalLines,
          newStartLine + this.maxLines - 1
        );

        this.currentWindow = { startLine: newStartLine, endLine: newEndLine };
      }
      // If new lines are within current window, no need to shift
    } else {
      // No specific new lines, default to showing the last 15 lines
      const newEndLine = totalLines;
      const newStartLine = Math.max(1, newEndLine - this.maxLines + 1);

      this.currentWindow = { startLine: newStartLine, endLine: newEndLine };
    }

    // Generate visible lines array
    const visibleLines = Array.from(
      { length: this.currentWindow.endLine - this.currentWindow.startLine + 1 },
      (_, i) => this.currentWindow.startLine + i
    );

    // Determine scroll animation type
    let scrollType: "none" | "scroll-up" | "scroll-down" = "none";
    if (previousWindow.startLine !== this.currentWindow.startLine) {
      scrollType =
        this.currentWindow.startLine > previousWindow.startLine
          ? "scroll-up"
          : "scroll-down";
    }

    return {
      visibleLines,
      scrollAnimation: {
        type: scrollType,
        duration: scrollType !== "none" ? 300 : 0, // 300ms smooth scroll animation
        fromWindow: previousWindow,
        toWindow: this.currentWindow,
      },
    };
  }

  /**
   * Get current visible window
   */
  getCurrentWindow(): { startLine: number; endLine: number } {
    return { ...this.currentWindow };
  }

  /**
   * Check if a line is currently visible in the window
   */
  isLineVisible(lineNumber: number): boolean {
    return (
      lineNumber >= this.currentWindow.startLine &&
      lineNumber <= this.currentWindow.endLine
    );
  }

  /**
   * Get the display line number for an actual line number
   * Returns null if the line is not visible
   */
  getDisplayLineNumber(actualLineNumber: number): number | null {
    if (!this.isLineVisible(actualLineNumber)) {
      return null;
    }
    return actualLineNumber - this.currentWindow.startLine + 1;
  }

  /**
   * Reset window to default position
   */
  reset(): void {
    this.currentWindow = { startLine: 1, endLine: this.maxLines };
  }

  /**
   * Set window to show specific lines (used for slide transitions)
   */
  setWindowForLines(
    targetLines: number[],
    totalLines: number
  ): {
    visibleLines: number[];
    scrollAnimation: ScrollAnimation;
  } {
    if (targetLines.length === 0) {
      return this.updateWindow(totalLines, []);
    }

    const previousWindow = { ...this.currentWindow };

    // If we have fewer target lines than maxLines, don't apply scrolling window logic
    // Just show all the target lines as-is
    if (targetLines.length <= this.maxLines) {
      // Sort target lines and use them directly as visible lines
      const sortedTargetLines = [...targetLines].sort((a, b) => a - b);

      // Set window to encompass all target lines
      const minTargetLine = Math.min(...targetLines);
      const maxTargetLine = Math.max(...targetLines);

      this.currentWindow = { startLine: minTargetLine, endLine: maxTargetLine };

      return {
        visibleLines: sortedTargetLines,
        scrollAnimation: {
          type: "none",
          duration: 0,
          fromWindow: previousWindow,
          toWindow: this.currentWindow,
        },
      };
    }

    // Original logic for cases where we have more lines than can fit
    // Find optimal window to show target lines
    const minTargetLine = Math.min(...targetLines);
    const maxTargetLine = Math.max(...targetLines);
    const targetLineCount = maxTargetLine - minTargetLine + 1;

    // If the target lines span more than maxLines, show the end of the range
    // This ensures we show the most recent lines when the range is large
    if (targetLineCount > this.maxLines) {
      // Show the last maxLines of the target range
      const windowEnd = maxTargetLine;
      const windowStart = Math.max(1, windowEnd - this.maxLines + 1);

      this.currentWindow = { startLine: windowStart, endLine: windowEnd };
    } else {
      // Try to center the target lines in the window
      const targetCenter = Math.floor((minTargetLine + maxTargetLine) / 2);
      const windowStart = Math.max(
        1,
        targetCenter - Math.floor(this.maxLines / 2)
      );
      const windowEnd = Math.min(totalLines, windowStart + this.maxLines - 1);

      // Adjust start if we hit the end boundary
      const adjustedStart = Math.max(1, windowEnd - this.maxLines + 1);

      this.currentWindow = { startLine: adjustedStart, endLine: windowEnd };
    }

    const visibleLines = Array.from(
      { length: this.currentWindow.endLine - this.currentWindow.startLine + 1 },
      (_, i) => this.currentWindow.startLine + i
    );

    // Determine scroll animation type
    let scrollType: "none" | "scroll-up" | "scroll-down" = "none";
    if (previousWindow.startLine !== this.currentWindow.startLine) {
      scrollType =
        this.currentWindow.startLine > previousWindow.startLine
          ? "scroll-up"
          : "scroll-down";
    }

    return {
      visibleLines,
      scrollAnimation: {
        type: scrollType,
        duration: scrollType !== "none" ? 300 : 0,
        fromWindow: previousWindow,
        toWindow: this.currentWindow,
      },
    };
  }
}

// Preview viewport - optimized for UI readability
export const previewViewport = new AnimationViewport({
  fixedWidth: 800,
  fixedHeight: 450,
  fontSize: 16, // Larger font for better UI readability
  lineHeight: 22, // Adjusted for larger font
  fontFamily: "JetBrains Mono, Monaco, Consolas, monospace",
  padding: 20,
  lineNumberWidth: 40,
  maxVisibleLines: 15,
});

// Export viewport - optimized for video export with 15-line display
export const exportViewport = new AnimationViewport({
  fixedWidth: 1387,
  fixedHeight: 780,
  fontSize: 14, // Smaller font works well for video export
  lineHeight: 20,
  fontFamily: "JetBrains Mono, Monaco, Consolas, monospace",
  padding: 30,
  lineNumberWidth: 40,
  maxVisibleLines: 15,
});

// Portrait Preview viewport - for "shorts" preview in the UI
export const portraitPreviewViewport = new AnimationViewport({
  fixedWidth: 360 * 0.6,
  fixedHeight: 640 * 0.6,
  fontSize: 7,
  lineHeight: 13,
  padding: 15,
  maxVisibleLines: 20, // Increased from 15 to 20 for portrait mode
  verticalAlignment: "top",
  lineNumberWidth: 10,
});

// Portrait Export viewport - for "shorts" export rendering
export const portraitExportViewport = new AnimationViewport({
  fixedWidth: 720,
  fixedHeight: 1280,
  fontSize: 12,
  lineHeight: 18,
  padding: 28,
  maxVisibleLines: 20,
  verticalAlignment: "top",
  lineNumberWidth: 20,
});

// Default viewport (for backward compatibility) - use preview settings
export const animationViewport = previewViewport;

// Export singleton scrolling window manager
export const scrollingWindowManager = new ScrollingWindowManager(15);

/**
 * Prism Theme Extraction Service
 *
 * This service extracts color information from the loaded Prism.js CSS theme
 * to ensure consistent syntax highlighting between the code editor and canvas renderer.
 */

export interface ThemeColorScheme {
  // Base colors
  background: string;
  text: string;
  lineNumber: string;

  // Token-specific colors
  tokens: {
    comment: string;
    keyword: string;
    string: string;
    number: string;
    operator: string;
    punctuation: string;
    function: string;
    "class-name": string;
    variable: string;
    property: string;
    tag: string;
    "attr-name": string;
    "attr-value": string;
    regex: string;
    important: string;
    bold: string;
    italic: string;
    [key: string]: string;
  };
}

export interface PrismThemeExtractor {
  extractThemeColors(): ThemeColorScheme;
  getBackgroundColor(): string;
  getTextColor(): string;
  getLineNumberColor(): string;
  clearCache(): void;
}

/**
 * Implementation of PrismThemeExtractor that extracts colors from loaded Prism.js CSS
 */
export class DOMPrismThemeExtractor implements PrismThemeExtractor {
  private cachedTheme: ThemeColorScheme | null = null;
  private readonly cacheKey = "prism-theme-cache";
  private readonly fallbackTheme: ThemeColorScheme;

  constructor() {
    // Fallback theme matching the CodeEditor's bg-gray-900 appearance
    this.fallbackTheme = {
      background: "#111827", // Tailwind's gray-900
      text: "#d1d5db", // Tailwind's gray-300
      lineNumber: "#6b7280", // Tailwind's gray-500
      tokens: {
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
        plain: "#ccc",
      },
    };
  }

  /**
   * Extract theme colors from loaded Prism.js CSS
   */
  extractThemeColors(): ThemeColorScheme {
    // Return cached theme if available
    if (this.cachedTheme) {
      return this.cachedTheme;
    }

    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof document === "undefined") {
      console.warn(
        "PrismThemeExtractor: Not in browser environment, using fallback theme"
      );
      return this.fallbackTheme;
    }

    try {
      const extractedTheme = this.extractFromDOM();

      // Cache the extracted theme
      this.cachedTheme = extractedTheme;

      // Store in sessionStorage for performance (optional)
      try {
        sessionStorage.setItem(this.cacheKey, JSON.stringify(extractedTheme));
      } catch (e) {
        // Ignore storage errors
      }

      return extractedTheme;
    } catch (error) {
      console.warn(
        "PrismThemeExtractor: Failed to extract theme from DOM, using fallback:",
        error
      );
      return this.fallbackTheme;
    }
  }

  /**
   * Get background color from theme
   */
  getBackgroundColor(): string {
    const theme = this.extractThemeColors();
    return theme.background;
  }

  /**
   * Get text color from theme
   */
  getTextColor(): string {
    const theme = this.extractThemeColors();
    return theme.text;
  }

  /**
   * Get line number color from theme
   */
  getLineNumberColor(): string {
    const theme = this.extractThemeColors();
    return theme.lineNumber;
  }

  /**
   * Clear cached theme data
   */
  clearCache(): void {
    this.cachedTheme = null;
    try {
      sessionStorage.removeItem(this.cacheKey);
    } catch (e) {
      // Ignore storage errors
    }
  }

  /**
   * Extract colors from DOM by creating temporary elements with Prism classes
   */
  private extractFromDOM(): ThemeColorScheme {
    // Create a temporary container
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    container.style.visibility = "hidden";
    container.style.pointerEvents = "none";

    // Create a pre element with Prism classes
    const pre = document.createElement("pre");
    pre.className = "language-javascript"; // Use JavaScript as base language

    // Create code element
    const code = document.createElement("code");
    code.className = "language-javascript";

    // Add sample tokens to extract colors from
    const tokenElements = this.createTokenElements();
    tokenElements.forEach((element) => code.appendChild(element));

    pre.appendChild(code);
    container.appendChild(pre);
    document.body.appendChild(container);

    try {
      // Extract colors using getComputedStyle
      const preStyles = window.getComputedStyle(pre);
      const codeStyles = window.getComputedStyle(code);

      const theme: ThemeColorScheme = {
        background:
          this.extractColor(preStyles.backgroundColor) ||
          this.fallbackTheme.background,
        text: this.extractColor(codeStyles.color) || this.fallbackTheme.text,
        lineNumber: this.fallbackTheme.lineNumber, // Will be extracted separately
        tokens: {
          comment:
            this.extractTokenColor(container, "comment") ||
            this.fallbackTheme.tokens.comment,
          keyword:
            this.extractTokenColor(container, "keyword") ||
            this.fallbackTheme.tokens.keyword,
          string:
            this.extractTokenColor(container, "string") ||
            this.fallbackTheme.tokens.string,
          number:
            this.extractTokenColor(container, "number") ||
            this.fallbackTheme.tokens.number,
          operator:
            this.extractTokenColor(container, "operator") ||
            this.fallbackTheme.tokens.operator,
          punctuation:
            this.extractTokenColor(container, "punctuation") ||
            this.fallbackTheme.tokens.punctuation,
          function:
            this.extractTokenColor(container, "function") ||
            this.fallbackTheme.tokens.function,
          "class-name":
            this.extractTokenColor(container, "class-name") ||
            this.fallbackTheme.tokens["class-name"],
          variable:
            this.extractTokenColor(container, "variable") ||
            this.fallbackTheme.tokens.variable,
          property:
            this.extractTokenColor(container, "property") ||
            this.fallbackTheme.tokens.property,
          tag:
            this.extractTokenColor(container, "tag") ||
            this.fallbackTheme.tokens.tag,
          "attr-name":
            this.extractTokenColor(container, "attr-name") ||
            this.fallbackTheme.tokens["attr-name"],
          "attr-value":
            this.extractTokenColor(container, "attr-value") ||
            this.fallbackTheme.tokens["attr-value"],
          regex:
            this.extractTokenColor(container, "regex") ||
            this.fallbackTheme.tokens.regex,
          important:
            this.extractTokenColor(container, "important") ||
            this.fallbackTheme.tokens.important,
          bold:
            this.extractTokenColor(container, "bold") ||
            this.fallbackTheme.tokens.bold,
          italic:
            this.extractTokenColor(container, "italic") ||
            this.fallbackTheme.tokens.italic,
          plain:
            this.extractColor(codeStyles.color) ||
            this.fallbackTheme.tokens.plain,
        },
      };

      return theme;
    } finally {
      // Clean up
      document.body.removeChild(container);
    }
  }

  /**
   * Create token elements for color extraction
   */
  private createTokenElements(): HTMLElement[] {
    const tokenTypes = [
      "comment",
      "keyword",
      "string",
      "number",
      "operator",
      "punctuation",
      "function",
      "class-name",
      "variable",
      "property",
      "tag",
      "attr-name",
      "attr-value",
      "regex",
      "important",
      "bold",
      "italic",
    ];

    return tokenTypes.map((tokenType) => {
      const span = document.createElement("span");
      span.className = `token ${tokenType}`;
      span.textContent = "sample";
      return span;
    });
  }

  /**
   * Extract color for a specific token type
   */
  private extractTokenColor(
    container: HTMLElement,
    tokenType: string
  ): string | null {
    const tokenElement = container.querySelector(`.token.${tokenType}`);
    if (!tokenElement) {
      return null;
    }

    const styles = window.getComputedStyle(tokenElement);
    return this.extractColor(styles.color);
  }

  /**
   * Extract and normalize color value
   */
  private extractColor(colorValue: string): string | null {
    if (
      !colorValue ||
      colorValue === "transparent" ||
      colorValue === "inherit"
    ) {
      return null;
    }

    // Convert rgb/rgba to hex if needed
    if (colorValue.startsWith("rgb")) {
      return this.rgbToHex(colorValue);
    }

    // Return hex colors as-is
    if (colorValue.startsWith("#")) {
      return colorValue;
    }

    // Handle named colors
    return this.namedColorToHex(colorValue) || colorValue;
  }

  /**
   * Convert RGB/RGBA color to hex
   */
  private rgbToHex(rgb: string): string {
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (!match) {
      return rgb;
    }

    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  /**
   * Convert named colors to hex (basic implementation)
   */
  private namedColorToHex(colorName: string): string | null {
    const namedColors: Record<string, string> = {
      black: "#000000",
      white: "#ffffff",
      red: "#ff0000",
      green: "#008000",
      blue: "#0000ff",
      yellow: "#ffff00",
      cyan: "#00ffff",
      magenta: "#ff00ff",
      silver: "#c0c0c0",
      gray: "#808080",
      grey: "#808080",
      maroon: "#800000",
      olive: "#808000",
      lime: "#00ff00",
      aqua: "#00ffff",
      teal: "#008080",
      navy: "#000080",
      fuchsia: "#ff00ff",
      purple: "#800080",
    };

    return namedColors[colorName.toLowerCase()] || null;
  }

  /**
   * Try to load cached theme from sessionStorage
   */
  private loadCachedTheme(): ThemeColorScheme | null {
    try {
      const cached = sessionStorage.getItem(this.cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      // Ignore storage errors
    }
    return null;
  }
}

// Export singleton instance
export const prismThemeExtractor = new DOMPrismThemeExtractor();

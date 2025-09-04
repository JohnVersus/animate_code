/**
 * Theme Extraction Service
 *
 * This service extracts color information from the loaded highlight.js CSS theme
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

export interface ThemeExtractor {
  extractThemeColors(): ThemeColorScheme;
  getBackgroundColor(): string;
  getTextColor(): string;
  getLineNumberColor(): string;
  clearCache(): void;
}

/**
 * Implementation of ThemeExtractor that extracts colors from loaded highlight.js CSS
 */
export class HighlightJsThemeExtractor implements ThemeExtractor {
  private cachedTheme: ThemeColorScheme | null = null;
  private readonly cacheKey = "hljs-theme-cache";
  private readonly fallbackTheme: ThemeColorScheme;

  constructor() {
    // Fallback theme matching atom-one-dark.css
    this.fallbackTheme = {
      background: "#282c34",
      text: "#abb2bf",
      lineNumber: "#5c6370",
      tokens: {
        comment: "#5c6370",
        keyword: "#c678dd",
        string: "#98c379",
        number: "#d19a66",
        operator: "#56b6c2", // hue-1 for operators
        punctuation: "#abb2bf", // Default text color
        function: "#61aeee",
        "class-name": "#e6c07b",
        variable: "#e06c75", // hue-5 for variables
        property: "#d19a66",
        tag: "#e06c75",
        "attr-name": "#d19a66",
        "attr-value": "#98c379",
        regex: "#98c379",
        important: "#c678dd",
        bold: "#abb2bf", // Default text, but bold
        italic: "#abb2bf", // Default text, but italic
        plain: "#abb2bf",
      },
    };
  }

  extractThemeColors(): ThemeColorScheme {
    if (this.cachedTheme) {
      return this.cachedTheme;
    }

    if (typeof window === "undefined" || typeof document === "undefined") {
      console.warn(
        "ThemeExtractor: Not in browser environment, using fallback theme"
      );
      return this.fallbackTheme;
    }

    try {
      const extractedTheme = this.extractFromDOM();
      this.cachedTheme = extractedTheme;
      try {
        sessionStorage.setItem(this.cacheKey, JSON.stringify(extractedTheme));
      } catch (e) {
        // Ignore storage errors
      }
      return extractedTheme;
    } catch (error) {
      console.warn(
        "ThemeExtractor: Failed to extract theme from DOM, using fallback:",
        error
      );
      return this.fallbackTheme;
    }
  }

  getBackgroundColor(): string {
    return this.extractThemeColors().background;
  }

  getTextColor(): string {
    return this.extractThemeColors().text;
  }

  getLineNumberColor(): string {
    return this.extractThemeColors().lineNumber;
  }

  clearCache(): void {
    this.cachedTheme = null;
    try {
      sessionStorage.removeItem(this.cacheKey);
    } catch (e) {
      // Ignore storage errors
    }
  }

  private extractFromDOM(): ThemeColorScheme {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    container.style.visibility = "hidden";
    container.style.pointerEvents = "none";

    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.className = "hljs"; // Base class for highlight.js themes

    // Add sample tokens to extract colors from
    const tokenElements = this.createTokenElements();
    tokenElements.forEach((element) => code.appendChild(element));

    pre.appendChild(code);
    container.appendChild(pre);
    document.body.appendChild(container);

    try {
      const codeStyles = window.getComputedStyle(code);

      const theme: ThemeColorScheme = {
        background:
          this.extractColor(codeStyles.backgroundColor) ||
          this.fallbackTheme.background,
        text: this.extractColor(codeStyles.color) || this.fallbackTheme.text,
        lineNumber: this.fallbackTheme.lineNumber, // Use fallback as it's not in hljs themes
        tokens: {
          comment:
            this.extractTokenColor(container, "hljs-comment") ||
            this.fallbackTheme.tokens.comment,
          keyword:
            this.extractTokenColor(container, "hljs-keyword") ||
            this.fallbackTheme.tokens.keyword,
          string:
            this.extractTokenColor(container, "hljs-string") ||
            this.fallbackTheme.tokens.string,
          number:
            this.extractTokenColor(container, "hljs-number") ||
            this.fallbackTheme.tokens.number,
          operator:
            this.extractTokenColor(container, "hljs-operator") ||
            this.fallbackTheme.tokens.operator,
          punctuation:
            this.extractTokenColor(container, "hljs-punctuation") ||
            this.fallbackTheme.tokens.punctuation,
          function:
            this.extractTokenColor(container, "hljs-title") || // hljs uses 'title' for functions
            this.fallbackTheme.tokens.function,
          "class-name":
            this.extractTokenColor(container, "hljs-class .hljs-title") || // and this for classes
            this.fallbackTheme.tokens["class-name"],
          variable:
            this.extractTokenColor(container, "hljs-variable") ||
            this.fallbackTheme.tokens.variable,
          property:
            this.extractTokenColor(container, "hljs-property") ||
            this.fallbackTheme.tokens.property,
          tag:
            this.extractTokenColor(container, "hljs-tag") ||
            this.fallbackTheme.tokens.tag,
          "attr-name":
            this.extractTokenColor(container, "hljs-attr") ||
            this.fallbackTheme.tokens["attr-name"],
          "attr-value":
            this.extractTokenColor(container, "hljs-string") || // Often same as string
            this.fallbackTheme.tokens["attr-value"],
          regex:
            this.extractTokenColor(container, "hljs-regexp") ||
            this.fallbackTheme.tokens.regex,
          important:
            this.extractTokenColor(container, "hljs-strong") ||
            this.fallbackTheme.tokens.important,
          bold:
            this.extractTokenColor(container, "hljs-strong") ||
            this.fallbackTheme.tokens.bold,
          italic:
            this.extractTokenColor(container, "hljs-emphasis") ||
            this.fallbackTheme.tokens.italic,
          plain:
            this.extractColor(codeStyles.color) ||
            this.fallbackTheme.tokens.plain,
        },
      };
      return theme;
    } finally {
      document.body.removeChild(container);
    }
  }

  private createTokenElements(): HTMLElement[] {
    const tokenClasses = [
      "hljs-comment",
      "hljs-keyword",
      "hljs-string",
      "hljs-number",
      "hljs-operator",
      "hljs-punctuation",
      "hljs-title",
      "hljs-variable",
      "hljs-property",
      "hljs-tag",
      "hljs-attr",
      "hljs-regexp",
      "hljs-strong",
      "hljs-emphasis",
    ];

    const classElement = document.createElement("span");
    classElement.className = "hljs-class";
    const titleSpan = document.createElement("span");
    titleSpan.className = "hljs-title";
    titleSpan.textContent = "ClassName";
    classElement.appendChild(titleSpan);

    const elements = tokenClasses.map((tokenClass) => {
      const span = document.createElement("span");
      span.className = tokenClass;
      span.textContent = "sample";
      return span;
    });

    elements.push(classElement);
    return elements;
  }

  private extractTokenColor(
    container: HTMLElement,
    selector: string
  ): string | null {
    const tokenElement = container.querySelector(
      `.${selector.replace(/ /g, ".")}`
    );
    if (!tokenElement) {
      return null;
    }
    const styles = window.getComputedStyle(tokenElement);
    return this.extractColor(styles.color);
  }

  private extractColor(colorValue: string): string | null {
    if (
      !colorValue ||
      colorValue === "transparent" ||
      colorValue === "inherit"
    ) {
      return null;
    }
    if (colorValue.startsWith("rgb")) {
      return this.rgbToHex(colorValue);
    }
    if (colorValue.startsWith("#")) {
      return colorValue;
    }
    return this.namedColorToHex(colorValue) || colorValue;
  }

  private rgbToHex(rgb: string): string {
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (!match) return rgb;
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  private namedColorToHex(colorName: string): string | null {
    // This can be expanded if needed
    const namedColors: Record<string, string> = {
      black: "#000000",
      white: "#ffffff",
    };
    return namedColors[colorName.toLowerCase()] || null;
  }
}

// Export singleton instance
export const themeExtractor = new HighlightJsThemeExtractor();

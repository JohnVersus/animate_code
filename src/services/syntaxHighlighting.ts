import hljs from "highlight.js";

export interface Token {
  type: string;
  content: string;
}

export interface SyntaxHighlightingService {
  detectLanguage(code: string): string;
  highlightCode(code: string, language: string): string;
  getSupportedLanguages(): string[];
  getLineTokens(code: string, language: string): Token[][];
}

// Kept for UI consistency in language dropdowns
const SUPPORTED_LANGUAGES_LIST = [
  "javascript",
  "typescript",
  "python",
  "java",
  "csharp",
  "cpp",
  "c",
  "php",
  "ruby",
  "go",
  "rust",
  "swift",
  "kotlin",
  "scala",
  "bash",
  "json",
  "yaml",
  "sql",
  "css",
  "jsx",
  "tsx",
];

export class HighlightJsSyntaxHighlightingService
  implements SyntaxHighlightingService
{
  private supportedLanguages: string[];

  // Mapping from highlight.js class names to our internal token types
  private readonly HLJS_CLASS_MAP: Record<string, string> = {
    "hljs-comment": "comment",
    "hljs-quote": "comment",
    "hljs-keyword": "keyword",
    "hljs-selector-tag": "keyword",
    "hljs-subst": "plain",
    "hljs-number": "number",
    "hljs-literal": "keyword", // e.g., true, false, null
    "hljs-string": "string",
    "hljs-regexp": "regex",
    "hljs-title": "function",
    "hljs-section": "function",
    "hljs-name": "tag",
    "hljs-attr": "attr-name",
    "hljs-symbol": "variable",
    "hljs-bullet": "string",
    "hljs-built_in": "variable",
    "hljs-addition": "string",
    "hljs-variable": "variable",
    "hljs-template-tag": "tag",
    "hljs-template-variable": "variable",
    "hljs-type": "class-name",
    "hljs-tag": "tag",
    "hljs-attribute": "attr-name",
    "hljs-meta": "keyword", // e.g., @decorator, import
    "hljs-strong": "bold",
    "hljs-emphasis": "italic",
  };

  constructor() {
    this.supportedLanguages = SUPPORTED_LANGUAGES_LIST;
    // Configure highlight.js to not throw errors on invalid languages
    hljs.configure({
      ignoreUnescapedHTML: true,
    });
  }

  detectLanguage(code: string): string {
    if (!code.trim()) return "javascript";
    const result = hljs.highlightAuto(code);
    return result.language || "javascript";
  }

  highlightCode(code: string, language: string): string {
    if (!this.supportedLanguages.includes(language)) {
      language = "plaintext";
    }
    try {
      return hljs.highlight(code, { language, ignoreIllegals: true }).value;
    } catch (error) {
      console.warn(`Failed to highlight code for language ${language}:`, error);
      // Return plain text escaped for HTML
      return code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  }

  getSupportedLanguages(): string[] {
    return [...this.supportedLanguages];
  }

  getLineTokens(code: string, language: string): Token[][] {
    if (!this.supportedLanguages.includes(language)) {
      language = "plaintext";
    }

    try {
      const lines = code.split("\n");
      return lines.map((line) => {
        if (!line.trim()) {
          return [{ type: "plain", content: line }];
        }
        const highlightedHtml = hljs.highlight(line, {
          language,
          ignoreIllegals: true,
        }).value;
        return this.parseHtmlToTokens(highlightedHtml);
      });
    } catch (error) {
      console.warn(`Failed to tokenize code for language ${language}:`, error);
      return code.split("\n").map((line) => [{ type: "plain", content: line }]);
    }
  }

  private parseHtmlToTokens(html: string): Token[] {
    const tokens: Token[] = [];
    // Regex to split by span tags, keeping the tags and their content
    const parts = html.split(/(<\/?span.*?>)/g).filter(Boolean);

    const typeStack: string[] = [];

    for (const part of parts) {
      if (part.startsWith("<span")) {
        const classMatch = part.match(/class="([^"]+)"/);
        const classNames = classMatch ? classMatch[1].split(" ") : [];
        typeStack.push(this.mapHljsClass(classNames));
      } else if (part.startsWith("</span>")) {
        typeStack.pop();
      } else if (part) {
        const content = part
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"');
        const currentType =
          typeStack.length > 0 ? typeStack[typeStack.length - 1] : "plain";
        tokens.push({ type: currentType, content });
      }
    }

    // Merge consecutive tokens of the same type
    if (tokens.length === 0) return [{ type: "plain", content: "" }];
    const mergedTokens: Token[] = [tokens[0]];
    for (let i = 1; i < tokens.length; i++) {
      if (tokens[i].type === mergedTokens[mergedTokens.length - 1].type) {
        mergedTokens[mergedTokens.length - 1].content += tokens[i].content;
      } else {
        mergedTokens.push(tokens[i]);
      }
    }

    return mergedTokens;
  }

  private mapHljsClass(classNames: string[]): string {
    for (const className of classNames) {
      if (this.HLJS_CLASS_MAP[className]) {
        return this.HLJS_CLASS_MAP[className];
      }
    }
    return "plain";
  }
}

// Export singleton instance
export const syntaxHighlightingService =
  new HighlightJsSyntaxHighlightingService();

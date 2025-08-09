import Prism from "prismjs";

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

// Language detection patterns
const LANGUAGE_PATTERNS = {
  python: [
    /def\s+\w+\s*\(/,
    /import\s+\w+/,
    /from\s+\w+\s+import/,
    /print\s*\(/,
    /if\s+__name__\s*==\s*['"']__main__['"']/,
    /class\s+\w+\s*\(/,
    /elif\s+/,
    /:\s*$/m,
  ],
  javascript: [
    /function\s+\w+\s*\(/,
    /const\s+\w+\s*=/,
    /let\s+\w+\s*=/,
    /var\s+\w+\s*=/,
    /console\.log\s*\(/,
    /=>\s*{/,
    /require\s*\(/,
    /module\.exports/,
  ],
  typescript: [
    /interface\s+\w+/,
    /type\s+\w+\s*=/,
    /:\s*string/,
    /:\s*number/,
    /:\s*boolean/,
    /export\s+interface/,
    /import\s+.*from/,
    /<.*>/,
  ],
  java: [
    /public\s+class\s+\w+/,
    /public\s+static\s+void\s+main/,
    /System\.out\.println/,
    /import\s+java\./,
    /private\s+\w+/,
    /public\s+\w+/,
    /extends\s+\w+/,
    /implements\s+\w+/,
  ],
  csharp: [
    /using\s+System/,
    /public\s+class\s+\w+/,
    /Console\.WriteLine/,
    /namespace\s+\w+/,
    /public\s+static\s+void/,
    /private\s+\w+/,
    /public\s+\w+/,
    /\[.*\]/,
  ],
  cpp: [
    /#include\s*</,
    /std::/,
    /cout\s*<</,
    /int\s+main\s*\(/,
    /using\s+namespace/,
    /class\s+\w+/,
    /public:/,
    /private:/,
  ],
  c: [
    /#include\s*</,
    /printf\s*\(/,
    /int\s+main\s*\(/,
    /malloc\s*\(/,
    /struct\s+\w+/,
    /typedef\s+/,
    /void\s+\w+\s*\(/,
    /#define/,
  ],
  php: [
    /<\?php/,
    /\$\w+/,
    /echo\s+/,
    /function\s+\w+\s*\(/,
    /class\s+\w+/,
    /public\s+function/,
    /private\s+function/,
    /->/,
  ],
  ruby: [
    /def\s+\w+/,
    /puts\s+/,
    /require\s+/,
    /class\s+\w+/,
    /end$/m,
    /@\w+/,
    /attr_accessor/,
    /do\s*\|/,
  ],
  go: [
    /package\s+\w+/,
    /func\s+\w+\s*\(/,
    /import\s+\(/,
    /fmt\.Print/,
    /var\s+\w+/,
    /type\s+\w+/,
    /go\s+\w+/,
    /defer\s+/,
  ],
  rust: [
    /fn\s+\w+\s*\(/,
    /let\s+mut/,
    /println!\s*\(/,
    /use\s+std::/,
    /struct\s+\w+/,
    /impl\s+\w+/,
    /match\s+\w+/,
    /&str/,
  ],
  swift: [
    /func\s+\w+\s*\(/,
    /var\s+\w+/,
    /let\s+\w+/,
    /print\s*\(/,
    /class\s+\w+/,
    /struct\s+\w+/,
    /import\s+\w+/,
    /override\s+func/,
  ],
  kotlin: [
    /fun\s+\w+\s*\(/,
    /val\s+\w+/,
    /var\s+\w+/,
    /println\s*\(/,
    /class\s+\w+/,
    /object\s+\w+/,
    /data\s+class/,
    /when\s*\(/,
  ],
  bash: [
    /^#!/,
    /echo\s+/,
    /if\s*\[/,
    /for\s+\w+\s+in/,
    /while\s*\[/,
    /function\s+\w+/,
    /\$\{.*\}/,
    /\|\s*\w+/,
  ],
  json: [
    /^\s*\{/,
    /^\s*\[/,
    /"[\w-]+"\s*:/,
    /:\s*".*"/,
    /:\s*\d+/,
    /:\s*true|false/,
    /:\s*null/,
  ],
  yaml: [/^\s*\w+\s*:/m, /^\s*-\s+/m, /---/, /\.\.\./, /\|\s*$/m, />\s*$/m],
  sql: [
    /SELECT\s+/i,
    /FROM\s+/i,
    /WHERE\s+/i,
    /INSERT\s+INTO/i,
    /UPDATE\s+/i,
    /DELETE\s+FROM/i,
    /CREATE\s+TABLE/i,
    /ALTER\s+TABLE/i,
  ],
  css: [
    /\.\w+\s*\{/,
    /#\w+\s*\{/,
    /\w+\s*:\s*[\w-]+;/,
    /@media/,
    /@import/,
    /::before/,
    /::after/,
    /hover:/,
  ],

  jsx: [
    /<\w+/,
    /React\./,
    /useState/,
    /useEffect/,
    /className=/,
    /onClick=/,
    /return\s*\(/,
    /export\s+default/,
  ],
  tsx: [
    /<\w+/,
    /React\./,
    /useState/,
    /useEffect/,
    /interface\s+\w+/,
    /:\s*React\./,
    /FC</,
    /Props/,
  ],
};

export class PrismSyntaxHighlightingService
  implements SyntaxHighlightingService
{
  private supportedLanguages: string[];

  constructor() {
    this.supportedLanguages = Object.keys(LANGUAGE_PATTERNS);
  }

  detectLanguage(code: string): string {
    if (!code.trim()) return "javascript";

    const scores: Record<string, number> = {};

    // Initialize scores
    for (const lang of this.supportedLanguages) {
      scores[lang] = 0;
    }

    // Calculate scores based on pattern matches
    for (const [language, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(code)) {
          scores[language] += 1;
        }
      }
    }

    // Find language with highest score
    let maxScore = 0;
    let detectedLanguage = "javascript";

    for (const [language, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedLanguage = language;
      }
    }

    // Require at least 2 pattern matches for confidence
    return maxScore >= 2 ? detectedLanguage : "javascript";
  }

  highlightCode(code: string, language: string): string {
    const grammar = Prism.languages[language as keyof typeof Prism.languages];
    if (!grammar) {
      return code;
    }

    try {
      return Prism.highlight(code, grammar, language);
    } catch (error) {
      console.warn(`Failed to highlight code for language ${language}:`, error);
      return code;
    }
  }

  getSupportedLanguages(): string[] {
    return [...this.supportedLanguages];
  }

  getLineTokens(code: string, language: string): Token[][] {
    const grammar = Prism.languages[language as keyof typeof Prism.languages];
    if (!grammar) {
      return code.split("\n").map((line) => [{ type: "plain", content: line }]);
    }

    try {
      const lines = code.split("\n");
      return lines.map((line) => {
        if (!line.trim()) {
          return [{ type: "plain", content: line }];
        }

        const tokens = Prism.tokenize(line, grammar);
        return this.flattenTokens(tokens);
      });
    } catch (error) {
      console.warn(`Failed to tokenize code for language ${language}:`, error);
      return code.split("\n").map((line) => [{ type: "plain", content: line }]);
    }
  }

  private flattenTokens(tokens: (string | Prism.Token)[]): Token[] {
    const result: Token[] = [];

    for (const token of tokens) {
      if (typeof token === "string") {
        result.push({ type: "plain", content: token });
      } else {
        if (Array.isArray(token.content)) {
          result.push(...this.flattenTokens(token.content));
        } else {
          result.push({
            type: token.type,
            content: String(token.content),
          });
        }
      }
    }

    return result;
  }
}

// Export singleton instance
export const syntaxHighlightingService = new PrismSyntaxHighlightingService();

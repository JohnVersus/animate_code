"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Dynamically import Prism to avoid SSR issues
let Prism: any = null;

interface CodeEditorProps {
  code: string;
  language: string;
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: string) => void;
  highlightedLines?: number[];
  className?: string;
}

// Supported languages with their display names
const SUPPORTED_LANGUAGES = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  csharp: "C#",
  cpp: "C++",
  c: "C",
  php: "PHP",
  ruby: "Ruby",
  go: "Go",
  rust: "Rust",
  swift: "Swift",
  kotlin: "Kotlin",
  scala: "Scala",
  bash: "Bash",
  json: "JSON",
  yaml: "YAML",
  sql: "SQL",
  css: "CSS",
  jsx: "JSX",
  tsx: "TSX",
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  onCodeChange,
  onLanguageChange,
  highlightedLines = [],
  className = "",
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string>("");
  const [prismLoaded, setPrismLoaded] = useState(false);
  const [isManuallySelected, setIsManuallySelected] = useState(false);
  const [previousCode, setPreviousCode] = useState<string>("");

  // Load Prism.js and its components after component mounts
  useEffect(() => {
    if (typeof window !== "undefined" && !Prism) {
      try {
        Prism = require("prismjs");
        require("prismjs/themes/prism-tomorrow.css");

        // Load language components
        require("prismjs/components/prism-javascript");
        require("prismjs/components/prism-typescript");
        require("prismjs/components/prism-python");
        require("prismjs/components/prism-java");
        require("prismjs/components/prism-csharp");
        require("prismjs/components/prism-cpp");
        require("prismjs/components/prism-c");
        require("prismjs/components/prism-php");
        require("prismjs/components/prism-ruby");
        require("prismjs/components/prism-go");
        require("prismjs/components/prism-rust");
        require("prismjs/components/prism-swift");
        require("prismjs/components/prism-kotlin");
        require("prismjs/components/prism-scala");
        require("prismjs/components/prism-bash");
        require("prismjs/components/prism-json");
        require("prismjs/components/prism-yaml");
        require("prismjs/components/prism-sql");
        require("prismjs/components/prism-css");
        require("prismjs/components/prism-jsx");
        require("prismjs/components/prism-tsx");

        setPrismLoaded(true);
      } catch (error) {
        console.warn("Failed to load Prism.js:", error);
      }
    } else if (Prism) {
      setPrismLoaded(true);
    }
  }, []);

  // Auto-detect language based on code content
  const detectLanguage = useCallback((codeContent: string): string => {
    if (!codeContent.trim()) return "javascript";

    // Simple heuristics for language detection
    const patterns = {
      python: [
        /def\s+\w+\s*\(/,
        /import\s+\w+/,
        /from\s+\w+\s+import/,
        /print\s*\(/,
        /if\s+__name__\s*==\s*['"']__main__['"']/,
      ],
      javascript: [
        /function\s+\w+\s*\(/,
        /const\s+\w+\s*=/,
        /let\s+\w+\s*=/,
        /var\s+\w+\s*=/,
        /console\.log\s*\(/,
      ],
      typescript: [
        /interface\s+\w+/,
        /type\s+\w+\s*=/,
        /:\s*string/,
        /:\s*number/,
        /:\s*boolean/,
      ],
      java: [
        /public\s+class\s+\w+/,
        /public\s+static\s+void\s+main/,
        /System\.out\.println/,
        /import\s+java\./,
      ],
      csharp: [
        /using\s+System/,
        /public\s+class\s+\w+/,
        /Console\.WriteLine/,
        /namespace\s+\w+/,
      ],
      cpp: [/#include\s*</, /std::/, /cout\s*<</, /int\s+main\s*\(/],
      c: [/#include\s*</, /printf\s*\(/, /int\s+main\s*\(/, /malloc\s*\(/],
      php: [/<\?php/, /\$\w+/, /echo\s+/, /function\s+\w+\s*\(/],
      ruby: [/def\s+\w+/, /puts\s+/, /require\s+/, /class\s+\w+/],
      go: [/package\s+\w+/, /func\s+\w+\s*\(/, /import\s+\(/, /fmt\.Print/],
      rust: [/fn\s+\w+\s*\(/, /let\s+mut/, /println!\s*\(/, /use\s+std::/],
      swift: [/func\s+\w+\s*\(/, /var\s+\w+/, /let\s+\w+/, /print\s*\(/],
      kotlin: [/fun\s+\w+\s*\(/, /val\s+\w+/, /var\s+\w+/, /println\s*\(/],
      bash: [/^#!/, /echo\s+/, /if\s*\[/, /for\s+\w+\s+in/],
      json: [/^\s*\{/, /^\s*\[/, /"[\w-]+"\s*:/],
      yaml: [/^\s*\w+\s*:/, /^\s*-\s+/, /---/],
      sql: [/SELECT\s+/, /FROM\s+/, /WHERE\s+/, /INSERT\s+INTO/i],
      css: [/\.\w+\s*\{/, /#\w+\s*\{/, /\w+\s*:\s*[\w-]+;/],
      jsx: [/<\w+/, /React\./, /useState/, /useEffect/],
      tsx: [/<\w+/, /React\./, /useState/, /useEffect/, /interface\s+\w+/],
    };

    for (const [lang, langPatterns] of Object.entries(patterns)) {
      const matchCount = langPatterns.reduce((count, pattern) => {
        return count + (pattern.test(codeContent) ? 1 : 0);
      }, 0);

      if (matchCount >= 2) {
        return lang;
      }
    }

    // Fallback to javascript if no clear match
    return "javascript";
  }, []);

  // Update detected language when code changes
  useEffect(() => {
    if (code) {
      const detected = detectLanguage(code);
      setDetectedLanguage(detected);

      // Check if this is a significant code change (like pasting new code)
      const isSignificantChange =
        previousCode.length > 0 &&
        code.length > 50 &&
        Math.abs(code.length - previousCode.length) >
          Math.min(code.length, previousCode.length) * 0.5;

      // Reset manual selection for significant changes or if no previous code
      if (isSignificantChange || previousCode.length === 0) {
        setIsManuallySelected(false);
      }

      // Auto-update language if user hasn't manually selected one or if significant change
      if (
        detected !== language &&
        (!isManuallySelected || isSignificantChange)
      ) {
        onLanguageChange(detected);
        if (isSignificantChange) {
          setIsManuallySelected(false);
        }
      }

      setPreviousCode(code);
    } else {
      // Reset manual selection when code is cleared
      setIsManuallySelected(false);
      setDetectedLanguage("");
      setPreviousCode("");
    }
  }, [
    code,
    detectLanguage,
    language,
    onLanguageChange,
    isManuallySelected,
    previousCode,
  ]);

  // Highlight code using Prism.js
  useEffect(() => {
    if (preRef.current && code && Prism && prismLoaded) {
      const grammar = Prism.languages[language as keyof typeof Prism.languages];
      if (grammar) {
        try {
          const highlighted = Prism.highlight(code, grammar, language);
          preRef.current.innerHTML = highlighted;
        } catch (error) {
          console.warn("Failed to highlight code:", error);
          preRef.current.textContent = code;
        }
      } else {
        preRef.current.textContent = code;
      }
    } else if (preRef.current && code) {
      preRef.current.textContent = code;
    }
  }, [code, language, prismLoaded]);

  // Sync scroll between textarea and pre
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  }, []);

  // Handle textarea input
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onCodeChange(e.target.value);
    },
    [onCodeChange]
  );

  // Handle language selection
  const handleLanguageChange = useCallback(
    (value: string) => {
      setIsManuallySelected(true);
      onLanguageChange(value);
    },
    [onLanguageChange]
  );

  // Generate line numbers
  const lines = code.split("\n");
  const lineCount = lines.length;

  return (
    <div className={`code-editor ${className}`}>
      {/* Language Selection */}
      <div className="flex items-center justify-between p-2 bg-gray-100 border-b">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Language:</label>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SUPPORTED_LANGUAGES).map(([key, displayName]) => (
                <SelectItem key={key} value={key}>
                  {displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {detectedLanguage && detectedLanguage !== language && (
          <div className="text-xs text-gray-500">
            Detected:{" "}
            {SUPPORTED_LANGUAGES[detectedLanguage as SupportedLanguage] ||
              detectedLanguage}
          </div>
        )}
      </div>

      {/* Code Editor */}
      <div className="relative flex bg-gray-900 text-white font-mono text-sm">
        {/* Line Numbers */}
        <div className="flex-shrink-0 p-4 bg-gray-800 border-r border-gray-700 select-none">
          {Array.from({ length: lineCount }, (_, i) => i + 1).map((lineNum) => (
            <div
              key={lineNum}
              className={`leading-6 text-right pr-2 ${
                highlightedLines.includes(lineNum)
                  ? "bg-blue-600 text-white"
                  : "text-gray-400"
              }`}
              style={{ minWidth: "2rem" }}
            >
              {lineNum}
            </div>
          ))}
        </div>

        {/* Code Content */}
        <div className="relative flex-1 overflow-hidden">
          {/* Line Highlighting Overlay - Behind everything */}
          {highlightedLines.length > 0 && (
            <div className="absolute inset-0 p-4 pointer-events-none overflow-hidden z-0">
              {code.split("\n").map((line, index) => (
                <div
                  key={index}
                  className={`leading-6 ${
                    highlightedLines.includes(index + 1) ? "bg-blue-500/20" : ""
                  }`}
                  style={{ minHeight: "1.5rem" }}
                >
                  {/* Invisible content to maintain layout */}
                  <span className="invisible">{line || " "}</span>
                </div>
              ))}
            </div>
          )}

          {/* Syntax Highlighted Code (Background) */}
          <pre
            ref={preRef}
            className="absolute inset-0 p-4 overflow-auto whitespace-pre-wrap break-words pointer-events-none z-10"
            style={{ margin: 0 }}
          />

          {/* Textarea (Foreground) */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleInput}
            onScroll={handleScroll}
            placeholder="Paste your code here..."
            className="absolute inset-0 p-4 w-full h-full bg-transparent text-transparent caret-white resize-none outline-none overflow-auto whitespace-pre-wrap break-words z-20"
            style={{ margin: 0 }}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;

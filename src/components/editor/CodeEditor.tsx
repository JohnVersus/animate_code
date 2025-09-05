"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";

interface CodeEditorProps {
  code: string;
  language: string;
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: string) => void;
  highlightedLines?: number[];
  onLineNumberClick?: (lineNumber: number) => void;
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
  onLineNumberClick,
  className = "",
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string>("");
  const [isManuallySelected, setIsManuallySelected] = useState(false);
  const [previousCode, setPreviousCode] = useState<string>("");

  // Update detected language when code changes
  useEffect(() => {
    if (code) {
      // Use highlight.js for auto-detection
      const detectedResult = hljs.highlightAuto(code);
      const detected = detectedResult.language || "javascript";
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
        Object.prototype.hasOwnProperty.call(SUPPORTED_LANGUAGES, detected) &&
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
  }, [code, language, onLanguageChange, isManuallySelected, previousCode]);

  // FIX 2: Refactor highlighting logic for efficiency and clarity.
  // This approach generates the highlighted HTML and sets it in one operation.
  useEffect(() => {
    if (preRef.current) {
      if (code) {
        const highlightedCode = hljs.highlight(code, {
          language,
          ignoreIllegals: true, // Prevents errors on invalid syntax
        }).value;
        preRef.current.innerHTML = highlightedCode;
      } else {
        preRef.current.textContent = ""; // Clear the display if there's no code
      }
    }
  }, [code, language]);

  // Sync scroll between textarea, pre, and line numbers
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
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
        {/* {detectedLanguage && detectedLanguage !== language && (
          <div className="text-xs text-gray-500">
            Detected:{" "}
            {SUPPORTED_LANGUAGES[detectedLanguage as SupportedLanguage] ||
              detectedLanguage}
          </div>
        )} */}
      </div>

      {/* Code Editor */}
      <div className="relative flex bg-gray-900 text-white font-mono text-sm code-editor-container max-h-[80vh]">
        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          className="flex-shrink-0 py-4 pl-4 pr-2 bg-gray-800 border-r border-gray-700 select-none"
          style={{
            overflow: "hidden",
            scrollbarWidth: "none", // Hide scrollbar for Firefox
            msOverflowStyle: "none", // Hide scrollbar for IE/Edge
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => i + 1).map((lineNum) => {
            const isHighlighted = highlightedLines.includes(lineNum);
            return (
              <div
                key={lineNum}
                className={`text-xs h-[1.5rem] flex items-center justify-between ${
                  isHighlighted ? "bg-blue-600 text-white" : "text-gray-400"
                }`}
                style={{
                  minWidth: "3.5rem",
                  lineHeight: "1.5rem",
                  paddingLeft: "0.5rem",
                  paddingRight: "0.5rem",
                }}
              >
                <Button
                  onClick={() => onLineNumberClick?.(lineNum)}
                  variant="ghost"
                  size="sm"
                  className={`w-6 h-6 p-0  ${
                    isHighlighted
                      ? "text-red-500 hover:text-red-400 hover:bg-amber-400"
                      : "text-green-500 hover:text-green-400 hover:bg-blue-700"
                  }`}
                  aria-label={
                    isHighlighted
                      ? `Remove line ${lineNum}`
                      : `Add line ${lineNum}`
                  }
                >
                  {isHighlighted ? "-" : "+"}
                </Button>
                <span>{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Code Content */}
        <div className="relative flex-1">
          {/* Line Highlighting Overlay - Behind everything */}
          {highlightedLines.length > 0 && (
            <div className="absolute inset-0 p-4 pointer-events-none overflow-hidden z-0">
              {code.split("\n").map((line, index) => (
                <div
                  key={index}
                  className={`${
                    highlightedLines.includes(index + 1) ? "bg-blue-500/20" : ""
                  }`}
                  style={{
                    lineHeight: "1.5rem",
                    height: "1.5rem",
                    minHeight: "1.5rem",
                  }}
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
            className="absolute inset-0 p-4 whitespace-pre-wrap break-words pointer-events-none z-10 text-xs"
            style={{
              margin: 0,
              lineHeight: "1.5rem",
              overflow: "hidden",
            }}
          />

          {/* Textarea (Foreground) */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleInput}
            onScroll={handleScroll}
            placeholder="Paste your code here..."
            className="absolute inset-0 p-4 w-full h-full bg-transparent text-transparent caret-white resize-none outline-none whitespace-pre-wrap break-words z-20 text-xs"
            style={{
              margin: 0,
              lineHeight: "1.5rem",
              overflow: "auto",
            }}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;

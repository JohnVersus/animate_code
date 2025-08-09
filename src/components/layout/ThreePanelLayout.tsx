"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import CodeEditor to avoid SSR issues
const CodeEditor = dynamic(
  () =>
    import("@/components/editor/CodeEditor").then((mod) => ({
      default: mod.CodeEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-gray-500">
        Loading editor...
      </div>
    ),
  }
);

export default function ThreePanelLayout() {
  const [leftPanelWidth, setLeftPanelWidth] = useState(30);
  const [rightPanelWidth, setRightPanelWidth] = useState(30);

  // State for CodeEditor
  const [code, setCode] = useState(`function hello() {
  console.log("Hello, World!");
  return "Welcome to Code Animator!";
}`);
  const [language, setLanguage] = useState("javascript");
  const [highlightedLines, setHighlightedLines] = useState<number[]>([2, 3]);

  return (
    <div className="flex h-full bg-gray-100">
      {/* Left Panel - Code Editor */}
      <div
        className="bg-white border-r border-gray-300 flex flex-col"
        style={{ width: `${leftPanelWidth}%` }}
      >
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Code Editor</h2>
        </div>
        <div className="flex-1 p-0">
          <CodeEditor
            code={code}
            language={language}
            onCodeChange={setCode}
            onLanguageChange={setLanguage}
            highlightedLines={highlightedLines}
            className="h-full"
          />
        </div>
      </div>

      {/* Center Panel - Animation Preview */}
      <div
        className="bg-white border-r border-gray-300 flex flex-col"
        style={{ width: `${100 - leftPanelWidth - rightPanelWidth}%` }}
      >
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">
            Animation Preview
          </h2>
        </div>
        <div className="flex-1 p-4">
          <div className="h-full bg-black rounded flex items-center justify-center">
            <p className="text-white">
              Motion Canvas preview will be rendered here
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Timeline */}
      <div
        className="bg-white flex flex-col"
        style={{ width: `${rightPanelWidth}%` }}
      >
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Timeline</h2>
        </div>
        <div className="flex-1 p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Test Controls
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setHighlightedLines([1])}
                  className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Highlight Line 1
                </button>
                <button
                  onClick={() => setHighlightedLines([2, 3])}
                  className="w-full px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Highlight Lines 2-3
                </button>
                <button
                  onClick={() => setHighlightedLines([])}
                  className="w-full px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Clear Highlights
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Timeline controls will be implemented here
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

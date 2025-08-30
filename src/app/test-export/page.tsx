"use client";

import React, { useState } from "react";
import { ExportButton } from "@/components/export";
import { Slide } from "@/types";

export default function TestExportPage() {
  const [testCode] = useState(`function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));`);

  const [testSlides] = useState<Slide[]>([
    {
      id: "1",
      name: "Function Declaration",
      lineRanges: [{ start: 1, end: 1 }],
      duration: 2000,
      animationStyle: "fade",
      order: 0,
    },
    {
      id: "2",
      name: "Base Case",
      lineRanges: [{ start: 1, end: 2 }],
      duration: 2000,
      animationStyle: "fade",
      order: 1,
    },
    {
      id: "3",
      name: "Recursive Case",
      lineRanges: [{ start: 1, end: 3 }],
      duration: 2000,
      animationStyle: "fade",
      order: 2,
    },
    {
      id: "4",
      name: "Complete Function",
      lineRanges: [{ start: 1, end: 6 }],
      duration: 2000,
      animationStyle: "fade",
      order: 3,
    },
  ]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Video Export Test
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Code</h2>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
            <code>{testCode}</code>
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Slides</h2>
          <div className="space-y-2">
            {testSlides.map((slide, index) => (
              <div
                key={slide.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div>
                  <span className="font-medium">
                    {index + 1}. {slide.name}
                  </span>
                  <span className="text-gray-500 ml-2">
                    (Lines{" "}
                    {slide.lineRanges
                      .map((r) => `${r.start}-${r.end}`)
                      .join(", ")}
                    )
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {slide.duration}ms, {slide.animationStyle}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Export Test</h2>
          <p className="text-gray-600 mb-4">
            Click the button below to test the video export functionality. This
            will create a short animation of the fibonacci function above.
          </p>

          <ExportButton
            code={testCode}
            language="javascript"
            slides={testSlides}
            projectName="fibonacci-test"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
          />
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            ← Back to Main App
          </a>
        </div>
      </div>
    </div>
  );
}

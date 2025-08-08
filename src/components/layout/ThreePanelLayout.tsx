"use client";

import { useState } from "react";

export default function ThreePanelLayout() {
  const [leftPanelWidth, setLeftPanelWidth] = useState(30);
  const [rightPanelWidth, setRightPanelWidth] = useState(30);

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
        <div className="flex-1 p-4">
          <div className="h-full bg-gray-50 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
            <p className="text-gray-500">
              Code editor will be implemented here
            </p>
          </div>
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
          <div className="h-full bg-gray-50 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
            <p className="text-gray-500">
              Timeline controls will be implemented here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

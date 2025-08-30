"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Slide, AnimationState } from "@/types";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ExportButton } from "@/components/export";

// Dynamically import components to avoid SSR issues
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

const AnimationPreview = dynamic(
  () =>
    import("@/components/preview/AnimationPreview").then((mod) => ({
      default: mod.AnimationPreview,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-gray-500">
        Loading preview...
      </div>
    ),
  }
);

const SlideManager = dynamic(
  () =>
    import("@/components/slides/SlideManager").then((mod) => ({
      default: mod.SlideManager,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-gray-500">
        Loading slides...
      </div>
    ),
  }
);

export default function ThreePanelLayout() {
  // State for CodeEditor
  const [code, setCode] = useState(`function hello() {
  console.log("Hello, World!");
  return "Welcome to Code Animator!";
}`);
  const [language, setLanguage] = useState("javascript");
  const [highlightedLines, setHighlightedLines] = useState<number[]>([2, 3]);

  // State for slides and animation
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animationState, setAnimationState] = useState<AnimationState>({
    currentSlide: 0,
    isPlaying: false,
    progress: 0,
    totalDuration: 0,
    playbackSpeed: 1,
  });

  const handlePlayStateChange = (playing: boolean) => {
    setAnimationState((prev) => ({ ...prev, isPlaying: playing }));
  };

  const handleSlideChange = (slideIndex: number) => {
    setCurrentSlide(slideIndex);
    setAnimationState((prev) => ({ ...prev, currentSlide: slideIndex }));
  };

  return (
    <div className="h-full bg-gray-100">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Code Editor */}
        <ResizablePanel defaultSize={35} minSize={25} maxSize={60}>
          <div className="bg-white border-r border-gray-300 flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">
                Code Editor
              </h2>
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
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Animation Preview and Slides */}
        <ResizablePanel defaultSize={65} minSize={40}>
          <ResizablePanelGroup direction="vertical" className="h-full">
            {/* Animation Preview Section */}
            <ResizablePanel defaultSize={70} minSize={40} maxSize={85}>
              <div className="bg-white flex flex-col h-full border-b border-gray-300">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Animation Preview
                  </h2>
                  <ExportButton
                    code={code}
                    language={language}
                    slides={slides}
                    projectName="code-animation"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  />
                </div>
                <div className="flex-1 p-4">
                  <div className="w-full h-full max-w-4xl mx-auto">
                    <AnimationPreview
                      code={code}
                      language={language}
                      slides={slides}
                      currentSlide={currentSlide}
                      isPlaying={animationState.isPlaying}
                      onPlayStateChange={handlePlayStateChange}
                      onCurrentSlideChange={handleSlideChange}
                    />
                  </div>
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Slides Section */}
            <ResizablePanel defaultSize={30} minSize={15} maxSize={60}>
              <div className="bg-white flex flex-col h-full">
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-base font-semibold text-gray-800">
                    Slides
                  </h2>
                </div>
                <div className="flex-1">
                  <SlideManager
                    slides={slides}
                    currentSlide={currentSlide}
                    onSlidesChange={setSlides}
                    onCurrentSlideChange={handleSlideChange}
                    totalLines={code.split("\n").length}
                  />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

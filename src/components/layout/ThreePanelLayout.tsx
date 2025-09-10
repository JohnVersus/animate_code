"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Slide, AnimationState, Project, VideoSettings } from "@/types";
import { updateLineRanges } from "@/lib/line-numbers";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ExportButton, ExportDialog } from "@/components/export";
import { videoExportService, ExportProgress } from "../../services/videoExport";
import { trackEvent } from "../../lib/gtag";
import { CodeManager } from "@/components/project";
import {
  previewViewport,
  portraitPreviewViewport,
} from "@/services/viewportConfig";
import { Button } from "@/components/ui/button";

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
  const [code, setCode] = useState(`// Welcome to Code Animator!
// Loading your example project...

function createCalculator() {
  // Your example code will load shortly
  return "Loading...";
}`);
  const [language, setLanguage] = useState("javascript");
  const [highlightedLines, setHighlightedLines] = useState<number[]>([]);

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

  // State for project management
  const [currentProjectName, setCurrentProjectName] = useState<string>("");

  // State for global animation speed
  const [globalSpeed, setGlobalSpeed] = useState<number>(1.0);

  // State for preview mode
  const [previewMode, setPreviewMode] = useState<"landscape" | "portrait">(
    "landscape"
  );

  const handlePlayStateChange = (playing: boolean) => {
    setAnimationState((prev) => ({ ...prev, isPlaying: playing }));
  };

  const handleSlideChange = (slideIndex: number) => {
    setCurrentSlide(slideIndex);
    setAnimationState((prev) => ({ ...prev, currentSlide: slideIndex }));

    // Update highlighted lines based on selected slide
    if (slides.length > 0 && slideIndex >= 0 && slideIndex < slides.length) {
      const selectedSlide = slides[slideIndex];
      const lines: number[] = [];
      selectedSlide.lineRanges.forEach((range) => {
        for (let i = range.start; i <= range.end; i++) {
          lines.push(i);
        }
      });
      setHighlightedLines(lines);
    } else {
      setHighlightedLines([]);
    }
  };

  const handleCodeSelect = (
    newCode: string,
    newLanguage: string,
    newSlides: Slide[]
  ) => {
    setCode(newCode);
    setLanguage(newLanguage);
    setSlides(newSlides);
    setCurrentSlide(0);
    setAnimationState((prev) => ({
      ...prev,
      currentSlide: 0,
      isPlaying: false,
      progress: 0,
    }));

    // Update highlighted lines based on first slide
    if (newSlides.length > 0) {
      const firstSlide = newSlides[0];
      const lines: number[] = [];
      firstSlide.lineRanges.forEach((range) => {
        for (let i = range.start; i <= range.end; i++) {
          lines.push(i);
        }
      });
      setHighlightedLines(lines);
    } else {
      setHighlightedLines([]);
    }
  };

  const handleSlidesChange = (newSlides: Slide[]) => {
    setSlides(newSlides);

    // Update highlighted lines if current slide is still valid
    if (
      newSlides.length > 0 &&
      currentSlide >= 0 &&
      currentSlide < newSlides.length
    ) {
      const selectedSlide = newSlides[currentSlide];
      const lines: number[] = [];
      selectedSlide.lineRanges.forEach((range) => {
        for (let i = range.start; i <= range.end; i++) {
          lines.push(i);
        }
      });
      setHighlightedLines(lines);
    } else {
      setHighlightedLines([]);
    }
  };

  const handleAutoSave = (projectName: string) => {
    setCurrentProjectName(projectName);
  };

  // State and logic for Export Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState<
    ExportProgress | undefined
  >();
  const [exportedVideo, setExportedVideo] = useState<
    | {
        blob: Blob;
        fileName: string;
      }
    | undefined
  >(undefined);

  const handleExportClick = () => {
    if (!code.trim()) {
      alert("Please add some code before exporting");
      return;
    }
    if (slides.length === 0) {
      alert("Please create at least one slide before exporting");
      return;
    }
    trackEvent("export_video_click");
    setIsDialogOpen(true);
  };

  const handleExport = useCallback(
    async (exportProjectName: string, videoSettings: VideoSettings) => {
      try {
        setExportProgress({
          phase: "preparing",
          progress: 0,
          message: "Starting export...",
        });
        setExportedVideo(undefined);
        const videoBlob = await videoExportService.exportVideo(
          code,
          language,
          slides,
          {
            videoSettings,
            projectName: exportProjectName,
          },
          (progress) => {
            setExportProgress(progress);
          },
          globalSpeed
        );
        const fileName = `${exportProjectName}.${videoSettings.format}`;
        setExportedVideo({
          blob: videoBlob,
          fileName,
        });
        setExportProgress({
          phase: "complete",
          progress: 1,
          message: `Video exported successfully! You can now preview and download it.`,
        });
      } catch (error) {
        console.error("Export failed:", error);
        setExportProgress({
          phase: "error",
          progress: 0,
          message: error instanceof Error ? error.message : "Export failed",
          error: error
            ? {
                type: "EXPORT_ERROR" as any,
                message: (error as any).message,
                details: error,
                timestamp: new Date(),
              }
            : undefined,
        });
      }
    },
    [code, language, slides, globalSpeed]
  );

  const handleCancel = useCallback(() => {
    videoExportService.cancelExport();
    setExportProgress({
      phase: "error",
      progress: 0,
      message: "Export cancelled by user",
    });
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setTimeout(() => {
      setExportProgress(undefined);
      setExportedVideo(undefined);
    }, 300);
  }, []);

  const isExporting = videoExportService.isExporting();
  const canExport = code.trim() && slides.length > 0;

  const handleLineNumberToggle = useCallback(
    (lineNumber: number) => {
      if (
        slides.length === 0 ||
        currentSlide < 0 ||
        currentSlide >= slides.length
      ) {
        return;
      }

      const slide = slides[currentSlide];
      const isHighlighted = highlightedLines.includes(lineNumber);

      const updatedRanges = updateLineRanges(
        slide.lineRanges,
        lineNumber,
        isHighlighted ? "remove" : "add"
      );

      const updatedSlide = { ...slide, lineRanges: updatedRanges };

      const newSlides = [
        ...slides.slice(0, currentSlide),
        updatedSlide,
        ...slides.slice(currentSlide + 1),
      ];

      handleSlidesChange(newSlides);
    },
    [slides, currentSlide, highlightedLines, handleSlidesChange]
  );

  // Update highlighted lines when slides or current slide changes
  useEffect(() => {
    if (
      slides.length > 0 &&
      currentSlide >= 0 &&
      currentSlide < slides.length
    ) {
      const selectedSlide = slides[currentSlide];
      const lines: number[] = [];
      selectedSlide.lineRanges.forEach((range) => {
        for (let i = range.start; i <= range.end; i++) {
          lines.push(i);
        }
      });
      setHighlightedLines(lines);
    } else {
      setHighlightedLines([]);
    }
  }, [slides, currentSlide]);

  const disableLineNumberButtons =
    slides.length === 0 || currentSlide < 0 || currentSlide >= slides.length;

  return (
    <div className="h-full bg-gray-100">
      <ExportDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onExport={handleExport}
        onCancel={handleCancel}
        exportProgress={exportProgress}
        defaultProjectName={currentProjectName || "code-animation"}
        exportedVideo={exportedVideo}
      />
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Code Projects */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="bg-white border-r border-gray-300 flex flex-col h-full">
            <CodeManager
              onCodeSelect={handleCodeSelect}
              currentCode={code}
              currentLanguage={language}
              currentSlides={slides}
              onAutoSave={handleAutoSave}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Middle Panel - Code Editor */}
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          <div className="bg-white border-r border-gray-300 flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  Code Editor
                </h2>
                {currentProjectName && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {currentProjectName}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 p-0">
              <CodeEditor
                code={code}
                language={language}
                onCodeChange={setCode}
                onLanguageChange={setLanguage}
                highlightedLines={highlightedLines}
                onLineNumberClick={handleLineNumberToggle}
                className="h-full"
                disableLineNumberButtons={disableLineNumberButtons}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Animation Preview and Slides */}
        <ResizablePanel defaultSize={45} minSize={35}>
          <ResizablePanelGroup direction="vertical" className="h-full">
            {/* Animation Preview Section */}
            <ResizablePanel defaultSize={70} minSize={40} maxSize={85}>
              <div className="bg-white flex flex-col h-full border-b border-gray-300">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Animation Preview
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPreviewMode(
                          previewMode === "landscape" ? "portrait" : "landscape"
                        )
                      }
                    >
                      {previewMode === "landscape" ? "Portrait" : "Landscape"}
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ExportButton
                      onClick={handleExportClick}
                      disabled={!canExport}
                      isExporting={isExporting}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    />
                  </div>
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
                      globalSpeed={globalSpeed}
                      onGlobalSpeedChange={setGlobalSpeed}
                      viewport={
                        previewMode === "landscape"
                          ? previewViewport
                          : portraitPreviewViewport
                      }
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
                    onSlidesChange={handleSlidesChange}
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

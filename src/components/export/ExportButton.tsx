"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ExportDialog } from "./ExportDialog";
import { videoExportService, ExportProgress } from "../../services/videoExport";
import { Slide, VideoSettings } from "../../types";

interface ExportButtonProps {
  code: string;
  language: string;
  slides: Slide[];
  projectName?: string;
  disabled?: boolean;
  className?: string;
  globalSpeed?: number;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  code,
  language,
  slides,
  projectName = "code-animation",
  disabled = false,
  className = "",
  globalSpeed = 1.0,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState<
    ExportProgress | undefined
  >();
  const [exportedVideo, setExportedVideo] = useState<{
    blob: Blob;
    fileName: string;
  } | null>(null);

  const handleExportClick = () => {
    // Validate prerequisites
    if (!code.trim()) {
      alert("Please add some code before exporting");
      return;
    }

    if (slides.length === 0) {
      alert("Please create at least one slide before exporting");
      return;
    }

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

        // Clean up previous exported video
        setExportedVideo(null);

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

        // Store the exported video for preview
        const fileName = `${exportProjectName}.${videoSettings.format}`;
        setExportedVideo({
          blob: videoBlob,
          fileName,
        });

        // Update progress to show completion
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
          error:
            error instanceof Error
              ? {
                  type: "EXPORT_ERROR" as any,
                  message: error.message,
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

    // Clean up after a delay to allow the dialog to close smoothly
    setTimeout(() => {
      setExportProgress(undefined);
      setExportedVideo(null);
    }, 300);
  }, []);

  const isExporting = videoExportService.isExporting();
  const canExport = !disabled && code.trim() && slides.length > 0;

  return (
    <>
      <Button
        onClick={handleExportClick}
        disabled={!canExport || isExporting}
        className={`${className}`}
        title={
          !canExport
            ? "Add code and slides to enable export"
            : "Export animation as video"
        }
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {isExporting ? "Exporting..." : "Export Video"}
      </Button>

      <ExportDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onExport={handleExport}
        onCancel={handleCancel}
        exportProgress={exportProgress}
        defaultProjectName={projectName}
        exportedVideo={exportedVideo}
      />
    </>
  );
};

"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { VideoSettings } from "../../types";
import { ExportProgress } from "../../services/videoExport";
import { VideoPreview } from "./VideoPreview";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (projectName: string, videoSettings: VideoSettings) => void;
  onCancel: () => void;
  exportProgress?: ExportProgress;
  defaultProjectName?: string;
  exportedVideo?: {
    blob: Blob;
    fileName: string;
  };
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  onCancel,
  exportProgress,
  defaultProjectName = "code-animation",
  exportedVideo,
}) => {
  const [projectName, setProjectName] = useState(defaultProjectName);
  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    resolution: "1080p",
    frameRate: 30,
    format: "mp4",
  });

  const handleExport = () => {
    if (!projectName.trim()) {
      return;
    }
    onExport(projectName.trim(), videoSettings);
  };

  const handleCancel = () => {
    if (
      exportProgress &&
      exportProgress.phase !== "complete" &&
      exportProgress.phase !== "error"
    ) {
      onCancel();
    } else {
      onClose();
    }
  };

  const isExporting =
    exportProgress &&
    exportProgress.phase !== "complete" &&
    exportProgress.phase !== "error";

  const getProgressColor = () => {
    if (!exportProgress) return "bg-blue-500";

    switch (exportProgress.phase) {
      case "preparing":
        return "bg-yellow-500";
      case "rendering":
        return "bg-blue-500";
      case "encoding":
        return "bg-purple-500";
      case "complete":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  };

  const getPhaseLabel = () => {
    if (!exportProgress) return "";

    switch (exportProgress.phase) {
      case "preparing":
        return "Preparing";
      case "rendering":
        return "Rendering";
      case "encoding":
        return "Encoding";
      case "complete":
        return "Complete";
      case "error":
        return "Error";
      default:
        return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`${
          exportedVideo
            ? "sm:max-w-4xl max-h-[90vh] overflow-y-auto"
            : "sm:max-w-md"
        }`}
      >
        <DialogHeader>
          <DialogTitle>Export Video</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Show video preview if export is complete */}
          {exportedVideo ? (
            <VideoPreview
              videoBlob={exportedVideo.blob}
              fileName={exportedVideo.fileName}
              onClose={onClose}
            />
          ) : (
            <>
              {/* Project Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                  disabled={isExporting}
                />
              </div>

              {/* Video Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Video Settings</h3>

                {/* Resolution */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Resolution</label>
                  <Select
                    value={videoSettings.resolution}
                    onValueChange={(value: "720p" | "1080p" | "4K") =>
                      setVideoSettings({ ...videoSettings, resolution: value })
                    }
                    disabled={isExporting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">720p (1280×720)</SelectItem>
                      <SelectItem value="1080p">1080p (1920×1080)</SelectItem>
                      <SelectItem value="4K">4K (3840×2160)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Frame Rate */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Frame Rate</label>
                  <Select
                    value={videoSettings.frameRate.toString()}
                    onValueChange={(value) =>
                      setVideoSettings({
                        ...videoSettings,
                        frameRate: parseInt(value) as 30 | 60,
                      })
                    }
                    disabled={isExporting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 FPS</SelectItem>
                      <SelectItem value="60">60 FPS</SelectItem>
                    </SelectContent>
                  </Select>
                  {videoSettings.format === "gif" && (
                    <p className="text-xs text-gray-500">
                      Note: Lower frame rates produce smaller GIF files
                    </p>
                  )}
                </div>

                {/* Format */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Format</label>
                  <Select
                    value={videoSettings.format}
                    onValueChange={(value: "mp4" | "webm" | "gif") =>
                      setVideoSettings({ ...videoSettings, format: value })
                    }
                    disabled={isExporting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp4">MP4</SelectItem>
                      <SelectItem value="webm">WebM</SelectItem>
                      <SelectItem value="gif">GIF</SelectItem>
                    </SelectContent>
                  </Select>
                  {videoSettings.format === "gif" && (
                    <p className="text-xs text-gray-500">
                      Note: GIF files are larger than video formats and best for
                      short animations
                    </p>
                  )}
                </div>
              </div>

              {/* Progress Section */}
              {exportProgress && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{getPhaseLabel()}</span>
                    <span>{Math.round(exportProgress.progress * 100)}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                      style={{ width: `${exportProgress.progress * 100}%` }}
                    />
                  </div>

                  {/* Progress Message */}
                  {exportProgress.message && (
                    <p className="text-sm text-gray-600">
                      {exportProgress.message}
                    </p>
                  )}

                  {/* Frame Progress (for rendering phase) */}
                  {exportProgress.phase === "rendering" &&
                    exportProgress.currentFrame &&
                    exportProgress.totalFrames && (
                      <p className="text-xs text-gray-500">
                        Frame {exportProgress.currentFrame} of{" "}
                        {exportProgress.totalFrames}
                      </p>
                    )}

                  {/* Error Message */}
                  {exportProgress.phase === "error" && exportProgress.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">
                        {exportProgress.error.message}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isExporting && exportProgress?.phase === "encoding"}
                >
                  {isExporting ? "Cancel" : "Close"}
                </Button>

                {exportProgress?.phase === "complete" ? (
                  <Button
                    onClick={onClose}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Done
                  </Button>
                ) : exportProgress?.phase === "error" ? (
                  <Button
                    onClick={handleExport}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Retry
                  </Button>
                ) : (
                  <Button
                    onClick={handleExport}
                    disabled={isExporting || !projectName.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isExporting ? "Exporting..." : "Export"}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

"use client";

import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface VideoPreviewProps {
  videoBlob: Blob;
  fileName: string;
  onClose: () => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoBlob,
  fileName,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const [isGif, setIsGif] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(videoBlob);
    setVideoUrl(url);
    setMetadataLoaded(false);
    setDuration(0);

    const isGifFile =
      videoBlob.type === "image/gif" || fileName.toLowerCase().endsWith(".gif");
    setIsGif(isGifFile);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [videoBlob, fileName]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      // This will be triggered when the browser has enough data to determine the duration
      // For some formats (like webm), we need to seek to the end to get the duration
      video.currentTime = 1e101;
    };

    const handleDurationChange = () => {
      if (video.duration && isFinite(video.duration)) {
        setDuration(video.duration);
        setMetadataLoaded(true);
        // Seek back to the beginning
        video.currentTime = 0;
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("durationchange", handleDurationChange);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("durationchange", handleDurationChange);
    };
  }, [videoUrl]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      // Only update time if it's a valid finite number
      if (isFinite(time) && !isNaN(time)) {
        setCurrentTime(time);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (time: number) => {
    // Handle invalid time values
    if (!isFinite(time) || isNaN(time) || time < 0) {
      return "0:00";
    }

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {/* Media Player - Video or GIF */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        {isGif ? (
          <img
            src={videoUrl}
            alt="Generated GIF"
            className="w-full h-auto max-h-[48rem] mx-auto"
          />
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-auto max-h-[48rem]"
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
        )}
      </div>

      {/* Video Controls - Only show for video files, not GIFs */}
      {!isGif && (
        <div className="space-y-3">
          {/* Play/Pause and Time Display */}
          <div className="flex items-center space-x-4">
            <Button
              onClick={handlePlayPause}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              {isPlaying ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 9v6m4-6v6"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </Button>

            <div className="text-sm text-gray-600">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                  duration > 0 ? (currentTime / duration) * 100 : 0
                }%, #e5e7eb ${
                  duration > 0 ? (currentTime / duration) * 100 : 0
                }%, #e5e7eb 100%)`,
              }}
            />
          </div>
        </div>
      )}

      {/* GIF Info - Show for GIF files */}
      {isGif && (
        <div className="text-center text-sm text-gray-600 py-2">
          GIF animation will loop automatically
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-gray-600">File: {fileName}</div>

        <div className="flex space-x-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={handleDownload}
            className="bg-green-600 hover:bg-green-700"
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
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

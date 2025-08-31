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

  useEffect(() => {
    // Create object URL for the video blob
    const url = URL.createObjectURL(videoBlob);
    setVideoUrl(url);
    setMetadataLoaded(false);
    setDuration(0);

    // Cleanup function to revoke the URL when component unmounts
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [videoBlob]);

  // Retry mechanism for WebM files that might take longer to load metadata
  useEffect(() => {
    if (!metadataLoaded && videoUrl && videoRef.current) {
      let retryCount = 0;
      const maxRetries = 10;

      const checkDuration = () => {
        if (videoRef.current && retryCount < maxRetries) {
          const videoDuration = videoRef.current.duration;
          if (
            isFinite(videoDuration) &&
            !isNaN(videoDuration) &&
            videoDuration > 0
          ) {
            setDuration(videoDuration);
            setMetadataLoaded(true);
            return;
          }

          retryCount++;
          setTimeout(checkDuration, 200); // Check every 200ms
        }
      };

      // Start checking after a small delay
      const timer = setTimeout(checkDuration, 100);

      return () => clearTimeout(timer);
    }
  }, [videoUrl, metadataLoaded]);

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

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      // Only set duration if it's a valid finite number
      if (
        isFinite(videoDuration) &&
        !isNaN(videoDuration) &&
        videoDuration > 0
      ) {
        setDuration(videoDuration);
        setMetadataLoaded(true);
      }
    }
  };

  // Additional handler specifically for WebM files that might need more time
  const handleCanPlayThrough = () => {
    if (videoRef.current && !metadataLoaded) {
      const videoDuration = videoRef.current.duration;
      if (
        isFinite(videoDuration) &&
        !isNaN(videoDuration) &&
        videoDuration > 0
      ) {
        setDuration(videoDuration);
        setMetadataLoaded(true);
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
      {/* Video Player */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-auto max-h-96"
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleLoadedMetadata}
          onCanPlayThrough={handleCanPlayThrough}
          onDurationChange={handleLoadedMetadata}
          onLoadedData={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
      </div>

      {/* Video Controls */}
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
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
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

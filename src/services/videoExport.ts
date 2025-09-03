import { Slide, VideoSettings, ErrorType, AppError, LineRange } from "../types";
import { animationEngine } from "./animationEngine";
import { canvasRenderer } from "./canvasRenderer";
import { exportViewport } from "./viewportConfig";
import GIF from "gif.js";
import { testGifLibrary } from "../utils/gifTest";

export interface ExportProgress {
  phase: "preparing" | "rendering" | "encoding" | "complete" | "error";
  progress: number; // 0-1
  currentFrame?: number;
  totalFrames?: number;
  message?: string;
  error?: AppError;
}

export interface ExportOptions {
  videoSettings: VideoSettings;
  projectName: string;
}

export interface VideoExportService {
  exportVideo(
    code: string,
    language: string,
    slides: Slide[],
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void,
    globalSpeed?: number
  ): Promise<Blob>;
  cancelExport(): void;
  isExporting(): boolean;
}

class MotionCanvasVideoExportService implements VideoExportService {
  private isCurrentlyExporting = false;
  private shouldCancel = false;
  private currentExportId: string | null = null;

  async exportVideo(
    code: string,
    language: string,
    slides: Slide[],
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void,
    globalSpeed: number = 1.0
  ): Promise<Blob> {
    if (this.isCurrentlyExporting) {
      throw new Error("Export already in progress");
    }

    this.isCurrentlyExporting = true;
    this.shouldCancel = false;
    this.currentExportId = Date.now().toString();

    try {
      // Validate inputs
      if (!code.trim()) {
        throw new Error("No code provided for export");
      }
      if (slides.length === 0) {
        throw new Error("No slides defined for export");
      }

      // Validate browser support for MediaRecorder
      if (!window.MediaRecorder) {
        throw new Error("Video export is not supported in this browser");
      }

      // Check if the requested format is supported (skip for GIF)
      if (options.videoSettings.format !== "gif") {
        const mimeType =
          options.videoSettings.format === "mp4" ? "video/mp4" : "video/webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          throw new Error(
            `${options.videoSettings.format.toUpperCase()} format is not supported in this browser`
          );
        }
      }

      // Phase 1: Preparing
      onProgress?.({
        phase: "preparing",
        progress: 0,
        message: "Preparing animation for export...",
      });

      // Calculate video parameters
      const { frameRate, resolution } = options.videoSettings;
      const totalDuration =
        slides.reduce((sum, slide) => sum + slide.duration / globalSpeed, 0) /
        1000; // Convert to seconds and apply global speed

      // Add a small buffer at the end to ensure the last frame is visible
      const bufferDuration = 0.5; // 0.5 seconds
      const totalDurationWithBuffer = totalDuration + bufferDuration;
      const totalFrames = Math.ceil(totalDurationWithBuffer * frameRate);

      // Create canvas for rendering
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to create canvas context");
      }

      // Set canvas dimensions based on resolution
      const dimensions = this.getResolutionDimensions(resolution);

      // Use the export viewport for video export sizing
      const contentSize =
        canvasRenderer.getCanvasSizeWithViewport(exportViewport);

      // Scale the content to fit the target resolution while maintaining aspect ratio
      const scaleX = dimensions.width / contentSize.width;
      const scaleY = dimensions.height / contentSize.height;
      const scale = Math.min(scaleX, scaleY);

      // Set final canvas size
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      // Store scale for later use in rendering
      (canvas as any)._exportScale = scale;
      (canvas as any)._contentSize = contentSize;

      // Phase 2: Rendering frames
      onProgress?.({
        phase: "rendering",
        progress: 0,
        totalFrames,
        currentFrame: 0,
        message: "Rendering animation frames...",
      });

      const frames: ImageData[] = [];
      let currentFrame = 0;

      // Generate animation steps with global speed
      const animationSteps = this.calculateAnimationSteps(
        code,
        slides,
        globalSpeed
      );

      // Debug: Log animation steps
      console.log(`Animation steps:`, animationSteps.length);
      animationSteps.forEach((step, index) => {
        console.log(
          `Step ${index}: startTime=${step.startTime}ms, duration=${step.duration}ms, slideIndex=${step.slideIndex}`
        );
      });

      // Render each frame
      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        if (this.shouldCancel) {
          throw new Error("Export cancelled by user");
        }

        const timeInSeconds = frameIndex / frameRate;
        const frameData = this.renderFrameAtTime(
          canvas,
          ctx,
          code,
          language,
          animationSteps,
          timeInSeconds
        );

        frames.push(frameData);
        currentFrame++;

        // Debug: Log frame timing for first few frames
        if (frameIndex < 5) {
          console.log(`Frame ${frameIndex}: time=${timeInSeconds}s`);
        }

        // Update progress every 10 frames or at the end
        if (currentFrame % 10 === 0 || currentFrame === totalFrames) {
          onProgress?.({
            phase: "rendering",
            progress: currentFrame / totalFrames,
            currentFrame,
            totalFrames,
            message: `Rendering frame ${currentFrame} of ${totalFrames}...`,
          });
        }

        // Allow UI to update
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      // Phase 3: Encoding
      onProgress?.({
        phase: "encoding",
        progress: 0,
        message: "Encoding video file...",
      });

      // Create video/gif blob from frames
      const videoBlob = await this.encodeFramesToVideo(
        frames,
        frameRate,
        dimensions,
        options.videoSettings.format,
        (progress) => {
          onProgress?.({
            phase: "encoding",
            progress,
            message: `Encoding ${options.videoSettings.format.toUpperCase()}... ${Math.round(
              progress * 100
            )}%`,
          });
        }
      );

      // Phase 4: Complete
      onProgress?.({
        phase: "complete",
        progress: 1,
        message: "Export completed successfully!",
      });

      return videoBlob;
    } catch (error) {
      const appError: AppError = {
        type: ErrorType.EXPORT_ERROR,
        message:
          error instanceof Error ? error.message : "Unknown export error",
        details: error,
        timestamp: new Date(),
      };

      onProgress?.({
        phase: "error",
        progress: 0,
        error: appError,
        message: appError.message,
      });

      throw appError;
    } finally {
      this.isCurrentlyExporting = false;
      this.shouldCancel = false;
      this.currentExportId = null;
    }
  }

  cancelExport(): void {
    this.shouldCancel = true;
  }

  isExporting(): boolean {
    return this.isCurrentlyExporting;
  }

  private getResolutionDimensions(resolution: string): {
    width: number;
    height: number;
  } {
    switch (resolution) {
      case "720p":
        return { width: 1280, height: 720 };
      case "1080p":
        return { width: 1920, height: 1080 };
      case "4K":
        return { width: 3840, height: 2160 };
      default:
        return { width: 1920, height: 1080 };
    }
  }

  private calculateAnimationSteps(
    code: string,
    slides: Slide[],
    globalSpeed: number = 1.0
  ) {
    // Reuse the animation engine's step calculation with global speed
    return animationEngine.createAnimatedScene(
      code,
      "javascript",
      slides,
      globalSpeed
    ).animationSteps;
  }

  private renderFrameAtTime(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    code: string,
    language: string,
    animationSteps: any[],
    timeInSeconds: number
  ): ImageData {
    // Find the current animation step for this time
    const currentStep = this.findAnimationStepAtTime(
      animationSteps,
      timeInSeconds
    );

    // Debug: Log current step for first few frames
    if (timeInSeconds < 1) {
      console.log(
        `Time ${timeInSeconds}s: currentStep=`,
        currentStep ? `slideIndex=${currentStep.slideIndex}` : "null"
      );
    }

    if (currentStep) {
      // Calculate progress within the current step
      const stepStartTimeInSeconds = currentStep.startTime / 1000; // Convert from milliseconds to seconds
      const stepProgress = Math.min(
        1,
        Math.max(
          0,
          (timeInSeconds - stepStartTimeInSeconds) /
            (currentStep.duration / 1000)
        )
      );

      // Create a temporary canvas for content rendering
      const tempCanvas = document.createElement("canvas");
      const contentSize = (canvas as any)._contentSize;
      tempCanvas.width = contentSize.width;
      tempCanvas.height = contentSize.height;

      // Use the new animation engine to render the frame
      const fromSlide =
        currentStep.slideIndex > 0
          ? this.getSlideFromStep(animationSteps, currentStep.slideIndex - 1)
          : null;
      const toSlide = this.getSlideFromStep(
        animationSteps,
        currentStep.slideIndex
      );

      if (toSlide) {
        const animationFrame = animationEngine.renderAnimationFrameWithViewport(
          code,
          language,
          fromSlide,
          toSlide,
          stepProgress,
          exportViewport
        );

        // Use the export-specific canvas renderer method
        canvasRenderer.updateTheme();
        canvasRenderer.renderAnimationFrameWithViewport(
          tempCanvas,
          animationFrame,
          exportViewport
        );

        // Clear main canvas first
        ctx.fillStyle = "#111827";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Scale and center the content on the main canvas
        const scale = (canvas as any)._exportScale;
        const scaledWidth = contentSize.width * scale;
        const scaledHeight = contentSize.height * scale;
        const offsetX = (canvas.width - scaledWidth) / 2;
        const offsetY = (canvas.height - scaledHeight) / 2;

        ctx.drawImage(
          tempCanvas,
          0,
          0,
          contentSize.width,
          contentSize.height,
          offsetX,
          offsetY,
          scaledWidth,
          scaledHeight
        );
      }
    } else {
      // Clear canvas if no step is active
      ctx.fillStyle = "#111827"; // Match the theme background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  private findAnimationStepAtTime(
    animationSteps: any[],
    timeInSeconds: number
  ) {
    for (const step of animationSteps) {
      const stepStartTime = step.startTime / 1000; // Convert from milliseconds to seconds
      const stepEndTime = stepStartTime + step.duration / 1000;

      if (timeInSeconds >= stepStartTime && timeInSeconds < stepEndTime) {
        return step;
      }
    }

    // Don't return the last step if we're past all steps - this was causing
    // the timing issue where slides were extended beyond their duration
    return null;
  }

  private getSlideFromStep(
    animationSteps: any[],
    slideIndex: number
  ): Slide | null {
    const step = animationSteps.find((s) => s.slideIndex === slideIndex);
    if (!step || !step.slideLines) return null;

    // Reconstruct slide data from animation step
    const lineRanges: LineRange[] = [];
    const sortedLines = step.slideLines.sort(
      (a: any, b: any) => a.lineNumber - b.lineNumber
    );

    if (sortedLines.length === 0) return null;

    // Group consecutive lines into ranges
    let rangeStart = sortedLines[0].lineNumber;
    let rangeEnd = sortedLines[0].lineNumber;

    for (let i = 1; i < sortedLines.length; i++) {
      if (sortedLines[i].lineNumber === rangeEnd + 1) {
        rangeEnd = sortedLines[i].lineNumber;
      } else {
        lineRanges.push({ start: rangeStart, end: rangeEnd });
        rangeStart = sortedLines[i].lineNumber;
        rangeEnd = sortedLines[i].lineNumber;
      }
    }
    lineRanges.push({ start: rangeStart, end: rangeEnd });

    return {
      id: `step-${slideIndex}`,
      name: `Slide ${slideIndex + 1}`,
      lineRanges,
      duration: step.duration,
      animationStyle: step.animationStyle,
      order: slideIndex,
    };
  }

  private async encodeFramesToVideo(
    frames: ImageData[],
    frameRate: number,
    dimensions: { width: number; height: number },
    format: "mp4" | "webm" | "gif",
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (format === "gif") {
      return this.encodeFramesToGIF(frames, frameRate, dimensions, onProgress);
    } else {
      // Use MediaRecorder for video encoding
      return this.fallbackMediaRecorderExport(
        frames,
        frameRate,
        dimensions,
        format,
        onProgress
      );
    }
  }

  private async encodeFramesToGIF(
    frames: ImageData[],
    frameRate: number,
    dimensions: { width: number; height: number },
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    // Test GIF library first
    console.log("Testing GIF library...");
    const isGifWorking = await testGifLibrary();
    if (!isGifWorking) {
      throw new Error(
        "GIF library is not working properly. Please check the gif.js installation."
      );
    }

    return new Promise((resolve, reject) => {
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error("GIF encoding timed out after 60 seconds"));
      }, 60000);

      try {
        const gif = new GIF({
          workers: 2, // Enable workers now that we have the worker script
          quality: 20, // Good balance of quality and speed
          width: dimensions.width,
          height: dimensions.height,
          workerScript: "/gif.worker.js", // Use the worker script
        });

        gif.on("progress", (progress: number) => {
          console.log("GIF encoding progress:", progress);
          onProgress?.(progress);
        });

        gif.on("finished", (blob: Blob) => {
          console.log("GIF encoding finished, blob size:", blob.size);
          clearTimeout(timeout);

          // Create a new blob with the correct MIME type for GIF
          const gifBlob = new Blob([blob], { type: "image/gif" });
          resolve(gifBlob);
        });

        // Calculate delay between frames (in milliseconds)
        const delay = Math.round(1000 / frameRate);

        console.log(
          `Adding ${frames.length} frames to GIF with delay ${delay}ms, dimensions: ${dimensions.width}x${dimensions.height}`
        );

        // Add frames with error handling - create a new canvas for each frame
        try {
          frames.forEach((frame, index) => {
            // Create a new canvas for each frame to avoid reference issues
            const frameCanvas = document.createElement("canvas");
            frameCanvas.width = dimensions.width;
            frameCanvas.height = dimensions.height;
            const frameCtx = frameCanvas.getContext("2d");

            if (!frameCtx) {
              throw new Error(
                `Failed to create canvas context for frame ${index}`
              );
            }

            // Draw the frame data to the canvas
            frameCtx.putImageData(frame, 0, 0);

            // Debug: Check if frames are different by sampling a pixel
            if (
              index === 0 ||
              index === Math.floor(frames.length / 2) ||
              index === frames.length - 1
            ) {
              const imageData = frameCtx.getImageData(100, 100, 1, 1);
              console.log(
                `Frame ${index} pixel sample (100,100):`,
                imageData.data
              );
            }

            // Add this specific canvas to the GIF
            gif.addFrame(frameCanvas, { delay });

            // Log progress for debugging
            if (index % 10 === 0) {
              console.log(`Added frame ${index + 1}/${frames.length}`);
            }
          });
        } catch (frameError) {
          clearTimeout(timeout);
          reject(new Error(`Failed to add frames: ${frameError}`));
          return;
        }

        console.log("Starting GIF render...");

        // Add a small delay before rendering to ensure all frames are added
        setTimeout(() => {
          try {
            gif.render();
          } catch (renderError) {
            clearTimeout(timeout);
            reject(new Error(`Failed to start GIF render: ${renderError}`));
          }
        }, 100);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private async fallbackMediaRecorderExport(
    frames: ImageData[],
    frameRate: number,
    dimensions: { width: number; height: number },
    format: "mp4" | "webm",
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // Create a canvas to play back the frames
        const canvas = document.createElement("canvas");
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to create canvas context for encoding"));
          return;
        }

        // Create MediaRecorder stream
        const stream = canvas.captureStream(frameRate);
        const mimeType = format === "mp4" ? "video/mp4" : "video/webm";

        // Check if the format is supported, fallback to webm if mp4 is not supported
        let finalMimeType = mimeType;
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          finalMimeType = "video/webm";
          if (!MediaRecorder.isTypeSupported(finalMimeType)) {
            throw new Error(
              "No supported video format available in this browser"
            );
          }
        }

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: finalMimeType,
          videoBitsPerSecond: 5000000, // 5 Mbps
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: finalMimeType });
          resolve(blob);
        };

        mediaRecorder.onerror = (event) => {
          reject(new Error(`MediaRecorder error: ${event}`));
        };

        // Start recording
        mediaRecorder.start();

        // Play back frames
        let frameIndex = 0;
        const playFrame = () => {
          if (frameIndex < frames.length) {
            ctx.putImageData(frames[frameIndex], 0, 0);
            frameIndex++;

            onProgress?.(frameIndex / frames.length);

            setTimeout(playFrame, 1000 / frameRate);
          } else {
            // Stop recording when all frames are played
            mediaRecorder.stop();
          }
        };

        playFrame();
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Export singleton instance
export const videoExportService = new MotionCanvasVideoExportService();

import { Slide, VideoSettings, ErrorType, AppError } from "../types";
import { animationEngine } from "./animationEngine";
import { canvasRenderer } from "./canvasRenderer";

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
    onProgress?: (progress: ExportProgress) => void
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
    onProgress?: (progress: ExportProgress) => void
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

      // Check if the requested format is supported
      const mimeType =
        options.videoSettings.format === "mp4" ? "video/mp4" : "video/webm";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        throw new Error(
          `${options.videoSettings.format.toUpperCase()} format is not supported in this browser`
        );
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
        slides.reduce((sum, slide) => sum + slide.duration, 0) / 1000; // Convert to seconds
      const totalFrames = Math.ceil(totalDuration * frameRate);

      // Create canvas for rendering
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to create canvas context");
      }

      // Set canvas dimensions based on resolution
      const dimensions = this.getResolutionDimensions(resolution);
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

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

      // Generate animation steps
      const animationSteps = this.calculateAnimationSteps(code, slides);

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

      // Create video blob from frames
      const videoBlob = await this.encodeFramesToVideo(
        frames,
        frameRate,
        dimensions,
        options.videoSettings.format,
        (progress) => {
          onProgress?.({
            phase: "encoding",
            progress,
            message: `Encoding video... ${Math.round(progress * 100)}%`,
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

  private calculateAnimationSteps(code: string, slides: Slide[]) {
    // Reuse the animation engine's step calculation
    return animationEngine.createAnimatedScene(code, "javascript", slides)
      .animationSteps;
  }

  private renderFrameAtTime(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    code: string,
    language: string,
    animationSteps: any[],
    timeInSeconds: number
  ): ImageData {
    // Clear canvas
    ctx.fillStyle = "#1e1e1e"; // Dark background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Find the current animation step for this time
    const currentStep = this.findAnimationStepAtTime(
      animationSteps,
      timeInSeconds
    );

    if (currentStep) {
      // Calculate progress within the current step
      const stepProgress = Math.min(
        1,
        Math.max(
          0,
          (timeInSeconds - currentStep.startTime) /
            (currentStep.duration / 1000)
        )
      );

      // Render the code for this step
      this.renderCodeStep(
        ctx,
        canvas,
        code,
        language,
        currentStep,
        stepProgress
      );
    }

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  private findAnimationStepAtTime(
    animationSteps: any[],
    timeInSeconds: number
  ) {
    for (const step of animationSteps) {
      const stepStartTime = step.startTime;
      const stepEndTime = stepStartTime + step.duration / 1000;

      if (timeInSeconds >= stepStartTime && timeInSeconds < stepEndTime) {
        return step;
      }
    }

    // Return the last step if we're past all steps
    return animationSteps[animationSteps.length - 1];
  }

  private renderCodeStep(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    code: string,
    language: string,
    step: any,
    progress: number
  ) {
    // Basic code rendering - this would be enhanced with proper syntax highlighting
    const lines = code.split("\n");
    const fontSize = Math.max(12, Math.min(24, canvas.width / 80)); // Responsive font size
    const lineHeight = fontSize * 1.4;

    ctx.font = `${fontSize}px 'JetBrains Mono', Monaco, Consolas, monospace`;
    ctx.fillStyle = "#d4d4d4"; // Light text color

    const startY = 50;
    const startX = 50;

    // Render visible lines for this step
    step.cumulativeLines.forEach((line: any, index: number) => {
      const y = startY + index * lineHeight;

      // Apply animation effects based on step progress and animation style
      let alpha = 1;
      let offsetX = 0;

      if (step.animationStyle === "fade") {
        // Fade in new lines
        if (step.linesToAdd.includes(line.lineNumber)) {
          alpha = progress;
        }
      } else if (step.animationStyle === "slide") {
        // Slide in from the right
        if (step.linesToAdd.includes(line.lineNumber)) {
          offsetX = (1 - progress) * 100;
          alpha = progress;
        }
      } else if (step.animationStyle === "typewriter") {
        // Typewriter effect
        if (step.linesToAdd.includes(line.lineNumber)) {
          const charProgress = progress * line.content.length;
          line.content = line.content.substring(0, Math.floor(charProgress));
        }
      }

      ctx.save();
      ctx.globalAlpha = alpha;

      // Line number
      ctx.fillStyle = "#858585";
      ctx.fillText(line.lineNumber.toString().padStart(3, " "), startX - 30, y);

      // Code content
      ctx.fillStyle = "#d4d4d4";
      ctx.fillText(line.content, startX + offsetX, y);

      ctx.restore();
    });
  }

  private async encodeFramesToVideo(
    frames: ImageData[],
    frameRate: number,
    dimensions: { width: number; height: number },
    format: "mp4" | "webm",
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    // Use MediaRecorder for video encoding
    // Motion Canvas integration would require more complex setup
    return this.fallbackMediaRecorderExport(
      frames,
      frameRate,
      dimensions,
      format,
      onProgress
    );
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

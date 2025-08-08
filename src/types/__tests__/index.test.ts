import {
  LineRange,
  AnimationStyle,
  Slide,
  VideoSettings,
  ProjectSettings,
  Project,
  AnimationState,
  ErrorType,
  AppError,
} from "../index";

describe("Type Definitions", () => {
  describe("LineRange", () => {
    it("should have correct structure", () => {
      const lineRange: LineRange = {
        start: 1,
        end: 5,
      };

      expect(typeof lineRange.start).toBe("number");
      expect(typeof lineRange.end).toBe("number");
    });
  });

  describe("AnimationStyle", () => {
    it("should accept valid animation styles", () => {
      const styles: AnimationStyle[] = [
        "fade",
        "slide",
        "typewriter",
        "highlight",
      ];

      styles.forEach((style) => {
        const testStyle: AnimationStyle = style;
        expect(["fade", "slide", "typewriter", "highlight"]).toContain(
          testStyle
        );
      });
    });
  });

  describe("Slide", () => {
    it("should have correct structure", () => {
      const slide: Slide = {
        id: "slide-1",
        name: "Test Slide",
        lineRanges: [{ start: 1, end: 5 }],
        duration: 2000,
        animationStyle: "fade",
        order: 1,
      };

      expect(typeof slide.id).toBe("string");
      expect(typeof slide.name).toBe("string");
      expect(Array.isArray(slide.lineRanges)).toBe(true);
      expect(typeof slide.duration).toBe("number");
      expect(["fade", "slide", "typewriter", "highlight"]).toContain(
        slide.animationStyle
      );
      expect(typeof slide.order).toBe("number");
    });
  });

  describe("VideoSettings", () => {
    it("should have correct structure", () => {
      const videoSettings: VideoSettings = {
        resolution: "1080p",
        frameRate: 30,
        format: "mp4",
      };

      expect(["720p", "1080p", "4K"]).toContain(videoSettings.resolution);
      expect([30, 60]).toContain(videoSettings.frameRate);
      expect(["mp4", "webm"]).toContain(videoSettings.format);
    });
  });

  describe("ProjectSettings", () => {
    it("should have correct structure", () => {
      const projectSettings: ProjectSettings = {
        globalSpeed: 1.0,
        defaultAnimationStyle: "fade",
        videoSettings: {
          resolution: "1080p",
          frameRate: 30,
          format: "mp4",
        },
      };

      expect(typeof projectSettings.globalSpeed).toBe("number");
      expect(["fade", "slide", "typewriter", "highlight"]).toContain(
        projectSettings.defaultAnimationStyle
      );
      expect(typeof projectSettings.videoSettings).toBe("object");
    });
  });

  describe("Project", () => {
    it("should have correct structure", () => {
      const project: Project = {
        id: "project-1",
        name: "Test Project",
        code: 'console.log("hello");',
        language: "javascript",
        slides: [
          {
            id: "slide-1",
            name: "Slide 1",
            lineRanges: [{ start: 1, end: 1 }],
            duration: 2000,
            animationStyle: "fade",
            order: 1,
          },
        ],
        settings: {
          globalSpeed: 1.0,
          defaultAnimationStyle: "fade",
          videoSettings: {
            resolution: "1080p",
            frameRate: 30,
            format: "mp4",
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(typeof project.id).toBe("string");
      expect(typeof project.name).toBe("string");
      expect(typeof project.code).toBe("string");
      expect(typeof project.language).toBe("string");
      expect(Array.isArray(project.slides)).toBe(true);
      expect(typeof project.settings).toBe("object");
      expect(project.createdAt instanceof Date).toBe(true);
      expect(project.updatedAt instanceof Date).toBe(true);
    });
  });

  describe("AnimationState", () => {
    it("should have correct structure", () => {
      const animationState: AnimationState = {
        currentSlide: 0,
        isPlaying: false,
        progress: 0.5,
        totalDuration: 10000,
        playbackSpeed: 1.0,
      };

      expect(typeof animationState.currentSlide).toBe("number");
      expect(typeof animationState.isPlaying).toBe("boolean");
      expect(typeof animationState.progress).toBe("number");
      expect(typeof animationState.totalDuration).toBe("number");
      expect(typeof animationState.playbackSpeed).toBe("number");
    });
  });

  describe("ErrorType", () => {
    it("should have correct enum values", () => {
      expect(ErrorType.SYNTAX_ERROR).toBe("SYNTAX_ERROR");
      expect(ErrorType.STORAGE_ERROR).toBe("STORAGE_ERROR");
      expect(ErrorType.EXPORT_ERROR).toBe("EXPORT_ERROR");
      expect(ErrorType.ANIMATION_ERROR).toBe("ANIMATION_ERROR");
      expect(ErrorType.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    });
  });

  describe("AppError", () => {
    it("should have correct structure", () => {
      const appError: AppError = {
        type: ErrorType.VALIDATION_ERROR,
        message: "Test error message",
        details: { field: "test" },
        timestamp: new Date(),
      };

      expect(Object.values(ErrorType)).toContain(appError.type);
      expect(typeof appError.message).toBe("string");
      expect(typeof appError.details).toBe("object");
      expect(appError.timestamp instanceof Date).toBe(true);
    });

    it("should work without optional details", () => {
      const appError: AppError = {
        type: ErrorType.STORAGE_ERROR,
        message: "Storage failed",
        timestamp: new Date(),
      };

      expect(Object.values(ErrorType)).toContain(appError.type);
      expect(typeof appError.message).toBe("string");
      expect(appError.timestamp instanceof Date).toBe(true);
    });
  });
});

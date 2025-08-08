// Core types for the Code Animator application

export interface LineRange {
  start: number;
  end: number;
}

export type AnimationStyle = "fade" | "slide" | "typewriter" | "highlight";

export interface Slide {
  id: string;
  name: string;
  lineRanges: LineRange[];
  duration: number;
  animationStyle: AnimationStyle;
  order: number;
}

export interface VideoSettings {
  resolution: "720p" | "1080p" | "4K";
  frameRate: 30 | 60;
  format: "mp4" | "webm";
}

export interface ProjectSettings {
  globalSpeed: number;
  defaultAnimationStyle: AnimationStyle;
  videoSettings: VideoSettings;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  language: string;
  slides: Slide[];
  settings: ProjectSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnimationState {
  currentSlide: number;
  isPlaying: boolean;
  progress: number; // 0-1 for current slide
  totalDuration: number;
  playbackSpeed: number;
}

// Error handling types
export enum ErrorType {
  SYNTAX_ERROR = "SYNTAX_ERROR",
  STORAGE_ERROR = "STORAGE_ERROR",
  EXPORT_ERROR = "EXPORT_ERROR",
  ANIMATION_ERROR = "ANIMATION_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
}

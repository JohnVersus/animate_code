// Core types for the Code Animator application

export interface CodeSnippet {
  id: string;
  title: string;
  language: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnimationProject {
  id: string;
  name: string;
  description?: string;
  codeSnippetId: string;
  animationConfig: AnimationConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnimationConfig {
  duration: number;
  fps: number;
  width: number;
  height: number;
  backgroundColor: string;
}

export interface TimelineEvent {
  id: string;
  type: "highlight" | "type" | "fade" | "move";
  startTime: number;
  duration: number;
  target: string;
  properties: Record<string, any>;
}

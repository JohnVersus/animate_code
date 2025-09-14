import { Project, Slide } from "@/types";

export type ExampleProject = Omit<Project, "id" | "createdAt" | "updatedAt">;

const helloWorldSlides: Slide[] = [
  {
    id: "slide-1",
    name: "Welcome Comment",
    lineRanges: [{ start: 1, end: 1 }],
    duration: 1000,
    animationStyle: "typewriter",
    order: 0,
  },
  {
    id: "slide-2",
    name: "Function Declaration",
    lineRanges: [
      { start: 1, end: 2 },
      { start: 6, end: 6 },
    ],
    duration: 1000,
    animationStyle: "fade",
    order: 1,
  },
  {
    id: "slide-3",
    name: "Create Greeting String",
    lineRanges: [
      { start: 1, end: 3 },
      { start: 6, end: 6 },
    ],
    duration: 600,
    animationStyle: "slide",
    order: 2,
  },
  {
    id: "slide-4",
    name: "Log and Return",
    lineRanges: [{ start: 1, end: 6 }],
    duration: 1000,
    animationStyle: "highlight",
    order: 3,
  },
  {
    id: "slide-5",
    name: "Function Usage",
    lineRanges: [{ start: 1, end: 10 }],
    duration: 2000,
    animationStyle: "fade",
    order: 4,
  },
];

const forLoopSlides: Slide[] = [
  {
    id: "slide-1",
    name: "For Loop Explanation",
    lineRanges: [
      {
        start: 1,
        end: 1,
      },
    ],
    duration: 1500,
    animationStyle: "typewriter",
    order: 0,
  },
  {
    id: "slide-2",
    name: "Loop Initialization",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 5,
        end: 5,
      },
    ],
    duration: 1000,
    animationStyle: "typewriter",
    order: 1,
  },
  {
    id: "slide-3",
    name: "Loop Condition",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 5,
        end: 5,
      },
    ],
    duration: 1000,
    animationStyle: "typewriter",
    order: 2,
  },
  {
    id: "slide-5",
    name: "Loop Increment",
    lineRanges: [
      {
        start: 1,
        end: 6,
      },
    ],
    duration: 2000,
    animationStyle: "typewriter",
    order: 3,
  },
  {
    id: "slide-6",
    name: "Loop Completes",
    lineRanges: [
      {
        start: 1,
        end: 7,
      },
    ],
    duration: 1200,
    animationStyle: "fade",
    order: 4,
  },
];

const aiSdkSlides: Slide[] = [
  {
    id: "slide-1",
    name: "Core AI SDK",
    lineRanges: [
      {
        start: 1,
        end: 2,
      },
    ],
    duration: 1500,
    animationStyle: "typewriter",
    order: 0,
  },
  {
    id: "slide-2",
    name: "Core AI SDK",
    lineRanges: [
      {
        start: 1,
        end: 2,
      },
    ],
    duration: 500,
    animationStyle: "typewriter",
    order: 1,
  },
  {
    name: "xai",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 4,
        end: 4,
      },
    ],
    duration: 1000,
    animationStyle: "typewriter",
    id: "slide-3",
    order: 2,
  },
  {
    name: "xai",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 4,
        end: 5,
      },
    ],
    duration: 750,
    animationStyle: "fade",
    id: "slide-4",
    order: 3,
  },
  {
    name: "xai",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 4,
        end: 6,
      },
      {
        start: 9,
        end: 9,
      },
    ],
    duration: 750,
    animationStyle: "fade",
    id: "slide-5",
    order: 4,
  },
  {
    name: "xai",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 4,
        end: 7,
      },
      {
        start: 9,
        end: 9,
      },
    ],
    duration: 1000,
    animationStyle: "typewriter",
    id: "slide-6",
    order: 5,
  },
  {
    name: "xai",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 4,
        end: 8,
      },
      {
        start: 9,
        end: 9,
      },
    ],
    duration: 1000,
    animationStyle: "typewriter",
    id: "slide-7",
    order: 6,
  },
  {
    name: "xai - pause",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 4,
        end: 8,
      },
      {
        start: 9,
        end: 9,
      },
    ],
    duration: 1000,
    animationStyle: "fade",
    id: "slide-8",
    order: 7,
  },
  {
    id: "slide-9",
    name: "Core AI SDK",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
    ],
    duration: 1500,
    animationStyle: "typewriter",
    order: 8,
  },
  {
    name: "openai",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 11,
        end: 11,
      },
    ],
    duration: 1000,
    animationStyle: "typewriter",
    id: "slide-10",
    order: 9,
  },
  {
    name: "openai",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 11,
        end: 12,
      },
    ],
    duration: 750,
    animationStyle: "fade",
    id: "slide-11",
    order: 10,
  },
  {
    name: "openai",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 11,
        end: 13,
      },
      {
        start: 16,
        end: 16,
      },
    ],
    duration: 750,
    animationStyle: "fade",
    id: "slide-12",
    order: 11,
  },
  {
    name: "openai",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 11,
        end: 14,
      },
      {
        start: 16,
        end: 16,
      },
    ],
    duration: 750,
    animationStyle: "typewriter",
    id: "slide-13",
    order: 12,
  },
  {
    name: "openai",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 11,
        end: 15,
      },
      {
        start: 16,
        end: 16,
      },
    ],
    duration: 750,
    animationStyle: "typewriter",
    id: "slide-14",
    order: 13,
  },
  {
    name: "openai - pause",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 11,
        end: 15,
      },
      {
        start: 16,
        end: 16,
      },
    ],
    duration: 500,
    animationStyle: "fade",
    id: "slide-15",
    order: 14,
  },
  {
    id: "slide-16",
    name: "Core AI SDK",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
    ],
    duration: 1500,
    animationStyle: "typewriter",
    order: 15,
  },
  {
    name: "anthropic",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 18,
        end: 18,
      },
    ],
    duration: 1000,
    animationStyle: "typewriter",
    id: "slide-17",
    order: 16,
  },
  {
    name: "anthropic",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 18,
        end: 19,
      },
    ],
    duration: 1000,
    animationStyle: "fade",
    id: "slide-18",
    order: 17,
  },
  {
    name: "anthropic",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 18,
        end: 20,
      },
      {
        start: 23,
        end: 23,
      },
    ],
    duration: 750,
    animationStyle: "fade",
    id: "slide-19",
    order: 18,
  },
  {
    name: "anthropic",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 18,
        end: 21,
      },
      {
        start: 23,
        end: 23,
      },
    ],
    duration: 1000,
    animationStyle: "typewriter",
    id: "slide-20",
    order: 19,
  },
  {
    name: "anthropic",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 18,
        end: 22,
      },
      {
        start: 23,
        end: 23,
      },
    ],
    duration: 750,
    animationStyle: "typewriter",
    id: "slide-21",
    order: 20,
  },
  {
    name: "anthropic - pause",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 18,
        end: 22,
      },
      {
        start: 23,
        end: 23,
      },
    ],
    duration: 500,
    animationStyle: "fade",
    id: "slide-22",
    order: 21,
  },
  {
    id: "slide-23",
    name: "Core AI SDK",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
    ],
    duration: 1500,
    animationStyle: "typewriter",
    order: 22,
  },
  {
    name: "google",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 25,
        end: 25,
      },
    ],
    duration: 1000,
    animationStyle: "typewriter",
    id: "slide-24",
    order: 23,
  },
  {
    name: "google",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 25,
        end: 26,
      },
    ],
    duration: 750,
    animationStyle: "fade",
    id: "slide-25",
    order: 24,
  },
  {
    name: "google",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 25,
        end: 27,
      },
      {
        start: 30,
        end: 30,
      },
    ],
    duration: 750,
    animationStyle: "fade",
    id: "slide-26",
    order: 25,
  },
  {
    name: "google",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 25,
        end: 28,
      },
      {
        start: 30,
        end: 30,
      },
    ],
    duration: 1000,
    animationStyle: "typewriter",
    id: "slide-27",
    order: 26,
  },
  {
    name: "google",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 25,
        end: 29,
      },
      {
        start: 30,
        end: 30,
      },
    ],
    duration: 750,
    animationStyle: "typewriter",
    id: "slide-28",
    order: 27,
  },
  {
    name: "google - pause",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 25,
        end: 29,
      },
      {
        start: 30,
        end: 30,
      },
    ],
    duration: 500,
    animationStyle: "fade",
    id: "slide-29",
    order: 28,
  },
  {
    id: "slide-30",
    name: "Core AI SDK",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
    ],
    duration: 1500,
    animationStyle: "typewriter",
    order: 29,
  },
  {
    name: "custom",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 32,
        end: 32,
      },
    ],
    duration: 1000,
    animationStyle: "typewriter",
    id: "slide-31",
    order: 30,
  },
  {
    name: "custom",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 32,
        end: 33,
      },
    ],
    duration: 750,
    animationStyle: "fade",
    id: "slide-32",
    order: 31,
  },
  {
    name: "custom",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 32,
        end: 34,
      },
      {
        start: 37,
        end: 37,
      },
    ],
    duration: 750,
    animationStyle: "fade",
    id: "slide-33",
    order: 32,
  },
  {
    name: "custom",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 32,
        end: 35,
      },
      {
        start: 37,
        end: 37,
      },
    ],
    duration: 750,
    animationStyle: "typewriter",
    id: "slide-34",
    order: 33,
  },
  {
    name: "custom",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 32,
        end: 36,
      },
      {
        start: 37,
        end: 37,
      },
    ],
    duration: 750,
    animationStyle: "typewriter",
    id: "slide-35",
    order: 34,
  },
  {
    name: "custom - pause",
    lineRanges: [
      {
        start: 1,
        end: 3,
      },
      {
        start: 32,
        end: 36,
      },
      {
        start: 37,
        end: 37,
      },
    ],
    duration: 1000,
    animationStyle: "typewriter",
    id: "slide-36",
    order: 35,
  },
] as const;

const exampleProjects: ExampleProject[] = [
  {
    name: "Hello World Example",
    code: `// Welcome to Code Animator!
function greetUser(name) {
  const greeting = "Hello, " + name + "!";
  console.log(greeting);
  return greeting;
}

// Call the function
const message = greetUser("World");
console.log("Message:", message);`,
    language: "javascript",
    slides: helloWorldSlides,
    settings: {
      globalSpeed: 1.0,
      defaultAnimationStyle: "fade",
      videoSettings: {
        resolution: "1080p",
        frameRate: 30,
        format: "mp4",
      },
    },
  },
  {
    name: "JS For Loop",
    code: `// This example explains a basic 'for' loop in JavaScript.

for (let i = 0; i < 3; i++) {
  console.log("Iteration: " + i);
}

console.log("Loop finished!");`,
    language: "javascript",
    slides: forLoopSlides,
    settings: {
      globalSpeed: 1.0,
      defaultAnimationStyle: "fade",
      videoSettings: {
        resolution: "1080p",
        frameRate: 30,
        format: "mp4",
      },
    },
  },
  {
    name: "AI SDK Providers",
    code: `// Use the AI SDK's generateText function
import { generateText } from "ai";

// --- Provider: xAI ---
import { xai } from "@ai-sdk/xai";
const { text } = await generateText({
  model: xai("grok-3-beta"),
  prompt: "What is love?",
});

// --- Provider: OpenAI ---
import { openai } from "@ai-sdk/openai";
const { text } = await generateText({
  model: openai("o3-mini"),
  prompt: "What is love?",
});

// --- Provider: Anthropic ---
import { anthropic } from "@ai-sdk/anthropic";
const { text } = await generateText({
  model: anthropic("claude-3-5-sonnet-latest"),
  prompt: "What is love?",
});

// --- Provider: Google ---
import { google } from "@ai-sdk/google";
const { text } = await generateText({
  model: google("models/gemini-2.0-flash-exp"),
  prompt: "What is love?",
});

// --- Provider: Custom ---
import { custom } from "@ai-sdk/custom";
const { text } = await generateText({
  model: custom("model-id"),
  prompt: "What is love?",
});
`,
    language: "javascript",
    slides: aiSdkSlides,
    settings: {
      globalSpeed: 1.0,
      defaultAnimationStyle: "fade",
      videoSettings: {
        resolution: "1080p",
        frameRate: 30,
        format: "mp4",
      },
    },
  },
];

/**
 * Returns a list of example projects.
 */
export const getExampleProjects = (): ExampleProject[] => {
  return exampleProjects;
};

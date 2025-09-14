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
];

/**
 * Returns a list of example projects.
 */
export const getExampleProjects = (): ExampleProject[] => {
  return exampleProjects;
};

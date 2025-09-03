import { Project, Slide } from "@/types";

/**
 * Default example project that demonstrates the Code Animator capabilities
 * This project shows a simple JavaScript function being built step by step
 */
export const createDefaultProject = (): Omit<
  Project,
  "id" | "createdAt" | "updatedAt"
> => {
  const exampleCode = `// Welcome to Code Animator!
function greetUser(name) {
  const greeting = "Hello, " + name + "!";
  console.log(greeting);
  return greeting;
}

// Call the function
const message = greetUser("World");
console.log("Message:", message);`;

  const exampleSlides: Slide[] = [
    {
      id: "slide-1",
      name: "Welcome Comment",
      lineRanges: [
        {
          start: 1,
          end: 1,
        },
      ],
      duration: 1000,
      animationStyle: "fade",
      order: 0,
    },
    {
      id: "slide-2",
      name: "Function Declaration",
      lineRanges: [
        {
          start: 1,
          end: 2,
        },
        {
          start: 6,
          end: 6,
        },
      ],
      duration: 500,
      animationStyle: "typewriter",
      order: 1,
    },
    {
      id: "slide-3",
      name: "Create Greeting String",
      lineRanges: [
        {
          start: 1,
          end: 3,
        },
        {
          start: 6,
          end: 6,
        },
      ],
      duration: 500,
      animationStyle: "slide",
      order: 2,
    },
    {
      id: "slide-4",
      name: "Log and Return",
      lineRanges: [
        {
          start: 1,
          end: 6,
        },
      ],
      duration: 500,
      animationStyle: "highlight",
      order: 3,
    },
    {
      id: "slide-5",
      name: "Function Usage",
      lineRanges: [
        {
          start: 1,
          end: 10,
        },
      ],
      duration: 100,
      animationStyle: "fade",
      order: 4,
    },
  ];

  return {
    name: "Hello World Example",
    code: exampleCode,
    language: "javascript",
    slides: exampleSlides,
    settings: {
      globalSpeed: 1.0,
      defaultAnimationStyle: "fade",
      videoSettings: {
        resolution: "1080p",
        frameRate: 30,
        format: "mp4",
      },
    },
  };
};

/**
 * Check if this is a first-time user (no projects exist)
 */
export const isFirstTimeUser = (projects: Project[]): boolean => {
  return projects.length === 0;
};

/**
 * Get the default project name for identification
 */
export const DEFAULT_PROJECT_NAME = "Hello World Example";

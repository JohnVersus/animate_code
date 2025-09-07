# Code Animator

> Built as a part of the [Kiro hackathon](https://kiro.dev?utm_source=code-animator-github).

A powerful web application for creating animated presentations of code snippets. Transform your code into engaging visual stories with smooth animations, perfect for tutorials, presentations, and educational content.

## 🚀 Features

- **Instant Code Animation**: Paste your code and create animated presentations in minutes
- **Multiple Animation Styles**: Choose from fade, slide, typewriter, and highlight animations
- **Smart Syntax Highlighting**: Automatic language detection with support for 50+ programming languages
- **Flexible Slide Management**: Define slides with specific line ranges, including non-consecutive lines
- **Live Preview**: See your animations in real-time as you build them
- **Video Export**: Export your animations as high-quality MP4, WebM, or GIF files
- **Project Management**: Save and manage multiple animation projects locally
- **No Setup Required**: Start creating immediately - no login or installation needed

## 🎯 Use Cases

- **Educational Content**: Create step-by-step coding tutorials
- **Conference Presentations**: Showcase code evolution in talks
- **Code Reviews**: Highlight changes and improvements visually
- **Documentation**: Enhance technical documentation with animated examples
- **Social Media**: Share coding concepts in an engaging format

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Local Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd code-animator
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Start the development server**

   ```bash
   pnpm dev
   # or
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` to start using Code Animator

### Build for Production

```bash
pnpm build
pnpm start
```

## 📖 How to Use

### Getting Started

1. **Paste Your Code**: Start by pasting your code into the left panel editor
2. **Create Slides**: Use the right panel to define slides with specific line ranges
3. **Preview Animation**: Watch your code animate in the center preview panel
4. **Export Video**: Click export to generate your animated video

### Step-by-Step Guide

#### 1. Code Input

- Paste or type your code in the editor
- The system automatically detects the programming language
- Use the language dropdown if manual selection is needed

#### 2. Creating Slides

- Click "Add Slide" to create a new animation slide
- Define line ranges (e.g., "1-5" for lines 1 through 5)
- Use multiple ranges (e.g., "1-3, 5, 8-10") for non-consecutive lines
- Set slide duration and choose animation style
- Reorder slides by dragging them in the list

#### 3. Animation Styles

- **Fade**: Smooth fade-in/fade-out transitions
- **Slide**: Lines slide in from different directions
- **Typewriter**: Characters appear one by one
- **Highlight**: Emphasize changes with background colors

#### 4. Preview & Export

- Use play/pause controls to preview your animation
- Navigate between slides manually
- Click "Export" to generate video files
- Choose resolution, frame rate, and format options

### Example Project

Here's a simple JavaScript example to get you started:

```javascript
// Welcome to Code Animator!
function greetUser(name) {
  const greeting = "Hello, " + name + "!";
  console.log(greeting);
  return greeting;
}

// Call the function
const message = greetUser("World");
console.log("Message:", message);
```

#### Corresponding Slides Configuration

```json
[
  {
    "id": "slide-1",
    "name": "Welcome Comment",
    "lineRanges": [
      {
        "start": 1,
        "end": 1
      }
    ],
    "duration": 1000,
    "animationStyle": "typewriter",
    "order": 0
  },
  {
    "id": "slide-2",
    "name": "Function Declaration",
    "lineRanges": [
      {
        "start": 1,
        "end": 2
      },
      {
        "start": 6,
        "end": 6
      }
    ],
    "duration": 1000,
    "animationStyle": "fade",
    "order": 1
  },
  {
    "id": "slide-3",
    "name": "Create Greeting String",
    "lineRanges": [
      {
        "start": 1,
        "end": 3
      },
      {
        "start": 6,
        "end": 6
      }
    ],
    "duration": 600,
    "animationStyle": "slide",
    "order": 2
  },
  {
    "id": "slide-4",
    "name": "Log and Return",
    "lineRanges": [
      {
        "start": 1,
        "end": 6
      }
    ],
    "duration": 1000,
    "animationStyle": "highlight",
    "order": 3
  },
  {
    "id": "slide-5",
    "name": "Function Usage",
    "lineRanges": [
      {
        "start": 1,
        "end": 10
      }
    ],
    "duration": 2000,
    "animationStyle": "fade",
    "order": 4
  }
]
```

## 🎥 Demo Video

https://github.com/user-attachments/assets/2a3cd828-77be-43f8-bc68-cfa689592a14

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 14 with React 18
- **Animation Engine**: Motion Canvas for smooth, high-quality animations
- **Syntax Highlighting**: Prism.js with 50+ language support
- **Storage**: IndexedDB with Dexie.js for local project management
- **Styling**: Tailwind CSS with shadcn/ui components
- **Video Export**: Motion Canvas built-in rendering (MP4, WebM, GIF)

### Key Components

- **Code Editor**: Syntax-highlighted editor with line numbering
- **Slide Manager**: Visual slide creation and management interface
- **Animation Preview**: Real-time preview with Motion Canvas rendering
- **Export System**: High-quality video generation and download
- **Project Manager**: Local storage and project organization

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and ensure code quality
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write clear, descriptive commit messages
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting

### Areas for Contribution

- Additional animation styles and effects
- New programming language support
- Performance optimizations
- UI/UX improvements
- Bug fixes and stability improvements
- Documentation and examples

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

This project was built with the help of amazing tools and communities:

- **[Kiro](https://kiro.dev?utm_source=code-animator-github)** - The AI-powered development environment that helped architect and build this application
- **[Motion Canvas](https://motioncanvas.io?utm_source=code-animator-github)** - The powerful animation library that makes smooth code animations possible

---

**Made with ❤️ for developers, educators, and content creators**

_Transform your code into captivating visual stories with Code Animator_

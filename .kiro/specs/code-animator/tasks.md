# Implementation Plan

- [x] 1. Set up project structure and core dependencies

  - Initialize Git repository with proper .gitignore for Next.js
  - Initialize Next.js 14 project with TypeScript and Tailwind CSS
  - Install Motion Canvas, Prism.js, Dexie.js, and other core dependencies
  - Configure project structure with components, services, and types directories
  - Set up basic layout with three-panel design
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 2. Implement core data models and types

  - Create TypeScript interfaces for Project, Slide, LineRange, and AnimationState
  - Implement validation functions for line ranges and slide configurations
  - Create utility functions for parsing line range strings (e.g., "1-5, 12-15")
  - _Requirements: 2.2, 2.6, 7.1, 7.2_

- [x] 3. Create IndexedDB storage service

  - Implement StorageService class using Dexie.js for project management
  - Create methods for saving, loading, listing, and deleting projects
  - Implement auto-save functionality with debouncing
  - Add error handling for storage operations
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 4. Build code editor component

  - Create CodeEditor component with syntax highlighting using Prism.js
  - Implement language auto-detection functionality
  - Add manual language selection dropdown with supported languages
  - Implement line highlighting for current slide preview
  - Add line numbers and proper formatting
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 5. Implement slide management system
- [x] 5.1 Create slide data structures and validation

  - Implement Slide interface with support for multiple line ranges
  - Create line range parser for complex range strings
  - Add validation for overlapping ranges and out-of-bounds lines
  - _Requirements: 2.1, 2.2, 7.1, 7.2, 7.6_

- [x] 5.2 Build slide manager UI component

  - Create SlideManager component with slide list and controls
  - Implement add/edit/delete slide functionality
  - Add drag-and-drop reordering for slides
  - Create slide preview with diff-style visualization
  - Add duration and animation style selection per slide
  - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.7, 8.1, 8.2_

- [x] 6. Create Motion Canvas animation engine
- [x] 6.1 Set up Motion Canvas scene and basic rendering

  - Initialize Motion Canvas project and scene setup
  - Create basic code rendering with syntax highlighting
  - Implement scene creation from code and language input
  - Add frame rendering for static code display
  - _Requirements: 3.1, 3.2_

- [x] 6.2 Implement animation transitions between slides

  - Create transition animations for fade, slide, typewriter, and highlight styles
  - Implement smooth transitions for line additions and removals
  - Add support for non-consecutive line range animations
  - Handle diff-style animations for modified lines
  - _Requirements: 3.3, 3.4, 3.5, 7.4, 7.5, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 7. Build animation preview component

  - Create AnimationPreview component with Motion Canvas integration
  - Implement play/pause controls and timeline scrubbing
  - Add manual slide navigation and current slide indicator
  - Implement real-time preview updates when slides change
  - Add progress indicator and timing display
  - _Requirements: 3.1, 3.6, 3.7, 9.5_

- [x] 8. Implement video export functionality

  - Integrate Motion Canvas video export API
  - Create export options UI for resolution, frame rate, and format
  - Implement progress tracking during export process
  - Add download functionality for completed videos
  - Handle export errors with retry mechanisms
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 9. Create Code management system

  - The AIM is to create multiple code samples and save them in home page
  - Build Code Manager component with code list
  - Implement new code addition and code selection with code name for recognistion
  - Clicking on the code item in the list should load the code.
  - Auto save the code and code animation slides in localstorage. So on page refresh we should still be able to load the slides by clicking on the code item in the list
  - _Requirements: 6.1, 6.2, 6.3, 6.6, 6.7_

- [x] 10. Fix animation logic and enhance animation styles functionality

  - Fix the flawed cumulative animation logic that always adds lines from previous slides
  - Implement per-slide absolute display logic where each slide shows exactly what the user specified
  - Enable proper line removal animations (fade-out) when transitioning between slides
  - Fix animation style implementations in the animation engine (fade, slide, typewriter, highlight styles are not working)
  - Ensure animation styles are properly applied during transitions between slides with correct add/remove line detection
  - Test and verify that each animation style produces the expected visual effects
  - Add global speed/timing controls for overall animation playback speed
  - _Requirements: 3.4, 3.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.3_

- [x] 11. Enhance user experience with UI improvements
- [x] 11.1 Replace slide edit form with shadcn popover

  - Replace the normal form used for editing slides with a shadcn popover component
  - Ensure consistency with the "Add slides" popover implementation
  - Maintain all existing edit functionality within the popover interface
  - _Requirements: 2.3, 2.4, 5.4_

- [ ] 11.2 Add video preview after export completion

  - Implement video preview component to display exported video in the UI
  - Show preview alongside a download button instead of direct download
  - Allow users to review the video before deciding to download
  - Add proper video controls (play/pause) for the preview
  - _Requirements: 4.3, 4.4, 5.4_

- [ ] 11.3 Sync code editor highlighting with slide selection

  - Update code editor line highlighting when clicking on slides in the slide manager
  - Ensure the code editor reflects the current slide's line ranges
  - Maintain synchronization between slide selection and code preview
  - _Requirements: 1.4, 2.1, 3.7_

- [ ] 11.4 Improve slide creation defaults and user experience

  - Auto-generate slide names with pattern "slide-1", "slide-2", etc. based on slide count
  - Remove the requirement for users to manually enter slide names during creation
  - Allow users to edit slide names after creation if desired
  - Change default duration from current value to 500 milliseconds
  - _Requirements: 2.3, 2.4, 5.4_

- [x] 12. Create responsive layout and UI polish

  - Implement responsive three-panel layout with collapsible panels
  - Add keyboard shortcuts for common operations
  - Create onboarding hints and placeholder text for new users
  - Implement dark/light theme support
  - Add accessibility features (ARIA labels, keyboard navigation)
  - _Requirements: 5.3, 5.4_

- [ ] 13. Integrate all components and implement main application state

  - Create main App component with global state management
  - Integrate all components with proper data flow
  - Implement auto-save triggers and state synchronization
  - Add application-wide keyboard shortcuts and hotkeys
  - _Requirements: 5.1, 5.2, 6.6_

- [ ] 14. Add comprehensive testing and optimization
  - Implement code splitting and lazy loading for better performance
  - Add memory leak detection and cleanup for Motion Canvas scenes
  - Add performance optimization for large code files and complex animations
  - _Requirements: All requirements validation_

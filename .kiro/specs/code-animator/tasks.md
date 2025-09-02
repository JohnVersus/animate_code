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

- [x] 11.2 Add video preview after export completion

  - Implement video preview component to display exported video in the UI
  - Show preview alongside a download button instead of direct download
  - Allow users to review the video before deciding to download
  - Add proper video controls (play/pause) for the preview
  - _Requirements: 4.3, 4.4, 5.4_

- [x] 11.3 Sync code editor highlighting with slide selection

  - Update code editor line highlighting when clicking on slides in the slide manager
  - Ensure the code editor reflects the current slide's line ranges
  - Maintain synchronization between slide selection and code preview
  - _Requirements: 1.4, 2.1, 3.7_

- [x] 11.4 Improve slide creation defaults and user experience

  - Auto-generate slide names with pattern "slide-1", "slide-2", etc. based on slide count
  - Remove the requirement for users to manually enter slide names during creation. Auto fill the name so user can update it if they want to.
  - Change default duration from current value to 500 milliseconds
  - _Requirements: 2.3, 2.4, 5.4_

- [x] 12. Create responsive layout and UI polish

  - Implement responsive three-panel layout with collapsible panels
  - Add keyboard shortcuts for common operations
  - Create onboarding hints and placeholder text for new users
  - Implement dark/light theme support
  - Add accessibility features (ARIA labels, keyboard navigation)
  - _Requirements: 5.3, 5.4_

- [x] 13. Implement JSON mode for slides editing
- [x] 13.1 Create JSON mode toggle functionality

  - Add a toggle button in the slide manager to switch between visual and JSON editing modes
  - Implement state management for tracking current editing mode (visual/JSON)
  - Ensure the toggle button is clearly visible and accessible in the slide manager UI
  - _Requirements: 2.3, 2.4, 5.4_

- [x] 13.2 Build JSON editor component for slides

  - Create a JSON editor component with syntax highlighting for JSON
  - Implement real-time JSON validation to prevent corrupt data
  - Add proper error handling and user feedback for invalid JSON
  - Ensure the JSON editor is properly sized and integrated into the slide manager layout
  - _Requirements: 2.1, 2.2, 7.1, 7.2_

- [x] 13.3 Implement bidirectional synchronization between visual and JSON modes

  - Convert slide data to properly formatted JSON when switching to JSON mode
  - Parse and validate JSON data when switching back to visual mode
  - Ensure no data loss during mode transitions
  - Handle edge cases like invalid JSON gracefully with user-friendly error messages
  - Maintain slide order, durations, animation styles, and line ranges during conversion
  - _Requirements: 2.1, 2.2, 2.5, 7.1, 7.2, 7.6_

- [x] 14. Add JSON mode validation and user experience enhancements
- [x] 14.1 Implement comprehensive JSON schema validation

  - Create TypeScript schema validation for slide JSON structure
  - Validate required fields (name, lineRanges, duration, animationStyle)
  - Check line range format and bounds against the current code
  - Provide detailed error messages for specific validation failures
  - _Requirements: 2.2, 7.1, 7.2, 7.6_

- [x] 14.2 Add JSON mode user experience features

  - Implement auto-formatting for JSON when switching to JSON mode
  - Add keyboard shortcuts for common JSON editing operations
  - Provide JSON template/example for new users
  - Add confirmation dialog when switching modes with unsaved JSON changes
  - Implement undo/redo functionality within JSON editor
  - _Requirements: 2.3, 2.4, 5.4_

- [x] 15. Fix line number animation and display issues
- [x] 15.1 Separate line number and code line animations

  - Modify animation engine to handle line numbers and code content as separate animation layers
  - Implement line number fade-in/fade-out animation (100-200ms duration) that occurs seamlessly before code line animation
  - Create smooth transition where line numbers appear first, then code lines animate with the defined slide animation style
  - Update Motion Canvas scene structure to support independent line number and code content animations
  - Ensure the animation sequence mimics the effect of pressing enter to add new lines then typing code
  - Test with all animation styles (fade, slide, typewriter, highlight) to ensure proper sequencing
  - Verify that line number animations are properly rendered in MP4, WebM, and GIF exports
  - _Requirements: 3.3, 3.4, 3.5, 4.4, 8.3, 8.4, 8.5, 8.6_

- [x] 15.2 Fix line numbering display for non-consecutive lines

  - Implement always-sequential line numbering system that shows 1, 2, 3... regardless of actual code line numbers
  - Create mapping system between sequential display numbers and actual code line numbers for proper highlighting
  - Update animation engine to use sequential numbering while maintaining correct code line associations
  - Ensure line number changes are animated smoothly when transitioning between slides with different line counts
  - Handle line number updates during transitions to maintain the illusion of sequential line addition
  - Test with various line range combinations (consecutive, non-consecutive, overlapping) to verify correct numbering
  - Verify that sequential numbering is properly maintained in video exports (MP4, WebM, GIF)
  - _Requirements: 2.3, 3.1, 3.2, 4.4, 7.3, 7.4_

- [x] 16. Create example code project for new users
- [x] 16.1 Implement default example code project

  - Create a simple JavaScript example that demonstrates the tool's capabilities
  - Include a basic function or algorithm that shows meaningful code progression
  - Ensure the example is beginner-friendly and showcases different animation styles
  - Pre-populate the code editor with this example when users first visit the application
  - Store the example as a default project that users can modify or replace
  - _Requirements: 5.4, 6.1, 6.2_

- [x] 16.2 Create pre-configured slides for the example project

  - Design 3-5 slides that demonstrate the example code being built step by step
  - Configure different animation styles across slides (fade, typewriter, highlight)
  - Set appropriate durations for each slide to create a smooth demonstration
  - Ensure slides show logical code progression that tells a story
  - Save the example slides configuration as part of the default project
  - _Requirements: 2.1, 2.3, 2.5, 3.4, 3.5_

- [x] 17. Create comprehensive GitHub README documentation

  - Write a detailed README.md file explaining the Code Animator tool
  - Include project description, features, and use cases
  - Add installation and setup instructions for local development
  - Document how to use the tool with step-by-step instructions
  - Include the simple JavaScript example code snippet in the README
  - Add the corresponding JSON slides configuration for the example
  - Reserve space for demo video with placeholder text
  - Add credits section thanking Kiro app and motion-canvas package
  - Include screenshots or diagrams showing the tool's interface
  - Add contributing guidelines and license information
  - _Requirements: 5.4, 6.7_

- [x] 18. Fix typing animation sequencing for natural left-to-right flow
- [x] 18.1 Implement sequential character animation system

  - Create TypewriterAnimationConfig interface with character delay and line delay settings
  - Implement TypewriterRenderer class that handles proper character sequencing
  - Modify animation engine to animate characters in strict left-to-right, top-to-bottom order
  - Ensure each line completes fully before starting the next line
  - Add consistent character timing across all lines in typewriter mode
  - Test typewriter animation with various code samples to verify proper sequencing
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 18.2 Update Motion Canvas typewriter implementation

  - Modify existing typewriter animation logic in the animation engine
  - Replace any random or out-of-order character appearance with sequential rendering
  - Implement character-by-character animation with proper timing controls
  - Ensure typewriter animation works correctly in both preview and video export
  - Test with different animation speeds and verify consistent behavior
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [-] 19. Fix preview dimension consistency issues
- [x] 19.1 Implement fixed viewport system

  - Create ViewportConfig interface with fixed width, height, and font size settings
  - Implement AnimationViewport class that maintains consistent dimensions
  - Remove any dynamic sizing logic that changes dimensions based on line count
  - Establish fixed preview area dimensions that remain constant regardless of content
  - Ensure font size remains consistent across all slides and line counts
  - Test with code samples of varying lengths (5 lines, 20 lines, 50+ lines)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 20. Optimize viewport dimensions for better video export compatibility
- [x] 20.1 Increase viewport dimensions to support more visible lines

  - Update ViewportConfig to increase fixedWidth from 800px to 1200px and fixedHeight from 450px to 675px
  - Maintain 16:9 aspect ratio for video export compatibility
  - Adjust font size and line height proportionally to fit more content while maintaining readability
  - Test that the new dimensions can properly display 15+ lines in both preview and video export
  - Verify that video export now correctly shows the intended number of lines
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 12.5_

- [x] 20.2 Implement 15-line scrolling window system with optimized viewport

  - Implement ScrollingWindow interface with maxLines set to 15
  - Create logic to determine which lines are visible in the current window
  - Implement window shifting algorithm that hides oldest lines when adding new ones
  - Add smooth scrolling animation when the window shifts
  - Ensure scrolling works correctly when transitioning between slides
  - Handle edge cases where total lines are fewer than 15
  - Test scrolling behavior with the new larger viewport dimensions
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.6, 12.7_

- [x] 20.3 Update animation engine with scrolling renderer

  - Create ScrollingRenderer class that handles 15-line window display
  - Modify Motion Canvas scene to render only visible lines within the window
  - Implement scrolling animations that maintain visual continuity
  - Update line numbering to work correctly with the scrolling window
  - Ensure scrolling behavior is consistent across all animation styles
  - Test scrolling with various slide configurations and line ranges
  - Verify scrolling works properly with the optimized viewport dimensions
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.6, 12.7_

- [x] 20.4 Apply scrolling system to video export with optimized dimensions

  - Ensure video export uses the same 15-line scrolling window system
  - Verify that exported videos maintain scrolling behavior correctly with the larger viewport
  - Test video export with long code samples to confirm scrolling works in MP4, WebM formats
  - Ensure scrolling animations are properly rendered in exported videos
  - Validate that video timing remains consistent with scrolling transitions
  - Confirm that all 15 lines are now visible and properly rendered in video exports
  - _Requirements: 12.5, 12.6_

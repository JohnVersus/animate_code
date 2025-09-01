# Requirements Document

## Introduction

The Code Animator is a single-page web application that allows users to create animated presentations of code snippets. Users can paste code, define slides with specific line ranges, and export the animated presentation as a video. The application uses React/Next.js with Motion Canvas for animations and provides a seamless experience without landing pages.

## Requirements

### Requirement 1

**User Story:** As a developer, I want to paste my code into a text area and have it automatically formatted based on the programming language, so that I can prepare it for animation.

#### Acceptance Criteria

1. WHEN a user pastes code into the input text area THEN the system SHALL automatically detect the programming language
2. WHEN the language is detected THEN the system SHALL apply syntax highlighting and proper formatting
3. WHEN the code is formatted THEN the system SHALL preserve the original line numbers and structure
4. IF the language cannot be detected THEN the system SHALL provide a dropdown to manually select the language
5. WHEN the user changes the language selection THEN the system SHALL re-format the code accordingly

### Requirement 2

**User Story:** As a content creator, I want to define slides with specific line ranges of code, so that I can control what code appears in each slide of my animation.

#### Acceptance Criteria

1. WHEN a user has code in the input area THEN the system SHALL display a slides management panel
2. WHEN creating a new slide THEN the system SHALL allow the user to specify start and end line numbers
3. WHEN a slide is defined THEN the system SHALL show a diff-style preview of what lines will be visible
4. WHEN multiple slides are created THEN the system SHALL display them in a list with reordering capabilities
5. WHEN a user selects a slide THEN the system SHALL highlight the corresponding lines in the code input
6. IF slide ranges overlap THEN the system SHALL show a warning but allow the configuration
7. WHEN a slide is deleted THEN the system SHALL remove it from the animation sequence

### Requirement 3

**User Story:** As a presenter, I want to see a live preview of my code animation, so that I can verify the transitions and timing before exporting.

#### Acceptance Criteria

1. WHEN slides are defined THEN the system SHALL display a preview area showing the current slide
2. WHEN the user navigates between slides THEN the system SHALL animate the transition smoothly
3. WHEN lines are added in a transition THEN the system SHALL animate them appearing with a fade-in effect
4. WHEN lines are removed in a transition THEN the system SHALL animate them disappearing with a fade-out effect
5. WHEN lines are modified THEN the system SHALL show a diff-style animation highlighting changes
6. WHEN the preview is playing THEN the system SHALL provide play/pause controls
7. WHEN the animation is paused THEN the system SHALL allow manual navigation between slides

### Requirement 4

**User Story:** As a user, I want to export my code animation as a video file, so that I can use it in presentations or share it with others.

#### Acceptance Criteria

1. WHEN the user clicks export THEN the system SHALL provide video format options (MP4, WebM)
2. WHEN export is initiated THEN the system SHALL show a progress indicator
3. WHEN the export is complete THEN the system SHALL provide a download link for the video file
4. WHEN exporting THEN the system SHALL maintain the defined slide timing and transitions
5. IF the export fails THEN the system SHALL display an error message with retry option
6. WHEN exporting THEN the system SHALL allow customization of video resolution and frame rate

### Requirement 5

**User Story:** As a user, I want the application to load directly into the main interface without landing pages, so that I can start creating animations immediately.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL display the main interface immediately
2. WHEN the page loads THEN the system SHALL show the code input area, slides panel, and preview area
3. WHEN first visiting THEN the system SHALL provide subtle hints or placeholder text to guide usage
4. WHEN the application starts THEN the system SHALL not require any login or setup steps
5. WHEN the interface loads THEN the system SHALL be fully functional without additional navigation

### Requirement 6

**User Story:** As a user, I want to save and manage multiple animation projects, so that I can work on different presentations and return to them later.

#### Acceptance Criteria

1. WHEN creating an animation THEN the system SHALL allow saving the project with a custom name
2. WHEN the application loads THEN the system SHALL display a list of saved projects
3. WHEN a project is selected THEN the system SHALL load the code, slides, and settings
4. WHEN projects are saved THEN the system SHALL use IndexedDB for local storage
5. WHEN a project is deleted THEN the system SHALL remove it from storage after confirmation
6. WHEN working on a project THEN the system SHALL auto-save changes periodically
7. WHEN exporting THEN the system SHALL associate the video with the project name

### Requirement 7

**User Story:** As a user, I want to define slides with non-consecutive line ranges, so that I can show specific code sections that aren't adjacent to each other.

#### Acceptance Criteria

1. WHEN creating a slide THEN the system SHALL allow multiple line range inputs (e.g., "1-5, 12-15")
2. WHEN multiple ranges are specified THEN the system SHALL validate that all ranges are within the code bounds
3. WHEN displaying a slide with multiple ranges THEN the system SHALL show gaps between non-consecutive sections
4. WHEN animating between slides THEN the system SHALL handle transitions for non-consecutive ranges smoothly
5. WHEN ranges overlap between slides THEN the system SHALL animate only the differences
6. WHEN entering ranges THEN the system SHALL provide visual feedback for valid/invalid range syntax
7. WHEN multiple ranges are used THEN the system SHALL maintain proper syntax highlighting across gaps

### Requirement 8

**User Story:** As a user, I want to choose from different animation styles for code transitions, so that I can create visually appealing presentations that match my content.

#### Acceptance Criteria

1. WHEN configuring slides THEN the system SHALL provide selectable animation styles (fade, slide, typewriter, highlight)
2. WHEN an animation style is selected THEN the system SHALL apply it to transitions between slides
3. WHEN using fade style THEN the system SHALL smoothly fade out old lines and fade in new lines
4. WHEN using slide style THEN the system SHALL animate lines sliding in from different directions
5. WHEN using typewriter style THEN the system SHALL animate characters appearing one by one
6. WHEN using highlight style THEN the system SHALL emphasize new/changed lines with background colors
7. WHEN previewing THEN the system SHALL show the selected animation style in real-time

### Requirement 9

**User Story:** As a user, I want to customize animation timing and effects, so that I can create presentations that match my preferred pace and style.

#### Acceptance Criteria

1. WHEN creating slides THEN the system SHALL allow setting custom duration for each slide
2. WHEN defining transitions THEN the system SHALL provide options for different animation types
3. WHEN configuring timing THEN the system SHALL allow global speed adjustments
4. WHEN customizing effects THEN the system SHALL provide preview of different transition styles
5. WHEN settings are changed THEN the system SHALL update the preview in real-time

### Requirement 10

**User Story:** As a user, I want the typing animation to appear natural and sequential, so that the code looks like it's being typed from left to right in proper order.

#### Acceptance Criteria

1. WHEN using typewriter animation style THEN the system SHALL animate characters appearing sequentially from left to right
2. WHEN typing animation is active THEN the system SHALL ensure characters appear in reading order (left-to-right, top-to-bottom)
3. WHEN multiple lines are being typed THEN the system SHALL complete each line before starting the next line
4. WHEN typing animation plays THEN the system SHALL maintain consistent character timing across all lines
5. WHEN typewriter style is selected THEN the system SHALL not show characters appearing out of sequence or randomly

### Requirement 11

**User Story:** As a user, I want consistent animation preview dimensions regardless of code length, so that the preview area remains stable and doesn't resize unexpectedly.

#### Acceptance Criteria

1. WHEN code exceeds 20 lines THEN the system SHALL maintain consistent preview dimensions
2. WHEN slides have no lines or few lines THEN the system SHALL not reduce font size or change preview dimensions
3. WHEN transitioning between slides of different lengths THEN the system SHALL keep preview area size constant
4. WHEN animation preview loads THEN the system SHALL establish fixed dimensions that don't change based on content
5. WHEN font sizing is applied THEN the system SHALL use consistent font size regardless of line count

### Requirement 12

**User Story:** As a user, I want to see only the most recent 15 lines of code in the animation, so that longer code snippets display with a scrolling effect that keeps the view focused.

#### Acceptance Criteria

1. WHEN code has more than 15 lines THEN the system SHALL display only the last 15 lines in the animation preview
2. WHEN new lines are added beyond 15 lines THEN the system SHALL hide the oldest lines from the top
3. WHEN transitioning between slides THEN the system SHALL maintain the 15-line window with scrolling effect
4. WHEN lines are removed THEN the system SHALL adjust the visible window to show up to 15 lines
5. WHEN exporting video THEN the system SHALL apply the same 15-line limit with scrolling behavior
6. WHEN scrolling occurs THEN the system SHALL animate the transition smoothly to maintain visual continuity
7. WHEN fewer than 15 lines exist THEN the system SHALL display all available lines without scrolling

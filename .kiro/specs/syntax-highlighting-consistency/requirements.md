# Requirements Document

## Introduction

This feature addresses the visual inconsistency between the code editor and animation preview components. Currently, the code editor uses Prism.js with the "prism-tomorrow" theme providing excellent syntax highlighting and dark background, while the animation preview uses a custom color scheme that doesn't match, creating a jarring visual experience for users.

## Requirements

### Requirement 1

**User Story:** As a developer using the code animation tool, I want consistent syntax highlighting colors between the code editor and animation preview, so that the visual experience is seamless and professional.

#### Acceptance Criteria

1. WHEN viewing code in both the editor and animation preview THEN the syntax highlighting colors SHALL be identical
2. WHEN switching between editor and preview THEN the background colors SHALL match exactly
3. WHEN code contains different token types (keywords, strings, comments, etc.) THEN each token type SHALL have the same color in both views

### Requirement 2

**User Story:** As a developer, I want the animation preview to use the same high-quality dark theme as the code editor, so that the preview looks as polished as the editor.

#### Acceptance Criteria

1. WHEN the animation preview renders code THEN it SHALL use the same background color as the code editor (#1e1e1e or equivalent from prism-tomorrow theme)
2. WHEN the animation preview renders text THEN it SHALL use the same base text color as the code editor
3. WHEN the animation preview renders line numbers THEN they SHALL match the editor's line number styling

### Requirement 3

**User Story:** As a developer, I want the canvas renderer to extract colors directly from the Prism.js theme, so that any future theme changes are automatically reflected in both components.

#### Acceptance Criteria

1. WHEN the canvas renderer applies syntax highlighting THEN it SHALL derive colors from the loaded Prism.js theme
2. WHEN the Prism.js theme is updated THEN the canvas renderer SHALL automatically use the new colors
3. WHEN a token type is not defined in the theme THEN the canvas renderer SHALL fall back to appropriate default colors from the theme

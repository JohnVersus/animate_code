# Design Document

## Overview

This design addresses the syntax highlighting inconsistency between the CodeEditor and AnimationPreview components by creating a unified theming system that extracts colors directly from the loaded Prism.js theme. The solution ensures both components use identical colors and styling while maintaining performance and flexibility.

## Architecture

### Current State Analysis

**CodeEditor Component:**

- Uses Prism.js with "prism-tomorrow" theme loaded via CSS
- Renders syntax highlighting through DOM manipulation
- Background: Dark theme with proper contrast
- Colors: Defined by prism-tomorrow.css

**AnimationPreview/CanvasRenderer:**

- Uses custom hardcoded color scheme
- Renders to HTML5 Canvas
- Background: Custom #1e1e1e
- Colors: Manually defined object with approximate VS Code colors

### Proposed Architecture

**Theme Extraction Service:**

- New service to extract colors from loaded Prism.js CSS theme
- Provides consistent color mapping for both DOM and Canvas rendering
- Handles fallbacks and theme detection

**Updated CanvasRenderer:**

- Removes hardcoded color scheme
- Uses Theme Extraction Service for colors
- Maintains performance while ensuring consistency

## Components and Interfaces

### 1. Theme Extraction Service

```typescript
interface PrismThemeExtractor {
  extractThemeColors(): ThemeColorScheme;
  getBackgroundColor(): string;
  getTextColor(): string;
  getLineNumberColor(): string;
}

interface ThemeColorScheme {
  background: string;
  text: string;
  lineNumber: string;
  tokens: {
    [tokenType: string]: string;
  };
}
```

**Implementation Strategy:**

- Create temporary DOM elements with Prism classes
- Use `getComputedStyle()` to extract actual CSS colors
- Cache results for performance
- Handle CSS custom properties and inheritance

### 2. Updated Canvas Renderer

```typescript
interface EnhancedCanvasRenderer extends CanvasRendererService {
  updateTheme(): void;
  renderCodeToCanvas(
    canvas: HTMLCanvasElement,
    code: string,
    language: string,
    lineRanges?: LineRange[]
  ): void;
}
```

**Key Changes:**

- Replace hardcoded `colorScheme` with dynamic theme extraction
- Update `backgroundColor`, `textColor` properties from theme
- Add theme update mechanism for runtime changes

### 3. Integration Points

**CodeEditor Integration:**

- No changes required (already uses Prism.js correctly)
- Ensure prism-tomorrow.css is loaded before theme extraction

**AnimationPreview Integration:**

- Initialize theme extraction on component mount
- Update canvas renderer when theme changes
- Maintain existing rendering performance

## Data Models

### ThemeColorScheme Model

```typescript
interface ThemeColorScheme {
  // Base colors
  background: string; // Main background color
  text: string; // Default text color
  lineNumber: string; // Line number color

  // Token-specific colors
  tokens: {
    comment: string; // Comments
    keyword: string; // Keywords (if, function, etc.)
    string: string; // String literals
    number: string; // Numeric literals
    operator: string; // Operators (+, -, etc.)
    punctuation: string; // Punctuation marks
    function: string; // Function names
    "class-name": string; // Class names
    variable: string; // Variables
    property: string; // Object properties
    tag: string; // HTML/XML tags
    "attr-name": string; // Attribute names
    "attr-value": string; // Attribute values
    regex: string; // Regular expressions
    important: string; // Important declarations
    bold: string; // Bold text
    italic: string; // Italic text
    [key: string]: string; // Additional token types
  };
}
```

## Error Handling

### Theme Extraction Failures

1. **CSS Not Loaded:**

   - Detect if prism-tomorrow.css is available
   - Provide fallback color scheme matching current editor appearance
   - Log warning for debugging

2. **DOM Access Issues:**

   - Handle SSR/hydration scenarios
   - Graceful degradation to fallback colors
   - Retry mechanism for timing issues

3. **Color Parsing Errors:**
   - Validate extracted color values
   - Convert between color formats (hex, rgb, hsl)
   - Fallback to safe defaults

### Canvas Rendering Resilience

1. **Invalid Colors:**

   - Validate color strings before canvas operations
   - Fallback to default colors for invalid values
   - Continue rendering with available colors

2. **Performance Considerations:**
   - Cache theme extraction results
   - Debounce theme updates
   - Minimize DOM queries

## Testing Strategy

Manual UI testing will be performed to verify:

- Visual consistency between code editor and animation preview
- Proper color matching across different token types
- Background color consistency
- Line number styling alignment
- Performance and rendering quality

## Implementation Phases

### Phase 1: Theme Extraction Service

- Create PrismThemeExtractor service
- Implement color extraction from DOM
- Add caching and error handling

### Phase 2: Canvas Renderer Updates

- Integrate theme extraction into CanvasRenderer
- Remove hardcoded color schemes
- Update color application logic
- Performance optimization

### Phase 3: Component Integration

- Update AnimationPreview to use new renderer
- Add theme update triggers
- Visual consistency verification

### Phase 4: Polish and Optimization

- Performance tuning
- Error handling refinement
- Documentation updates
- Final validation

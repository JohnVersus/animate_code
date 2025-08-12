# Implementation Plan

- [x] 1. Create Prism theme extraction service

  - Create new service file `src/services/prismThemeExtractor.ts`
  - Implement DOM-based color extraction from loaded Prism CSS
  - Add caching mechanism for extracted colors
  - Include fallback color scheme matching current editor appearance
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 2. Update canvas renderer to use extracted theme colors

  - Remove hardcoded color scheme from `src/services/canvasRenderer.ts`
  - Integrate theme extraction service for dynamic color retrieval
  - Update background color, text color, and line number styling to match editor
  - Ensure proper error handling for color extraction failures
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [x] 3. Initialize theme extraction in animation preview component

  - Update `src/components/preview/AnimationPreview.tsx` to initialize theme extraction
  - Add theme update mechanism when component mounts
  - Ensure canvas renderer uses extracted colors for consistent rendering
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_

- [x] 4. Test and validate visual consistency
  - Verify syntax highlighting colors match between editor and preview
  - Check background color consistency across both components
  - Validate line number styling alignment
  - Test with different programming languages and code samples
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

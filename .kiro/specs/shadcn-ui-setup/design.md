# Design Document

## Overview

This design outlines the migration from Tailwind CSS v3 to v4 and the integration of shadcn/ui components into the existing Next.js code-animator project. The migration will be performed in phases to ensure stability and minimize breaking changes.

## Architecture

### Migration Strategy

The implementation follows a two-phase approach:

1. **Phase 1**: Migrate Tailwind CSS from v3 to v4
2. **Phase 2**: Install and configure shadcn/ui with the new Tailwind v4 setup

### Dependencies Update

- Remove `tailwindcss@^3.4.1` and `autoprefixer@^10.4.21`
- Install `@tailwindcss/cli@next` (Tailwind v4)
- Install `shadcn-ui` CLI tool
- Update PostCSS configuration for v4 compatibility

## Components and Interfaces

### Tailwind CSS v4 Configuration

Tailwind v4 introduces significant changes:

- CSS-first configuration instead of JavaScript config files
- New `@import` syntax in CSS files
- Simplified setup with built-in PostCSS processing
- Enhanced performance and smaller bundle sizes

### shadcn/ui Integration Points

- **Component Directory**: `src/components/ui/` (already exists)
- **Utilities**: `src/lib/utils.ts` (already has `cn` function)
- **Configuration**: `components.json` (to be created)
- **Styling**: Integration with Tailwind v4 CSS variables

### Existing Component Mapping

Current custom components that can be replaced:

- `src/components/ui/resizable.tsx` → Keep (react-resizable-panels integration)
- Future UI components → Use shadcn/ui equivalents

## Data Models

### Configuration Files

#### components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "src/components",
    "utils": "src/lib/utils",
    "ui": "src/components/ui"
  }
}
```

#### Updated globals.css (Tailwind v4)

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* Additional CSS variables for shadcn/ui theming */
  }
}
```

#### Updated tailwind.config.ts (v4)

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Additional shadcn/ui color variables
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
```

## Error Handling

### Migration Risks

- **Breaking Changes**: Tailwind v4 may have breaking changes from v3
- **Build Failures**: PostCSS configuration changes may cause build issues
- **Style Inconsistencies**: Existing styles may need adjustment

### Mitigation Strategies

- Incremental migration with testing at each step
- Backup of current configuration files
- Verification of existing styles after migration
- Gradual replacement of custom components

### Error Recovery

- Rollback plan with git version control
- Documentation of all configuration changes
- Testing of critical UI components after each phase

## Testing Strategy

### Migration Testing

1. **Build Verification**: Ensure project builds successfully after Tailwind v4 migration
2. **Visual Regression**: Verify existing UI components render correctly
3. **Functionality Testing**: Test all interactive components work as expected

### shadcn/ui Integration Testing

1. **Component Installation**: Test adding shadcn/ui components via CLI
2. **Styling Integration**: Verify components use correct theme variables
3. **TypeScript Compatibility**: Ensure proper type definitions
4. **Accessibility Testing**: Verify shadcn/ui components maintain accessibility standards

### Automated Testing

- Add build verification to CI/CD pipeline
- Include component rendering tests
- Validate CSS compilation and optimization

## Implementation Phases

### Phase 1: Tailwind v4 Migration

1. Update package.json dependencies
2. Modify PostCSS configuration
3. Update globals.css with v4 syntax
4. Update tailwind.config.ts for v4 compatibility
5. Test and fix any breaking changes

### Phase 2: shadcn/ui Setup

1. Install shadcn/ui CLI
2. Initialize shadcn/ui configuration
3. Update utils.ts if needed
4. Add CSS variables for theming
5. Test component installation

### Phase 3: Component Integration

1. Install essential shadcn/ui components
2. Update existing components to use shadcn/ui where appropriate
3. Establish component usage patterns
4. Document component library setup

## Performance Considerations

### Tailwind v4 Benefits

- Smaller CSS bundle sizes
- Faster build times
- Improved tree-shaking
- Better development experience

### shadcn/ui Benefits

- On-demand component installation
- Optimized bundle sizes
- Consistent design system
- Accessibility built-in

### Bundle Size Impact

- Monitor bundle size changes during migration
- Ensure tree-shaking works correctly
- Remove unused Tailwind classes
- Optimize component imports

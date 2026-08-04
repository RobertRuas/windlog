---
kind: frontend_style
name: Tailwind CSS Utility-First Styling with Custom Design System
category: frontend_style
scope:
    - '**'
source_files:
    - src/index.css
    - vite.config.ts
    - src/components/ui/Button.tsx
    - src/components/ui/Input.tsx
    - src/pages/weekly-timesheet/styles/timesheet.css
---

The frontend styling system is built around **Tailwind CSS v4** (via `@tailwindcss/vite` plugin) integrated into a Vite-based React application. The approach combines utility-first CSS for most components with targeted custom CSS for complex domain-specific features like the weekly timesheet spreadsheet.

## Core Styling Architecture

**Primary framework**: Tailwind CSS v4 configured through `vite.config.ts` using the `@tailwindcss/vite` plugin. The global stylesheet at `src/index.css` imports Tailwind via `@import "tailwindcss"` and establishes foundational styles including the Inter font family (loaded via `@fontsource/inter`) as a visual substitute for Apple's San Francisco font, with appropriate system fallbacks.

**Global design tokens**: The base stylesheet defines consistent form element patterns through reusable classes:
- `.form-input`, `.form-select` (40px height, standardized padding/borders)
- `.form-textarea` (80px minimum height, vertical resize)
- `.form-button`, `.form-button-primary`, `.form-button-secondary`, `.form-button-danger` (consistent button variants)
- `.form-label` (12px, medium weight, gray color)

These classes provide a cohesive visual language across forms while remaining separate from component-specific styling.

## Component Library Pattern

The `src/components/ui/` directory contains a small, purpose-built component library where each component uses Tailwind utility classes directly in JSX:
- **Button**: Supports `primary`/`secondary` variants and `sm`/`md` sizes through class mapping
- **Input**: Includes label, error state handling, and accessibility features (forId linking)
- **Accordion**, **DataTable**, **DatePicker**, **SecureFileLink**, **SecureImage**, **SignaturePad**: Domain-specific UI primitives

Components follow a consistent pattern: props define behavior, Tailwind classes handle presentation, and className prop allows composition.

## Domain-Specific Styling

The weekly timesheet feature (`src/pages/weekly-timesheet/styles/timesheet.css`) represents a significant exception to the Tailwind-only approach. This 568-line stylesheet was migrated from an original Excel-like design and includes:
- CSS custom properties for the Excel color palette (`--excel-header-bg`, `--excel-green-accent`, etc.)
- Fixed-width table layout (1489px) mimicking Excel's spreadsheet appearance
- Complex cell types with specific borders, backgrounds, and typography
- Print-specific rules for A4 landscape output with color preservation
- Zoom controls via CSS transform and zoom properties

This demonstrates a pragmatic approach: use Tailwind for general UI consistency while allowing dedicated CSS for complex, pixel-perfect requirements that would be unwieldy in utility classes.

## Typography and Visual Consistency

- **Font strategy**: Inter font family (weights 400, 500, 600, 700) loaded via @fontsource, with Apple system fonts as native fallbacks
- **Color system**: Primarily relies on Tailwind's default color palette (gray scales, blue accents, red for errors)
- **Spacing and sizing**: Uses Tailwind's spacing scale consistently across components
- **Responsive design**: Mobile-first approach with responsive prefixes (sm:, md:) for layout adjustments

## Build Integration

Vite configuration enables Tailwind processing, path aliases (`@/` → `./src`), and development proxy setup. The build pipeline processes both Tailwind utilities and custom CSS files without additional configuration complexity.
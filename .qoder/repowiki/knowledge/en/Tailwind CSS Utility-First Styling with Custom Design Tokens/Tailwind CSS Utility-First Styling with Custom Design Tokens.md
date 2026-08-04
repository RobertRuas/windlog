---
kind: frontend_style
name: Tailwind CSS Utility-First Styling with Custom Design Tokens
category: frontend_style
scope:
    - '**'
source_files:
    - src/index.css
    - src/pages/weekly-timesheet/styles/timesheet.css
    - src/components/ui/Button.tsx
    - package.json
---

The Windlog frontend uses a utility-first styling approach built on **Tailwind CSS v4** (via `@tailwindcss/vite` plugin), combined with a small set of custom CSS design tokens and reusable UI components. There is no centralized Tailwind configuration file; styles are applied directly through inline className strings across React components, with global styles defined in a single entry stylesheet.

### Styling System
- **Tailwind CSS v4** is the primary styling engine, imported via `@import "tailwindcss"` in `src/index.css`. Components use Tailwind utility classes extensively for layout (`flex`, `grid`, `gap-*`, `p-*`, `m-*`), colors (`bg-*`, `text-*`, `border-*`), typography (`font-*`, `text-*`), spacing, and responsive behavior.
- **Inter font** from `@fontsource/inter` is used as the project's typeface, with Apple system fonts (SF Pro) as native fallbacks on macOS/iOS.
- A small set of **custom CSS classes** in `src/index.css` provides consistent form element styling: `.form-input`, `.form-select`, `.form-textarea`, `.form-button` (with `.form-button-primary`, `.form-button-secondary`, `.form-button-danger` variants), and `.form-label`. These enforce uniform height (40px), border radius (6px), focus states (blue ring), and transitions.
- The **Weekly Timesheet module** maintains its own dedicated stylesheet (`src/pages/weekly-timesheet/styles/timesheet.css`) with extensive CSS variables (`--ts-*`, `--excel-*`) defining an Excel-like palette, glassmorphic panels, zoom controls, print-specific rules (A4 landscape), and cell-level styling that faithfully reproduces the original spreadsheet design.

### Component Library Pattern
Reusable UI primitives live under `src/components/ui/` (Button, Input, DataTable, DatePicker, Accordion, SignaturePad, etc.). Each component encapsulates its own Tailwind class composition rather than relying on a shared design system library. The Button component demonstrates the pattern: variant and size mappings are resolved to Tailwind class strings at runtime, with support for additional `className` overrides.

### Design Token Strategy
- Global tokens are defined as CSS custom properties in `timesheet.css` (`:root` variables for colors, gradients, shadows, and Excel-specific palettes).
- No centralized design token system exists beyond these localized variable files; color values like `#3b82f6` (blue-500), `#d1d5db` (gray-300), and `#f5f5f7` (background) appear scattered across both Tailwind utilities and raw CSS.
- The timesheet module defines its own semantic tokens (`--ts-primary-accent`, `--excel-header-bg`, `--excel-border-color`) scoped to that feature.

### Responsive & Print Strategy
- Responsive behavior relies entirely on Tailwind's responsive prefixes (observed in component classNames).
- Print styles are explicitly handled in `timesheet.css` using `@media print` with `@page { size: A4 landscape }`, ensuring faithful reproduction of the spreadsheet layout when printing or exporting.

### Conventions Observed
- Inline Tailwind classes are the default styling mechanism throughout JSX components.
- Custom CSS is reserved for shared form patterns and complex feature-specific layouts (like the timesheet).
- Component-scoped styling is preferred over global styles; each page/module tends to keep its visual concerns close to its implementation.
- Font smoothing (`-webkit-font-smoothing: antialiased`) and consistent form heights are enforced globally.
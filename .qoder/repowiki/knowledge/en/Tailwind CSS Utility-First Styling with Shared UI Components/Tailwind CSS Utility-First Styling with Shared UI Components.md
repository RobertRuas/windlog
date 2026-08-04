---
kind: frontend_style
name: Tailwind CSS Utility-First Styling with Shared UI Components
category: frontend_style
scope:
    - '**'
source_files:
    - src/index.css
    - src/components/ui/Button.tsx
    - src/components/ui/Input.tsx
    - src/components/ui/SectionCard.tsx
    - src/pages/weekly-timesheet/styles/timesheet.css
---

The frontend styling system is built around Tailwind CSS as a utility-first framework, combined with a small set of reusable React UI components and a dedicated CSS file for the complex weekly timesheet module.

**Styling approach and tools**
- Tailwind CSS v4 is imported via `@import "tailwindcss"` in `src/index.css`, which serves as the single global stylesheet entry point.
- The Inter font (loaded through `@fontsource/inter`) is used as the primary typeface, falling back to Apple's SF Pro on macOS/iOS devices. The body sets a light gray background (`#f5f5f7`) and antialiased text rendering.
- No separate `tailwind.config.js` was found; configuration appears to rely on Tailwind's defaults or Vite's built-in setup.

**Global styles and design tokens**
- `src/index.css` defines shared form primitives: `.form-input`, `.form-select`, `.form-textarea`, `.form-button` (with `primary`, `secondary`, `danger` variants), and `.form-label`. These establish consistent heights (40px for inputs/buttons), border radius (6px), focus states (blue ring with shadow), and color palette centered around blue (`#3b82f6`) and neutral grays.
- The global stylesheet also documents the rationale for using Inter as an open-source alternative to San Francisco, establishing the font stack priority.

**Shared UI component library**
- Reusable presentational components live under `src/components/ui/`: `Button.tsx`, `Input.tsx`, `SectionCard.tsx`, `Accordion.tsx`, `DataTable.tsx`, `DatePicker.tsx`, `SecureFileLink.tsx`, `SecureImage.tsx`, and `SignaturePad.tsx`.
- Each component encapsulates its own Tailwind classes and exposes a typed props interface. For example, `Button` supports `variant` (`primary` | `secondary`) and `size` (`sm` | `md`) mapped to specific Tailwind class strings, while `Input` handles label/error display with conditional red borders and error messages.
- Components follow a consistent pattern: accept a `className` prop for overrides, use template literals to compose variant/size classes, and spread rest props onto native HTML elements.

**Page-scoped CSS**
- The weekly timesheet module (`src/pages/weekly-timesheet/styles/timesheet.css`) is the only significant standalone CSS file. It contains ~568 lines of custom CSS defining CSS variables for an Excel-like spreadsheet aesthetic, including glassmorphic panels, zoom controls, print-to-A4-landscape rules, and cell-level styling that faithfully reproduces the original Excel design.
- This file uses CSS custom properties (`--ts-*`, `--excel-*`) as design tokens for colors, fonts, and spacing within the module scope.

**Component composition conventions**
- Pages are organized under `src/pages/<feature>/` with feature-specific subdirectories containing page components, child components, hooks, types, and sometimes scoped styles.
- Layout components (`AppLayout.tsx`, `Sidebar.tsx`) provide the shell structure, while feature pages compose the shared `ui/*` components together.
- All JSX styling is done inline via Tailwind `className` attributes — no CSS modules, styled-components, or SCSS files are used outside the timesheet module.

**Responsive strategy**
- Responsiveness is handled entirely through Tailwind's responsive prefixes (e.g., `sm:`, `md:`) applied directly in className strings throughout components and pages. No media queries exist outside the timesheet print rules.
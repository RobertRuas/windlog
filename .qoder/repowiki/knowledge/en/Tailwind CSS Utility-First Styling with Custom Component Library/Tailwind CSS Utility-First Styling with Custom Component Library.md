---
kind: frontend_style
name: Tailwind CSS Utility-First Styling with Custom Component Library
category: frontend_style
scope:
    - '**'
source_files:
    - src/index.css
    - vite.config.ts
    - package.json
    - src/components/ui/Button.tsx
    - src/components/ui/Input.tsx
    - src/components/ui/DataTable.tsx
    - src/pages/weekly-timesheet/styles/timesheet.css
    - src/components/layout/AppLayout.tsx
---

The Windlog frontend uses a utility-first styling approach built on **Tailwind CSS v4** integrated via the `@tailwindcss/vite` plugin in Vite. The styling system combines Tailwind utility classes with a small set of reusable React UI components and a few global CSS files for shared form patterns and a specialized timesheet module.

**Core styling stack:**
- Tailwind CSS v4 (`tailwindcss` + `@tailwindcss/vite`) configured through Vite plugins, with no separate `tailwind.config.js` — configuration is inline or default-based.
- Global styles centralized in `src/index.css`, which imports Tailwind via `@import "tailwindcss"` and defines the Inter font family (via `@fontsource/inter`) as the primary typeface, falling back to San Francisco on Apple devices.
- A minimal custom component library under `src/components/ui/` (Button, Input, DataTable, Accordion, DatePicker, SecureFileLink, SecureImage, SignaturePad) that wraps Tailwind classes into typed React props for consistent visual variants.
- One dedicated CSS module `src/pages/weekly-timesheet/styles/timesheet.css` containing ~560 lines of traditional CSS variables, layout rules, and print-specific `@media print` rules for A4 landscape output, migrated from an original Excel-style design.

**Design tokens and conventions observed:**
- Color palette: blue (`#3b82f6` / `blue-600`) for primary actions, gray scale (`gray-100`–`gray-900`) for neutral surfaces, red (`#dc2626` / `red-500`) for errors/danger states.\n- Form elements follow a consistent 40px height pattern via `.form-input`, `.form-select`, `.form-button` classes defined globally, with focus rings using `ring-blue-500`.
- Spacing and typography use Tailwind's default scale; the DataTable component standardizes table styling across all list views (projects, users, logs).
- The timesheet module defines its own CSS custom properties (`--ts-*` and `--excel-*` variables) scoped to that feature, including glassmorphic backgrounds, Excel-like cell colors, and print-preserving color adjustments.

**Architecture decisions:**
- No external UI kit (no shadcn, Radix, MUI, AntD, Chakra) — the team built lightweight, single-purpose components that compose Tailwind utilities directly.
- Styling is co-located where needed: most components are styled entirely inline via className strings; only cross-cutting form patterns live in `index.css`, and the complex timesheet spreadsheet gets its own stylesheet.
- Responsive behavior is handled through Tailwind's breakpoint prefixes (`sm:`, `md:`, `lg:`), with the AppLayout switching sidebar to a drawer on mobile.
- Print support is explicitly implemented only for the timesheet module via `@media print` rules targeting A4 landscape with `print-color-adjust: exact`.

**Constraints enforced by the build:**
- All imports go through the `@/` path alias resolved in `vite.config.ts`, keeping import paths consistent.
- TypeScript is used throughout for component prop typing, ensuring style-related props (like `variant`, `size`) are validated at compile time.
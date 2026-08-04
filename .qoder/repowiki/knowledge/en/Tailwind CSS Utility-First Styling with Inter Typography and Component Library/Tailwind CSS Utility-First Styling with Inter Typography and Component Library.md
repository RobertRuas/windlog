---
kind: frontend_style
name: Tailwind CSS Utility-First Styling with Inter Typography and Component Library
category: frontend_style
scope:
    - '**'
source_files:
    - src/index.css
    - src/pages/weekly-timesheet/styles/timesheet.css
    - src/components/ui/Button.tsx
    - package.json
---

The Windlog frontend uses a Tailwind CSS v4 utility-first styling approach built on Vite, combined with a small set of shared UI components and scoped CSS for complex layouts.

**Styling system and tooling**
- Tailwind CSS v4 is configured via `@tailwindcss/vite` plugin (no separate `tailwind.config.js`) and imported through `@import "tailwindcss"` in `src/index.css`.
- The Inter font family from `@fontsource/inter` (weights 400, 500, 600, 700) is the primary typeface, falling back to Apple's SF Pro on macOS/iOS.
- Global base styles are centralized in `src/index.css`: body background (`#f5f5f7`), antialiased fonts, and reusable form primitives (`.form-input`, `.form-select`, `.form-textarea`, `.form-button-*`, `.form-label`).
- Build tooling: Vite + TypeScript; no PostCSS or SCSS pipeline is used.

**Component library pattern**
- Shared UI primitives live under `src/components/ui/` (Button, Input, DatePicker, DataTable, Accordion, SecureImage, SecureFileLink, SignaturePad). Components are styled exclusively with Tailwind class strings passed via `className`, with variant/size props mapping to predefined Tailwind class sets (e.g., Button's `primary`/`secondary` variants and `sm`/`md` sizes).
- Feature-specific components (feedback, notifications, layout) follow the same pattern — inline Tailwind classes rather than external stylesheets.

**Scoped CSS for complex modules**
- The Weekly Timesheet module owns its own stylesheet at `src/pages/weekly-timesheet/styles/timesheet.css` (~568 lines). This file defines CSS custom properties for an Excel-like palette, a fixed-width 1489px sheet layout, cell-level classes (`.cell-title`, `.cell-meta-header`, `.cell-day-header`, `.cell-data`, etc.), zoom controls, and comprehensive `@media print` rules targeting A4 landscape output. It was migrated verbatim from an original design stylesheet.

**Design tokens and conventions observed**
- Colors: Tailwind's blue/gray palette dominates (`bg-blue-600`, `text-gray-800`, `hover:bg-blue-700`); the timesheet sheet uses a green accent (`--ts-primary-accent: #10b981`) and Excel-style header/background colors.
- Spacing and sizing: consistent use of Tailwind spacing scale; form elements share a 40px height baseline defined globally.
- Typography: Inter font stack with `-apple-system` fallback; font weights 400/500/600/700 only.
- No global theme configuration beyond `index.css`; there is no centralized design-token file or Tailwind theme customization layer discovered.

**Key files**
- `src/index.css` — global Tailwind import, Inter font imports, body defaults, and shared form component styles.
- `src/pages/weekly-timesheet/styles/timesheet.css` — scoped CSS for the Excel-like timesheet sheet, including print rules.
- `src/components/ui/Button.tsx` — canonical example of a Tailwind-styled shared component with variant/size props.
- `package.json` — declares `tailwindcss` v4, `@tailwindcss/vite`, and `@fontsource/inter`.
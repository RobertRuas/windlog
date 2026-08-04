---
kind: frontend_style
name: Tailwind CSS Utility-First Styling with Shared Component Library
category: frontend_style
scope:
    - '**'
source_files:
    - src/index.css
    - src/components/ui/Button.tsx
    - src/components/ui/Input.tsx
    - src/components/ui/DataTable.tsx
    - src/pages/weekly-timesheet/styles/timesheet.css
    - src/components/layout/AppLayout.tsx
    - src/components/layout/Sidebar.tsx
---

The frontend uses a utility-first styling approach built on Tailwind CSS, combined with a shared React component library in `src/components/ui/` and a few feature-specific CSS files for complex layouts.

**System and tools**
- Tailwind CSS v4 is imported via `@import "tailwindcss"` in `src/index.css`, with the Inter font loaded through `@fontsource/inter` (weights 400, 500, 600, 700) as an open-source substitute for Apple's SF Pro.
- No `tailwind.config.*` file exists; Tailwind is used with its default configuration plus the global styles defined in `index.css`.
- Icons come from `lucide-react` (e.g., `FolderOpen`, `ChevronLeft`, `ChevronRight`, `LogOut`).
- The build toolchain is Vite (`main.tsx`, `vite-env.d.ts`).

**Global design tokens and base styles**
- `src/index.css` defines the application-wide typography (`Inter` + system fallbacks), background color (`#f5f5f7`), and reusable form primitives: `.form-input`, `.form-select`, `.form-textarea`, `.form-button` (with `primary`, `secondary`, `danger` variants), and `.form-label`. These provide consistent heights (40px), border radius (6px), focus rings (`ring-blue-500`), and transitions across all forms.
- A single page-level stylesheet exists at `src/pages/weekly-timesheet/styles/timesheet.css`, which declares CSS custom properties (`--ts-*` and `--excel-*`) for the timesheet module, including colors, shadows, and Excel-like palette tokens. It also contains extensive print rules (`@page { size: A4 landscape }`) to faithfully reproduce the original spreadsheet layout.

**Shared UI component library (`src/components/ui/`)**
- `Button.tsx` — variant-driven (`primary` | `secondary`) and size-driven (`sm` | `md`) button using Tailwind classes mapped in JS objects.
- `Input.tsx` — label + input + optional error message, with consistent Tailwind-based focus ring and error state styling.
- `DataTable.tsx` — generic, configurable data table with loading/empty states, optional pagination, sticky columns, and uniform Tailwind styling.
- Other primitives include `Accordion.tsx`, `DatePicker.tsx`, `SecureFileLink.tsx`, `SecureImage.tsx`, and `SignaturePad.tsx` (canvas-based signature capture).
- All components accept a `className` prop so consumers can layer additional Tailwind utilities.

**Layout and page-level styling**
- Layout is composed through `AppLayout.tsx` and `Sidebar.tsx`, both styled entirely with Tailwind utility classes (flexbox, responsive breakpoints like `md:`, fixed positioning for the sidebar, mobile hamburger menu, etc.).
- Pages are organized under `src/pages/<feature>/` with co-located `components/` subfolders; most pages rely on the shared UI components and Tailwind utilities rather than custom CSS.
- The only dedicated CSS file outside the global stylesheet is the timesheet module's `styles/timesheet.css`, which is justified by its need to precisely replicate an existing Excel-like spreadsheet design (fixed widths, row heights, rotated headers, print output).

**Conventions and constraints observed**
- Utility-first: JSX elements are styled inline with Tailwind class strings; custom CSS is reserved for global form primitives and the complex timesheet sheet.
- Design tokens are centralized: global tokens live in `index.css` (colors, spacing, typography), while module-scoped tokens use CSS variables (`--ts-*`, `--excel-*`) in the timesheet stylesheet.
- Form consistency is enforced through the shared `.form-*` classes and the `Input`/`Button` components, ensuring uniform height, border-radius, focus states, and disabled visuals across the app.
- Responsive behavior follows Tailwind's breakpoint convention (`sm:`, `md:`) throughout layout components.
- Print fidelity is explicitly handled in the timesheet stylesheet with `@media print` rules that force A4 landscape, hide non-print elements, and preserve colors via `print-color-adjust: exact`.
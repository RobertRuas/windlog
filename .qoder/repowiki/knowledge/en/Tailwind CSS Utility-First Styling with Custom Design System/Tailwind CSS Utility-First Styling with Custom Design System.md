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

The Windlog frontend uses a utility-first styling approach built on **Tailwind CSS v4** (via `@tailwindcss/vite` plugin integrated into Vite), combined with a small set of custom reusable UI components and scoped CSS for complex layouts.

### Core Styling System
- **Tailwind CSS v4** is the primary styling engine, imported via `@import "tailwindcss"` in `src/index.css`. The Vite config registers `@tailwindcss/vite` as a plugin, enabling Tailwind's new CSS-first configuration model without a separate `tailwind.config.js` file.
- **Inter font** (via `@fontsource/inter`) serves as the open-source substitute for Apple's San Francisco, with system fallbacks (`-apple-system`, `BlinkMacSystemFont`, etc.) ensuring native SF Pro rendering on Apple devices.
- Global base styles define consistent form elements: `.form-input`, `.form-select`, `.form-textarea`, `.form-button` variants (primary/secondary/danger), and `.form-label` — all sharing a 40px height standard for visual alignment across inputs, selects, and buttons.

### Component Library Pattern
Reusable UI primitives live in `src/components/ui/` and follow a consistent pattern:
- **Button.tsx**: Supports `variant` ('primary' | 'secondary') and `size` ('sm' | 'md') props mapped to Tailwind class sets, with consistent rounded corners, transitions, and disabled states.
- **Input.tsx**: Wraps native `<input>` with label, error messaging (red border + red text), focus ring (`focus:ring-blue-500`), and accessible `htmlFor`/`id` pairing.
- Additional UI components include Accordion, DatePicker, DataTable, SecureFileLink, SecureImage, and SignaturePad — all styled exclusively with Tailwind utility classes.

### Iconography
- **Lucide React** is the icon library used throughout (`lucide-react` imports for Bell, MessageSquare, ChevronDown, Calendar, Pen, ShieldCheck, etc.), applied via className props like `text-blue-600` or `bg-blue-100`.

### Scoped CSS for Complex Layouts
While most styling is utility-based, complex domain-specific layouts use dedicated CSS files:
- `src/pages/weekly-timesheet/styles/timesheet.css` (568 lines) contains the entire weekly timesheet spreadsheet interface, migrated from an original Excel-like design. It defines CSS custom properties (`--ts-*`, `--excel-*` tokens), fixed-width table layouts (1489px), zoom controls, print styles for A4 landscape, and cell-level styling for metadata, day headers, data cells, and signatures.

### Design Tokens & Conventions
- **Color palette**: Blue (`#3b82f6` / blue-600) as primary action color, gray scale for neutral elements, red (`#dc2626`) for destructive actions.
- **Typography**: Inter font family with weights 400/500/600/700; consistent text sizes using Tailwind's scale (xs/sm/base/lg/xl).
- **Spacing & borders**: 6px border radius for inputs/buttons, 12px for cards, 16px for modals; 1px solid `#d1d5db` borders for form elements.
- **Transitions**: 0.15s–0.2s duration for hover/focus states with cubic-bezier easing where animated (e.g., timesheet zoom).
- **Responsive strategy**: Primarily mobile-first via Tailwind breakpoints; no media queries in global styles except for print (`@media print`) rules in the timesheet module.

### Build Integration
- Vite serves the app on port 5173 with Tailwind CSS processed at build time.
- Path aliases configured (`@/` → `./src`) for cleaner imports.
- No separate CSS framework (no Bootstrap, Material-UI, etc.); styling is entirely custom via Tailwind utilities plus the small component wrapper layer.
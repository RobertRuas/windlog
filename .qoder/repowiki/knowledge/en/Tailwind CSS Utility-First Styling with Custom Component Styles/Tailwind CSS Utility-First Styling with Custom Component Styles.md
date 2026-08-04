---
kind: frontend_style
name: Tailwind CSS Utility-First Styling with Custom Component Styles
category: frontend_style
scope:
    - '**'
source_files:
    - src/index.css
    - src/pages/weekly-timesheet/styles/timesheet.css
    - vite.config.ts
---

The frontend styling system is built on **Tailwind CSS v4** (utility-first approach) integrated via `@tailwindcss/vite` in Vite. Global styles are centralized in `src/index.css`, which imports Tailwind and defines the Inter font family (via `@fontsource/inter`) as a San Francisco alternative, along with reusable form component classes (`.form-input`, `.form-select`, `.form-textarea`, `.form-button-*`, `.form-label`).

**Architecture & Conventions:**
- **Utility-first layout**: Most UI components use Tailwind utility classes directly in JSX (e.g., `flex`, `bg-white`, `rounded-lg`, `shadow-sm`, `border-gray-200`) rather than custom CSS classes.
- **Component-scoped CSS**: Complex or domain-specific styling lives in dedicated CSS files per feature area — notably `src/pages/weekly-timesheet/styles/timesheet.css` for the timesheet spreadsheet module, which contains ~500 lines of Excel-faithful styling with CSS variables (`--ts-*`, `--excel-*`) defining design tokens for colors, borders, and typography.
- **CSS Variables for theming**: The timesheet module uses CSS custom properties extensively to maintain visual consistency across headers, cells, buttons, and print output.
- **Print styles**: Dedicated `@media print` rules ensure A4 landscape printing with preserved colors (`print-color-adjust: exact`).

**Build Integration:**
- Tailwind is configured through `@tailwindcss/vite` plugin in `vite.config.ts`
- Path aliases (`@/`) resolve to `./src` for cleaner imports
- No separate Tailwind config file — configuration is inline via the Vite plugin

**Design Tokens & Patterns:**
- Consistent spacing using Tailwind's scale (p-6, gap-4, etc.)
- Color palette centered around grays (`gray-50` through `gray-900`) with blue accents (`blue-600`)
- Form elements standardized at 40px height with consistent border radius (6px) and focus states
- Glassmorphic effects used sparingly (backdrop-filter blur in control panels)

**Responsive Strategy:**
- Mobile-first with Tailwind's responsive prefixes (`sm:`, `md:`)
- Sidebar collapses to mobile menu on small screens
- Timesheet sheet uses fixed width (1489px) with horizontal scrolling for complex spreadsheets
---
kind: frontend_style
name: Tailwind CSS Utility-First Styling with Shared UI Components
category: frontend_style
scope:
    - '**'
source_files:
    - src/index.css
    - vite.config.ts
    - src/components/ui/Button.tsx
    - src/components/ui/Input.tsx
    - src/components/ui/DataTable.tsx
---

The Windlog frontend uses a utility-first styling approach built on Tailwind CSS v4, integrated via the `@tailwindcss/vite` plugin in Vite. There is no separate `tailwind.config.js` file — configuration is handled through the modern CSS-based import system (`@import "tailwindcss"`) in `src/index.css`, which also defines global base styles and reusable form component classes.

**Core System:**
- **Framework**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin in `vite.config.ts`)
- **Build tool**: Vite with React plugin, configured with path aliases (`@/` → `./src`)
- **Font system**: Inter font (via `@fontsource/inter`) as an open-source alternative to Apple's SF Pro, loaded through CSS imports for weights 400, 500, 600, 700
- **Icon library**: Lucide React icons used throughout components

**Global Styles & Design Tokens:**
The `src/index.css` file serves as the single source of truth for global styling, defining:
- Base typography using Inter font family with system font fallbacks
- Consistent form element heights (40px) for inputs, selects, and buttons
- Reusable form class patterns: `.form-input`, `.form-select`, `.form-textarea`, `.form-button`, `.form-label`
- Color palette centered around blue (`#3b82f6`), gray scales, and semantic colors (red for danger/error states)
- Focus states with consistent ring effects (`focus:ring-blue-500`)

**Component Library Pattern:**
Shared UI components in `src/components/ui/` follow a consistent pattern:
- **Button**: Props-based variants (`primary`/`secondary`) and sizes (`sm`/`md`) mapped to Tailwind classes
- **Input**: Accessible label/input pairing with error state handling
- **DataTable**: Generic table component with configurable columns, pagination, loading/empty states, and sticky columns
- All components use inline Tailwind classes rather than CSS modules or styled-components

**Styling Conventions:**
- Utility-first approach: all styling done through Tailwind class names directly in JSX
- Consistent spacing scale using Tailwind's default spacing system
- Semantic color usage: blue for primary actions, gray for neutral elements, red for errors/danger
- Hover states and transitions applied consistently across interactive elements
- Responsive design handled through Tailwind's responsive prefixes
- No custom CSS frameworks beyond Tailwind — minimal global CSS limited to form utilities and base styles

**Architecture Decisions:**
- No design token system beyond Tailwind's defaults — colors and spacing come from Tailwind's built-in palette
- Component styling is co-located within component files rather than separate style files
- Form consistency achieved through shared CSS classes in `index.css` rather than component-level styling
- Font rendering optimized with antialiasing and grayscale smoothing for better text appearance
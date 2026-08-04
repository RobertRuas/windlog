---
kind: frontend_style
name: Tailwind CSS + CSS Variables Design System
category: frontend_style
scope:
    - '**'
source_files:
    - src/index.css
    - src/contexts/SettingsContext.tsx
    - src/components/ui/Button.tsx
    - src/components/layout/AppLayout.tsx
    - package.json
---

The frontend uses a hybrid styling approach combining Tailwind CSS v4 (utility-first) with a centralized CSS custom properties design system. The build stack is Vite with @tailwindcss/vite plugin, and styles are declared in `src/index.css`.

**Core styling system:**
- Tailwind CSS v4 is imported via `@import "tailwindcss"` in `index.css`, using the new CSS-based configuration approach (no `tailwind.config.js`).
- A comprehensive set of CSS custom properties (`--color-primary`, `--color-text`, `--color-surface`, `--form-height`, etc.) define the design tokens for colors, spacing, typography, and form dimensions.
- Dark mode is implemented through a `.dark` class on `<html>` (not `prefers-color-scheme`), applied by `SettingsContext.tsx` which manages theme state ('light', 'dark', 'auto') and persists it to localStorage and the API.
- Inter font from `@fontsource/inter` is used as the primary typeface, falling back to Apple's SF Pro on macOS/iOS devices.

**Component library pattern:**
- Reusable UI components live in `src/components/ui/` (Button, Input, Select, DataTable, DatePicker, etc.) and follow a consistent pattern: they combine global CSS classes (`.form-button`, `.form-input`, `.form-select`) with Tailwind utility classes for layout and responsive behavior.
- Global form styles enforce consistent 40px height, border radius, focus states, and error states across all inputs.
- Components use TypeScript interfaces for props and include detailed JSDoc comments explaining usage patterns.

**Layout architecture:**
- `AppLayout.tsx` provides a fixed sidebar + header + main content layout using Tailwind utilities (`min-h-screen`, `bg-gray-50`, `md:ml-60`, `sticky top-0`).
- Responsive breakpoints follow Tailwind defaults (sm, md, lg) with mobile-first approach.
- Dark mode overrides are applied globally via `html.dark` selectors targeting common Tailwind classes like `bg-white`, `text-gray-*`, `border-gray-*`.

**Theming and personalization:**
- Theme switching is managed through `SettingsContext.tsx` which applies the theme class to `<html>` and handles system preference detection when theme='auto'.
- Font scaling is supported via CSS `zoom` property controlled through the same context.
- All color values flow through CSS variables, making theme switching seamless without component-level changes.

**Styling conventions observed:**
- Utility classes handle layout, spacing, and responsive behavior while semantic CSS classes (`.form-*`) handle visual consistency.
- Dark mode uses explicit `dark:` variants where needed, plus global overrides in `index.css`.
- Component styling combines global base classes with Tailwind utilities for modifiers (variants, sizes).
- No CSS-in-JS libraries, SCSS preprocessors, or styled-components — pure CSS with Tailwind utilities.
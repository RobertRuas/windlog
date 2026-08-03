---
kind: frontend_style
name: Tailwind CSS Utility-First Styling with Custom Component Library and Excel-Fidelity Timesheet Styles
category: frontend_style
scope:
    - '**'
source_files:
    - src/index.css
    - src/pages/weekly-timesheet/styles/timesheet.css
    - src/components/ui/Button.tsx
    - src/components/ui/Input.tsx
---

The frontend styling system is built on **Tailwind CSS** (v4 via `@import "tailwindcss"`) using a utility-first approach, combined with a small set of reusable React UI components and a dedicated CSS module for the spreadsheet-like weekly timesheet view.

### Core Styling System
- **Tailwind CSS** is imported globally in `src/index.css` and used directly via `className` props throughout JSX components. No `tailwind.config.js` file exists; configuration is done inline through Tailwind v4's import-based setup.
- **Inter font** from `@fontsource/inter` (weights 400, 500, 600, 700) serves as the primary typeface, falling back to Apple's SF Pro on macOS/iOS devices.
- Global base styles define a light gray background (`#f5f5f7`), antialiased text rendering, and consistent form element heights (40px for inputs/selects/buttons).

### Custom CSS Classes for Form Consistency
A small set of hand-written CSS classes in `src/index.css` provides visual consistency across forms:
- `.form-input`, `.form-select`, `.form-textarea` — standardized input fields with 1px borders, rounded corners, focus states using blue ring (`#3b82f6`)
- `.form-button`, `.form-button-primary`, `.form-button-secondary`, `.form-button-danger` — button variants with consistent sizing and hover/disabled states
- `.form-label` — consistent label styling

### Reusable UI Component Library
The `src/components/ui/` directory contains small, purpose-built React components styled entirely with Tailwind classes:
- `Button.tsx` — supports `primary`/`secondary` variants and `sm`/`md` sizes
- `Input.tsx` — includes label, error state handling, and accessible `htmlFor` associations
- Additional components: `Accordion`, `DataTable`, `SecureFileLink`, `SecureImage`

These components encapsulate Tailwind class composition patterns rather than relying on a design system or theme tokens.

### Spreadsheet-Style Timesheet Module
The weekly timesheet feature uses a separate CSS file (`src/pages/weekly-timesheet/styles/timesheet.css`) that faithfully reproduces an Excel-like spreadsheet interface:
- **CSS custom properties** define the Excel color palette (header backgrounds, travel row colors, green accents, borders)
- Fixed-width layout (1489px) with zoom controls via CSS `zoom` and `transform: scale()`
- Specific cell classes for different row types: title, metadata headers/values, day headers (including rotated vertical text), data cells, signature areas
- **Print stylesheet** configured for A4 landscape output with exact color preservation (`print-color-adjust: exact`)
- Glassmorphic control panel with backdrop blur effects

### Design Conventions Observed
- Utility-first Tailwind classes are preferred over custom CSS for most UI elements
- Custom CSS is reserved for complex layouts (timesheet spreadsheet) and global form consistency
- Color palette centers around blues (`#3b82f6`, `#2563eb`) for primary actions, grays for neutral elements, and semantic reds for errors/danger
- Typography uses Inter/SF Pro with consistent sizing scales (text-xs through text-base)
- Spacing follows Tailwind's default scale (0.25rem increments)
- Border radius consistently uses 6px for form elements and 8-16px for cards/buttons
- Focus states use blue rings with subtle shadows for accessibility

### Responsive Strategy
- Mobile-first responsive classes (e.g., `md:hidden`, `sm:block`) are used throughout components
- The sidebar collapses to a mobile menu on smaller screens
- The main content area adapts with responsive padding and max-width constraints

No centralized design tokens, CSS-in-JS, or component library like Material-UI/Tailwind UI is used — styling is a mix of Tailwind utilities, small custom CSS classes, and component-specific styles.
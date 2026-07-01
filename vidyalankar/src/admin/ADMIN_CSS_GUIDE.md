# Admin Panel CSS System Guide

## Overview

The admin panel CSS has been redesigned to follow a **unified design system** with consistent styling, spacing, colors, and components across all the admin pages.

## Files Structure

### 1. **AdminTheme.css** (Core Design System)

- **Purpose**: Contains all global variables, colors, typography, and utility classes
- **When to use**: Import this in ALL admin component CSS files as the first import
- **Key Features**:
  - CSS custom properties for colors, typography, spacing, and shadows
  - Global button styles
  - Form and input styles
  - Modal and dialog styles
  - Alert and banner styles
  - Responsive utilities
  - Grid utilities

### 2. **AdminDashboard.css** (Dashboard Cards)

- **Imports**: AdminTheme.css
- **Purpose**: Specific styles for the admin dashboard card layout
- **Components**:
  - Card grid layout
  - Card items with icons
  - Card labels with decorative underlines
  - Coming soon badges
  - Info banners

### 3. **FacultyList.css** (Faculty Management)

- **Imports**: AdminTheme.css
- **Purpose**: Styles for faculty list views and cards
- **Components**:
  - Stats grid
  - Control section with search and view toggle
  - Faculty card grid view
  - Faculty table view
  - Action buttons
  - Empty state

### 4. **FacultyForm.css** (Faculty Forms)

- **Imports**: AdminTheme.css
- **Purpose**: Styles for faculty creation and editing forms
- **Components**:
  - Form progress indicator
  - Form sections and cards
  - Form fields and validation
  - Array items (for multiple inputs like skills)
  - Form actions (submit/cancel buttons)

### 5. **AdminComponents.css** (Reusable Components)

- **Purpose**: Shared component styles used across multiple pages
- **Components**:
  - View tabs
  - Search input
  - Data tables
  - Action buttons
  - Staff cards
  - Info cards
  - Modals
  - Empty states

### 6. **DepartmentManagement.css**

- **Imports**: AdminTheme.css, AdminComponents.css
- **Purpose**: Department-specific styles

## CSS Variables (AdminTheme.css)

### Color Variables

```css
--admin-primary              /* Primary brand color (green) */
--admin-primary-dark         /* Darker primary for hover states */
--admin-primary-light        /* Light tint for backgrounds */

--admin-success              /* Success/positive indicators */
--admin-danger               /* Error/destructive actions */
--admin-warning              /* Warnings */
--admin-info                 /* Information */

--admin-text-primary         /* Main text color */
--admin-text-secondary       /* Secondary/muted text */
--admin-text-tertiary        /* Very light text */

--admin-bg-main              /* Page background */
--admin-bg-card              /* Card/surface background */
--admin-bg-secondary         /* Secondary surface */
```

### Spacing Variables

```css
--admin-space-xs   /* 4px */
--admin-space-sm   /* 8px */
--admin-space-md   /* 12px */
--admin-space-lg   /* 16px */
--admin-space-xl   /* 24px */
--admin-space-2xl  /* 32px */
```

### Shadow Variables

```css
--admin-shadow-xs    /* Subtle drop shadow */
--admin-shadow-sm    /* Small shadow */
--admin-shadow-md    /* Medium shadow */
--admin-shadow-lg    /* Large shadow */
--admin-shadow-xl    /* Extra large shadow */
```

## How to Use

### For Creating New Admin Components

1. **Create your component CSS file**:

```css
/* NewComponent.css */
@import "./AdminTheme.css";
@import "./AdminComponents.css"; /* If using common components */

/* Your specific styles here, using theme variables */
.your-component {
  background: var(--admin-bg-card);
  border: 1px solid var(--admin-border);
  padding: var(--admin-space-lg);
}
```

2. **Use theme variables, NOT hard-coded colors**:

```css
/* ✅ Good */
.button {
  background: var(--admin-primary);
  color: var(--admin-text-on-primary);
  padding: var(--admin-space-md);
}

/* ❌ Bad */
.button {
  background: #10b981;
  color: #ffffff;
  padding: 12px;
}
```

3. **Import in your React component**:

```jsx
import "./NewComponent.css";
```

### Updating Existing Styles

1. Check if the style rule already exists in AdminTheme.css
2. If not, add it to AdminTheme.css or create a specific component CSS
3. Remove duplicate code from individual component files
4. Replace hard-coded values with CSS variables

## Utility Classes

The AdminTheme.css provides utility classes for common patterns:

### Spacing

- `.mt-sm`, `.mt-md`, `.mt-lg`, `.mt-xl` - Margin top
- `.mb-sm`, `.mb-md`, `.mb-lg`, `.mb-xl` - Margin bottom
- `.gap-sm`, `.gap-md`, `.gap-lg` - Gap for flex containers

### Flexbox

- `.flex` - Display flex
- `.flex-col` - Flex direction column
- `.flex-between` - justify-content space-between
- `.flex-center` - Both justify-content and align-items center
- `.items-center` - Align items center

### Text

- `.text-center` - Text align center
- `.text-right` - Text align right

### Other

- `.cursor-pointer` - Cursor pointer
- `.opacity-50`, `.opacity-75` - Opacity utilities

## Grid System

For responsive layouts, use CSS Grid utilities:

```css
/* 2-column grid */
<div class="grid-2">...</div>

/* 3-column grid */
<div class="grid-3">...</div>

/* 4-column grid */
<div class="grid-4">...</div>
```

These automatically stack to 1 column on mobile.

## Responsive Breakpoints

- **768px** - Tablet
- **640px** - Mobile

```css
@media (max-width: 768px) {
  /* Tablet styles */
}

@media (max-width: 640px) {
  /* Mobile styles */
}
```

## Color Palette Integration

The system uses CSS variables defined in `theme.js`:

- `--primary-accent` → `--admin-primary`
- `--primary-accent-dark` → `--admin-primary-dark`
- `--bg-color` → `--admin-bg-main`
- `--card-bg` → `--admin-bg-card`
- `--text-main` → `--admin-text-primary`
- `--text-muted` → `--admin-text-secondary`

This ensures consistency with your global theme system and supports dark mode switching.

## Common Patterns

### Card Component

```jsx
<div className="card">
  <h3>Title</h3>
  <p>Content</p>
</div>
```

### Button Styles

```jsx
<button className="btn btn-primary">Primary Button</button>
<button className="btn btn-secondary">Secondary Button</button>
<button className="btn btn-danger">Danger Button</button>
<button className="btn btn-sm">Small Button</button>
<button className="btn btn-icon"><i className="icon"></i></button>
```

### Form Group

```jsx
<div className="form-group">
  <label>Label</label>
  <input type="text" />
  <span className="field-error">Error message</span>
  <span className="field-hint">Hint text</span>
</div>
```

### Table

```jsx
<div className="table-wrapper">
  <table className="table">
    <thead>
      <tr>
        <th>Column</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Data</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Modal

```jsx
<div className="modal-overlay">
  <div className="modal">
    <div className="modal-header">
      <h3>Title</h3>
    </div>
    <div className="modal-body">Content</div>
    <div className="modal-footer">
      <button>Cancel</button>
      <button>Submit</button>
    </div>
  </div>
</div>
```

## Best Practices

1. **Always import AdminTheme.css first** in component CSS files
2. **Use CSS variables** instead of hard-coded values
3. **Maintain consistency** with spacing and typography
4. **Avoid duplicate styles** - check if already defined in theme
5. **Use semantic class names** that describe the component
6. **Respect the color palette** - don't introduce arbitrary colors
7. **Test responsive design** at 768px and 640px breakpoints
8. **Keep specificity low** - use single class selectors when possible

## Migration Checklist

When updating old admin components:

- [ ] Add `@import './AdminTheme.css';` at top
- [ ] Replace hard-coded colors with CSS variables
- [ ] Replace magic numbers with spacing variables
- [ ] Remove duplicate button styles
- [ ] Remove duplicate form styles
- [ ] Update shadows to use shadow variables
- [ ] Add responsive media queries
- [ ] Test all states (hover, active, disabled, error)
- [ ] Check consistency with other admin pages

## Support & Questions

For questions about the CSS system:

1. Check this guide first
2. Review AdminTheme.css CSS comments
3. Look at existing component implementations
4. Check the most recently updated component for examples

# Office Panel Institution Theme Guide

## Overview
The office staff panel now automatically adapts its color scheme based on the institution the staff member belongs to. This provides a consistent visual identity across the application.

## Institution Color Palettes

### 1. **VP (Vidyalankar Polytechnic)** - Green Theme
- **Primary Color**: `#10b981` (Emerald Green)
- **Dark Accent**: `#059669` (Dark Green)
- **Header Background**: `#2e7d32` (Forest Green)

**Applied to:**
- Sidebar logo and active menu items
- Header gradient
- Primary buttons (Upload, Apply Filter, etc.)
- Expand/Collapse buttons in Division Credentials
- Table headers in student lists
- Edit mode input borders
- Regenerate password buttons
- Copy buttons

### 2. **VIT (Vidyalankar Institute of Technology)** - Blue Theme
- **Primary Color**: `#3b82f6` (Sky Blue)
- **Dark Accent**: `#1d4ed8` (Royal Blue)
- **Header Background**: `#1565c0` (Deep Blue)

**Applied to:**
- All the same elements as VP, but in blue tones

### 3. **VSIT (Vidyalankar School of Information Technology)** - Red Theme
- **Primary Color**: `#ef4444` (Bright Red)
- **Dark Accent**: `#b91c1c` (Crimson)
- **Header Background**: `#c62828` (Dark Red)

**Applied to:**
- All the same elements as VP, but in red tones

## Implementation Details

### CSS Variables Used
The office panel uses the following CSS variables that automatically adapt:

```css
:root {
  --office-primary: var(--primary-accent, #1e40af);
  --office-primary-dark: var(--primary-accent-dark, #1e3a8a);
  --office-header-bg: var(--app-header-bg, #1e40af);
  --office-sidebar-accent: var(--primary-accent, #1e40af);
  --office-sidebar-dark: var(--primary-accent-dark, #1e3a8a);
}
```

### Updated Components

1. **OfficeSidebar.css** - Already using CSS variables
2. **OfficeHeader.css** - Already using CSS variables
3. **OfficeDashboard.css** - Already using CSS variables
4. **DivisionCredentials.css** - ✅ Updated to use CSS variables
5. **ManageStudents.css** - ✅ Updated to use CSS variables

### Theme Application Flow

1. **Login**: User logs in as office staff with their institution selected
2. **Storage**: Institution code (VP/VIT/VSIT) is stored in `localStorage.getItem("college")`
3. **Theme Loading**: `App.jsx` calls `applyTheme(college, role)` function
4. **CSS Variables Set**: Function sets the root CSS variables based on institution
5. **Automatic Styling**: All office panel components automatically use the new colors

## Testing the Theme

To test different institution themes:

1. **Log in as VP office staff**:
   - Select "VP" from institution dropdown
   - Role: "Office Staff"
   - Should see green theme throughout panel

2. **Log in as VIT office staff**:
   - Select "VIT" from institution dropdown
   - Role: "Office Staff"
   - Should see blue theme throughout panel

3. **Log in as VSIT office staff**:
   - Select "VSIT" from institution dropdown
   - Role: "Office Staff"
   - Should see red theme throughout panel

## Elements Styled

### Office Dashboard
- Tab buttons (active state)
- Primary action buttons
- Upload buttons
- Filter buttons
- Table pills/badges
- Input focus borders
- Success/error alerts
- Credential display borders

### Division Credentials
- Expand/Collapse division buttons
- Table headers
- Student count badges
- Download PDF buttons (using green for download action)
- Code display in credential tables

### Manage Students
- Edit/Filter input borders on focus
- Primary action buttons (Edit, Save)
- Pagination navigation (hover state)
- Password regenerate buttons
- Password display modal
- Copy to clipboard buttons

### Office Header
- Header background gradient
- Quick action buttons
- Notification badges

### Office Sidebar
- Logo background gradient
- Active menu item highlighting
- Section dividers
- Logout button (uses red for warning)

## Notes

- **Delete buttons** remain red (`#cc3333`) across all themes for consistency (warning action)
- **Success buttons** remain green (`#33cc33`) across all themes (positive action)
- **Cancel buttons** remain neutral gray across all themes
- **Error messages** remain red across all themes
- **Success messages** remain green across all themes

## Future Customization

To add a new institution:

1. Update `applyTheme()` in `App.jsx`:
```javascript
const themeMap = {
  VSIT: { header: "#c62828", accent: "#ef4444", accentDark: "#b91c1c" },
  VIT: { header: "#1565c0", accent: "#3b82f6", accentDark: "#1d4ed8" },
  VP: { header: "#2e7d32", accent: "#10b981", accentDark: "#059669" },
  NEW: { header: "#HEX", accent: "#HEX", accentDark: "#HEX" }, // Add here
};
```

2. No changes needed to CSS files - they automatically use the variables!

## Maintenance

All office panel styling is centralized using CSS variables. To modify the theme system:

1. Update color values in `App.jsx` `themeMap`
2. CSS files automatically adapt - no manual updates needed
3. Test across all three institutions to ensure consistency

---

**Last Updated**: February 13, 2026
**Version**: 1.0.0

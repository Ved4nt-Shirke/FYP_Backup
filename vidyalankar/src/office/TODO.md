# Office Staff UI Improvement TODO

## [ ] 1. Create/Update OfficeTheme.css (IN PROGRESS)

- Mirror AdminTheme.css structure
- Use project green palette (#10b981 primary from App.css)
- Full vars: colors, typography, spacing, shadows, components (buttons, cards, modals)

## [x] 2. Create NoticesPage.css ✅

- Import OfficeTheme.css
- Modern notice cards, rich editor toolbar (bold/italic/link/color)
- Animations, responsive grid (4→1 cols)

## [x] 3. Update Notices

- Add `import "./NoticesPage.css";`
- Replace Bootstrap classes → office-\* (btn-primary → office-btn-primary, form-group → office-form-section)

## [ ] 4. Create ManageStudents.css

- Import OfficeTheme.css
- Modern table (sticky header, hover rows, zebra stripes)
- Filter panel, modals (glassmorphism), pagination
- PDF export button with icon/hover

## [ ] 5. Update ManageStudents.jsx

- Add `import "./ManageStudents.css";`
- Update table/modal/action classes to office-\*

## [ ] 6. Test & Polish

- `npm run dev` in vidyalankar/
- Test office pages: responsive, hovers, consistency with admin green theme
- Mobile: stacks correctly, touch-friendly

**Status:** Starting with OfficeTheme.css foundation.

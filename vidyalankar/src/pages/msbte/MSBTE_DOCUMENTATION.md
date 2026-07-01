# MSBTE Formats Panel Documentation

## Overview

The MSBTE Formats Panel is an academic management module that provides collapsible format sections for MSBTE (Maharashtra State Board of Technical Education) K-Scheme formats with options to Generate, Edit, and Print assessments.

## Component Structure

### Main Components

#### 1. **MSBTEPanel.jsx** (`/src/components/`)

- Main modal component for MSBTE formats
- Displays collapsible format sections
- Handles navigation to different format pages
- Features:
  - Smooth expand/collapse animations
  - Format icons and labels
  - Action buttons (Generate, Edit, Print)
  - Direct attendance report link

#### 2. **MSBTE Format Pages** (`/src/pages/msbte/`)

Individual pages for each format action:

- `FAPRK3Generate.jsx` - Generate FA-PR-K3 format
- `SAPRK4Generate.jsx` - Generate SA-PR-K4 format
- `SAPRK4Edit.jsx` - Edit SA-PR-K4 format
- `SAPRK4Print.jsx` - Print/PDF preview SA-PR-K4
- `AttendanceReport.jsx` - View attendance reports

### Integration

The MSBTEPanel is integrated into the main Sidebar (`/src/basic/Sidebar.jsx`):

- Triggered by clicking "MSBTE Formats" in the sidebar menu
- Opens as a modal overlay
- Maintains consistent styling with the application theme

## Format Structure

### Supported Formats

1. **FA-PR-K3** (First Assessment - Practical - K Scheme)
   - Generate action available
   - Collapsible section

2. **SA-PR-K4** (Second Assessment - Practical - K Scheme)
   - Generate action
   - Edit action
   - Print action
   - Full CRUD operations

3. **FA-TH-K5** (First Assessment - Theory - K Scheme)
   - Collapsible section (actions to be added)

4. **SLA-K6** (Student Learning Achievement - K Scheme)
   - Collapsible section (actions to be added)

5. **Attendance Report**
   - Direct clickable item
   - Aggregates all attendance types

## Routing

### Routes Configuration

```
/msbte/fa-pr-k3/generate        → Generate FA-PR-K3
/msbte/sa-pr-k4/generate        → Generate SA-PR-K4
/msbte/sa-pr-k4/edit            → Edit SA-PR-K4
/msbte/sa-pr-k4/print           → Print SA-PR-K4
/msbte/attendance               → Attendance Report
```

All routes are configured in `/src/App.jsx`

## UI Features

### Styling

- **Color Scheme**: Purple gradient (#667eea → #764ba2)
- **Modal Design**: Centered overlay with smooth animations
- **Responsive**: Mobile-friendly layout
- **Accessibility**: Icons and labels for clarity

### Interactions

1. **Format Headers**
   - Click to expand/collapse
   - Chevron icon rotates on expand
   - Hover effect for visual feedback

2. **Actions**
   - Indented under format headers
   - File icon for each action
   - Hover highlighting

3. **Attendance Report**
   - Direct navigation button
   - Gradient background
   - Separate from format sections

## Future Enhancements

### To Be Implemented

- FA-TH-K5 actions (Generate, Edit, Print)
- SLA-K6 actions (Generate, Edit, Print)
- Data fetching from student/subject records
- PDF generation and download
- Print preview functionality
- Data validation and error handling

### Data Integration

- Fetch student marks from Assessment collection
- Fetch attendance data from attendance records
- Fetch subject information from Ciaan data
- Fetch faculty information from Faculty collection

## File Structure

```
/components
  ├── MSBTEPanel.jsx
  └── MSBTEPanel.css

/pages/msbte
  ├── FAPRK3Generate.jsx
  ├── SAPRK4Generate.jsx
  ├── SAPRK4Edit.jsx
  ├── SAPRK4Print.jsx
  ├── AttendanceReport.jsx
  └── MSBTEPages.css

/basic
  └── Sidebar.jsx (updated)

/App.jsx (updated with routes)
```

## Usage

### For Users

1. Click "MSBTE Formats" in the sidebar
2. Select a format to expand its actions
3. Click the desired action (Generate/Edit/Print)
4. For Attendance Report, click directly without expansion

### For Developers

1. Each format page follows the same template structure
2. Use `useNavigate()` for navigation
3. Use `Header` and `Sidebar` for consistent layout
4. Update MSBTEPanel.jsx to add new formats/actions

## Testing Checklist

- [ ] Panel opens/closes smoothly
- [ ] Formats expand/collapse correctly
- [ ] Navigation to each route works
- [ ] Mobile responsiveness verified
- [ ] Sidebar integration functional
- [ ] No console errors
- [ ] Styling consistent with app theme

## Notes

- All pages are currently placeholder implementations
- Real data integration will be added in next phase
- PDF generation library to be selected (e.g., jsPDF, pdfkit)
- Database queries for data fetching to be implemented

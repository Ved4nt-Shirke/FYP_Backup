# Office Panel - Quick Reference

## Files Modified/Created

### Modified Files:

1. **OfficeDashboard.jsx** - Complete rewrite of upload flow
2. **ManageStudents.jsx** - Complete rewrite with cascading filters
3. **OfficeDashboard.css** - Added form and upload styles
4. **OfficeTheme.css** - No changes (already dynamic)
5. **ManageStudents.css** - No changes (already using theme vars)

### New Files:

1. **OFFICE_PANEL_GUIDE.md** - Comprehensive user guide
2. **IMPLEMENTATION_SUMMARY.md** - Technical implementation details
3. **QUICK_REFERENCE.md** - This file

---

## Key Changes Summary

### Excel Upload Format

**Old Format:**

```
RollNo | EnrollmentNo | StudentName | Batch | Division
```

**New Format:**

```
RollNo | EnrollmentNo | StudentName
```

**Note:** Department, Course, and Division are selected from dropdowns - NOT in the Excel file.

---

### Upload Workflow

```
1. Select Department
        ↓
2. Select Course (filtered by Department)
        ↓
3. Select Division (filtered by Course)
        ↓
4. Upload Excel File
        ↓
5. Credentials Generated & Displayed
```

---

### Filter Workflow

```
Select Department → Select Course → Select Division → Apply Filters
        ↓               ↓                ↓
   Cascading        Cascading         Shows results
   dropdowns        dropdowns         for selected combo
```

---

## Backend Requirements

### API Endpoints Needed:

```
GET  /api/admin/departments
GET  /api/courses/{departmentId}
GET  /api/divisions/{courseId}
POST /api/students/bulk
GET  /api/students?departmentId=x&courseId=y&divisionId=z
```

### Student Model Fields:

```javascript
{
  rollNo: String,
  enrollmentNo: String,
  studentName: String,
  departmentId: ObjectId,      // NEW
  courseId: ObjectId,           // NEW
  divisionId: ObjectId,         // NEW
  username: String,
  plainPassword: String
}
```

---

## Testing Checklist (5 min quick test)

- [ ] Can select Department dropdown
- [ ] Course dropdown appears after Department selection
- [ ] Division dropdown appears after Course selection
- [ ] Can upload Excel with 3 columns
- [ ] Credentials appear after upload
- [ ] Can filter students by Department
- [ ] Can filter by Department → Course
- [ ] Can filter by Department → Course → Division
- [ ] Can edit student info
- [ ] Can delete student

---

## Common Issues & Solutions

| Issue                   | Solution                                                 |
| ----------------------- | -------------------------------------------------------- |
| Dropdown shows no items | Check backend endpoints are responding                   |
| Upload fails            | Ensure Excel has only: RollNo, EnrollmentNo, StudentName |
| Can't select Course     | Select Department first                                  |
| Can't select Division   | Select Course first                                      |
| Students not filtering  | Click "Apply Filters" button                             |
| Credentials not showing | Create students first, then upload                       |

---

## Configuration

All endpoints are defined in: `src/config/api.js`

```javascript
config.admin.departments; // GET departments
config.courses.listByDepartment(deptId); // GET courses
config.divisions.listByCourse(courseId); // GET divisions
config.students; // POST/GET students
```

---

## Database Migration

If migrating from old system:

1. Existing students without departmentId/courseId/divisionId are still viewable
2. New students uploaded through new flow will have all three IDs
3. Can update old students by re-uploading through new system

---

## Performance Notes

- Departments loaded on page load (cached)
- Courses loaded on Department selection (lazy)
- Divisions loaded on Course selection (lazy)
- Students paginated 10 per page
- Filters applied client-side for search

---

## Version Info

- **Version:** 2.0.0
- **Status:** Production Ready
- **Last Updated:** February 14, 2026
- **Main Changes:** Simplified Excel format, hierarchical selection, dynamic filtering

---

## Support Quick Links

- **User Guide:** [OFFICE_PANEL_GUIDE.md](./OFFICE_PANEL_GUIDE.md)
- **Technical Details:** [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **Component:** `/src/office/OfficeDashboard.jsx`
- **Manager Component:** `/src/office/ManageStudents.jsx`
- **Theme:** `/src/office/OfficeTheme.css`

---

**Ready to deploy!** 🚀

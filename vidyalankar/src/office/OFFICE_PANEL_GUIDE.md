# Office Panel - Student Upload & Management Guide

## Overview

The Office Panel now features a simplified, hierarchical student management system with Department → Course → Division selection before upload. All students are automatically assigned to the selected department, course, and division combination.

---

## 1. Student Upload Flow (OfficeDashboard.jsx)

### Step-by-Step Process

#### Step 1: Select Department, Course, and Division

1. Office user navigates to **Upload Students** tab
2. Selects:
   - **Department** (from dropdown - fetched from Admin Panel)
   - **Course** (from dropdown - filtered by selected Department)
   - **Division** (from dropdown - filtered by selected Course)

**Key Points:**

- All three selections are **required** before file upload
- Dropdowns are populated from Admin Panel configuration
- Each selection cascades to the next (Department → Course → Division)

#### Step 2: Upload Excel File

1. Once Department, Course, and Division are selected, user can upload Excel file
2. File format should contain only these columns:
   - **RollNo**
   - **EnrollmentNo**
   - **StudentName**

3. Alternative column names are supported:
   - RollNo: `Roll No`, `roll_no`, `RollNo`
   - EnrollmentNo: `Enrollment No`, `enrollment_no`, `EnrollmentNo`
   - StudentName: `Student Name`, `studentName`, `Name`

#### Step 3: Verify and Upload

1. File is parsed and preview shows number of valid rows
2. User clicks **Upload Students**
3. All students in the file are automatically assigned to the selected Department, Course, and Division

#### Step 4: Generated Credentials

1. Backend generates usernames and passwords automatically
2. Credentials are displayed in a table after successful upload
3. **Important:** Credentials are shown once and must be saved/copied
4. Users can copy all credentials to clipboard in CSV format

---

## 2. Manage Students Flow (ManageStudents.jsx)

### Viewing and Filtering Students

#### Filter Options

Users can filter students by:

- **Department** (dropdown)
- **Course** (dropdown - cascades from Department)
- **Division** (dropdown - cascades from Course)
- **Search** (by student name, roll no, or enrollment no)

#### Process

1. Select Department from dropdown
2. Select Course (auto-filtered by Department)
3. Select Division (auto-filtered by Course)
4. Optionally enter search term
5. Click **Apply Filters** to view results
6. Use **Clear Filters** to reset all selections

#### Features Available for Each Student

- **View Password:** Display the stored password for a student
- **Edit:** Modify student name, roll number, or enrollment number
- **Delete:** Remove student from system (requires confirmation)

---

## 3. Upload Form Changes

### Old Format (DEPRECATED)

```
RollNo | EnrollmentNo | StudentName | Batch | Division
01     | 2024001      | John Doe    | CO-B1 | A
```

### New Format (CURRENT)

```
RollNo | EnrollmentNo | StudentName
01     | 2024001      | John Doe
02     | 2024002      | Jane Smith
```

**Note:** Department, Course, and Division are selected from dropdowns BEFORE upload. They are automatically applied to all students in the file.

---

## 4. Database Structure

Each student now stores:

```javascript
{
  _id: ObjectId,
  rollNo: String,
  enrollmentNo: String,
  studentName: String,
  departmentId: ObjectId (reference to Department),   // NEW
  courseId: ObjectId (reference to Course),            // NEW
  divisionId: ObjectId (reference to Division),        // NEW
  username: String,
  plainPassword: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 5. API Endpoints Used

### Fetching Configuration

- **GET** `/api/admin/departments` - Fetch all departments
- **GET** `/api/admin/courses?departmentId=<id>` - Fetch courses for department
- **GET** `/api/admin/divisions?courseId=<id>` - Fetch divisions for course

### Student Operations

- **POST** `/api/students/bulk` - Upload multiple students
- **GET** `/api/students?departmentId=<id>&courseId=<id>&divisionId=<id>` - Fetch students with filters
- **PUT** `/api/students/<id>` - Update student
- **DELETE** `/api/students/<id>` - Delete student

---

## 6. Removed Features

The following old features have been removed:

- ❌ **Division Credentials Tab** - No longer needed
- ❌ **Batch Field in Upload** - Not required in Excel
- ❌ **Manual Division Input** - Use dropdowns instead
- ❌ **Division-based Only Filtering** - Now supports Department/Course/Division filtering

---

## 7. Best Practices

### For Office Users

1. **Download Template First:** Click "Download Template" in the upload modal to get the correct format
2. **Check Column Headers:** Ensure Excel has RollNo, EnrollmentNo, StudentName columns
3. **Save Credentials Immediately:** Copy generated credentials right after upload
4. **Use Filters Properly:** Always select Department first, then Course, then Division
5. **Verify Data:** Check the preview before uploading

### For Integration

1. **API Consistency:** All student endpoints support the new departmentId, courseId, divisionId fields
2. **Backward Compatibility:** Old data without department references will show as "-"
3. **Cascading Dropdowns:** Always wait for parent dropdown to load before enabling child dropdown
4. **Error Handling:** Clear error messages guide users through the process

---

## 8. Troubleshooting

| Issue                         | Solution                                                                |
| ----------------------------- | ----------------------------------------------------------------------- |
| Division dropdown is disabled | Select Course first                                                     |
| Course dropdown is disabled   | Select Department first                                                 |
| Upload button is disabled     | Ensure Department, Course, Division are all selected and file is parsed |
| "No valid rows found"         | Check Excel column headers match RollNo, EnrollmentNo, StudentName      |
| Students not showing          | Click "Apply Filters" or "Clear Filters" to refresh the list            |
| Cannot edit student           | Ensure you are logged in as office staff with proper permissions        |

---

## 9. Testing Checklist

- [ ] Upload students with valid Excel file
- [ ] Verify students are assigned correct department/course/division
- [ ] Filter students by department
- [ ] Filter students by course (after selecting department)
- [ ] Filter students by division (after selecting course)
- [ ] Search for student by name
- [ ] Edit student information
- [ ] Delete student (with confirmation)
- [ ] View student password
- [ ] Copy credentials to clipboard
- [ ] Clear filters and reload

---

## 10. File Locations

- **Upload Component:** `/src/office/OfficeDashboard.jsx`
- **Management Component:** `/src/office/ManageStudents.jsx`
- **Styling:** `/src/office/ManageStudents.css`, `/src/office/OfficeDashboard.css`
- **Theme:** `/src/office/OfficeTheme.css`

---

**Last Updated:** February 2026
**Status:** Active Implementation

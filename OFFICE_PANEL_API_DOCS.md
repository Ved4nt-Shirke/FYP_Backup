# 📡 Office Panel API Documentation

## Base URL
```
http://localhost:5000/api
```

---

## Authentication Header
All authenticated endpoints require:
```
Authorization: Bearer {JWT_TOKEN}
```

Get token by logging in as office staff:
```javascript
POST /auth/login
{
  "username": "office.staff.office",
  "password": "your_password",
  "college": "VSIT",
  "role": "office"
}
```

---

## Dashboard Endpoints

### GET /office/dashboard-summary
Get dashboard statistics

**Auth:** ✅ Required (office | admin | superadmin)

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/office/dashboard-summary
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalStudents": 150,
    "totalDivisions": 3,
    "totalBatches": 5
  }
}
```

---

## Student Endpoints

### GET /office/students
Fetch all students with optional filters

**Auth:** ✅ Required (office | admin | superadmin)

**Query Parameters:**
- `batch` (optional) - Filter by batch
- `division` (optional) - Filter by division

**Example Request:**
```bash
# Get all students
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/office/students

# Filter by division
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/office/students?division=A

# Filter by batch
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/office/students?batch=CO-B1

# Filter by both
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/office/students?batch=CO-B1&division=A
```

**Response:**
```json
{
  "success": true,
  "students": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "rollNo": "001",
      "enrollmentNo": "12345",
      "studentName": "John Doe",
      "batch": "CO-B1",
      "division": "A",
      "username": "12345",
      "plainPassword": "abc12345",
      "createdAt": "2026-02-12T...",
      "updatedAt": "2026-02-12T..."
    }
  ]
}
```

### GET /office/student/:id
Get specific student details

**Auth:** ✅ Required (office | admin | superadmin)

**URL Parameters:**
- `id` - Student MongoDB ID

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/office/student/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "student": {
    "_id": "507f1f77bcf86cd799439011",
    "rollNo": "001",
    "enrollmentNo": "12345",
    "studentName": "John Doe",
    "batch": "CO-B1",
    "division": "A",
    "username": "12345",
    "plainPassword": "abc12345"
  }
}
```

### POST /office/bulk-import
Bulk import students with automatic credential generation

**Auth:** ✅ Required (office | admin | superadmin)

**Request Body:**
```json
{
  "students": [
    {
      "rollNo": "001",
      "enrollmentNo": "12345",
      "studentName": "John Doe",
      "batch": "CO-B1",
      "division": "A"
    },
    {
      "rollNo": "002",
      "enrollmentNo": "12346",
      "studentName": "Jane Smith",
      "batch": "CO-B1",
      "division": "A"
    }
  ]
}
```

**Example Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "students": [
      {
        "rollNo": "001",
        "enrollmentNo": "12345",
        "studentName": "John Doe",
        "batch": "CO-B1",
        "division": "A"
      }
    ]
  }' \
  http://localhost:5000/api/office/bulk-import
```

**Response:**
```json
{
  "success": true,
  "inserted": 1,
  "skipped": 0,
  "errors": [],
  "generatedCredentials": [
    {
      "enrollmentNo": "12345",
      "studentName": "John Doe",
      "username": "12345",
      "plainPassword": "x7kP9mQw"
    }
  ]
}
```

### PUT /office/student/:id
Update student information

**Auth:** ✅ Required (office | admin | superadmin)

**Request Body:**
```json
{
  "rollNo": "001",
  "enrollmentNo": "12345",
  "studentName": "John Updated",
  "batch": "CO-B2",
  "division": "B"
}
```

**Example Request:**
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rollNo": "001",
    "enrollmentNo": "12345",
    "studentName": "John Updated",
    "batch": "CO-B2",
    "division": "B"
  }' \
  http://localhost:5000/api/office/student/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "student": {
    "_id": "507f1f77bcf86cd799439011",
    "rollNo": "001",
    "enrollmentNo": "12345",
    "studentName": "John Updated",
    "batch": "CO-B2",
    "division": "B"
  }
}
```

### DELETE /office/student/:id
Delete a student and associated user account

**Auth:** ✅ Required (office | admin | superadmin)

**Example Request:**
```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/office/student/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "message": "Student deleted successfully",
  "studentName": "John Doe"
}
```

---

## Metadata Endpoints

### GET /office/divisions
Get all available divisions

**Auth:** ✅ Required (office | admin | superadmin)

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/office/divisions
```

**Response:**
```json
{
  "success": true,
  "divisions": ["A", "B", "C"]
}
```

### GET /office/batches
Get all available batches

**Auth:** ✅ Required (office | admin | superadmin)

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/office/batches
```

**Response:**
```json
{
  "success": true,
  "batches": ["CO-B1", "CO-B2", "IT-B1"]
}
```

---

## Credential Endpoints

### POST /office/export-credentials
Export student credentials for a division/batch

**Auth:** ✅ Required (office | admin | superadmin)

**Request Body:**
```json
{
  "division": "A",
  "batch": "CO-B1"
}
```

**Example Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "division": "A",
    "batch": "CO-B1"
  }' \
  http://localhost:5000/api/office/export-credentials
```

**Response:**
```json
{
  "success": true,
  "count": 25,
  "credentials": [
    {
      "enrollmentNo": "12345",
      "studentName": "John Doe",
      "username": "12345",
      "plainPassword": "x7kP9mQw",
      "batch": "CO-B1",
      "division": "A"
    }
  ]
}
```

### POST /office/regenerate-password/:studentId
Regenerate password for a specific student

**Auth:** ✅ Required (office | admin | superadmin)

**Example Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/office/regenerate-password/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "message": "Password regenerated successfully",
  "studentName": "John Doe",
  "username": "12345",
  "plainPassword": "newPass123"
}
```

---

## Public Student Endpoints (No Auth)

### GET /students
Get all students (public - no authentication needed)

**Example Request:**
```bash
curl http://localhost:5000/api/students
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "rollNo": "001",
    "enrollmentNo": "12345",
    "studentName": "John Doe",
    "batch": "CO-B1",
    "division": "A"
  }
]
```

### GET /students/divisions
Get all divisions (public - no authentication needed)

**Example Request:**
```bash
curl http://localhost:5000/api/students/divisions
```

**Response:**
```json
{
  "divisions": ["A", "B", "C"]
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No token, authorization denied"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Office staff or admins only."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Student not found"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Required fields missing"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limiting & Best Practices

- ✅ Use batch operations for multiple students
- ✅ Cache divisions/batches list
- ✅ Implement pagination for large datasets
- ✅ Always include content-type header
- ✅ Handle token expiration gracefully
- ✅ Log all operations for audit trail

---

## Testing with Postman

1. **Set Token Variable**
   ```
   {{token}} - Set after login
   ```

2. **Common Header**
   ```
   Authorization: Bearer {{token}}
   Content-Type: application/json
   ```

3. **Pre-request Script** (for token)
   ```javascript
   // Login if needed
   if (!pm.globals.get("token")) {
     // Make login request
   }
   ```

---

## Integration Example (JavaScript/Fetch)

```javascript
// Login
async function login(username, password) {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password,
      college: 'VSIT',
      role: 'office'
    })
  });
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data.token;
}

// Get Students
async function getStudents() {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/office/students', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

// Bulk Import
async function bulkImport(students) {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/office/bulk-import', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ students })
  });
  return response.json();
}
```

---

## Webhook Integration

For real-time notifications on student operations:

```javascript
// Listen for student events (Future Enhancement)
socket.on('student:imported', (data) => {
  console.log(`${data.count} students imported`);
});

socket.on('student:updated', (data) => {
  console.log(`Student ${data.studentName} updated`);
});

socket.on('student:deleted', (data) => {
  console.log(`Student ${data.studentName} deleted`);
});
```

---

*API Documentation v1.0 - February 2026*

# Super Admin UI - Backend Integration Setup Guide

## Quick Start

### Prerequisites
- Node.js v14+ installed
- MongoDB running locally (default: `mongodb://127.0.0.1:27017`)
- Git (optional)

### Step 1: Install Dependencies

**Backend Setup:**
```bash
cd backend
npm install
```

**Frontend Setup:**
```bash
cd vidyalankar
npm install
```

---

### Step 2: Configure Environment

**Backend - Create `.env` file in `/backend`:**
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/vidyalankarDB
JWT_SECRET=your-secret-key-here
CLIENT_URL=http://localhost:5173
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=superadmin123
```

**Frontend - Already configured in `vite.config.js`:**
- API Base URL: `http://localhost:5000/api`
- Development Server: `http://localhost:5174` (or next available port)

---

### Step 3: Start the Services

**Terminal 1 - Start Backend:**
```bash
cd backend
npm start
```

Expected output:
```
Server is running on port 5000
MongoDB Connected Successfully
```

**Terminal 2 - Start Frontend:**
```bash
cd vidyalankar
npm run dev
```

Expected output:
```
VITE ready in XXXms
Local: http://localhost:5174/
```

---

### Step 4: Access the Application

1. Open browser: `http://localhost:5174`
2. Navigate to login page
3. Default Super Admin credentials:
   - **Username:** `superadmin`
   - **Password:** `superadmin123`
   - **College/Institution:** Select any from dropdown

---

## Super Admin Features

### Dashboard
- **View Statistics:** Total institutions, admins, system status
- **Quick Actions:** Create institution, manage admins
- **Recent Activity:** Latest institutions and administrators

### Create Institution
1. Click "Create Institution" button
2. Fill in institution details:
   - Institution name
   - Institution code
   - Address, phone, email
   - Admin name and email
3. Select theme color preset (12 options available)
4. Submit form
5. Auto-generated credentials will be displayed with copy buttons

### View Institutions
- Search institutions by name or code
- Card-based grid layout
- Actions available per institution:
  - View details
  - Edit institution
  - Delete institution

### Manage Administrators
- View all system administrators
- Search admins by username, email
- Create new admin:
  - Auto-generate credentials or enter custom
  - System validates password strength
- Edit admin details:
  - Update username and email
- Change admin password
- Delete admin (cannot delete last admin)

---

## Available API Endpoints

### Authentication
```
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/verify
```

### Super Admin - Institutions
```
GET /api/superadmin/institutions
POST /api/superadmin/create-institution
PUT /api/superadmin/institution/:id
DELETE /api/superadmin/institution/:id
GET /api/superadmin/institution/:id
```

### Super Admin - Administrators (NEW)
```
GET /api/superadmin/admins
POST /api/superadmin/admins
PUT /api/superadmin/admins/:id
PUT /api/superadmin/admins/:id/password
DELETE /api/superadmin/admins/:id
```

---

## Credential System

### Auto-Generated Credentials
- **Username Format:** firstname.surname (e.g., `john.doe`)
- **Password Format:** Xxxx9999 (uppercase, lowercase, numbers, min 8 chars)

### Theme Presets (12 Available)
1. Ocean Blue
2. Forest Green
3. Sunset Orange
4. Royal Purple
5. Crimson Red
6. Teal Aqua
7. Midnight Indigo
8. Amber Gold
9. Slate Gray
10. Rose Pink
11. Emerald Jade
12. Sky Cyan

---

## Troubleshooting

### Backend Issues

**MongoDB Connection Error**
```
MongoDB Connection Error: Error: connect ECONNREFUSED 127.0.0.1:27017
```
→ Ensure MongoDB is running: `mongod --dbpath {path}`

**Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::5000
```
→ Change PORT in `.env` file or kill process: `netstat -ano | findstr :5000`

**Duplicate Schema Index Warning**
```
[MONGOOSE] Warning: Duplicate schema index...
```
→ This is a warning only; application will work fine

### Frontend Issues

**Port Already in Use**
```
Port 5173 is in use, trying another one...
```
→ Vite automatically switches to next available port (5174, 5175, etc.)

**API Connection Error**
```
Failed to fetch from /api/...
```
→ Verify backend is running on port 5000
→ Check CORS settings in backend/server.js

**Blank Page or Missing Components**
→ Clear browser cache (Ctrl+Shift+Delete)
→ Hard refresh (Ctrl+F5)
→ Check browser console (F12) for errors

---

## Development Tools

### VS Code Extensions (Recommended)
- ESLint
- Prettier
- MongoDB for VS Code
- REST Client

### Testing API with cURL or Postman

**Example: Create Admin**
```bash
curl -X POST http://localhost:5000/api/superadmin/admins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {your_token}" \
  -d '{
    "username": "john.admin",
    "email": "john@admin.com",
    "password": "SecurePass123"
  }'
```

---

## Database Seeding (Optional)

If you need sample data:

```bash
cd backend
node seed.js
```

This will create:
- Sample institutions
- Sample users
- Sample CIANNs
- Sample attendance records

---

## Building for Production

### Frontend Build
```bash
cd vidyalankar
npm run build
```

Output: `dist/` folder with optimized production build

### Backend Deployment
- Ensure `.env` variables are set in production environment
- Use process manager: PM2
  ```bash
  npm install -g pm2
  pm2 start server.js
  pm2 save
  pm2 startup
  ```

---

## File Structure Reference

```
project/
├── backend/
│   ├── models/
│   │   ├── Institution.js
│   │   ├── user.js
│   │   └── ...
│   ├── routes/
│   │   ├── superadmin.js          (Admin endpoints)
│   │   ├── auth.js
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.js
│   │   └── ...
│   ├── server.js                  (Main server file)
│   ├── package.json
│   └── .env
│
├── vidyalankar/
│   ├── src/
│   │   ├── layouts/
│   │   │   ├── SuperAdminLayout.jsx
│   │   │   └── SuperAdminLayout.css
│   │   ├── superadmin/
│   │   │   ├── SuperAdminDashboard.jsx
│   │   │   ├── CreateInstitution.jsx
│   │   │   ├── ViewInstitutions.jsx
│   │   │   ├── AdminManagement.jsx
│   │   │   └── *.css
│   │   ├── utils/
│   │   │   ├── axiosConfig.js
│   │   │   ├── credentialGenerator.js
│   │   │   ├── themePresets.js
│   │   │   ├── alertUtils.jsx
│   │   │   └── ...
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## Performance Optimization

### Frontend
- Lazy loading for routes
- Code splitting with Vite
- CSS minification in production
- Image optimization

### Backend
- Database indexing on frequently queried fields
- Pagination for large datasets (if needed)
- Response caching for public endpoints
- Connection pooling for MongoDB

---

## Security Checklist

- ✅ JWT token-based authentication
- ✅ Password hashing with bcryptjs
- ✅ Role-based authorization
- ✅ CORS properly configured
- ✅ Environment variables for sensitive data
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (using MongoDB)
- ✅ HTTPS ready (configure in production)

---

## Next Steps

1. **Verify Installation**
   - Both servers running without errors
   - Can login with default credentials
   - Dashboard displays without issues

2. **Test Features**
   - Create a test institution
   - Create a test admin
   - Edit and delete operations

3. **Customize**
   - Add your institution logo
   - Configure theme colors
   - Add custom branding

4. **Deploy**
   - Configure production environment
   - Set up SSL/HTTPS
   - Use process manager (PM2)
   - Set up database backups

---

## Support

For issues or questions:
1. Check error messages in browser console (F12)
2. Check backend logs in terminal
3. Review this guide's troubleshooting section
4. Check MongoDB connection status

---

## License

This project is part of the Vidyalankar CMS system.

---

**Last Updated:** January 2025
**Version:** 2.0.0

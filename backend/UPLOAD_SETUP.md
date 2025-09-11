# Admin File Upload Setup Guide

This guide explains how to set up and test the complete admin file upload functionality for Sukun Slide.

## 🎯 What's Implemented

### ✅ Complete Features
- **File Storage System**: Supports both local storage and Supabase Storage
- **Admin Upload Endpoint**: `/api/admin/documents/upload` with admin authentication
- **File Validation**: Size limits, format checking, security validation
- **Database Integration**: Full CRUD operations with proper relationships
- **Activity Logging**: All admin actions are logged
- **Error Handling**: Comprehensive error handling with cleanup

### 🔧 File Upload Flow
1. **Frontend**: Admin drag-drops file or selects via file picker
2. **Validation**: Client-side validation (size, format)
3. **Upload**: File sent to `/api/admin/documents/upload` with metadata
4. **Backend Processing**:
   - Admin authentication check
   - Server-side file validation
   - File storage (Supabase or local)
   - Database record creation
   - Activity logging
5. **Response**: Success/error feedback to frontend

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Database Setup
Run the SQL schema to create tables and functions:
```sql
-- Apply the supabase-schema.sql to your Supabase project
-- This includes the increment_download_count function
```

### 3. Environment Configuration
Create `.env` file in backend directory:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SECRET_KEY=your_jwt_secret_key
```

### 4. Storage Configuration
The system supports two storage methods:

#### Option A: Supabase Storage (Recommended)
- Automatically creates "documents" bucket
- Handles file URLs and access control
- Configured in `app/core/storage.py`

#### Option B: Local Storage
- Files stored in `backend/uploads/` directory
- Good for development/testing
- Change `use_supabase=False` in storage.py

### 5. Admin User Setup
Create an admin user in your database:
```sql
INSERT INTO users (id, email, password_hash, first_name, last_name, role, status)
VALUES (
    uuid_generate_v4(),
    'admin@sukunslide.uz',
    '$2b$12$hashed_password_here',  -- Use bcrypt to hash 'admin123'
    'Admin',
    'User',
    'admin',
    'active'
);
```

## 🧪 Testing

### Automated Test
Run the integration test:
```bash
cd backend
python test_upload.py
```

This test will:
- Create a test PDF file
- Login as admin
- Upload the file
- Verify it appears in the document list
- Clean up test files

### Manual Testing
1. Start the backend server:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. Open admin panel: `http://localhost:8000/admin.html`

3. Login with admin credentials

4. Navigate to "Yuklash" (Upload) section

5. Test file upload with different file types

## 📁 File Structure

```
backend/
├── app/
│   ├── core/
│   │   └── storage.py          # File storage system
│   ├── api/
│   │   ├── admin.py           # Admin upload endpoint
│   │   ├── documents.py       # Document CRUD operations
│   │   └── auth.py            # Authentication
│   └── main.py                # FastAPI app
├── uploads/                   # Local file storage (if used)
├── test_upload.py            # Integration test
└── requirements.txt          # Dependencies
```

## 🔍 API Endpoints

### Admin Upload
```http
POST /api/admin/documents/upload
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

FormData:
- file: (binary file)
- title: "Document Title"
- subject: "mathematics"
- description: "Optional description"
- author: "Author Name"
- tags: "tag1, tag2, tag3"
```

### Response
```json
{
    "message": "Document uploaded successfully",
    "document_id": "uuid-here",
    "file_path": "storage/path/or/url",
    "status": "approved",
    "title": "Document Title",
    "subject": "mathematics",
    "format": "pdf",
    "file_size": 1048576
}
```

## 🛡️ Security Features

### File Validation
- **Size Limit**: 50MB maximum
- **Allowed Formats**: PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX
- **MIME Type Checking**: Validates actual file type
- **Filename Sanitization**: Prevents path traversal attacks

### Authentication
- **Admin Required**: Only users with role='admin' can upload
- **JWT Tokens**: Secure authentication
- **Activity Logging**: All actions tracked

### Database Security
- **Row Level Security**: Enabled on all tables
- **UUID Primary Keys**: Prevents enumeration attacks
- **Prepared Statements**: SQL injection protection

## 🐛 Troubleshooting

### Common Issues

1. **"Admin access required"**
   - Check user role in database
   - Verify JWT token is valid
   - Ensure admin user exists

2. **"File upload failed"**
   - Check file size (max 50MB)
   - Verify file format is allowed
   - Check storage permissions

3. **"Subject not found"**
   - Ensure subjects table has required entries
   - Check subject ID matches frontend dropdown

4. **Storage errors**
   - For Supabase: Check bucket permissions
   - For local: Ensure uploads/ directory exists and is writable

### Debug Mode
Enable debug logging in FastAPI:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 🚀 Deployment Notes

### Production Checklist
- [ ] Set secure JWT secret key
- [ ] Configure Supabase Storage bucket
- [ ] Set up file size limits
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up file cleanup jobs
- [ ] Monitor storage usage

### Environment Variables
```env
ENVIRONMENT=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key
SECRET_KEY=very_secure_secret_key_here
MAX_FILE_SIZE=52428800
ALLOWED_ORIGINS=https://your-domain.com
```

## 📞 Support

If you encounter issues:
1. Check the test script output
2. Review FastAPI logs
3. Verify database schema is correctly applied
4. Test with small files first
5. Check Supabase dashboard for storage issues

The upload system is now fully functional and ready for production use! 🎉

# 🚀 Sukun Slide Backend Implementation Guide

## Quick Start (Step by Step)

### 1. **Supabase Setup** (15 minutes)

```bash
# 1. Go to https://supabase.com
# 2. Create new project
# 3. Copy Project URL and API Keys
# 4. Go to SQL Editor and run supabase-schema.sql
# 5. Enable Storage bucket for files
```

**Environment Variables Needed:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
ENVIRONMENT=development
```

### 2. **Backend Development** (1-2 days)

```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Test API at http://localhost:8000/api/docs
```

### 3. **Frontend Integration** (1 day)

Update your existing JavaScript files to use the API:

```javascript
// Replace localStorage calls with API calls
const API_BASE = 'http://localhost:8000/api'; // Development
// const API_BASE = 'https://your-backend.onrender.com/api'; // Production

// Example: Login function
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;
        } else {
            throw new Error(data.detail);
        }
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}
```

### 4. **Deployment** (30 minutes)

#### **Backend Deployment (Render):**
```bash
# 1. Push code to GitHub
# 2. Connect GitHub repo to Render
# 3. Create Web Service
# 4. Set environment variables
# 5. Deploy
```

#### **Frontend Deployment (Vercel):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Update vercel.json with your backend URL
```

## 🎯 **Priority Implementation Order**

### **Week 1: Core Authentication**
1. ✅ Supabase setup
2. ✅ Basic FastAPI structure
3. ✅ User registration/login
4. Frontend auth integration

### **Week 2: Document Management**
1. Document upload API
2. Document listing/search
3. File storage with Supabase Storage
4. Frontend document integration

### **Week 3: Admin Features**
1. Admin dashboard API
2. User management
3. Document approval system
4. Analytics endpoints

### **Week 4: Production & Polish**
1. Full deployment
2. Error handling
3. Performance optimization
4. Testing & bug fixes

## 💰 **Cost Breakdown (Free Tiers)**

| Service | Free Tier Limits | Cost After Limit |
|---------|------------------|------------------|
| **Supabase** | 500MB DB, 1GB Storage, 50k MAU | $25/month |
| **Render** | 750 hours/month, 512MB RAM | $7/month |
| **Vercel** | 100GB bandwidth, unlimited sites | $20/month |

**Total Free Usage**: Supports ~1000 active users with moderate usage

## 🔧 **API Integration Examples**

### **Replace localStorage with API calls:**

```javascript
// OLD: localStorage.getItem('documents')
// NEW: 
async function getDocuments() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE}/documents`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.json();
}

// OLD: localStorage.setItem('user', userData)
// NEW: API handles user data automatically with JWT
```

### **File Upload Example:**
```javascript
async function uploadDocument(file, metadata) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title);
    formData.append('subject_id', metadata.subject);
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE}/documents`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    
    return response.json();
}
```

## 🚨 **Common Issues & Solutions**

### **CORS Issues**
```javascript
// Add to backend main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-domain.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### **File Upload Size Limits**
```python
# Increase in FastAPI
app.add_middleware(
    Middleware,
    LimitUploadSizeMiddleware,
    max_upload_size=50_000_000  # 50MB
)
```

### **Database Connection Issues**
- Ensure Supabase URL and keys are correct
- Check firewall/network restrictions
- Verify RLS policies are set correctly

## 📊 **Monitoring & Analytics**

### **Built-in Supabase Analytics:**
- User registrations
- Database performance
- API usage
- Storage usage

### **Additional Monitoring:**
- Render logs for backend errors
- Vercel analytics for frontend performance
- Custom logging in FastAPI

## 🔄 **Migration Strategy from Current Setup**

1. **Phase 1**: Keep localStorage, add API alongside
2. **Phase 2**: Migrate authentication to API
3. **Phase 3**: Migrate document management
4. **Phase 4**: Migrate admin features
5. **Phase 5**: Remove localStorage completely

This approach ensures zero downtime and gradual migration.

## 📞 **Support & Resources**

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Supabase Docs**: https://supabase.com/docs
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs

---

**Ready to start? Begin with Supabase setup and let me know if you need help with any step!**

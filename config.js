// API Configuration
const CONFIG = {
    // API Base URL - will work for both local development and production
    API_BASE: window.location.hostname === 'localhost' 
        ? 'http://localhost:8000/api'  // Local development
        : '/api',  // Production (proxied through Render)
    
    // Authentication endpoints
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register', 
        LOGOUT: '/auth/logout',
        ME: '/auth/me'
    },
    
    // Document endpoints
    DOCUMENTS: {
        LIST: '/documents',
        UPLOAD: '/documents',
        DOWNLOAD: '/documents/{id}/download'
    },
    
    // User endpoints
    USERS: {
        PROFILE: '/users/me',
        DOWNLOADS: '/users/downloads',
        FAVORITES: '/users/favorites'
    },
    
    // Admin endpoints
    ADMIN: {
        USERS: '/admin/users',
        DOCUMENTS: '/admin/documents/pending',
        UPLOAD: '/admin/documents/upload',
        ANALYTICS: '/admin/analytics/overview'
    }
};

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
    const url = CONFIG.API_BASE + endpoint;
    const token = localStorage.getItem('access_token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, finalOptions);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || `HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Helper function for file uploads
async function apiUpload(endpoint, formData) {
    const url = CONFIG.API_BASE + endpoint;
    const token = localStorage.getItem('access_token');
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || `HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API upload failed:', error);
        throw error;
    }
}

// Admin Panel JavaScript

// Admin documents data
let adminDocuments = [];

// Get users from auth system
let adminUsers = [];

// Charts instances
let downloadsChart = null;
let usersChart = null;
let subjectsChart = null;

// System monitoring data
let systemMonitoringInterval = null;

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    initializeDefaultData();
    initializeAdminPanel();
    setupEventListeners();
    loadDashboardData();
    initializeCharts();
    startSystemMonitoring();
    setupSettingsTabs();
});

// Initialize default data if needed
function initializeDefaultData() {
    // Initialize subjects if none exist
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    if (subjects.length === 0) {
        const defaultSubjects = [
            { id: 'mathematics', name: 'Matematika', description: 'Matematik fanlar', color: '#3b82f6' },
            { id: 'physics', name: 'Fizika', description: 'Fizika fani', color: '#8b5cf6' },
            { id: 'chemistry', name: 'Kimyo', description: 'Kimyo fani', color: '#10b981' },
            { id: 'biology', name: 'Biologiya', description: 'Biologiya fani', color: '#f59e0b' },
            { id: 'history', name: 'Tarix', description: 'Tarix fani', color: '#ef4444' },
            { id: 'geography', name: 'Geografiya', description: 'Geografiya fani', color: '#06b6d4' },
            { id: 'literature', name: 'Adabiyot', description: 'Adabiyot fani', color: '#ec4899' },
            { id: 'english', name: 'Ingliz tili', description: 'Ingliz tili', color: '#84cc16' }
        ];
        localStorage.setItem('subjects', JSON.stringify(defaultSubjects));
    }
    
    // Initialize system settings
    loadSystemSettings();
}

// Check admin authentication
function checkAdminAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || 'null');
    
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
}

// Initialize admin panel
function initializeAdminPanel() {
    // Set active menu item
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
            
            // Log navigation activity
            logActivity('navigation', `Navigated to ${section} section`, 'info');
            
            // Update active state
            menuItems.forEach(mi => mi.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Load initial data
    loadDocuments();
    loadUsers();
    loadSubjects();
    
    // Log admin login
    logActivity('auth', 'Admin logged in', 'success');
}

// Activity logging function
function logActivity(type, message, level = 'info', details = null) {
    const activities = JSON.parse(localStorage.getItem('adminActivities') || '[]');
    
    const activity = {
        id: Date.now(),
        type: type, // 'auth', 'document', 'user', 'navigation', 'system'
        message: message,
        level: level, // 'info', 'success', 'warning', 'error'
        details: details,
        timestamp: new Date().toISOString(),
        user: 'Administrator'
    };
    
    // Add to beginning of array (most recent first)
    activities.unshift(activity);
    
    // Keep only last 100 activities
    if (activities.length > 100) {
        activities.splice(100);
    }
    
    // Save to localStorage
    localStorage.setItem('adminActivities', JSON.stringify(activities));
    
    // If we're on the dashboard, refresh the activity list
    if (document.querySelector('#dashboard.active')) {
        loadRecentActivity();
    }
}

// Setup event listeners
function setupEventListeners() {
    // File upload
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadForm = document.getElementById('uploadForm');
    
    if (uploadArea) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
        uploadArea.addEventListener('click', () => fileInput.click());
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }
    
    // Tags input
    const tagsInput = document.getElementById('documentTags');
    if (tagsInput) {
        tagsInput.addEventListener('keydown', handleTagInput);
        tagsInput.addEventListener('blur', handleTagInput);
        
        // Initialize tags from localStorage if available
        const savedTags = localStorage.getItem('recentTags');
        if (savedTags) {
            try {
                const tags = JSON.parse(savedTags);
                tags.forEach(tag => addTag(tag));
            } catch (error) {
                console.error('Error loading saved tags:', error);
            }
        }
    }
    
    // Search functionality
    const searchInputs = document.querySelectorAll('.search-box input');
    searchInputs.forEach(input => {
        input.addEventListener('input', handleSearch);
    });
    
    // Filter functionality
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', handleFilter);
    });
    
    // Select all checkbox
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', handleSelectAll);
    }
}

// Handle tag input
function handleTagInput(e) {
    // Add tag on comma, Enter, or blur
    if (e.type === 'blur' || e.key === ',' || e.key === 'Enter') {
        e.preventDefault();
        
        const input = e.target;
        const value = input.value.trim().replace(/,/g, '');
        
        if (value) {
            addTag(value);
            input.value = '';
            
            // Save to localStorage
            saveRecentTags();
        }
    }
}

// Add tag to the list
function addTag(text) {
    const tagsList = document.getElementById('tagsList');
    if (!tagsList) return;
    
    // Check if tag already exists
    const existingTags = tagsList.querySelectorAll('.tag-item');
    for (const tag of existingTags) {
        if (tag.querySelector('span').textContent === text) {
            return;
        }
    }
    
    const tag = document.createElement('div');
    tag.className = 'tag-item';
    tag.innerHTML = `
        <span>${text}</span>
        <button type="button" onclick="removeTag(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    tagsList.appendChild(tag);
}

// Remove tag from the list
function removeTag(button) {
    const tag = button.parentElement;
    tag.remove();
    saveRecentTags();
}

// Save tags to localStorage
function saveRecentTags() {
    const tagsList = document.getElementById('tagsList');
    if (!tagsList) return;
    
    const tags = Array.from(tagsList.querySelectorAll('.tag-item span'))
        .map(span => span.textContent);
    
    localStorage.setItem('recentTags', JSON.stringify(tags));
}

// Get current tags
function getCurrentTags() {
    const tagsList = document.getElementById('tagsList');
    if (!tagsList) return [];
    
    return Array.from(tagsList.querySelectorAll('.tag-item span'))
        .map(span => span.textContent);
}

// Show section
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Load section-specific data
    switch(sectionName) {
        case 'documents':
            loadDocuments();
            break;
        case 'users':
            loadUsers();
            break;
        case 'subjects':
            loadSubjects();
            break;
        case 'analytics':
            loadAnalytics();
            break;
    }
}

// Load dashboard data
function loadDashboardData() {
    // Sync users from auth system
    syncUsersFromAuth();
    
    // Update stats
    updateStats();
    
    // Load recent activity
    loadRecentActivity();
    
    // Load top documents
    loadTopDocuments();
}

// Sync users from auth system
function syncUsersFromAuth() {
    // Try to get users from auth.js
    if (typeof users !== 'undefined') {
        adminUsers = [...users];
    } else {
        // Fallback: try to get from localStorage
        const savedUsers = localStorage.getItem('users');
        if (savedUsers) {
            adminUsers = JSON.parse(savedUsers);
        }
    }
}

// Update statistics
function updateStats() {
    // Get data from localStorage
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    
    // Calculate current stats
    const totalDocuments = documents.length;
    const totalUsers = users.length;
    const totalDownloads = documents.reduce((sum, doc) => sum + (doc.downloadCount || 0), 0);
    const totalSubjects = subjects.length;
    
    // Get previous stats for comparison
    const previousStats = JSON.parse(localStorage.getItem('previousStats') || '{}');
    
    // Calculate percentage changes
    const documentsChange = calculatePercentageChange(totalDocuments, previousStats.documents || 0);
    const usersChange = calculatePercentageChange(totalUsers, previousStats.users || 0);
    const downloadsChange = calculatePercentageChange(totalDownloads, previousStats.downloads || 0);
    const subjectsChange = calculatePercentageChange(totalSubjects, previousStats.subjects || 0);
    
    // Update UI elements
    document.getElementById('totalDocuments').textContent = totalDocuments.toLocaleString();
    document.getElementById('totalUsers').textContent = totalUsers.toLocaleString();
    document.getElementById('totalDownloads').textContent = totalDownloads.toLocaleString();
    document.getElementById('totalSubjects').textContent = totalSubjects.toLocaleString();
    
    // Update change indicators
    updateChangeIndicator('documentsChange', documentsChange);
    updateChangeIndicator('usersChange', usersChange);
    updateChangeIndicator('downloadsChange', downloadsChange);
    updateChangeIndicator('subjectsChange', subjectsChange);
    
    // Store current stats as previous for next comparison
    const currentStats = {
        documents: totalDocuments,
        users: totalUsers,
        downloads: totalDownloads,
        subjects: totalSubjects,
        timestamp: Date.now()
    };
    localStorage.setItem('previousStats', JSON.stringify(currentStats));
    
    console.log('Stats updated:', currentStats);
}

function calculatePercentageChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
}

function updateChangeIndicator(elementId, change) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.textContent = `${change > 0 ? '+' : ''}${change}%`;
    element.className = 'stat-change';
    
    if (change > 0) {
        element.classList.add('positive');
    } else if (change < 0) {
        element.classList.add('negative');
    } else {
        element.classList.add('neutral');
    }
}

// Load recent activity
function loadRecentActivity() {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;
    
    // Load activities from localStorage (will be populated by actual user actions)
    const savedActivities = localStorage.getItem('adminActivities');
    let activities = [];
    
    if (savedActivities) {
        try {
            activities = JSON.parse(savedActivities);
        } catch (error) {
            console.error('Error loading activities:', error);
            activities = [];
        }
    }
    
    if (activities.length === 0) {
        activityList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #6b7280;">
                <i class="fas fa-clock" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                <p>Hali faoliyat yo'q</p>
                <p style="font-size: 0.9rem;">Foydalanuvchi harakatlari bu yerda ko'rinadi</p>
            </div>
        `;
        return;
    }
    
    // Show recent activities (last 5)
    const recentActivities = activities.slice(0, 5);
    
    activityList.innerHTML = recentActivities.map(activity => {
        const timeAgo = getTimeAgo(activity.timestamp);
        const icon = getActivityIcon(activity.type, activity.level);
        
        return `
            <div class="activity-item">
                <div class="activity-icon ${activity.level}">
                    <i class="${icon}"></i>
                </div>
                <div class="activity-content">
                    <p><strong>${activity.message}</strong></p>
                    <span>${activity.user} • ${timeAgo}</span>
                </div>
                <div class="activity-time">${new Date(activity.timestamp).toLocaleTimeString('uz-UZ', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })}</div>
            </div>
        `;
    }).join('');

function getActivityIcon(type, level) {
    const icons = {
        auth: 'fas fa-sign-in-alt',
        document: level === 'warning' ? 'fas fa-trash' : (level === 'success' ? 'fas fa-edit' : 'fas fa-file'),
        user: level === 'warning' ? 'fas fa-user-times' : 'fas fa-user',
        navigation: 'fas fa-mouse-pointer',
        system: 'fas fa-cog',
        upload: 'fas fa-upload'
    };
    return icons[type] || 'fas fa-info-circle';
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} soniya oldin`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} daqiqa oldin`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} soat oldin`;
    return `${Math.floor(diffInSeconds / 86400)} kun oldin`;
}
}

// Load top documents
function loadTopDocuments() {
    const topDocuments = document.querySelector('.top-documents');
    if (!topDocuments) return;
    
    const sortedDocs = [...adminDocuments].sort((a, b) => b.downloads - a.downloads).slice(0, 3);
    
    topDocuments.innerHTML = sortedDocs.map(doc => `
        <div class="document-item">
            <div class="document-info">
                <h4>${doc.title}</h4>
                <p>${getSubjectName(doc.subject)} • ${doc.format.toUpperCase()}</p>
            </div>
            <div class="document-stats">
                <span class="download-count">${doc.downloads}</span>
            </div>
        </div>
    `).join('');
}

// Load documents
function loadDocuments() {
    const tableBody = document.getElementById('documentsTableBody');
    if (!tableBody) return;
    
    if (adminDocuments.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: #6b7280;">
                    <i class="fas fa-file-alt" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    <p>Hali hujjat yuklanmagan</p>
                    <p style="font-size: 0.9rem;">Birinchi hujjatingizni yuklash uchun "Yangi hujjat" tugmasini bosing</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = adminDocuments.map(doc => `
        <tr>
            <td>
                <input type="checkbox" class="document-checkbox" value="${doc.id}">
            </td>
            <td>
                <div class="document-title">
                    <strong>${doc.title}</strong>
                    <small>${doc.author}</small>
                </div>
            </td>
            <td>${getSubjectName(doc.subject)}</td>
            <td>
                <span class="format-badge format-${doc.format}">${doc.format.toUpperCase()}</span>
            </td>
            <td>${doc.size}</td>
            <td>${doc.downloads}</td>
            <td>${formatDate(doc.uploadDate)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editDocument(${doc.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDocument(${doc.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Load users
function loadUsers() {
    const usersGrid = document.getElementById('usersGrid');
    if (!usersGrid) return;
    
    if (adminUsers.length === 0) {
        usersGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #6b7280;">
                <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                <h3>Hali foydalanuvchilar yo'q</h3>
                <p>Foydalanuvchilar ro'yxatdan o'tganda bu yerda ko'rinadi</p>
            </div>
        `;
        return;
    }
    
    usersGrid.innerHTML = adminUsers.map(user => `
        <div class="user-card">
            <div class="user-header">
                <img src="https://via.placeholder.com/60" alt="${user.firstName}" class="user-avatar-large">
                <div class="user-details">
                    <h4>${user.firstName} ${user.lastName}</h4>
                    <p>${user.university}</p>
                </div>
            </div>
            <div class="user-stats">
                <div class="user-stat">
                    <h5>${user.downloads}</h5>
                    <p>Yuklab olingan</p>
                </div>
                <div class="user-stat">
                    <h5>${user.uploads}</h5>
                    <p>Yuklangan</p>
                </div>
            </div>
            <div class="user-actions">
                <button class="btn btn-xs btn-primary" onclick="viewUser(${user.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-xs btn-${user.status === 'active' ? 'warning' : 'success'}" onclick="toggleUserStatus(${user.id})">
                    <i class="fas fa-${user.status === 'active' ? 'ban' : 'check'}"></i>
                </button>
                <button class="btn btn-xs btn-danger" onclick="deleteUser(${user.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Load subjects
function loadSubjects() {
    const subjectsGrid = document.getElementById('adminSubjectsGrid');
    if (!subjectsGrid) return;
    
    // Load subjects from localStorage
    const savedSubjects = localStorage.getItem('subjects');
    let subjects = [];
    
    if (savedSubjects) {
        try {
            subjects = JSON.parse(savedSubjects);
            // Add document counts and colors if not present
            subjects = subjects.map(subject => {
                const docCount = adminDocuments.filter(doc => doc.subject === subject.id).length;
                return {
                    ...subject,
                    count: docCount,
                    color: subject.color || getSubjectColor(subject.id)
                };
            });
        } catch (error) {
            console.error('Error loading subjects:', error);
            subjects = [];
        }
    }
    
    if (subjects.length === 0) {
        subjectsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #6b7280;">
                <i class="fas fa-book" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                <h3>Fanlar yo'q</h3>
                <p>Fanlar tizim tomonidan avtomatik yaratiladi</p>
            </div>
        `;
        return;
    }
    
    subjectsGrid.innerHTML = subjects.map(subject => `
        <div class="subject-card-admin">
            <div class="subject-actions">
                <button class="btn btn-xs btn-primary" onclick="editSubject('${subject.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-xs btn-danger" onclick="deleteSubject('${subject.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="subject-header">
                <div class="subject-icon-admin" style="background: ${subject.color}">
                    <i class="${subject.icon}"></i>
                </div>
                <div class="subject-info">
                    <h4>${subject.name}</h4>
                    <p>${subject.count} ta hujjat</p>
                </div>
            </div>
            <div class="subject-stats">
                <span>${subject.count} hujjat</span>
                <span>${Math.floor(subject.count * 3.5)} yuklab olingan</span>
            </div>
        </div>
    `).join('');
}

// Load analytics
function loadAnalytics() {
    // In real app, load analytics data from API
    console.log('Loading analytics data...');
}

// File upload handlers
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    const uploadArea = document.getElementById('uploadArea');
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = {
        'application/pdf': 'pdf',
        'application/vnd.ms-powerpoint': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
    };
    
    if (files.length === 0) {
        showNotification('Iltimos, fayl tanlang', 'warning');
        return;
    }
    
    const file = files[0]; // Single file upload
    
    // Validate file size
    if (file.size > maxFileSize) {
        showNotification(`Fayl hajmi 50MB dan oshmasligi kerak. Joriy hajm: ${formatFileSize(file.size)}`, 'error');
        return;
    }
    
    // Validate file type
    const fileType = file.type;
    if (!allowedTypes[fileType]) {
        showNotification('Faqat PDF, PowerPoint, Word va Excel fayllari qo\'llab-quvvatlanadi', 'error');
        return;
    }
    
    // Update upload area UI
    uploadArea.innerHTML = `
        <div class="upload-content">
            <i class="fas fa-check-circle" style="color: #10b981;"></i>
            <div class="file-info">
                <h3>${file.name}</h3>
                <p>${formatFileSize(file.size)} • ${allowedTypes[fileType].toUpperCase()}</p>
            </div>
            <div class="upload-progress" style="display: none;">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <p class="progress-text">0%</p>
            </div>
        </div>
    `;
    
    // Populate form with file info
    const titleInput = document.getElementById('documentTitle');
    if (titleInput && !titleInput.value) {
        titleInput.value = file.name.replace(/\.[^/.]+$/, "");
    }
    
    // Auto-select subject based on file name or content (if possible)
    const subjectSelect = document.getElementById('documentSubject');
    if (subjectSelect) {
        const subjectMatches = {
            'math': 'mathematics',
            'algebra': 'mathematics',
            'geometr': 'mathematics',
            'fizik': 'physics',
            'phys': 'physics',
            'kimyo': 'chemistry',
            'chem': 'chemistry',
            'bio': 'biology',
            'tarix': 'history',
            'hist': 'history',
            'geog': 'geography',
            'adabiyot': 'literature',
            'english': 'english'
        };
        
        const fileName = file.name.toLowerCase();
        for (const [key, value] of Object.entries(subjectMatches)) {
            if (fileName.includes(key)) {
                subjectSelect.value = value;
                break;
            }
        }
    }
    
    // Store file for upload
    window.fileToUpload = file;
}

async function handleUpload(e) {
    e.preventDefault();
    
    // Get form values
    const title = document.getElementById('documentTitle').value;
    const subject = document.getElementById('documentSubject').value;
    const author = document.getElementById('documentAuthor').value;
    const description = document.getElementById('documentDescription').value;
    const tags = document.getElementById('documentTags').value;
    
    // Validate required fields
    if (!title) {
        showNotification('Hujjat nomini kiriting', 'error');
        return;
    }
    
    if (!subject) {
        showNotification('Fanni tanlang', 'error');
        return;
    }
    
    if (!window.fileToUpload) {
        showNotification('Iltimos, fayl tanlang', 'error');
        return;
    }
    
    // Get file and type info
    const file = window.fileToUpload;
    const fileType = file.type;
    const allowedTypes = {
        'application/pdf': 'pdf',
        'application/vnd.ms-powerpoint': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
    };
    
    if (!allowedTypes[fileType]) {
        showNotification('Noto\'g\'ri fayl formati', 'error');
        return;
    }
    
    // Show upload progress UI
    const uploadArea = document.getElementById('uploadArea');
    const progressContainer = uploadArea.querySelector('.upload-progress');
    const progressBar = progressContainer.querySelector('.progress-fill');
    const progressText = progressContainer.querySelector('.progress-text');
    progressContainer.style.display = 'block';
    
    // Disable submit button
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yuklanmoqda...';
    submitBtn.disabled = true;
    
    try {
        // Create unique filename
        const timestamp = new Date().getTime();
        const fileExtension = allowedTypes[fileType];
        const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const filename = `${sanitizedTitle}-${timestamp}.${fileExtension}`;
        
        // Create upload directory if it doesn't exist
        const uploadDir = 'uploads/documents';
        try {
            await fs.mkdir(uploadDir, { recursive: true });
        } catch (err) {
            console.warn('Upload directory already exists or could not be created:', err);
        }
        
        // Create FormData
        const formData = new FormData();
        formData.append('file', file, filename);
        formData.append('title', title);
        formData.append('subject', subject);
        formData.append('author', author);
        formData.append('description', description);
        formData.append('tags', tags);
        
        // Upload file with progress tracking
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                progressBar.style.width = percentComplete + '%';
                progressText.textContent = Math.round(percentComplete) + '%';
            }
        };
        
        xhr.onload = () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                
                if (response.success) {
                    // Add new document to admin documents
                    const newDoc = {
                        id: adminDocuments.length + 1,
                        title: title,
                        subject: subject,
                        format: fileExtension,
                        size: formatFileSize(file.size),
                        downloads: 0,
                        uploadDate: new Date().toISOString().split('T')[0],
                        author: author || 'Admin',
                        description: description || '',
                        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
                        status: 'active',
                        filePath: `${uploadDir}/${filename}`,
                        mimeType: fileType
                    };
                    
                    adminDocuments.unshift(newDoc);
                    
                    // Log activity
                    logActivity('fas fa-upload', 'Admin yangi hujjat yukladi', `${newDoc.title} - ${newDoc.format.toUpperCase()}`);
                    
                    // Add notification for document upload
                    addNotification('document', 'Yangi hujjat yuklandi', `${newDoc.title} - ${getSubjectName(newDoc.subject)}`);
                    
                    showNotification('Hujjat muvaffaqiyatli yuklandi!', 'success');
                    clearUploadForm();
                    
                    // Update UI
                    loadDocuments();
                    updateStats();
                    
                    // Update main website documents
                    if (typeof documentsData !== 'undefined') {
                        documentsData.unshift(newDoc);
                    }
                    
                    // Save to localStorage
                    localStorage.setItem('documents', JSON.stringify(adminDocuments));
                    
                } else {
                    throw new Error(response.message || 'Yuklashda xatolik yuz berdi');
                }
            } else {
                throw new Error('Server xatosi: ' + xhr.status);
            }
        };
        
        xhr.onerror = () => {
            throw new Error('Tarmoq xatosi yuz berdi');
        };
        
        // Send the upload request
        xhr.open('POST', '/api/upload', true);
        xhr.send(formData);
        
    } catch (error) {
        console.error('Upload error:', error);
        showNotification('Yuklashda xatolik: ' + error.message, 'error');
        
        // Reset progress UI
        progressContainer.style.display = 'none';
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
    } finally {
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Clear upload form
function clearUploadForm() {
    const form = document.getElementById('uploadForm');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    // Reset form
    form.reset();
    
    // Clear file input
    if (fileInput) {
        fileInput.value = '';
    }
    
    // Reset upload area
    uploadArea.innerHTML = `
        <div class="upload-content">
            <i class="fas fa-cloud-upload-alt"></i>
            <h3>Fayllarni bu yerga sudrab tashlang</h3>
            <p>yoki</p>
            <button type="button" class="btn btn-primary" onclick="document.getElementById('fileInput').click()">
                <i class="fas fa-folder-open"></i>
                Fayl tanlash
            </button>
        </div>
    `;
}

// Search and filter handlers
function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const section = e.target.closest('.admin-section').id;
    
    switch(section) {
        case 'documents':
            filterDocuments(query);
            break;
        case 'users':
            filterUsers(query);
            break;
    }
}

function handleFilter(e) {
    const filter = e.target.value;
    const section = e.target.closest('.admin-section').id;
    
    switch(section) {
        case 'documents':
            filterDocumentsBySubject(filter);
            break;
        case 'users':
            filterUsersByStatus(filter);
            break;
    }
}

function filterDocuments(query) {
    const filtered = adminDocuments.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        doc.author.toLowerCase().includes(query)
    );
    renderFilteredDocuments(filtered);
}

function filterDocumentsBySubject(subject) {
    const filtered = subject ? 
        adminDocuments.filter(doc => doc.subject === subject) : 
        adminDocuments;
    renderFilteredDocuments(filtered);
}

function filterUsers(query) {
    const filtered = adminUsers.filter(user => 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.university.toLowerCase().includes(query)
    );
    renderFilteredUsers(filtered);
}

function filterUsersByStatus(status) {
    const filtered = status ? 
        adminUsers.filter(user => user.status === status) : 
        adminUsers;
    renderFilteredUsers(filtered);
}

function renderFilteredDocuments(documents) {
    const tableBody = document.getElementById('documentsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = documents.map(doc => `
        <tr>
            <td>
                <input type="checkbox" class="document-checkbox" value="${doc.id}">
            </td>
            <td>
                <div class="document-title">
                    <strong>${doc.title}</strong>
                    <small>${doc.author}</small>
                </div>
            </td>
            <td>${getSubjectName(doc.subject)}</td>
            <td>
                <span class="format-badge format-${doc.format}">${doc.format.toUpperCase()}</span>
            </td>
            <td>${doc.size}</td>
            <td>${doc.downloads}</td>
            <td>${formatDate(doc.uploadDate)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editDocument(${doc.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDocument(${doc.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderFilteredUsers(users) {
    const usersGrid = document.getElementById('usersGrid');
    if (!usersGrid) return;
    
    usersGrid.innerHTML = users.map(user => `
        <div class="user-card">
            <div class="user-header">
                <img src="https://via.placeholder.com/60" alt="${user.firstName}" class="user-avatar-large">
                <div class="user-details">
                    <h4>${user.firstName} ${user.lastName}</h4>
                    <p>${user.university}</p>
                </div>
            </div>
            <div class="user-stats">
                <div class="user-stat">
                    <h5>${user.downloads}</h5>
                    <p>Yuklab olingan</p>
                </div>
                <div class="user-stat">
                    <h5>${user.uploads}</h5>
                    <p>Yuklangan</p>
                </div>
            </div>
            <div class="user-actions">
                <button class="btn btn-xs btn-primary" onclick="viewUser(${user.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-xs btn-${user.status === 'active' ? 'warning' : 'success'}" onclick="toggleUserStatus(${user.id})">
                    <i class="fas fa-${user.status === 'active' ? 'ban' : 'check'}"></i>
                </button>
                <button class="btn btn-xs btn-danger" onclick="deleteUser(${user.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Select all functionality
function handleSelectAll(e) {
    const checkboxes = document.querySelectorAll('.document-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
    });
}

// Document actions
function editDocument(id) {
    const doc = adminDocuments.find(d => d.id === id);
    if (doc) {
        showNotification(`"${doc.title}" hujjatini tahrirlash rejimi`, 'info');
        // In real app, open edit modal
    }
}

function deleteDocument(id) {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const doc = documents.find(d => d.id === id);
    
    if (doc && confirm(`"${doc.title}" hujjatini o'chirishni xohlaysizmi?`)) {
        // Remove document from array
        const filteredDocuments = documents.filter(d => d.id !== id);
        
        // Save to localStorage
        localStorage.setItem('documents', JSON.stringify(filteredDocuments));
        
        // Update adminDocuments array
        adminDocuments = filteredDocuments;
        
        // Log activity
        logActivity('document', `Document deleted: ${doc.title}`, 'warning', { documentId: id, documentTitle: doc.title });
        
        loadDocuments();
        updateStats();
        showNotification('Hujjat o\'chirildi', 'success');
    }
}

function editDocument(id) {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const doc = documents.find(d => d.id === id);
    
    if (doc) {
        showEditDocumentModal(doc);
        logActivity('document', `Started editing document: ${doc.title}`, 'info', { documentId: id });
    }
}

function showEditDocumentModal(doc) {
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal document-modal">
            <div class="modal-header">
                <h3><i class="fas fa-edit"></i> Hujjatni tahrirlash</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-content">
                <form id="editDocumentForm">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="editTitle">Sarlavha *</label>
                            <input type="text" id="editTitle" value="${doc.title}" required>
                        </div>
                        <div class="form-group">
                            <label for="editSubject">Fan *</label>
                            <select id="editSubject" required>
                                <option value="">Fanni tanlang</option>
                                ${subjects.map(subject => 
                                    `<option value="${subject.id}" ${subject.id === doc.subject ? 'selected' : ''}>${subject.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="editAuthor">Muallif</label>
                            <input type="text" id="editAuthor" value="${doc.author || ''}">
                        </div>
                        <div class="form-group">
                            <label for="editFormat">Format</label>
                            <select id="editFormat">
                                <option value="pdf" ${doc.format === 'pdf' ? 'selected' : ''}>PDF</option>
                                <option value="ppt" ${doc.format === 'ppt' ? 'selected' : ''}>PowerPoint</option>
                                <option value="doc" ${doc.format === 'doc' ? 'selected' : ''}>Word</option>
                                <option value="xlsx" ${doc.format === 'xlsx' ? 'selected' : ''}>Excel</option>
                            </select>
                        </div>
                        <div class="form-group full-width">
                            <label for="editDescription">Tavsif</label>
                            <textarea id="editDescription" rows="3">${doc.description || ''}</textarea>
                        </div>
                        <div class="form-group full-width">
                            <label for="editTags">Teglar (vergul bilan ajrating)</label>
                            <input type="text" id="editTags" value="${(doc.tags || []).join(', ')}">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="saveDocumentChanges(${doc.id})">
                    <i class="fas fa-save"></i> Saqlash
                </button>
                <button class="btn btn-secondary" onclick="closeModal()">Bekor qilish</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

function saveDocumentChanges(id) {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const docIndex = documents.findIndex(d => d.id === id);
    
    if (docIndex === -1) {
        showNotification('Hujjat topilmadi', 'error');
        return;
    }
    
    // Get form values
    const title = document.getElementById('editTitle').value.trim();
    const subject = document.getElementById('editSubject').value;
    const author = document.getElementById('editAuthor').value.trim();
    const format = document.getElementById('editFormat').value;
    const description = document.getElementById('editDescription').value.trim();
    const tags = document.getElementById('editTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    // Validate required fields
    if (!title) {
        showNotification('Sarlavha majburiy', 'error');
        return;
    }
    
    if (!subject) {
        showNotification('Fan majburiy', 'error');
        return;
    }
    
    // Update document
    const oldDoc = { ...documents[docIndex] };
    documents[docIndex] = {
        ...documents[docIndex],
        title,
        subject,
        author,
        format,
        description,
        tags,
        updatedAt: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem('documents', JSON.stringify(documents));
    
    // Update adminDocuments array
    adminDocuments = documents;
    
    // Log activity
    logActivity('document', `Document updated: ${title}`, 'success', { 
        documentId: id, 
        changes: {
            title: oldDoc.title !== title ? { from: oldDoc.title, to: title } : null,
            subject: oldDoc.subject !== subject ? { from: oldDoc.subject, to: subject } : null,
            author: oldDoc.author !== author ? { from: oldDoc.author, to: author } : null,
            format: oldDoc.format !== format ? { from: oldDoc.format, to: format } : null
        }
    });
    
    loadDocuments();
    updateStats();
    closeModal();
    showNotification('Hujjat muvaffaqiyatli yangilandi', 'success');
}

// User actions
function viewUser(id) {
    const user = adminUsers.find(u => u.id === id);
    if (user) {
        showNotification(`${user.firstName} ${user.lastName} ma'lumotlarini ko'rish`, 'info');
        // In real app, open user details modal
    }
}

function toggleUserStatus(id) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex !== -1) {
        const user = users[userIndex];
        const oldStatus = user.status;
        user.status = user.status === 'active' ? 'inactive' : 'active';
        
        // Save to localStorage
        localStorage.setItem('users', JSON.stringify(users));
        
        // Update adminUsers array
        adminUsers = users;
        
        // Log activity
        logActivity('user', `User status changed: ${user.firstName} ${user.lastName} (${oldStatus} → ${user.status})`, 'info', { userId: id, oldStatus, newStatus: user.status });
        
        loadUsers();
        updateStats();
        showNotification(`Foydalanuvchi ${user.status === 'active' ? 'faollashtirildi' : 'nofaollashtirildi'}`, 'success');
    }
}

function deleteUser(id) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === id);
    
    if (user && confirm(`${user.firstName} ${user.lastName} foydalanuvchisini o'chirishni xohlaysizmi?`)) {
        // Remove user from array
        const filteredUsers = users.filter(u => u.id !== id);
        
        // Save to localStorage
        localStorage.setItem('users', JSON.stringify(filteredUsers));
        
        // Update adminUsers array
        adminUsers = filteredUsers;
        
        // Log activity
        logActivity('user', `User deleted: ${user.firstName} ${user.lastName}`, 'warning', { userId: id, userEmail: user.email });
        
        loadUsers();
        updateStats();
        showNotification('Foydalanuvchi o\'chirildi', 'success');
    }
}

function viewUser(id) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === id);
    
    if (user) {
        // Create and show user details modal
        showUserDetailsModal(user);
        
        // Log activity
        logActivity('user', `Viewed user details: ${user.firstName} ${user.lastName}`, 'info', { userId: id });
    }
}

function showUserDetailsModal(user) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal user-modal">
            <div class="modal-header">
                <h3><i class="fas fa-user"></i> Foydalanuvchi ma'lumotlari</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-content">
                <div class="user-profile">
                    <div class="user-avatar-section">
                        <div class="user-avatar-large">
                            <i class="fas fa-user"></i>
                        </div>
                        <h4>${user.firstName} ${user.lastName}</h4>
                        <span class="user-status ${user.status}">${user.status === 'active' ? 'Faol' : 'Nofaol'}</span>
                    </div>
                    <div class="user-details-grid">
                        <div class="detail-item">
                            <label>Email:</label>
                            <span>${user.email}</span>
                        </div>
                        <div class="detail-item">
                            <label>Universitet:</label>
                            <span>${user.university || 'Belgilanmagan'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Telefon:</label>
                            <span>${user.phone || 'Belgilanmagan'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Ro'yxatdan o'tgan sana:</label>
                            <span>${user.registrationDate ? new Date(user.registrationDate).toLocaleDateString('uz-UZ') : 'Noma\'lum'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Yuklab olingan fayllar:</label>
                            <span>${user.downloads || 0} ta</span>
                        </div>
                        <div class="detail-item">
                            <label>Sevimli fayllar:</label>
                            <span>${user.favorites || 0} ta</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="editUser(${user.id})">
                    <i class="fas fa-edit"></i> Tahrirlash
                </button>
                <button class="btn btn-${user.status === 'active' ? 'warning' : 'success'}" onclick="toggleUserStatus(${user.id}); closeModal();">
                    <i class="fas fa-${user.status === 'active' ? 'ban' : 'check'}"></i> 
                    ${user.status === 'active' ? 'Nofaollashtirish' : 'Faollashtirish'}
                </button>
                <button class="btn btn-secondary" onclick="closeModal()">Yopish</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

function editUser(id) {
    showNotification('Foydalanuvchi tahrirlash funksiyasi tez orada qo\'shiladi', 'info');
    closeModal();
}

// Subject actions
function addNewSubject() {
    showNotification('Yangi fan qo\'shish rejimi', 'info');
    // In real app, open add subject modal
}

function editSubject(id) {
    showNotification(`${id} fanini tahrirlash rejimi`, 'info');
    // In real app, open edit subject modal
}

function deleteSubject(id) {
    if (confirm(`${id} fanini o'chirishni xohlaysizmi?`)) {
        showNotification('Fan o\'chirildi', 'success');
        // In real app, remove subject and update data
    }
}

// Notifications
function toggleNotifications() {
    const panel = document.getElementById('notificationsPanel');
    panel.classList.toggle('active');
}

// Logout
function logout() {
    if (confirm('Chiqishni xohlaysizmi?')) {
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// Utility functions
function getSubjectName(subjectId) {
    const subjects = {
        'mathematics': 'Matematika',
        'physics': 'Fizika',
        'chemistry': 'Kimyo',
        'biology': 'Biologiya',
        'history': 'Tarix',
        'geography': 'Geografiya',
        'literature': 'Adabiyot',
        'english': 'Ingliz tili'
    };
    return subjects[subjectId] || subjectId;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function getNotificationColor(type) {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    return colors[type] || '#3b82f6';
}

// Get subject color by ID
function getSubjectColor(subjectId) {
    const colors = {
        'mathematics': '#3b82f6',
        'physics': '#ef4444',
        'chemistry': '#10b981',
        'biology': '#8b5cf6',
        'history': '#f59e0b',
        'geography': '#06b6d4',
        'literature': '#ec4899',
        'english': '#84cc16'
    };
    return colors[subjectId] || '#6b7280';
}

// Log activity for admin panel
function logActivity(icon, title, subtitle) {
    const activities = JSON.parse(localStorage.getItem('adminActivities') || '[]');
    const newActivity = {
        id: Date.now(),
        icon: icon,
        title: title,
        subtitle: subtitle,
        time: getRelativeTime(new Date()),
        timestamp: new Date().toISOString()
    };
    
    activities.unshift(newActivity);
    // Keep only last 50 activities
    if (activities.length > 50) {
        activities.splice(50);
    }
    
    localStorage.setItem('adminActivities', JSON.stringify(activities));
}

// Get relative time string
function getRelativeTime(date) {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Hozir';
    if (diffInMinutes < 60) return `${diffInMinutes} daqiqa oldin`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} soat oldin`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} kun oldin`;
}

// ===== ADVANCED ANALYTICS AND CHARTS =====

// Initialize all charts
function initializeCharts() {
    initializeDownloadsChart();
    initializeUsersChart();
    initializeSubjectsChart();
    loadAnalyticsData();
}

// Initialize downloads chart
function initializeDownloadsChart() {
    const ctx = document.getElementById('downloadsChart');
    if (!ctx) return;
    
    const chartData = generateDownloadsChartData(7);
    
    downloadsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Yuklab olishlar',
                data: chartData.data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f3f4f6'
                    },
                    ticks: {
                        color: '#6b7280'
                    }
                },
                x: {
                    grid: {
                        color: '#f3f4f6'
                    },
                    ticks: {
                        color: '#6b7280'
                    }
                }
            }
        }
    });
}

// Initialize users growth chart
function initializeUsersChart() {
    const ctx = document.getElementById('usersChart');
    if (!ctx) return;
    
    const chartData = generateUsersChartData(30);
    
    usersChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Yangi foydalanuvchilar',
                data: chartData.data,
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderColor: '#10b981',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f3f4f6'
                    },
                    ticks: {
                        color: '#6b7280'
                    }
                },
                x: {
                    grid: {
                        color: '#f3f4f6'
                    },
                    ticks: {
                        color: '#6b7280'
                    }
                }
            }
        }
    });
}

// Initialize subjects popularity chart
function initializeSubjectsChart() {
    const ctx = document.getElementById('subjectsChart');
    if (!ctx) return;
    
    const chartData = generateSubjectsChartData();
    
    subjectsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.labels,
            datasets: [{
                data: chartData.data,
                backgroundColor: [
                    '#3b82f6', '#ef4444', '#10b981', '#8b5cf6',
                    '#f59e0b', '#06b6d4', '#ec4899', '#84cc16'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        color: '#6b7280'
                    }
                }
            }
        }
    });
}

// Generate downloads chart data
function generateDownloadsChartData(days) {
    const labels = [];
    const data = [];
    const today = new Date();
    
    // Get download history from localStorage
    const downloadHistory = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        labels.push(date.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }));
        
        // Count downloads for this specific date
        const downloadsForDate = downloadHistory.filter(download => {
            const downloadDate = new Date(download.timestamp).toISOString().split('T')[0];
            return downloadDate === dateStr;
        }).length;
        
        data.push(downloadsForDate);
    }
    
    return { labels, data };
}

// Function to record download activity
function recordDownload(documentId, userId = null) {
    const downloadHistory = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    
    const download = {
        id: Date.now(),
        documentId: documentId,
        userId: userId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
    };
    
    downloadHistory.push(download);
    localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory));
    
    // Update document download count
    const docIndex = documents.findIndex(doc => doc.id === documentId);
    if (docIndex !== -1) {
        documents[docIndex].downloadCount = (documents[docIndex].downloadCount || 0) + 1;
        localStorage.setItem('documents', JSON.stringify(documents));
    }
    
    // Log activity
    const doc = documents.find(d => d.id === documentId);
    if (doc) {
        logActivity('document', `Document downloaded: ${doc.title}`, 'info', { documentId, userId });
    }
}

// Generate users chart data
function generateUsersChartData(days) {
    const labels = [];
    const data = [];
    const today = new Date();
    
    // Get user registration history
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        labels.push(date.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }));
        
        // Count user registrations for this specific date
        const usersForDate = users.filter(user => {
            if (!user.registrationDate) return false;
            const userDate = new Date(user.registrationDate).toISOString().split('T')[0];
            return userDate === dateStr;
        }).length;
        
        data.push(usersForDate);
    }
    
    return { labels, data };
}

// Generate subjects chart data
function generateSubjectsChartData() {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    
    // Create subject statistics from real data
    const subjectStats = {};
    
    // Initialize subjects
    subjects.forEach(subject => {
        subjectStats[subject.id] = {
            name: subject.name,
            downloads: 0,
            documents: 0
        };
    });
    
    // Calculate real statistics
    documents.forEach(doc => {
        if (subjectStats[doc.subject]) {
            subjectStats[doc.subject].downloads += doc.downloadCount || 0;
            subjectStats[doc.subject].documents += 1;
        }
    });
    
    // Convert to arrays for chart
    const labels = [];
    const data = [];
    
    Object.values(subjectStats).forEach(subject => {
        if (subject.documents > 0) { // Only include subjects with documents
            labels.push(subject.name);
            data.push(subject.downloads);
        }
    });
    
    return { labels, data };
}

// Update charts based on period selection
function updateDownloadsChart() {
    const period = document.getElementById('downloadsChartPeriod').value;
    const chartData = generateDownloadsChartData(parseInt(period));
    
    downloadsChart.data.labels = chartData.labels;
    downloadsChart.data.datasets[0].data = chartData.data;
    downloadsChart.update();
}

function updateUsersChart() {
    const period = document.getElementById('usersChartPeriod').value;
    const chartData = generateUsersChartData(parseInt(period));
    
    usersChart.data.labels = chartData.labels;
    usersChart.data.datasets[0].data = chartData.data;
    usersChart.update();
}

// Load and update analytics data
function loadAnalyticsData() {
    updateAnalyticsKPIs();
    loadTopDocuments();
    loadDownloadsReport();
    loadUsersActivityReport();
}

// Update KPI cards
function updateAnalyticsKPIs() {
    const totalViews = adminDocuments.reduce((sum, doc) => sum + ((doc.viewCount || 0) * 3), 0) + Math.floor(Math.random() * 1000);
    const totalDownloads = adminDocuments.reduce((sum, doc) => sum + (doc.downloadCount || 0), 0);
    const activeUsers = adminUsers.filter(user => user.isActive).length;
    
    document.getElementById('totalViews').textContent = totalViews.toLocaleString();
    document.getElementById('totalDownloadsAnalytics').textContent = totalDownloads.toLocaleString();
    document.getElementById('activeUsersAnalytics').textContent = activeUsers.toLocaleString();
    
    // Calculate and display trends
    document.getElementById('viewsTrend').textContent = '+' + (Math.floor(Math.random() * 20) + 5) + '%';
    document.getElementById('downloadsTrend').textContent = '+' + (Math.floor(Math.random() * 15) + 3) + '%';
    document.getElementById('usersTrend').textContent = '+' + (Math.floor(Math.random() * 10) + 2) + '%';
}

// Load top documents for analytics
function loadTopDocuments() {
    const container = document.getElementById('topDocumentsList');
    if (!container) return;
    
    const sortedDocs = [...adminDocuments]
        .sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))
        .slice(0, 5);
    
    if (sortedDocs.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <p>Hali hujjatlar yo'q</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = sortedDocs.map((doc, index) => `
        <div class="document-rank-item">
            <div class="rank-number">#${index + 1}</div>
            <div class="document-info">
                <h4>${doc.title}</h4>
                <p>${getSubjectName(doc.subject)} • ${doc.format.toUpperCase()}</p>
            </div>
            <div class="document-stats">
                <span class="download-count">${doc.downloadCount || 0}</span>
                <small>yuklab olingan</small>
            </div>
        </div>
    `).join('');
}

// Load downloads report table
function loadDownloadsReport() {
    const tableBody = document.getElementById('downloadsReportTable');
    if (!tableBody) return;
    
    if (adminDocuments.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem;">
                    <p>Hujjatlar yo'q</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = adminDocuments.slice(0, 10).map(doc => {
        const views = (doc.viewCount || 0) * 3 + Math.floor(Math.random() * 50);
        const downloads = doc.downloadCount || 0;
        const conversion = views > 0 ? ((downloads / views) * 100).toFixed(1) : 0;
        const lastDownload = doc.lastDownload || doc.uploadDate || new Date().toISOString();
        
        return `
            <tr>
                <td>${doc.title}</td>
                <td>${getSubjectName(doc.subject)}</td>
                <td>${downloads}</td>
                <td>${views}</td>
                <td>${conversion}%</td>
                <td>${formatDate(lastDownload)}</td>
            </tr>
        `;
    }).join('');
}

// Load users activity report
function loadUsersActivityReport() {
    const tableBody = document.getElementById('usersActivityTable');
    if (!tableBody) return;
    
    if (adminUsers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem;">
                    <p>Foydalanuvchilar yo'q</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = adminUsers.slice(0, 10).map(user => {
        const lastActivity = user.lastActivity || user.createdAt || new Date().toISOString();
        const downloads = user.downloads || Math.floor(Math.random() * 20);
        const statusClass = user.isActive ? 'status-active' : 'status-inactive';
        const statusText = user.isActive ? 'Faol' : 'Nofaol';
        
        return `
            <tr>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.email}</td>
                <td>${downloads}</td>
                <td>${formatDate(lastActivity)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            </tr>
        `;
    }).join('');
}

// Analytics update and export functions
function updateAnalytics() {
    loadAnalyticsData();
    updateDownloadsChart();
    updateUsersChart();
    showNotification('Analitika yangilandi', 'success');
}

function refreshAnalytics() {
    updateAnalytics();
}

function exportReport() {
    showNotification('Hisobot eksport qilinmoqda...', 'info');
    // Simulate export process
    setTimeout(() => {
        showNotification('Hisobot muvaffaqiyatli eksport qilindi!', 'success');
    }, 2000);
}

function exportDownloadsReport() {
    showNotification('Yuklab olish hisoboti eksport qilinmoqda...', 'info');
    setTimeout(() => {
        showNotification('Excel fayli yuklab olindi!', 'success');
    }, 1500);
}

function exportDownloadsPDF() {
    showNotification('PDF hisoboti yaratilmoqda...', 'info');
    setTimeout(() => {
        showNotification('PDF fayli yuklab olindi!', 'success');
    }, 2000);
}

function exportUsersReport() {
    showNotification('Foydalanuvchilar hisoboti eksport qilinmoqda...', 'info');
    setTimeout(() => {
        showNotification('Excel fayli yuklab olindi!', 'success');
    }, 1500);
}

function viewAllDocuments() {
    showSection('documents');
}

// ===== ADVANCED SETTINGS AND SYSTEM MANAGEMENT =====

// Setup settings tabs
function setupSettingsTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.settings-tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.onclick.toString().match(/showSettingsTab\('(.+?)'\)/)[1];
            showSettingsTab(tabName);
        });
    });
}

// Show settings tab
function showSettingsTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.settings-tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    event.target.classList.add('active');
    document.getElementById(tabName + '-settings').classList.add('active');
    
    // Load tab-specific data
    switch(tabName) {
        case 'security':
            loadAuditLogs();
            break;
        case 'backup':
            loadBackupHistory();
            break;
        case 'system':
            refreshSystemStats();
            refreshLogs();
            break;
    }
}

// Security and audit functions
function loadAuditLogs() {
    const container = document.getElementById('recentAuditLogs');
    if (!container) return;
    
    const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    
    if (auditLogs.length === 0) {
        container.innerHTML = `
            <div class="no-logs">
                <p>Audit loglari yo'q</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = auditLogs.slice(0, 5).map(log => `
        <div class="audit-log-item">
            <div class="log-time">${formatDate(log.timestamp)}</div>
            <div class="log-action">${log.action}</div>
            <div class="log-user">${log.user}</div>
        </div>
    `).join('');
}

function downloadAuditLog() {
    showNotification('Audit log yuklab olinmoqda...', 'info');
    setTimeout(() => {
        showNotification('Audit log fayli yuklab olindi!', 'success');
    }, 1000);
}

function clearAuditLog() {
    if (confirm('Barcha audit loglarni o\'chirish tasdiqlaysizmi?')) {
        localStorage.removeItem('auditLogs');
        loadAuditLogs();
        showNotification('Audit loglari tozalandi', 'success');
    }
}

// Email and notification functions
function testEmailSettings() {
    showNotification('Test email yuborilmoqda...', 'info');
    setTimeout(() => {
        showNotification('Test email muvaffaqiyatli yuborildi!', 'success');
    }, 2000);
}

// Backup and restore functions
function loadBackupHistory() {
    const container = document.getElementById('backupHistoryList');
    if (!container) return;
    
    const backups = JSON.parse(localStorage.getItem('backupHistory') || '[]');
    
    if (backups.length === 0) {
        container.innerHTML = `
            <div class="no-backups">
                <p>Zaxira fayllari yo'q</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = backups.slice(0, 10).map(backup => `
        <div class="backup-item">
            <div class="backup-info">
                <h4>${backup.name}</h4>
                <p>${backup.type} • ${backup.size}</p>
            </div>
            <div class="backup-date">${formatDate(backup.date)}</div>
            <div class="backup-actions">
                <button class="btn btn-xs btn-primary" onclick="downloadBackup('${backup.id}')">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn btn-xs btn-danger" onclick="deleteBackup('${backup.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function createDatabaseBackup() {
    showNotification('Ma\'lumotlar bazasi zaxirasi yaratilmoqda...', 'info');
    setTimeout(() => {
        const backup = {
            id: Date.now(),
            name: `database_backup_${new Date().toISOString().split('T')[0]}.sql`,
            type: 'Database',
            size: '2.1 MB',
            date: new Date().toISOString()
        };
        
        const backups = JSON.parse(localStorage.getItem('backupHistory') || '[]');
        backups.unshift(backup);
        localStorage.setItem('backupHistory', JSON.stringify(backups));
        
        loadBackupHistory();
        showNotification('Ma\'lumotlar bazasi zaxirasi yaratildi!', 'success');
    }, 3000);
}

function createFilesBackup() {
    showNotification('Fayllar zaxirasi yaratilmoqda...', 'info');
    setTimeout(() => {
        const backup = {
            id: Date.now(),
            name: `files_backup_${new Date().toISOString().split('T')[0]}.zip`,
            type: 'Files',
            size: '15.3 MB',
            date: new Date().toISOString()
        };
        
        const backups = JSON.parse(localStorage.getItem('backupHistory') || '[]');
        backups.unshift(backup);
        localStorage.setItem('backupHistory', JSON.stringify(backups));
        
        loadBackupHistory();
        showNotification('Fayllar zaxirasi yaratildi!', 'success');
    }, 5000);
}

function createFullBackup() {
    showNotification('To\'liq zaxira yaratilmoqda...', 'info');
    setTimeout(() => {
        const backup = {
            id: Date.now(),
            name: `full_backup_${new Date().toISOString().split('T')[0]}.zip`,
            type: 'Full Backup',
            size: '28.7 MB',
            date: new Date().toISOString()
        };
        
        const backups = JSON.parse(localStorage.getItem('backupHistory') || '[]');
        backups.unshift(backup);
        localStorage.setItem('backupHistory', JSON.stringify(backups));
        
        loadBackupHistory();
        showNotification('To\'liq zaxira yaratildi!', 'success');
    }, 8000);
}

function downloadBackup(backupId) {
    showNotification('Zaxira fayli yuklab olinmoqda...', 'info');
    setTimeout(() => {
        showNotification('Zaxira fayli yuklab olindi!', 'success');
    }, 2000);
}

function deleteBackup(backupId) {
    if (confirm('Bu zaxira faylini o\'chirish tasdiqlaysizmi?')) {
        const backups = JSON.parse(localStorage.getItem('backupHistory') || '[]');
        const filtered = backups.filter(backup => backup.id != backupId);
        localStorage.setItem('backupHistory', JSON.stringify(filtered));
        
        loadBackupHistory();
        showNotification('Zaxira fayli o\'chirildi', 'success');
    }
}

function restoreFromBackup() {
    const file = document.getElementById('restoreFile').files[0];
    if (!file) {
        showNotification('Iltimos, zaxira faylini tanlang', 'error');
        return;
    }
    
    if (confirm('Tizimni zaxiradan tiklashni tasdiqlaysizmi? Bu amal qaytarib bo\'lmaydi.')) {
        showNotification('Tizim tiklanmoqda...', 'info');
        setTimeout(() => {
            showNotification('Tizim muvaffaqiyatli tiklandi!', 'success');
        }, 10000);
    }
}

// System monitoring functions
function startSystemMonitoring() {
    refreshSystemStats();
    systemMonitoringInterval = setInterval(refreshSystemStats, 30000); // Update every 30 seconds
}

function refreshSystemStats() {
    // Update server time
    document.getElementById('serverTime').textContent = new Date().toLocaleString('uz-UZ');
    
    // Simulate system stats
    document.getElementById('serverUptime').textContent = '15 kun, 7 soat';
    document.getElementById('phpVersion').textContent = '8.1.0';
    
    // Database status
    const dbStatus = document.getElementById('databaseStatus');
    dbStatus.textContent = 'Ulanish muvaffaqiyatli';
    dbStatus.className = 'status-indicator status-success';
    
    // Memory usage
    const memoryPercent = Math.floor(Math.random() * 30) + 40; // 40-70%
    document.getElementById('memoryUsage').style.width = memoryPercent + '%';
    document.getElementById('memoryText').textContent = memoryPercent + '%';
    
    // Update memory usage color
    const memoryBar = document.getElementById('memoryUsage');
    if (memoryPercent > 80) {
        memoryBar.style.backgroundColor = '#ef4444';
    } else if (memoryPercent > 60) {
        memoryBar.style.backgroundColor = '#f59e0b';
    } else {
        memoryBar.style.backgroundColor = '#10b981';
    }
}

function refreshLogs() {
    const logViewer = document.getElementById('logViewer');
    if (!logViewer) return;
    
    const logType = document.getElementById('logType').value;
    
    // Simulate log data
    const logs = [
        `[${new Date().toISOString()}] INFO: Tizim normal ishlayapti`,
        `[${new Date().toISOString()}] INFO: Yangi foydalanuvchi ro'yxatdan o'tdi`,
        `[${new Date().toISOString()}] WARNING: Kesh hajmi 80% dan oshdi`,
        `[${new Date().toISOString()}] INFO: Zaxira muvaffaqiyatli yaratildi`,
        `[${new Date().toISOString()}] ERROR: Ma'lumotlar bazasiga ulanishda vaqtinchalik xatolik`
    ];
    
    logViewer.innerHTML = `<pre>${logs.join('\n')}</pre>`;
}

function downloadLogs() {
    showNotification('Loglar yuklab olinmoqda...', 'info');
    setTimeout(() => {
        showNotification('Log fayli yuklab olindi!', 'success');
    }, 1000);
}

// System cleanup functions
function clearCache() {
    showNotification('Kesh tozalanmoqda...', 'info');
    setTimeout(() => {
        showNotification('Kesh muvaffaqiyatli tozalandi! 156 MB bo\'sh joy ajratildi', 'success');
    }, 2000);
}

function cleanupOldFiles() {
    if (confirm('30 kundan eski fayllarni o\'chirishni tasdiqlaysizmi?')) {
        showNotification('Eski fayllar o\'chirilmoqda...', 'info');
        setTimeout(() => {
            showNotification('Eski fayllar o\'chirildi! 23 fayl, 89 MB bo\'sh joy ajratildi', 'success');
        }, 3000);
    }
}

function archiveAuditLogs() {
    showNotification('Audit loglari arxivlanmoqda...', 'info');
    setTimeout(() => {
        showNotification('Audit loglari muvaffaqiyatli arxivlandi!', 'success');
    }, 4000);
}

// Real settings management
function loadSystemSettings() {
    const settings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
    
    // Set default settings if none exist
    const defaultSettings = {
        siteName: 'Sukun Slide',
        siteDescription: 'Ta\'lim resurslari platformasi',
        maxFileSize: 50, // MB
        allowedFormats: ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'xlsx'],
        autoApprove: false,
        requireAuth: true,
        maintenanceMode: false,
        emailNotifications: true,
        backupFrequency: 'daily',
        sessionTimeout: 30 // minutes
    };
    
    // Merge with defaults
    const finalSettings = { ...defaultSettings, ...settings };
    localStorage.setItem('systemSettings', JSON.stringify(finalSettings));
    
    return finalSettings;
}

function saveSystemSettings(newSettings) {
    const currentSettings = loadSystemSettings();
    const updatedSettings = { ...currentSettings, ...newSettings };
    
    localStorage.setItem('systemSettings', JSON.stringify(updatedSettings));
    logActivity('system', 'System settings updated', 'info', { settings: newSettings });
    
    return updatedSettings;
}

// Form submission handlers for settings
document.addEventListener('DOMContentLoaded', function() {
    // Load current settings when page loads
    loadSystemSettings();
    
    // General settings form
    const generalForm = document.getElementById('generalSettingsForm');
    if (generalForm) {
        generalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const settings = {
                siteName: formData.get('siteName') || 'Sukun Slide',
                siteDescription: formData.get('siteDescription') || '',
                maintenanceMode: formData.has('maintenanceMode'),
                requireAuth: formData.has('requireAuth')
            };
            
            saveSystemSettings(settings);
            showNotification('Umumiy sozlamalar saqlandi!', 'success');
        });
    }
    
    // File settings form
    const fileForm = document.getElementById('fileSettingsForm');
    if (fileForm) {
        fileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const settings = {
                maxFileSize: parseInt(formData.get('maxFileSize')) || 50,
                autoApprove: formData.has('autoApprove'),
                allowedFormats: formData.getAll('allowedFormats')
            };
            
            saveSystemSettings(settings);
            showNotification('Fayl sozlamalari saqlandi!', 'success');
        });
    }
    
    // Password change form
    const passwordForm = document.getElementById('passwordChangeForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const current = document.getElementById('currentPassword').value;
            const newPass = document.getElementById('newPassword').value;
            const confirm = document.getElementById('confirmPassword').value;
            
            if (newPass !== confirm) {
                showNotification('Parollar mos kelmaydi', 'error');
                return;
            }
            
            showNotification('Parol muvaffaqiyatli o\'zgartirildi!', 'success');
            this.reset();
        });
    }
    
    // Security settings form
    const securityForm = document.getElementById('securitySettingsForm');
    if (securityForm) {
        securityForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showNotification('Xavfsizlik sozlamalari saqlandi!', 'success');
        });
    }
    
    // Email notifications form
    const emailForm = document.getElementById('emailNotificationsForm');
    if (emailForm) {
        emailForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showNotification('Email sozlamalari saqlandi!', 'success');
        });
    }
    
    // Notification types form
    const notificationForm = document.getElementById('notificationTypesForm');
    if (notificationForm) {
        notificationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showNotification('Bildirishnoma sozlamalari saqlandi!', 'success');
        });
    }
    
    // Backup settings form
    const backupForm = document.getElementById('backupSettingsForm');
    if (backupForm) {
        backupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showNotification('Zaxira sozlamalari saqlandi!', 'success');
        });
    }
    
    // Password strength checker
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            const password = this.value;
            const strengthDiv = document.getElementById('passwordStrength');
            if (!strengthDiv) return;
            
            let strength = 0;
            let feedback = [];
            
            if (password.length >= 8) strength++; else feedback.push('8+ belgi');
            if (/[a-z]/.test(password)) strength++; else feedback.push('kichik harf');
            if (/[A-Z]/.test(password)) strength++; else feedback.push('katta harf');
            if (/[0-9]/.test(password)) strength++; else feedback.push('raqam');
            if (/[^A-Za-z0-9]/.test(password)) strength++; else feedback.push('maxsus belgi');
            
            const levels = ['Juda zaif', 'Zaif', 'O\'rtacha', 'Kuchli', 'Juda kuchli'];
            const colors = ['#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#059669'];
            
            strengthDiv.innerHTML = `
                <div class="strength-bar">
                    <div class="strength-fill" style="width: ${(strength / 5) * 100}%; background: ${colors[strength]}"></div>
                </div>
                <small style="color: ${colors[strength]}">${levels[strength]} ${feedback.length > 0 ? '(' + feedback.join(', ') + ' kerak)' : ''}</small>
            `;
        });
    }
});

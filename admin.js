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
    initializeAdminPanel();
    setupEventListeners();
    loadDashboardData();
    initializeCharts();
    startSystemMonitoring();
    setupSettingsTabs();
});

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
            
            // Update active state
            menuItems.forEach(mi => mi.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Load initial data
    loadDocuments();
    loadUsers();
    loadSubjects();
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
    const stats = {
        totalDocuments: adminDocuments.length,
        totalUsers: adminUsers.length,
        totalDownloads: adminDocuments.reduce((sum, doc) => sum + (doc.downloads || 0), 0),
        totalSubjects: 8
    };
    
    // Update stat cards
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
        statCards[0].querySelector('h3').textContent = stats.totalDocuments;
        statCards[1].querySelector('h3').textContent = stats.totalUsers.toLocaleString();
        statCards[2].querySelector('h3').textContent = stats.totalDownloads.toLocaleString();
        statCards[3].querySelector('h3').textContent = stats.totalSubjects;
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
    
    activityList.innerHTML = recentActivities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <p><strong>${activity.title}</strong></p>
                <span>${activity.subtitle}</span>
            </div>
            <div class="activity-time">${activity.time}</div>
        </div>
    `).join('');
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
    
    if (files.length > 0) {
        uploadArea.innerHTML = `
            <div class="upload-content">
                <i class="fas fa-check-circle" style="color: #10b981;"></i>
                <h3>${files.length} ta fayl tanlandi</h3>
                <p>Fayl ma'lumotlarini to'ldiring va yuklang</p>
            </div>
        `;
        
        // Populate form with file info
        const firstFile = files[0];
        const titleInput = document.getElementById('documentTitle');
        if (titleInput && !titleInput.value) {
            titleInput.value = firstFile.name.replace(/\.[^/.]+$/, "");
        }
    }
}

function handleUpload(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const fileInput = document.getElementById('fileInput');
    
    // Get form values
    const title = document.getElementById('documentTitle').value;
    const subject = document.getElementById('documentSubject').value;
    const author = document.getElementById('documentAuthor').value;
    const description = document.getElementById('documentDescription').value;
    
    // Validate required fields
    if (!title) {
        showNotification('Hujjat nomini kiriting', 'error');
        return;
    }
    
    if (!subject) {
        showNotification('Fanni tanlang', 'error');
        return;
    }
    
    if (!fileInput.files.length) {
        showNotification('Iltimos, fayl tanlang', 'error');
        return;
    }
    
    // Validate file type
    const allowedTypes = ['ppt', 'pptx', 'pdf', 'doc', 'docx', 'xlsx'];
    const fileExtension = fileInput.files[0].name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
        showNotification('Faqat PPT, PDF, DOC, XLSX formatlarida fayl yuklash mumkin', 'error');
        return;
    }
    
    // Show loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yuklanmoqda...';
    submitBtn.disabled = true;
    
    // Simulate upload
    setTimeout(() => {
        // Add new document
        const newDoc = {
            id: adminDocuments.length + 1,
            title: title,
            subject: subject,
            format: fileExtension,
            size: formatFileSize(fileInput.files[0].size),
            downloads: 0,
            uploadDate: new Date().toISOString().split('T')[0],
            author: author || 'Admin',
            description: description || '',
            status: 'active'
        };
        
        adminDocuments.unshift(newDoc);
        
        // Log activity
        logActivity('fas fa-upload', 'Admin yangi hujjat yukladi', `${newDoc.title} - ${newDoc.format.toUpperCase()}`);
        
        showNotification('Hujjat muvaffaqiyatli yuklandi!', 'success');
        clearUploadForm();
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Refresh documents list
        loadDocuments();
        updateStats();
        
        // Also update main website documents if available
        if (typeof documentsData !== 'undefined') {
            documentsData.unshift(newDoc);
        }
        
        // Save documents to localStorage for user dashboard access
        localStorage.setItem('documents', JSON.stringify(adminDocuments));
        
    }, 2000);
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
    const doc = adminDocuments.find(d => d.id === id);
    if (doc && confirm(`"${doc.title}" hujjatini o'chirishni xohlaysizmi?`)) {
        adminDocuments = adminDocuments.filter(d => d.id !== id);
        loadDocuments();
        updateStats();
        showNotification('Hujjat o\'chirildi', 'success');
    }
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
    const user = adminUsers.find(u => u.id === id);
    if (user) {
        user.status = user.status === 'active' ? 'inactive' : 'active';
        loadUsers();
        showNotification(`Foydalanuvchi ${user.status === 'active' ? 'faollashtirildi' : 'nofaollashtirildi'}`, 'success');
    }
}

function deleteUser(id) {
    const user = adminUsers.find(u => u.id === id);
    if (user && confirm(`${user.firstName} ${user.lastName} foydalanuvchisini o'chirishni xohlaysizmi?`)) {
        adminUsers = adminUsers.filter(u => u.id !== id);
        loadUsers();
        updateStats();
        showNotification('Foydalanuvchi o\'chirildi', 'success');
    }
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
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }));
        // Simulate download data based on existing documents
        const downloads = Math.floor(Math.random() * 50) + (adminDocuments.length * 2);
        data.push(downloads);
    }
    
    return { labels, data };
}

// Generate users chart data
function generateUsersChartData(days) {
    const labels = [];
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }));
        // Simulate user registration data
        const newUsers = Math.floor(Math.random() * 10) + Math.floor(adminUsers.length / days);
        data.push(newUsers);
    }
    
    return { labels, data };
}

// Generate subjects chart data
function generateSubjectsChartData() {
    const subjects = [
        { name: 'Matematika', downloads: 0 },
        { name: 'Fizika', downloads: 0 },
        { name: 'Kimyo', downloads: 0 },
        { name: 'Biologiya', downloads: 0 },
        { name: 'Tarix', downloads: 0 },
        { name: 'Geografiya', downloads: 0 },
        { name: 'Adabiyot', downloads: 0 },
        { name: 'Ingliz tili', downloads: 0 }
    ];
    
    // Calculate actual downloads per subject
    adminDocuments.forEach(doc => {
        const subject = subjects.find(s => s.name === getSubjectName(doc.subject));
        if (subject) {
            subject.downloads += doc.downloadCount || 0;
        }
    });
    
    // Add some base values for visualization
    subjects.forEach(subject => {
        if (subject.downloads === 0) {
            subject.downloads = Math.floor(Math.random() * 20) + 5;
        }
    });
    
    return {
        labels: subjects.map(s => s.name),
        data: subjects.map(s => s.downloads)
    };
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

// Form submission handlers for settings
document.addEventListener('DOMContentLoaded', function() {
    // General settings form
    const generalForm = document.getElementById('generalSettingsForm');
    if (generalForm) {
        generalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showNotification('Umumiy sozlamalar saqlandi!', 'success');
        });
    }
    
    // File settings form
    const fileForm = document.getElementById('fileSettingsForm');
    if (fileForm) {
        fileForm.addEventListener('submit', function(e) {
            e.preventDefault();
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

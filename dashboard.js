// User Dashboard JavaScript

// User downloads data
let userDownloads = [];
let userFavorites = [];

// Document data (synced from admin panel)
let documentsData = [];

// Subjects data - will be loaded dynamically
let subjectsData = [];

// Notifications data
let userNotifications = [];

// Initialize subjects data
function initializeSubjects() {
    // Default subjects structure - can be managed by admin in the future
    const defaultSubjects = [
        { id: 'mathematics', name: 'Matematika', icon: 'fas fa-calculator' },
        { id: 'physics', name: 'Fizika', icon: 'fas fa-atom' },
        { id: 'chemistry', name: 'Kimyo', icon: 'fas fa-flask' },
        { id: 'biology', name: 'Biologiya', icon: 'fas fa-dna' },
        { id: 'history', name: 'Tarix', icon: 'fas fa-landmark' },
        { id: 'geography', name: 'Geografiya', icon: 'fas fa-globe' },
        { id: 'literature', name: 'Adabiyot', icon: 'fas fa-book' },
        { id: 'english', name: 'Ingliz tili', icon: 'fas fa-language' }
    ];
    
    // Load from localStorage if available, otherwise use defaults
    const savedSubjects = localStorage.getItem('subjects');
    if (savedSubjects) {
        try {
            subjectsData = JSON.parse(savedSubjects);
        } catch (error) {
            console.error('Error loading subjects:', error);
            subjectsData = defaultSubjects;
        }
    } else {
        subjectsData = defaultSubjects;
        localStorage.setItem('subjects', JSON.stringify(subjectsData));
    }
}

// Current filters
let currentFilters = {
    search: '',
    subject: '',
    format: ''
};

// Display settings
let displayedDocuments = 12;

let currentUser = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkUserAuth();
    initializeSubjects();
    syncDocumentsFromMainSite();
    initializeDashboard();
    setupEventListeners();
    loadUserData();
    setupDocumentBrowsing();
    handleURLParameters();
    
    // Initialize notifications
    updateNotificationBadge();
    
    // Initialize dark mode
    initializeDarkMode();
    
    // Debug: Log documents data to help with troubleshooting
    console.log('Documents loaded:', documentsData.length);
    if (documentsData.length > 0) {
        console.log('Sample document structure:', documentsData[0]);
    } else {
        console.log('No documents found. You can add sample documents via admin panel or use createSampleDocuments() function in console.');
    }
});

// Check user authentication
function checkUserAuth() {
    const savedUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    
    if (!savedUser) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = JSON.parse(savedUser);
    
    if (currentUser.role === 'admin') {
        window.location.href = 'admin.html';
        return;
    }
}

// Sync documents from storage
function syncDocumentsFromMainSite() {
    // Get documents from localStorage (managed by admin panel)
    const savedDocuments = localStorage.getItem('documents');
    if (savedDocuments) {
        try {
            documentsData = JSON.parse(savedDocuments);
            console.log(`Loaded ${documentsData.length} documents from storage`);
        } catch (error) {
            console.error('Error parsing documents data:', error);
            documentsData = [];
        }
    } else {
        // Initialize with empty array - admin will add documents
        documentsData = [];
        console.log('No documents found in storage');
    }
    
    // Save last sync time
    localStorage.setItem('lastDocumentSync', new Date().toISOString());
}

// Initialize dashboard
function initializeDashboard() {
    // Set user info
    updateUserInfo();
    
    // Set appropriate avatar based on user role
    setUserAvatar();
    
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
    loadOverviewData();
}

// Setup event listeners
function setupEventListeners() {
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Password form
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }
    
    // Notifications form
    const notificationsForm = document.getElementById('notificationsForm');
    if (notificationsForm) {
        notificationsForm.addEventListener('submit', handleNotificationsUpdate);
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
}

// Update user info in navigation
function updateUserInfo() {
    if (!currentUser) return;
    
    const userName = document.getElementById('userName');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileUniversity = document.getElementById('profileUniversity');
    
    if (userName) userName.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    if (profileName) profileName.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    if (profileEmail) profileEmail.textContent = currentUser.email;
    if (profileUniversity) profileUniversity.textContent = getUniversityName(currentUser.university);
}

// Set user avatar based on role or saved preference
function setUserAvatar() {
    if (!currentUser) return;
    
    // Get saved avatar preference or use default based on role
    let avatarIcon = localStorage.getItem('userAvatarIcon');
    
    if (!avatarIcon) {
        // Default avatars based on user role or university
        const roleAvatars = {
            'student': 'fas fa-user-graduate',
            'teacher': 'fas fa-user-tie',
            'admin': 'fas fa-user-shield',
            'guest': 'fas fa-user'
        };
        
        avatarIcon = roleAvatars[currentUser.role] || 'fas fa-user-graduate';
    }
    
    // Update navigation avatar
    const navAvatar = document.querySelector('.user-avatar i');
    if (navAvatar) {
        navAvatar.className = avatarIcon;
    }
    
    // Update profile avatar
    const profileAvatar = document.querySelector('#profileImage i');
    if (profileAvatar) {
        profileAvatar.className = avatarIcon;
    }
}

// Load user data
function loadUserData() {
    // Load user downloads and favorites from localStorage
    const savedDownloads = localStorage.getItem('userDownloads');
    if (savedDownloads) {
        userDownloads = JSON.parse(savedDownloads);
    }
    
    const savedFavorites = localStorage.getItem('userFavorites');
    if (savedFavorites) {
        userFavorites = JSON.parse(savedFavorites);
    }
    
    // Load profile form data
    loadProfileForm();
    
    // Load user downloads
    loadRecentDownloads();
    
    // Load recommended documents
    loadRecommendedDocuments();
    
    // Load favorites
    loadFavorites();
    
    // Load statistics
    updateStatistics();
}

// Load profile form
function loadProfileForm() {
    if (!currentUser) return;
    
    const form = document.getElementById('profileForm');
    if (!form) return;
    
    form.firstName.value = currentUser.firstName || '';
    form.lastName.value = currentUser.lastName || '';
    form.email.value = currentUser.email || '';
    form.phone.value = currentUser.phone || '';
    form.university.value = currentUser.university || '';
    form.course.value = currentUser.course || '';
}

// Show section
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Load section-specific data
    switch(sectionName) {
        case 'overview':
            loadOverviewData();
            break;
        case 'documents':
            loadUserDocuments();
            break;
        case 'downloads':
            loadDownloads();
            break;
        case 'favorites':
            loadFavorites();
            break;
        case 'profile':
            loadProfileForm();
            break;
    }
}

// Load overview data
function loadOverviewData() {
    loadRecentDownloads();
    loadRecommendedDocuments();
    updateStatistics();
}

// Load recent downloads
function loadRecentDownloads() {
    const container = document.getElementById('recentDownloads');
    if (!container) return;
    
    if (userDownloads.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #6b7280;">
                <i class="fas fa-download" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                <p>Hali hujjat yuklab olmadingiz</p>
            </div>
        `;
        return;
    }
    
    const recentDownloads = userDownloads.slice(0, 3);
    
    container.innerHTML = recentDownloads.map(download => `
        <div class="download-item">
            <div class="download-icon">
                <i class="${getFormatIcon(download.format)}"></i>
            </div>
            <div class="download-content">
                <h4>${download.title}</h4>
                <p>${getSubjectName(download.subject)} • ${download.author}</p>
            </div>
            <div class="download-time">${formatDate(download.downloadDate)}</div>
        </div>
    `).join('');
}

// Load recommended documents
function loadRecommendedDocuments() {
    const container = document.getElementById('recommendedDocuments');
    if (!container) return;
    
    if (documentsData.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #6b7280;">
                <i class="fas fa-file-alt" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                <p>Hali hujjatlar yo'q</p>
            </div>
        `;
        return;
    }
    
    // Show first 3 documents as recommended
    const recommended = documentsData.slice(0, 3);
    
    container.innerHTML = recommended.map(doc => `
        <div class="recommended-item" onclick="downloadDocument(${doc.id})">
            <div class="recommended-icon">
                <i class="${getFormatIcon(doc.format)}"></i>
            </div>
            <div class="recommended-content">
                <h4>${doc.title}</h4>
                <p>${getSubjectName(doc.subject)} • ${doc.author}</p>
            </div>
            <div class="recommended-actions">
                <button class="btn btn-xs btn-primary" onclick="event.stopPropagation(); downloadDocument(${doc.id})">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn btn-xs btn-secondary" onclick="event.stopPropagation(); toggleFavorite(${doc.id})">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Load user documents - this shows all available documents for browsing
function loadUserDocuments() {
    // Show all documents section
    applyDocumentFilters();
}

// Load downloads
function loadDownloads() {
    const container = document.getElementById('downloadsList');
    if (!container) return;
    
    container.innerHTML = userDownloads.map(download => `
        <div class="download-list-item">
            <div class="download-list-icon">
                <i class="${getFormatIcon(download.format)}"></i>
            </div>
            <div class="download-list-content">
                <h4>${download.title}</h4>
                <p>${getSubjectName(download.subject)} • ${download.author}</p>
            </div>
            <div class="download-list-meta">
                <div class="download-list-time">${formatDate(download.downloadDate)}</div>
                <div class="download-list-actions">
                    <button class="btn btn-xs btn-primary" onclick="downloadDocument(${download.id})">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-xs btn-secondary" onclick="addToFavorites(${download.id})">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Load favorites
function loadFavorites() {
    const container = document.getElementById('favoritesGrid');
    if (!container) return;
    
    if (userFavorites.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <h3>Sevimli hujjatlar yo'q</h3>
                <p>Hujjatlarni sevimli qilish uchun yurak belgisini bosing</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userFavorites.map(favorite => `
        <div class="favorite-card">
            <button class="favorite-remove" onclick="removeFromFavorites(${favorite.id})">
                <i class="fas fa-times"></i>
            </button>
            <div class="document-header">
                <div class="document-format">
                    <i class="${getFormatIcon(favorite.format)}"></i>
                    ${favorite.format.toUpperCase()}
                </div>
                <h3 class="document-title">${favorite.title}</h3>
                <p class="document-subject">${getSubjectName(favorite.subject)}</p>
            </div>
            <div class="document-footer">
                <div class="document-meta">
                    <span><i class="fas fa-user"></i> ${favorite.author}</span>
                </div>
                <div class="document-actions">
                    <button class="btn btn-sm btn-primary" onclick="downloadDocument(${favorite.id})">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Update statistics
function updateStatistics() {
    const totalDownloads = document.getElementById('totalDownloads');
    const totalFavorites = document.getElementById('totalFavorites');
    const recentActivity = document.getElementById('recentActivity');
    const totalDownloadsStat = document.getElementById('totalDownloadsStat');
    const totalFavoritesStat = document.getElementById('totalFavoritesStat');
    const joinDate = document.getElementById('joinDate');
    const lastActivity = document.getElementById('lastActivity');
    
    if (totalDownloads) totalDownloads.textContent = userDownloads.length;
    if (totalFavorites) totalFavorites.textContent = userFavorites.length;
    if (recentActivity) recentActivity.textContent = userDownloads.length;
    if (totalDownloadsStat) totalDownloadsStat.textContent = userDownloads.length;
    if (totalFavoritesStat) totalFavoritesStat.textContent = userFavorites.length;
    if (joinDate) joinDate.textContent = formatDate(currentUser.createdAt || '2024-01-01');
    if (lastActivity) lastActivity.textContent = userDownloads.length > 0 ? formatDate(userDownloads[0].downloadDate) : 'Hozircha yo\'q';
}

// Handle profile update
function handleProfileUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const updatedUser = {
        ...currentUser,
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        university: formData.get('university'),
        course: formData.get('course')
    };
    
    // Show loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saqlanmoqda...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        currentUser = updatedUser;
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        updateUserInfo();
        showNotification('Profil muvaffaqiyatli yangilandi!', 'success');
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 1500);
}

// Handle password change
function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    
    if (newPassword !== confirmPassword) {
        showNotification('Yangi parollar mos kelmaydi', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showNotification('Parol kamida 8 ta belgi bo\'lishi kerak', 'error');
        return;
    }
    
    // Show loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> O\'zgartirilmoqda...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        showNotification('Parol muvaffaqiyatli o\'zgartirildi!', 'success');
        e.target.reset();
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 1500);
}

// Handle notifications update
function handleNotificationsUpdate(e) {
    e.preventDefault();
    
    const emailNotifications = document.getElementById('emailNotifications').checked;
    const newDocuments = document.getElementById('newDocuments').checked;
    const weeklyDigest = document.getElementById('weeklyDigest').checked;
    
    // Show loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saqlanmoqda...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        showNotification('Bildirishnoma sozlamalari saqlandi!', 'success');
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 1000);
}

// Search and filter handlers
function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const section = e.target.closest('.dashboard-section').id;
    
    switch(section) {
        case 'documents':
            // Filter user documents
            break;
        case 'downloads':
            filterDownloads(query);
            break;
    }
}

function handleFilter(e) {
    const filter = e.target.value;
    const section = e.target.closest('.dashboard-section').id;
    
    switch(section) {
        case 'downloads':
            filterDownloadsByTime(filter);
            break;
    }
}

function filterDownloads(query) {
    const filtered = userDownloads.filter(download => 
        download.title.toLowerCase().includes(query) ||
        download.author.toLowerCase().includes(query) ||
        getSubjectName(download.subject).toLowerCase().includes(query)
    );
    renderFilteredDownloads(filtered);
}

function filterDownloadsByTime(timeFilter) {
    const now = new Date();
    let filtered = userDownloads;
    
    if (timeFilter === 'today') {
        filtered = userDownloads.filter(download => {
            const downloadDate = new Date(download.downloadDate);
            return downloadDate.toDateString() === now.toDateString();
        });
    } else if (timeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = userDownloads.filter(download => {
            const downloadDate = new Date(download.downloadDate);
            return downloadDate >= weekAgo;
        });
    } else if (timeFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = userDownloads.filter(download => {
            const downloadDate = new Date(download.downloadDate);
            return downloadDate >= monthAgo;
        });
    }
    
    renderFilteredDownloads(filtered);
}

function renderFilteredDownloads(downloads) {
    const container = document.getElementById('downloadsList');
    if (!container) return;
    
    if (downloads.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Hech narsa topilmadi</h3>
                <p>Qidiruv so'zingizni o'zgartiring yoki filterlarni tozalang</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = downloads.map(download => `
        <div class="download-list-item">
            <div class="download-list-icon">
                <i class="${getFormatIcon(download.format)}"></i>
            </div>
            <div class="download-list-content">
                <h4>${download.title}</h4>
                <p>${getSubjectName(download.subject)} • ${download.author}</p>
            </div>
            <div class="download-list-meta">
                <div class="download-list-time">${formatDate(download.downloadDate)}</div>
                <div class="download-list-actions">
                    <button class="btn btn-xs btn-primary" onclick="downloadDocument(${download.id})">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-xs btn-secondary" onclick="addToFavorites(${download.id})">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Document actions - moved to bottom of file for proper implementation

function addToFavorites(id) {
    const download = userDownloads.find(d => d.id === id);
    if (download && !userFavorites.find(f => f.id === id)) {
        userFavorites.push({
            id: download.id,
            title: download.title,
            subject: download.subject,
            format: download.format,
            author: download.author
        });
        
        updateStatistics();
        showNotification('Sevimli qilindi!', 'success');
    } else {
        showNotification('Bu hujjat allaqachon sevimlilarda', 'info');
    }
}

function removeFromFavorites(id) {
    userFavorites = userFavorites.filter(f => f.id !== id);
    loadFavorites();
    updateStatistics();
    showNotification('Sevimlilardan olib tashlandi', 'success');
}

// Profile actions
function changeAvatar() {
    const avatarIcons = [
        'fas fa-user-circle',
        'fas fa-user-graduate',
        'fas fa-user-tie',
        'fas fa-user-astronaut',
        'fas fa-user-ninja',
        'fas fa-user-md',
        'fas fa-user-secret',
        'fas fa-smile',
        'fas fa-smile-beam',
        'fas fa-grin-stars'
    ];
    
    const currentIcon = document.querySelector('#profileImage i');
    const currentIconClass = currentIcon.className;
    
    // Find current icon index
    let currentIndex = avatarIcons.findIndex(icon => currentIconClass.includes(icon.split(' ')[1]));
    
    // Move to next icon (or first if not found)
    const nextIndex = (currentIndex + 1) % avatarIcons.length;
    const newIcon = avatarIcons[nextIndex];
    
    // Update the icon
    currentIcon.className = newIcon;
    
    // Update navigation avatar too
    const navAvatar = document.querySelector('.user-avatar i');
    if (navAvatar) {
        navAvatar.className = newIcon;
    }
    
    // Save preference
    localStorage.setItem('userAvatarIcon', newIcon);
    
    // Show notification
    showNotification('Avatar o\'zgartirildi!', 'success');
    
    // Add notification
    addNotification('system', 'Avatar yangilandi', 'Profil rasmingiz o\'zgartirildi');
}

function resetProfile() {
    loadProfileForm();
    showNotification('Profil ma\'lumotlari qaytarildi', 'info');
}

function deleteAccount() {
    if (confirm('Hisobingizni butunlay o\'chirishni xohlaysizmi? Bu amal qaytarib bo\'lmaydi.')) {
        if (confirm('Bu amalni tasdiqlash uchun "DELETE" deb yozing')) {
            showNotification('Hisob o\'chirish funksiyasi tez orada qo\'shiladi', 'info');
        }
    }
}

function contactAdmin() {
    showNotification('Admin bilan bog\'lanish funksiyasi tez orada qo\'shiladi', 'info');
}

// Notifications
function toggleNotifications() {
    const panel = document.getElementById('notificationsPanel');
    panel.classList.toggle('active');
    
    if (panel.classList.contains('active')) {
        loadNotifications();
        markNotificationsAsRead();
    }
}

// Load notifications
function loadNotifications() {
    const container = document.getElementById('notificationsList');
    if (!container) return;
    
    // Load from localStorage
    const savedNotifications = localStorage.getItem('userNotifications');
    if (savedNotifications) {
        userNotifications = JSON.parse(savedNotifications);
    }
    
    if (userNotifications.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #6b7280;">
                <i class="fas fa-bell" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                <p>Bildirishnomalar yo'q</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userNotifications.map(notification => `
        <div class="notification-item ${notification.read ? 'read' : 'unread'}">
            <div class="notification-icon">
                <i class="${getNotificationTypeIcon(notification.type)}"></i>
            </div>
            <div class="notification-content">
                <p>${notification.message}</p>
                <span>${notification.details || ''}</span>
            </div>
            <div class="notification-time">${formatTimeAgo(notification.createdAt)}</div>
        </div>
    `).join('');
}

// Add notification
function addNotification(type, message, details = '') {
    const notification = {
        id: Date.now(),
        type: type,
        message: message,
        details: details,
        read: false,
        createdAt: new Date().toISOString()
    };
    
    userNotifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (userNotifications.length > 50) {
        userNotifications = userNotifications.slice(0, 50);
    }
    
    // Save to localStorage
    localStorage.setItem('userNotifications', JSON.stringify(userNotifications));
    
    // Update notification badge
    updateNotificationBadge();
}

// Mark notifications as read
function markNotificationsAsRead() {
    userNotifications.forEach(notification => {
        notification.read = true;
    });
    
    localStorage.setItem('userNotifications', JSON.stringify(userNotifications));
    updateNotificationBadge();
}

// Update notification badge
function updateNotificationBadge() {
    const badge = document.querySelector('.notification-badge');
    if (!badge) return;
    
    const unreadCount = userNotifications.filter(n => !n.read).length;
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Get notification type icon
function getNotificationTypeIcon(type) {
    const icons = {
        download: 'fas fa-download',
        favorite: 'fas fa-heart',
        document: 'fas fa-file-alt',
        system: 'fas fa-info-circle',
        warning: 'fas fa-exclamation-triangle',
        success: 'fas fa-check-circle'
    };
    return icons[type] || 'fas fa-bell';
}

// Format time ago
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Hozirgina';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} daqiqa oldin`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} soat oldin`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} kun oldin`;
    }
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
function getFormatIcon(format) {
    const icons = {
        'ppt': 'fas fa-file-powerpoint',
        'pdf': 'fas fa-file-pdf',
        'doc': 'fas fa-file-word',
        'xlsx': 'fas fa-file-excel'
    };
    return icons[format] || 'fas fa-file';
}

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

function getUniversityName(universityId) {
    const universities = {
        'tashkent-university': 'Toshkent Davlat Universiteti',
        'tashkent-tech': 'Toshkent Axborot Texnologiyalari Universiteti',
        'samarkand-university': 'Samarqand Davlat Universiteti',
        'bukhara-university': 'Buxoro Davlat Universiteti',
        'namangan-university': 'Namangan Davlat Universiteti',
        'andijan-university': 'Andijon Davlat Universiteti',
        'fergana-university': 'Farg\'ona Davlat Universiteti',
        'other': 'Boshqa'
    };
    return universities[universityId] || universityId;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    
    // Uzbek month names
    const months = {
        0: 'yanvar',
        1: 'fevral',
        2: 'mart',
        3: 'aprel',
        4: 'may',
        5: 'iyun',
        6: 'iyul',
        7: 'avgust',
        8: 'sentabr',
        9: 'oktabr',
        10: 'noyabr',
        11: 'dekabr'
    };

    // Format: "9-sentabr, 2025-yil"
    return `${date.getDate()}-${months[date.getMonth()]}, ${date.getFullYear()}-yil`;
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

// ===== DOCUMENT BROWSING FUNCTIONALITY =====

// Setup document browsing
function setupDocumentBrowsing() {
    // Setup search
    const searchInput = document.getElementById('documentSearch');
    if (searchInput) {
        searchInput.addEventListener('input', handleDocumentSearch);
    }
    
    // Setup filters
    const subjectFilter = document.getElementById('subjectFilter');
    if (subjectFilter) {
        subjectFilter.addEventListener('change', handleDocumentFilter);
    }
    
    const formatFilter = document.getElementById('formatFilter');
    if (formatFilter) {
        formatFilter.addEventListener('change', handleDocumentFilter);
    }
    
    // Load documents
    loadAllDocuments();
}

// Handle document search
function handleDocumentSearch(e) {
    currentFilters.search = e.target.value.toLowerCase();
    applyDocumentFilters();
}

// Handle document filter
function handleDocumentFilter(e) {
    const filterType = e.target.id === 'subjectFilter' ? 'subject' : 'format';
    currentFilters[filterType] = e.target.value;
    applyDocumentFilters();
}

// Apply document filters
function applyDocumentFilters() {
    let filteredDocuments = documentsData.filter(doc => {
        const matchesSearch = !currentFilters.search || 
            doc.title.toLowerCase().includes(currentFilters.search) ||
            doc.description.toLowerCase().includes(currentFilters.search) ||
            doc.author.toLowerCase().includes(currentFilters.search);
        
        const matchesSubject = !currentFilters.subject || doc.subject === currentFilters.subject;
        const matchesFormat = !currentFilters.format || doc.format === currentFilters.format;
        
        return matchesSearch && matchesSubject && matchesFormat;
    });
    
    renderDocuments(filteredDocuments);
}

// Load all documents
function loadAllDocuments() {
    renderDocuments(documentsData);
}

// Render documents
function renderDocuments(documents) {
    const container = document.getElementById('allDocumentsGrid');
    if (!container) return;
    
    if (documents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h3>Hujjatlar topilmadi</h3>
                <p>Qidiruv shartlariga mos hujjatlar yo'q</p>
            </div>
        `;
        return;
    }
    
    const documentsToShow = documents.slice(0, displayedDocuments);
    
    container.innerHTML = documentsToShow.map(doc => `
        <div class="document-card enhanced">
            <div class="document-header">
                <div class="document-format">
                    <i class="${getFormatIcon(doc.format)}"></i>
                    ${doc.format.toUpperCase()}
                </div>
                <div class="document-actions">
                    <button class="btn-icon" onclick="toggleFavorite(${doc.id})" title="Sevimli">
                        <i class="fas fa-heart ${isFavorite(doc.id) ? 'favorited' : ''}"></i>
                    </button>
                    <button class="btn-icon" onclick="viewDocumentDetails(${doc.id})" title="Batafsil">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
            <div class="document-content">
                <h3 class="document-title">${doc.title}</h3>
                <p class="document-subject">
                    <i class="${getSubjectIcon(doc.subject)}"></i>
                    ${getSubjectName(doc.subject)}
                </p>
                <p class="document-description">${doc.description || 'Tavsif mavjud emas'}</p>
                <div class="document-meta">
                    <span><i class="fas fa-user"></i> ${doc.author}</span>
                    <span><i class="fas fa-download"></i> ${doc.downloadCount || 0} yuklab olingan</span>
                    <span><i class="fas fa-file"></i> ${doc.size || 'N/A'}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(doc.uploadDate || new Date().toISOString())}</span>
                </div>
            </div>
            <div class="document-footer">
                <button class="btn btn-primary" onclick="downloadDocument(${doc.id})">
                    <i class="fas fa-download"></i> Yuklab olish
                </button>
                <button class="btn btn-secondary btn-sm" onclick="shareDocument(${doc.id})" style="margin-left: 0.5rem;">
                    <i class="fas fa-share"></i> Ulashish
                </button>
            </div>
        </div>
    `).join('');
    
    // Show/hide load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.style.display = documents.length > displayedDocuments ? 'block' : 'none';
    }
}

// Load more documents
function loadMoreDocuments() {
    displayedDocuments += 12;
    applyDocumentFilters();
}

// Download document
function downloadDocument(docId) {
    const doc = documentsData.find(d => d.id === docId);
    if (!doc) {
        showNotification('Hujjat topilmadi', 'error');
        return;
    }
    
    // Show download notification
    showNotification(`${doc.title} yuklab olinmoqda...`, 'info');
    
    // Try different file path options
    let filePath = doc.filePath || doc.file || doc.url;
    
    // If no direct file path, try to construct one from admin uploads
    if (!filePath && doc.filename) {
        filePath = `uploads/${doc.filename}`;
    }
    
    // If still no file path, check if it's a demo/sample file
    if (!filePath) {
        // For demo purposes, create a placeholder file or show appropriate message
        console.warn('No file path found for document:', doc);
        
        // Try to download as a text file with document info (for demo)
        const documentInfo = `${doc.title}\n\nAuthor: ${doc.author}\nSubject: ${getSubjectName(doc.subject)}\nFormat: ${doc.format}\nDescription: ${doc.description || 'No description available'}\n\nThis is a placeholder file. The actual document should be uploaded by the admin.`;
        
        const blob = new Blob([documentInfo], { type: 'text/plain' });
        filePath = URL.createObjectURL(blob);
    }
    
    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.href = filePath;
    downloadLink.download = `${doc.title}.${doc.format || 'txt'}`;
    downloadLink.style.display = 'none';
    
    document.body.appendChild(downloadLink);
    
    try {
        // Trigger download
        downloadLink.click();
        
        // Update download count
        doc.downloadCount = (doc.downloadCount || 0) + 1;
        
        // Add to user downloads
        const downloadRecord = {
            id: Date.now(),
            docId: docId,
            title: doc.title,
            subject: doc.subject,
            format: doc.format || 'txt',
            downloadDate: new Date().toISOString(),
            author: doc.author,
            size: doc.size || 'Unknown',
            filePath: filePath
        };
        userDownloads.unshift(downloadRecord);
        
        // Update documents data in localStorage
        localStorage.setItem('documents', JSON.stringify(documentsData));
        
        // Save user downloads
        localStorage.setItem('userDownloads', JSON.stringify(userDownloads));
        
        // Update UI
        if (typeof renderDocuments === 'function') {
            renderDocuments(documentsData);
        }
        loadRecentDownloads();
        updateStatistics();
        
        // Add notification
        addNotification('download', 'Hujjat muvaffaqiyatli yuklab olindi', `${doc.title} - ${getSubjectName(doc.subject)}`);
        
        // Show success notification
        showNotification(`${doc.title} muvaffaqiyatli yuklab olindi!`, 'success');
        
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Yuklab olishda xatolik yuz berdi. Iltimos, admin bilan bog\'laning.', 'error');
    } finally {
        // Clean up
        document.body.removeChild(downloadLink);
        
        // Clean up blob URL if created
        if (filePath && filePath.startsWith('blob:')) {
            setTimeout(() => URL.revokeObjectURL(filePath), 1000);
        }
    }
}

// Toggle favorite
function toggleFavorite(docId) {
    const doc = documentsData.find(d => d.id === docId);
    if (!doc) return;
    
    const existingIndex = userFavorites.findIndex(fav => fav.id === docId);
    
    if (existingIndex > -1) {
        userFavorites.splice(existingIndex, 1);
        addNotification('favorite', 'Sevimlilardan olib tashlandi', `${doc.title} - ${getSubjectName(doc.subject)}`);
        showNotification('Sevimlilardan olib tashlandi', 'info');
    } else {
        userFavorites.push({
            id: docId,
            title: doc.title,
            subject: doc.subject,
            format: doc.format,
            author: doc.author,
            addedDate: new Date().toISOString().split('T')[0]
        });
        addNotification('favorite', 'Sevimlilarga qo\'shildi', `${doc.title} - ${getSubjectName(doc.subject)}`);
        showNotification('Sevimlilarga qo\'shildi', 'success');
    }
    
    // Save to localStorage
    localStorage.setItem('userFavorites', JSON.stringify(userFavorites));
    
    // Update UI
    renderDocuments(documentsData);
    loadFavorites();
}

// Check if document is favorite
function isFavorite(docId) {
    return userFavorites.some(fav => fav.id === docId);
}

// Utility functions
function getFormatIcon(format) {
    const icons = {
        'ppt': 'fas fa-file-powerpoint',
        'pdf': 'fas fa-file-pdf',
        'doc': 'fas fa-file-word',
        'xlsx': 'fas fa-file-excel'
    };
    return icons[format] || 'fas fa-file';
}

function getSubjectIcon(subjectId) {
    const subject = subjectsData.find(s => s.id === subjectId);
    return subject ? subject.icon : 'fas fa-book';
}

function getSubjectName(subjectId) {
    const subject = subjectsData.find(s => s.id === subjectId);
    return subject ? subject.name : subjectId;
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

// Handle URL parameters (e.g., subject filtering from homepage)
function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const subjectParam = urlParams.get('subject');
    
    if (subjectParam) {
        // Show documents section and filter by subject
        showSection('documents');
        
        // Set the subject filter
        const subjectFilter = document.getElementById('subjectFilter');
        if (subjectFilter) {
            subjectFilter.value = subjectParam;
        }
        
        // Apply the filter
        currentFilters.subject = subjectParam;
        applyDocumentFilters();
        
        // Show notification about the filter
        const subject = subjectsData.find(s => s.id === subjectParam);
        if (subject) {
            showNotification(`${subject.name} fani bo'yicha filtr qo'llandi`, 'info');
        }
        
        // Remove the parameter from URL to clean it up
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// View document details in modal
function viewDocumentDetails(docId) {
    const doc = documentsData.find(d => d.id === docId);
    if (!doc) return;
    
    const modal = document.createElement('div');
    modal.className = 'doc-details-modal-overlay';
    modal.innerHTML = `
        <div class="doc-details-modal">
            <div class="doc-details-header">
                <div class="doc-icon-large">
                    <i class="${getFormatIcon(doc.format)}"></i>
                </div>
                <div class="doc-header-info">
                    <h3>${doc.title}</h3>
                    <p class="doc-subject-badge">
                        <i class="${getSubjectIcon(doc.subject)}"></i>
                        ${getSubjectName(doc.subject)}
                    </p>
                </div>
                <button class="close-btn" onclick="closeDocDetailsModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="doc-details-content">
                <div class="doc-info-grid">
                    <div class="info-item">
                        <i class="fas fa-user"></i>
                        <div>
                            <strong>Muallif</strong>
                            <p>${doc.author}</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-file"></i>
                        <div>
                            <strong>Fayl turi</strong>
                            <p>${doc.format.toUpperCase()}</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-hdd"></i>
                        <div>
                            <strong>Hajmi</strong>
                            <p>${doc.size || 'N/A'}</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar"></i>
                        <div>
                            <strong>Yuklangan sana</strong>
                            <p>${formatDate(doc.uploadDate || new Date().toISOString())}</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-download"></i>
                        <div>
                            <strong>Yuklab olingan</strong>
                            <p>${doc.downloadCount || 0} marta</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-tag"></i>
                        <div>
                            <strong>Status</strong>
                            <p><span class="status-badge active">Aktiv</span></p>
                        </div>
                    </div>
                </div>
                ${doc.description ? `
                    <div class="doc-description-full">
                        <h4><i class="fas fa-align-left"></i> Tavsif</h4>
                        <p>${doc.description}</p>
                    </div>
                ` : ''}
            </div>
            <div class="doc-details-actions">
                <button class="btn btn-primary" onclick="downloadDocument(${doc.id}); closeDocDetailsModal();">
                    <i class="fas fa-download"></i> Yuklab olish
                </button>
                <button class="btn btn-secondary" onclick="addToFavorites(${doc.id})">
                    <i class="fas fa-heart"></i> Sevimli qilish
                </button>
                <button class="btn btn-outline" onclick="shareDocument(${doc.id})">
                    <i class="fas fa-share"></i> Ulashish
                </button>
            </div>
        </div>
    `;
    
    // Add styles
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const modalContent = modal.querySelector('.doc-details-modal');
    modalContent.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 0;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        animation: modalSlideIn 0.3s ease;
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeDocDetailsModal();
        }
    });
}

// Close document details modal
function closeDocDetailsModal() {
    const modal = document.querySelector('.doc-details-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Share document function
function shareDocument(docId) {
    const doc = documentsData.find(d => d.id === docId);
    if (!doc) return;
    
    if (navigator.share) {
        navigator.share({
            title: doc.title,
            text: `${doc.title} - ${getSubjectName(doc.subject)} fani bo'yicha material`,
            url: window.location.href
        }).catch(err => {
            console.log('Ulashishda xatolik:', err);
            fallbackShare(doc);
        });
    } else {
        fallbackShare(doc);
    }
}

// Fallback share function
function fallbackShare(doc) {
    const shareText = `${doc.title} - ${getSubjectName(doc.subject)} fani bo'yicha material\nSukun Slide platformasida ko'ring: ${window.location.href}`;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('Havolasi nusxalandi!', 'success');
        }).catch(() => {
            showShareModal(shareText);
        });
    } else {
        showShareModal(shareText);
    }
}

// Show share modal
function showShareModal(shareText) {
    const modal = document.createElement('div');
    modal.className = 'share-modal-overlay';
    modal.innerHTML = `
        <div class="share-modal">
            <h4>Materialini Ulashing</h4>
            <textarea readonly style="width: 100%; height: 100px; margin: 1rem 0; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">${shareText}</textarea>
            <div class="share-actions">
                <button class="btn btn-primary" onclick="copyShareText('${shareText.replace(/'/g, "\'")}')">Nusxalash</button>
                <button class="btn btn-secondary" onclick="closeShareModal()">Yopish</button>
            </div>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    `;
    
    document.body.appendChild(modal);
}

// Copy share text
function copyShareText(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Nusxalandi!', 'success');
        closeShareModal();
    });
}

// Close share modal
function closeShareModal() {
    const modal = document.querySelector('.share-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Helper function for testing - creates sample documents
function createSampleDocuments() {
    const sampleDocuments = [
        {
            id: 1,
            title: "Matematika - Algebra Asoslari",
            description: "Algebra fanining asosiy tushunchalari va formulalari",
            author: "Prof. Ahmad Nazarov",
            subject: "mathematics",
            format: "pdf",
            size: "2.5 MB",
            uploadDate: "2024-01-15",
            downloadCount: 156
        },
        {
            id: 2,
            title: "Fizika - Mexanika Qonunlari",
            description: "Mexanika bo'limining asosiy qonunlari va masalalar",
            author: "Dr. Gulnora Karimova",
            subject: "physics",
            format: "ppt",
            size: "4.8 MB",
            uploadDate: "2024-01-10",
            downloadCount: 89
        },
        {
            id: 3,
            title: "Kimyo - Anorganik Birikmalar",
            description: "Anorganik kimyo fanidan asosiy birikmalar va ularning xossalari",
            author: "Prof. Rustam Toshmatov",
            subject: "chemistry",
            format: "doc",
            size: "1.8 MB",
            uploadDate: "2024-01-08",
            downloadCount: 67
        }
    ];
    
    // Save to localStorage
    localStorage.setItem('documents', JSON.stringify(sampleDocuments));
    documentsData = sampleDocuments;
    
    // Reload the documents
    loadAllDocuments();
    loadRecommendedDocuments();
    
    console.log('Sample documents created successfully!');
    showNotification('Namuna hujjatlar yaratildi!', 'success');
    
    // Add notification
    addNotification('system', 'Namuna hujjatlar qo\'shildi', 'Test uchun 3 ta hujjat yaratildi');
}

// Make function available globally for console access
window.createSampleDocuments = createSampleDocuments;

// Enhance form elements
function enhanceFormElements() {
    // Wrap all enhanced select elements in custom-select container
    document.querySelectorAll('select.filter-select.enhanced').forEach(select => {
        if (!select.parentElement.classList.contains('custom-select')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'custom-select';
            select.parentNode.insertBefore(wrapper, select);
            wrapper.appendChild(select);
        }
    });

    // Add password strength indicator
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            const strength = calculatePasswordStrength(this.value);
            const strengthBar = document.querySelector('.strength-bar');
            const strengthText = document.querySelector('.strength-text');
            
            if (strengthBar && strengthText) {
                strengthBar.style.setProperty('--strength-width', `${strength.score * 25}%`);
                strengthBar.style.setProperty('--strength-color', strength.color);
                strengthText.textContent = strength.message;
            }
        });
    }
}

// Calculate password strength
function calculatePasswordStrength(password) {
    let score = 0;
    let message = 'Parol kiritilmagan';
    let color = '#e5e7eb';

    if (password.length > 0) {
        score++;
        message = 'Juda zaif';
        color = '#ef4444';
    }
    if (password.length >= 8) {
        score++;
        message = 'Zaif';
        color = '#f59e0b';
    }
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
        score++;
        message = 'O\'rtacha';
        color = '#10b981';
    }
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
        score++;
        message = 'Kuchli';
        color = '#059669';
    }

    return { score, message, color };
}

// Call enhanceFormElements when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    enhanceFormElements();
});

// ===== DARK MODE FUNCTIONALITY =====

// Initialize dark mode
function initializeDarkMode() {
    const savedTheme = localStorage.getItem('theme');
    const darkModeIcon = document.getElementById('darkModeIcon');
    
    if (savedTheme === 'dark') {
        enableDarkMode();
    } else {
        disableDarkMode();
    }
    
    // Update icon based on current theme
    updateDarkModeIcon();
}

// Toggle dark mode
function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        disableDarkMode();
        localStorage.setItem('theme', 'light');
    } else {
        enableDarkMode();
        localStorage.setItem('theme', 'dark');
    }
    
    updateDarkModeIcon();
    
    // Add notification
    const theme = currentTheme === 'dark' ? 'yorug\'' : 'tungi';
    addNotification('info', `${theme.charAt(0).toUpperCase() + theme.slice(1)} rejim yoqildi`, 'Rejim muvaffaqiyatli o\'zgartirildi');
}

// Enable dark mode
function enableDarkMode() {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-mode');
}

// Disable dark mode
function disableDarkMode() {
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.classList.remove('dark-mode');
}

// Update dark mode icon
function updateDarkModeIcon() {
    const darkModeIcon = document.getElementById('darkModeIcon');
    if (!darkModeIcon) return;
    
    const currentTheme = document.documentElement.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        darkModeIcon.className = 'fas fa-sun';
        darkModeIcon.parentElement.title = 'Yorug\' rejim';
    } else {
        darkModeIcon.className = 'fas fa-moon';
        darkModeIcon.parentElement.title = 'Tungi rejim';
    }
}

// Enhanced functionality for new features

// Clear search functions
function clearDocumentSearch() {
    const searchInput = document.getElementById('documentSearch');
    if (searchInput) {
        searchInput.value = '';
        currentFilters.search = '';
        applyDocumentFilters();
    }
}

function clearDownloadsSearch() {
    const searchInput = document.getElementById('downloadsSearch');
    if (searchInput) {
        searchInput.value = '';
        filterDownloads('');
    }
}

function clearFavoritesSearch() {
    const searchInput = document.getElementById('favoritesSearch');
    if (searchInput) {
        searchInput.value = '';
        loadFavorites();
    }
}

// Reset filters
function resetFilters() {
    currentFilters = { search: '', subject: '', format: '' };
    
    // Reset filter inputs
    const searchInput = document.getElementById('documentSearch');
    const subjectFilter = document.getElementById('subjectFilter');
    const formatFilter = document.getElementById('formatFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    if (searchInput) searchInput.value = '';
    if (subjectFilter) subjectFilter.value = '';
    if (formatFilter) formatFilter.value = '';
    if (sortFilter) sortFilter.value = 'newest';
    
    applyDocumentFilters();
    showNotification('Filterlar tozalandi', 'info');
}

// Export functions
function exportDownloads() {
    const downloadsData = userDownloads.map(download => ({
        'Hujjat nomi': download.title,
        'Muallif': download.author,
        'Fan': getSubjectName(download.subject),
        'Format': download.format,
        'Yuklab olingan sana': formatDate(download.downloadDate),
        'Hajmi': download.size || 'N/A'
    }));
    
    exportToCSV(downloadsData, 'yuklab_olingan_hujjatlar.csv');
    showNotification('Yuklab olingan ma\'lumotlar eksport qilindi', 'success');
}

function exportFavorites() {
    const favoritesData = userFavorites.map(favorite => ({
        'Hujjat nomi': favorite.title,
        'Muallif': favorite.author,
        'Fan': getSubjectName(favorite.subject),
        'Format': favorite.format,
        'Qo\'shilgan sana': formatDate(favorite.addedDate)
    }));
    
    exportToCSV(favoritesData, 'sevimli_hujjatlar.csv');
    showNotification('Sevimli hujjatlar eksport qilindi', 'success');
}

function exportProfile() {
    if (!currentUser) return;
    
    const profileData = {
        'Ism': currentUser.firstName,
        'Familiya': currentUser.lastName,
        'Email': currentUser.email,
        'Telefon': currentUser.phone || '',
        'Universitet': getUniversityName(currentUser.university),
        'Kurs': currentUser.course || '',
        'Ro\'yxatdan o\'tgan': formatDate(currentUser.createdAt || '2024-01-01'),
        'Jami yuklab olingan': userDownloads.length,
        'Sevimli hujjatlar': userFavorites.length
    };
    
    const csvData = Object.entries(profileData).map(([key, value]) => `${key},${value}`).join('\n');
    downloadCSV(csvData, 'profil_malumotlari.csv');
    showNotification('Profil ma\'lumotlari yuklab olindi', 'success');
}

// CSV export utility
function exportToCSV(data, filename) {
    if (data.length === 0) {
        showNotification('Eksport qilish uchun ma\'lumotlar yo\'q', 'warning');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    downloadCSV(csvContent, filename);
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}

// Favorites management
function clearAllFavorites() {
    if (userFavorites.length === 0) {
        showNotification('Sevimli hujjatlar yo\'q', 'info');
        return;
    }
    
    if (confirm(`${userFavorites.length} ta sevimli hujjatni o\'chirishni xohlaysizmi?`)) {
        userFavorites = [];
        localStorage.setItem('userFavorites', JSON.stringify(userFavorites));
        loadFavorites();
        updateStatistics();
        showNotification('Barcha sevimli hujjatlar o\'chirildi', 'success');
        addNotification('system', 'Sevimlilar tozalandi', 'Barcha sevimli hujjatlar o\'chirildi');
    }
}

// Settings functions
function resetAllSettings() {
    if (confirm('Barcha sozlamalarni standart holatga qaytarishni xohlaysizmi?')) {
        // Reset theme
        localStorage.removeItem('theme');
        
        // Reset notifications
        const emailNotifications = document.getElementById('emailNotifications');
        const newDocuments = document.getElementById('newDocuments');
        const weeklyDigest = document.getElementById('weeklyDigest');
        
        if (emailNotifications) emailNotifications.checked = true;
        if (newDocuments) newDocuments.checked = true;
        if (weeklyDigest) weeklyDigest.checked = false;
        
        showNotification('Sozlamalar standart holatga qaytarildi', 'success');
        addNotification('system', 'Sozlamalar qaytarildi', 'Barcha sozlamalar standart qiymatlarga o\'rnatildi');
    }
}

function clearUserData() {
    if (confirm('Barcha ma\'lumotlaringizni (yuklab olinganlar, sevimlilar) o\'chirishni xohlaysizmi? Bu amal qaytarib bo\'lmaydi.')) {
        const confirmText = prompt('Tasdiqlash uchun "DELETE" deb yozing:');
        if (confirmText === 'DELETE') {
            // Clear all user data
            userDownloads = [];
            userFavorites = [];
            userNotifications = [];
            
            localStorage.removeItem('userDownloads');
            localStorage.removeItem('userFavorites');
            localStorage.removeItem('userNotifications');
            localStorage.removeItem('userAvatarIcon');
            
            // Reload sections
            loadUserData();
            loadNotifications();
            updateNotificationBadge();
            setUserAvatar();
            
            showNotification('Barcha ma\'lumotlar o\'chirildi', 'success');
            addNotification('system', 'Ma\'lumotlar tozalandi', 'Barcha foydalanuvchi ma\'lumotlari o\'chirildi');
        } else {
            showNotification('Tasdiq matnini noto\'g\'ri kiritdingiz', 'error');
        }
    }
}

// Update statistics with total documents
function updateStatistics() {
    const totalDownloads = document.getElementById('totalDownloads');
    const totalFavorites = document.getElementById('totalFavorites');
    const recentActivity = document.getElementById('recentActivity');
    const totalDocuments = document.getElementById('totalDocuments');
    const totalDownloadsStat = document.getElementById('totalDownloadsStat');
    const totalFavoritesStat = document.getElementById('totalFavoritesStat');
    const joinDate = document.getElementById('joinDate');
    const lastActivity = document.getElementById('lastActivity');
    
    // Update counts
    const downloadsCount = userDownloads.length;
    const favoritesCount = userFavorites.length;
    const documentsCount = documentsData.length;
    
    if (totalDownloads) totalDownloads.textContent = downloadsCount;
    if (totalFavorites) totalFavorites.textContent = favoritesCount;
    if (recentActivity) recentActivity.textContent = Math.min(downloadsCount, 7); // Active days this week
    if (totalDocuments) totalDocuments.textContent = documentsCount;
    if (totalDownloadsStat) totalDownloadsStat.textContent = downloadsCount;
    if (totalFavoritesStat) totalFavoritesStat.textContent = favoritesCount;
    
    // Update other stats
    if (joinDate) joinDate.textContent = formatDate(currentUser?.createdAt || '2024-01-01');
    if (lastActivity) lastActivity.textContent = downloadsCount > 0 ? formatDate(userDownloads[0].downloadDate) : 'Hozircha yo\'q';
    
    // Update section-specific counts
    const documentsCountEl = document.getElementById('documentsCount');
    const downloadsCountEl = document.getElementById('downloadsCount');
    const favoritesCountEl = document.getElementById('favoritesCount');
    
    if (documentsCountEl) documentsCountEl.textContent = documentsCount;
    if (downloadsCountEl) downloadsCountEl.textContent = downloadsCount;
    if (favoritesCountEl) favoritesCountEl.textContent = favoritesCount;
    
    // Update summary stats
    updateDownloadsSummary();
}

// Update downloads summary
function updateDownloadsSummary() {
    const downloadsThisMonth = document.getElementById('downloadsThisMonth');
    const totalSize = document.getElementById('totalSize');
    const favoritesFromDownloads = document.getElementById('favoritesFromDownloads');
    
    if (downloadsThisMonth) {
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const monthlyDownloads = userDownloads.filter(download => {
            const downloadDate = new Date(download.downloadDate);
            return downloadDate.getMonth() === thisMonth && downloadDate.getFullYear() === thisYear;
        });
        downloadsThisMonth.textContent = monthlyDownloads.length;
    }
    
    if (totalSize) {
        // Calculate approximate total size
        const estimatedSize = userDownloads.length * 2.5; // Assume average 2.5MB per file
        totalSize.textContent = `${estimatedSize.toFixed(1)} MB`;
    }
    
    if (favoritesFromDownloads) {
        const favoritedFromDownloads = userDownloads.filter(download => 
            userFavorites.some(fav => fav.id === download.docId)
        );
        favoritesFromDownloads.textContent = favoritedFromDownloads.length;
    }
}

// Mobile menu functionality
function setupMobileMenu() {
    // Show mobile menu button on mobile devices
    if (window.innerWidth <= 768) {
        const mobileBtn = document.querySelector('.mobile-menu-btn');
        if (mobileBtn) mobileBtn.style.display = 'block';
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        const mobileBtn = document.querySelector('.mobile-menu-btn');
        const sidebar = document.getElementById('mobileSidebar');
        
        if (window.innerWidth <= 768) {
            if (mobileBtn) mobileBtn.style.display = 'block';
        } else {
            if (mobileBtn) mobileBtn.style.display = 'none';
            if (sidebar) sidebar.classList.remove('mobile-open');
        }
    });
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('mobileSidebar');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
}

// Close mobile sidebar when clicking outside
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('mobileSidebar');
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    
    if (sidebar && sidebar.classList.contains('mobile-open')) {
        if (!sidebar.contains(event.target) && !mobileBtn.contains(event.target)) {
            sidebar.classList.remove('mobile-open');
        }
    }
});

// Initialize mobile menu when page loads
window.addEventListener('load', function() {
    setupMobileMenu();
});

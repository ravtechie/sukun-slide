// Subjects and documents data - loaded dynamically
let subjectsData = [];

// Initialize subjects data
function initializeSubjects() {
    // Default subjects structure
    const defaultSubjects = [
        {
            id: 'mathematics',
            name: 'Matematika',
            icon: 'fas fa-calculator',
            description: 'Algebra, geometriya, trigonometriya va boshqa matematik fanlar',
            color: '#3b82f6'
        },
        {
            id: 'physics',
            name: 'Fizika',
            icon: 'fas fa-atom',
            description: 'Mexanika, elektromagnetizm, termodinamika va boshqa fizik fanlar',
            color: '#ef4444'
        },
        {
            id: 'chemistry',
            name: 'Kimyo',
            icon: 'fas fa-flask',
            description: 'Organik va noorganik kimyo, analitik kimyo',
            color: '#10b981'
        },
        {
            id: 'biology',
            name: 'Biologiya',
            icon: 'fas fa-dna',
            description: 'Hujayra biologiyasi, genetika, ekologiya',
            color: '#8b5cf6'
        },
        {
            id: 'history',
            name: 'Tarix',
            icon: 'fas fa-landmark',
            description: 'O\'zbekiston tarixi, jahon tarixi',
            color: '#f59e0b'
        },
        {
            id: 'geography',
            name: 'Geografiya',
            icon: 'fas fa-globe',
            description: 'Fizik geografiya, iqtisodiy geografiya',
            color: '#06b6d4'
        },
        {
            id: 'literature',
            name: 'Adabiyot',
            icon: 'fas fa-book',
            description: 'O\'zbek adabiyoti, jahon adabiyoti',
            color: '#ec4899'
        },
        {
            id: 'english',
            name: 'Ingliz tili',
            icon: 'fas fa-language',
            description: 'Grammatika, lug\'at, nutq mahorati',
            color: '#84cc16'
        }
    ];
    
    // Load from localStorage if available, otherwise use defaults
    const savedSubjects = localStorage.getItem('subjects');
    if (savedSubjects) {
        try {
            subjectsData = JSON.parse(savedSubjects);
            // Add descriptions and colors if not present
            subjectsData = subjectsData.map(subject => {
                const defaultSubject = defaultSubjects.find(ds => ds.id === subject.id);
                return {
                    ...defaultSubject,
                    ...subject,
                    documentCount: documentsData.filter(doc => doc.subject === subject.id).length
                };
            });
        } catch (error) {
            console.error('Error loading subjects:', error);
            subjectsData = defaultSubjects;
        }
    } else {
        subjectsData = defaultSubjects;
        // Save to localStorage
        localStorage.setItem('subjects', JSON.stringify(subjectsData));
    }
    
    // Update document counts
    updateSubjectDocumentCounts();
}

let documentsData = [];

// DOM Elements
const subjectsGrid = document.getElementById('subjectsGrid');
const documentsGrid = document.getElementById('documentsGrid');
const searchInput = document.getElementById('searchInput');
const subjectFilter = document.getElementById('subjectFilter');
const formatFilter = document.getElementById('formatFilter');
const searchBtn = document.querySelector('.search-btn');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

// State
let currentDocuments = [];
let displayedDocuments = 6;
let currentFilters = {
    search: '',
    subject: '',
    format: ''
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadFavorites();
    syncDocumentsFromAdmin();
    initializeSubjects();
    renderSubjects();
    renderDocuments();
    updateHomepageStats();
    setupEventListeners();
    setupMobileNavigation();
    setupNavbarScroll();
});

// Sync documents from admin panel
function syncDocumentsFromAdmin() {
    // Try to get documents from localStorage (saved by admin panel)
    const savedDocuments = localStorage.getItem('documents');
    if (savedDocuments) {
        documentsData = JSON.parse(savedDocuments);
        console.log('Loaded documents from localStorage:', documentsData.length);
    }
    
    // Also try to get from admin documents if available
    if (typeof adminDocuments !== 'undefined' && adminDocuments.length > 0) {
        documentsData = [...adminDocuments];
        console.log('Loaded documents from adminDocuments:', documentsData.length);
    }
    
    // Update subject document counts
    updateSubjectDocumentCounts();
    
    // Initialize current documents for display
    currentDocuments = [...documentsData];
}

// Refresh documents when page becomes visible (in case uploaded in another tab)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        syncDocumentsFromAdmin();
        renderSubjects();
        renderDocuments();
    }
});

// Manual refresh function
function refreshDocuments() {
    showNotification('Hujjatlar yangilanmoqda...', 'info');
    
    setTimeout(() => {
        syncDocumentsFromAdmin();
        renderSubjects();
        renderDocuments();
        showNotification('Hujjatlar muvaffaqiyatli yangilandi!', 'success');
    }, 500);
}

// Update subject document counts based on actual documents
function updateSubjectDocumentCounts() {
    subjectsData.forEach(subject => {
        const count = documentsData.filter(doc => doc.subject === subject.id).length;
        subject.documentCount = count;
    });
}

// Get total downloads for a subject
function getSubjectDownloads(subjectId) {
    const subjectDocs = documentsData.filter(doc => doc.subject === subjectId);
    return subjectDocs.reduce((total, doc) => total + (doc.downloadCount || 0), 0);
}

// Render subjects
function renderSubjects() {
    if (!subjectsGrid) return;
    
    subjectsGrid.innerHTML = subjectsData.map(subject => {
        const docCount = documentsData.filter(doc => doc.subject === subject.id).length;
        const downloadCount = getSubjectDownloads(subject.id);
        
        return `
            <div class="subject-card" onclick="viewSubject('${subject.id}')" style="cursor: pointer;">
                <div class="subject-icon" style="background: ${subject.color}">
                    <i class="${subject.icon}"></i>
                </div>
                <h3>${subject.name}</h3>
                <p>${subject.description}</p>
                <div class="subject-stats">
                    <span><i class="fas fa-file-alt"></i> ${docCount} material</span>
                    <span><i class="fas fa-download"></i> ${downloadCount} yuklab olingan</span>
                </div>
                <div class="subject-actions">
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewSubjectFiles('${subject.id}')">
                        <i class="fas fa-list"></i> Fayllar (${docCount})
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); filterBySubject('${subject.id}')">
                        <i class="fas fa-filter"></i> Filtr
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Render documents
function renderDocuments() {
    if (currentDocuments.length === 0) {
        documentsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #6b7280;">
                <i class="fas fa-file-alt" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                <h3>Hali hujjatlar yo'q</h3>
                <p>Admin tomonidan hujjatlar yuklanganda bu yerda ko'rinadi</p>
            </div>
        `;
        loadMoreBtn.style.display = 'none';
        return;
    }
    
    const documentsToShow = currentDocuments.slice(0, displayedDocuments);
    
    documentsGrid.innerHTML = documentsToShow.map(doc => `
        <div class="document-card">
            <div class="document-header">
                <div class="document-format">
                    <i class="${getFormatIcon(doc.format)}"></i>
                    ${doc.format.toUpperCase()}
                </div>
                <div class="document-actions">
                    <button class="btn-icon" onclick="toggleFavorite(${doc.id})" title="Sevimli">
                        <i class="fas fa-heart ${isFavorite(doc.id) ? 'favorited' : ''}"></i>
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
                    <span><i class="fas fa-download"></i> ${doc.downloadCount || 0}</span>
                    <span><i class="fas fa-file"></i> ${doc.size}</span>
                </div>
            </div>
            <div class="document-footer">
                ${isUserLoggedIn() ? 
                    `<button class="btn btn-primary" onclick="downloadDocument(${doc.id})">
                        <i class="fas fa-download"></i> Yuklab olish
                    </button>` :
                    `<button class="btn btn-outline" onclick="showAuthRequiredModal(${doc.id})">
                        <i class="fas fa-lock"></i> Kirish kerak
                    </button>`
                }
                <button class="btn btn-secondary btn-sm" onclick="viewDocumentInfo(${doc.id})" style="margin-left: 0.5rem;">
                    <i class="fas fa-info-circle"></i> Ma'lumot
                </button>
            </div>
        </div>
    `).join('');
    
    // Show/hide load more button
    loadMoreBtn.style.display = currentDocuments.length > displayedDocuments ? 'block' : 'none';
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', handleSearch);
    searchBtn.addEventListener('click', handleSearch);
    
    // Filter functionality
    subjectFilter.addEventListener('change', handleFilter);
    formatFilter.addEventListener('change', handleFilter);
    
    // Load more functionality
    loadMoreBtn.addEventListener('click', loadMoreDocuments);
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', handleNavbarScroll);
}

// Setup mobile navigation
function setupMobileNavigation() {
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    }
}

// Handle search
function handleSearch() {
    currentFilters.search = searchInput.value.toLowerCase();
    applyFilters();
}

// Handle filter changes
function handleFilter() {
    currentFilters.subject = subjectFilter.value;
    currentFilters.format = formatFilter.value;
    applyFilters();
}

// Apply all filters
function applyFilters() {
    console.log('applyFilters called with filters:', currentFilters);
    console.log('Total documents before filtering:', documentsData.length);
    
    currentDocuments = documentsData.filter(doc => {
        const matchesSearch = !currentFilters.search || 
            doc.title.toLowerCase().includes(currentFilters.search) ||
            doc.description.toLowerCase().includes(currentFilters.search) ||
            getSubjectName(doc.subject).toLowerCase().includes(currentFilters.search);
        
        const matchesSubject = !currentFilters.subject || doc.subject === currentFilters.subject;
        const matchesFormat = !currentFilters.format || doc.format === currentFilters.format;
        
        return matchesSearch && matchesSubject && matchesFormat;
    });
    
    console.log('Filtered documents count:', currentDocuments.length);
    
    displayedDocuments = 6;
    renderDocuments();
}

// View subject files - redirect to dashboard if logged in, otherwise to browse page
function viewSubjectFiles(subjectId) {
    if (isUserLoggedIn()) {
        // Redirect to dashboard with subject filter
        window.location.href = `dashboard.html?subject=${subjectId}`;
    } else {
        // Redirect to browse page with subject filter
        window.location.href = `browse.html?subject=${subjectId}`;
    }
}

// View subject documents (for homepage filtering)
function viewSubject(subjectId) {
    const subject = subjectsData.find(s => s.id === subjectId);
    if (!subject) return;
    
    // Show subject-specific documents
    showSubjectDocuments(subjectId, subject.name);
    
    // Scroll to documents section
    const documentsSection = document.querySelector('.documents-section');
    if (documentsSection) {
        documentsSection.scrollIntoView({
            behavior: 'smooth'
        });
    }
}

// Show documents for a specific subject
function showSubjectDocuments(subjectId, subjectName) {
    const subjectDocs = documentsData.filter(doc => doc.subject === subjectId);
    
    // Update section header
    const sectionHeader = document.querySelector('.documents-section .section-header');
    if (sectionHeader) {
        sectionHeader.innerHTML = `
            <div class="header-content">
                <div>
                    <h2>${subjectName} Materiallari</h2>
                    <p>${subjectDocs.length} ta material mavjud</p>
                </div>
                <div class="subject-header-actions">
                    <button class="btn btn-sm btn-outline" onclick="showAllDocuments()">
                        <i class="fas fa-list"></i> Barcha hujjatlar
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="refreshDocuments()">
                        <i class="fas fa-sync-alt"></i> Yangilash
                    </button>
                </div>
            </div>
        `;
    }
    
    // Update current documents and render
    currentDocuments = [...subjectDocs];
    displayedDocuments = 6;
    renderDocuments();
}

// Show all documents (reset view)
function showAllDocuments() {
    const sectionHeader = document.querySelector('.documents-section .section-header');
    if (sectionHeader) {
        sectionHeader.innerHTML = `
            <div class="header-content">
                <div>
                    <h2>Oxirgi Materiallar</h2>
                    <p>Eng so'nggi qo'shilgan o'quv materiallari</p>
                </div>
                <button class="btn btn-sm btn-outline" onclick="refreshDocuments()" title="Hujjatlarni yangilash">
                    <i class="fas fa-sync-alt"></i>
                    Yangilash
                </button>
            </div>
        `;
    }
    
    // Reset filters and show all documents
    currentFilters = { search: '', subject: '', format: '' };
    currentDocuments = [...documentsData];
    displayedDocuments = 6;
    
    // Reset filter inputs
    if (searchInput) searchInput.value = '';
    if (subjectFilter) subjectFilter.value = '';
    if (formatFilter) formatFilter.value = '';
    
    renderDocuments();
}

// Filter by subject (from subject cards)
function filterBySubject(subjectId) {
    console.log('filterBySubject called with:', subjectId);
    
    if (subjectFilter) {
        subjectFilter.value = subjectId;
        console.log('subjectFilter set to:', subjectId);
    } else {
        console.warn('subjectFilter element not found');
    }
    
    currentFilters.subject = subjectId;
    console.log('currentFilters updated:', currentFilters);
    
    applyFilters();
    
    // Scroll to documents section
    const documentsSection = document.querySelector('.documents-section');
    if (documentsSection) {
        documentsSection.scrollIntoView({
            behavior: 'smooth'
        });
        console.log('Scrolled to documents section');
    } else {
        console.warn('Documents section not found');
    }
}

// Load more documents
function loadMoreDocuments() {
    displayedDocuments += 6;
    renderDocuments();
}

// Check if user is logged in
function isUserLoggedIn() {
    const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    return currentUser !== null;
}

// Download document with authentication check
function downloadDocument(docId) {
    // Check if user is logged in
    if (!isUserLoggedIn()) {
        showAuthRequiredModal(docId);
        return;
    }
    
    const doc = documentsData.find(d => d.id === docId);
    if (doc) {
        // Show download notification
        showNotification(`${doc.title} yuklab olinmoqda...`, 'info');
        
        // Simulate download process
        setTimeout(() => {
            // Update download count
            doc.downloadCount = (doc.downloadCount || 0) + 1;
            
            // Save updated documents to localStorage
            localStorage.setItem('documents', JSON.stringify(documentsData));
            
            // Update current documents and re-render
            currentDocuments = [...documentsData];
            renderDocuments();
            
            // Show success notification
            showNotification(`${doc.title} muvaffaqiyatli yuklab olindi!`, 'success');
            
            // Add to user downloads if logged in
            if (typeof userDownloads !== 'undefined') {
                const downloadRecord = {
                    id: Date.now(),
                    title: doc.title,
                    subject: doc.subject,
                    format: doc.format,
                    downloadDate: new Date().toISOString().split('T')[0],
                    author: doc.author
                };
                userDownloads.unshift(downloadRecord);
                localStorage.setItem('userDownloads', JSON.stringify(userDownloads));
            }
        }, 1500);
    } else {
        showNotification('Hujjat topilmadi', 'error');
    }
}

// Show authentication required modal
function showAuthRequiredModal(docId, subjectId) {
    const modal = document.createElement('div');
    modal.className = 'auth-modal-overlay';
    
    let message = 'Fayllarni yuklab olish uchun avval tizimga kirishingiz kerak.';
    let title = 'Kirish Talab Qilinadi';
    
    if (subjectId) {
        const subject = subjectsData.find(s => s.id === subjectId);
        if (subject) {
            title = `${subject.name} Fayllarini Ko'rish`;
            message = `${subject.name} fanidagi barcha fayllarni ko'rish va yuklab olish uchun tizimga kirishingiz kerak.`;
        }
    }
    
    modal.innerHTML = `
        <div class="auth-modal">
            <div class="auth-modal-header">
                <h3>${title}</h3>
                <button class="auth-modal-close" onclick="closeAuthModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="auth-modal-content">
                <i class="fas fa-lock" style="font-size: 3rem; color: #6b7280; margin-bottom: 1rem;"></i>
                <p>${message}</p>
                <div class="auth-modal-actions">
                    <a href="login.html" class="btn btn-primary">
                        <i class="fas fa-sign-in-alt"></i> Kirish
                    </a>
                    <a href="register.html" class="btn btn-outline">
                        <i class="fas fa-user-plus"></i> Ro'yxatdan o'tish
                    </a>
                </div>
                <p style="margin-top: 1rem; font-size: 0.9rem; color: #6b7280;">
                    Hali hisobingiz yo'qmi? <a href="register.html">Ro'yxatdan o'ting</a>
                </p>
            </div>
        </div>
    `;
    
    // Add modal styles
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
    
    const modalContent = modal.querySelector('.auth-modal');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 400px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        animation: modalSlideIn 0.3s ease;
    `;
    
    // Add animation keyframes to head
    if (!document.querySelector('#modal-animations')) {
        const style = document.createElement('style');
        style.id = 'modal-animations';
        style.textContent = `
            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAuthModal();
        }
    });
}

// Close authentication modal
function closeAuthModal() {
    const modal = document.querySelector('.auth-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Update homepage statistics with real data
function updateHomepageStats() {
    // Get actual counts
    const totalDocuments = documentsData.length;
    const totalSubjects = subjectsData.length;
    const totalUsers = getTotalUsers();
    
    // Update stats in about section
    const statElements = document.querySelectorAll('.stat h3');
    if (statElements.length >= 3) {
        statElements[0].textContent = `${totalDocuments}+`;
        statElements[1].textContent = `${totalSubjects}+`;
        statElements[2].textContent = `${totalUsers}+`;
    }
    
    // Update stat labels if needed
    const statLabels = document.querySelectorAll('.stat p');
    if (statLabels.length >= 3) {
        statLabels[0].textContent = 'Materiallar';
        statLabels[1].textContent = 'Fanlar';
        statLabels[2].textContent = 'Foydalanuvchilar';
    }
}

// Get total number of users
function getTotalUsers() {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.length;
    } catch (error) {
        return 0;
    }
}

// View document information in a modal
function viewDocumentInfo(docId) {
    const doc = documentsData.find(d => d.id === docId);
    if (!doc) return;
    
    const modal = document.createElement('div');
    modal.className = 'info-modal-overlay';
    modal.innerHTML = `
        <div class="info-modal">
            <div class="info-modal-header">
                <h3>Fayl Ma'lumotlari</h3>
                <button class="info-modal-close" onclick="closeInfoModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="info-modal-content">
                <div class="doc-info-header">
                    <div class="doc-format-icon">
                        <i class="${getFormatIcon(doc.format)}"></i>
                    </div>
                    <div class="doc-details">
                        <h4>${doc.title}</h4>
                        <p><i class="fas fa-user"></i> ${doc.author}</p>
                    </div>
                </div>
                <div class="doc-info-stats">
                    <div class="doc-stat">
                        <i class="${getSubjectIcon(doc.subject)}"></i>
                        <span>${getSubjectName(doc.subject)}</span>
                    </div>
                    <div class="doc-stat">
                        <i class="fas fa-file"></i>
                        <span>${doc.format.toUpperCase()}</span>
                    </div>
                    <div class="doc-stat">
                        <i class="fas fa-hdd"></i>
                        <span>${doc.size || 'N/A'}</span>
                    </div>
                    <div class="doc-stat">
                        <i class="fas fa-download"></i>
                        <span>${doc.downloadCount || 0} yuklab olingan</span>
                    </div>
                </div>
                ${doc.description ? `
                    <div class="doc-description">
                        <h5>Tavsif:</h5>
                        <p>${doc.description}</p>
                    </div>
                ` : ''}
                <div class="doc-info-actions">
                    ${isUserLoggedIn() ? 
                        `<button class="btn btn-primary" onclick="downloadDocument(${doc.id}); closeInfoModal();">
                            <i class="fas fa-download"></i> Yuklab olish
                        </button>` :
                        `<button class="btn btn-outline" onclick="showAuthRequiredModal(${doc.id}); closeInfoModal();">
                            <i class="fas fa-lock"></i> Yuklab olish uchun kirish
                        </button>`
                    }
                    <button class="btn btn-secondary" onclick="closeInfoModal()">
                        <i class="fas fa-times"></i> Yopish
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal styles
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
    
    const modalContent = modal.querySelector('.info-modal');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 500px;
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
            closeInfoModal();
        }
    });
}

// Close document info modal
function closeInfoModal() {
    const modal = document.querySelector('.info-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Handle navbar scroll effect
function handleNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
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

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function getSubjectName(subjectId) {
    const subject = subjectsData.find(s => s.id === subjectId);
    return subject ? subject.name : subjectId;
}

function getSubjectIcon(subjectId) {
    const subject = subjectsData.find(s => s.id === subjectId);
    return subject ? subject.icon : 'fas fa-book';
}

// Favorites functionality
let userFavorites = [];

// Load favorites from localStorage
function loadFavorites() {
    const savedFavorites = localStorage.getItem('userFavorites');
    if (savedFavorites) {
        userFavorites = JSON.parse(savedFavorites);
    }
}

// Check if document is favorite
function isFavorite(docId) {
    return userFavorites.some(fav => fav.id === docId);
}

// Toggle favorite
function toggleFavorite(docId) {
    const doc = documentsData.find(d => d.id === docId);
    if (!doc) return;
    
    const existingIndex = userFavorites.findIndex(fav => fav.id === docId);
    
    if (existingIndex > -1) {
        userFavorites.splice(existingIndex, 1);
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
        showNotification('Sevimlilarga qo\'shildi', 'success');
    }
    
    // Save to localStorage
    localStorage.setItem('userFavorites', JSON.stringify(userFavorites));
    
    // Update UI
    renderDocuments();
}

function getSubjectDownloads(subjectId) {
    return documentsData
        .filter(doc => doc.subject === subjectId)
        .reduce((total, doc) => total + doc.downloadCount, 0);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
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
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Contact form handling
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const name = this.querySelector('input[type="text"]').value;
            const email = this.querySelector('input[type="email"]').value;
            const message = this.querySelector('textarea').value;
            
            // Validate form
            if (!name || !email || !message) {
                showNotification('Barcha maydonlarni to\'ldiring', 'error');
                return;
            }
            
            if (!isValidEmail(email)) {
                showNotification('Email formati noto\'g\'ri', 'error');
                return;
            }
            
            // Show loading
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yuborilmoqda...';
            submitBtn.disabled = true;
            
            // Simulate form submission
            setTimeout(() => {
                showNotification('Xabaringiz muvaffaqiyatli yuborildi!', 'success');
                
                // Reset form
                this.reset();
                
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 1500);
        });
    }
});

// Add loading states for buttons
function addLoadingState(button) {
    const originalText = button.innerHTML;
    button.innerHTML = '<div class="loading"></div>';
    button.disabled = true;
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
    }, 2000);
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.subject-card, .document-card, .contact-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    // Escape key closes mobile menu
    if (e.key === 'Escape') {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    }
    
    // Enter key triggers search
    if (e.key === 'Enter' && document.activeElement === searchInput) {
        handleSearch();
    }
});

// Add touch support for mobile
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', function(e) {
    touchStartY = e.changedTouches[0].screenY;
});

document.addEventListener('touchend', function(e) {
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartY - touchEndY;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe up - could be used for navigation
        } else {
            // Swipe down - could be used for navigation
        }
    }
}

// Navbar scroll effect
function setupNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    
    if (!navbar) return;
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Make functions globally available for onclick handlers
window.filterBySubject = filterBySubject;
window.viewSubjectFiles = viewSubjectFiles;
window.viewSubject = viewSubject;

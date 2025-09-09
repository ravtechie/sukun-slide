// Public file browsing JavaScript
let documentsData = [];
let subjectsData = [];
let currentDocuments = [];
let displayedDocuments = 12;
let currentFilters = {
    search: '',
    subject: '',
    format: ''
};

// Initialize the browse page
document.addEventListener('DOMContentLoaded', function() {
    initializeSubjects();
    syncDocumentsFromAdmin();
    handleURLParameters();
    setupEventListeners();
    renderFiles();
    updateStats();
});

// Initialize subjects data
function initializeSubjects() {
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
    
    const savedSubjects = localStorage.getItem('subjects');
    if (savedSubjects) {
        try {
            subjectsData = JSON.parse(savedSubjects);
        } catch (error) {
            subjectsData = defaultSubjects;
        }
    } else {
        subjectsData = defaultSubjects;
    }
    
    // Populate subject filter
    const subjectFilter = document.getElementById('subjectFilter');
    if (subjectFilter) {
        subjectFilter.innerHTML = '<option value="">Barcha fanlar</option>' +
            subjectsData.map(subject => 
                `<option value="${subject.id}">${subject.name}</option>`
            ).join('');
    }
}

// Sync documents from admin panel
function syncDocumentsFromAdmin() {
    const savedDocuments = localStorage.getItem('documents');
    if (savedDocuments) {
        try {
            documentsData = JSON.parse(savedDocuments);
        } catch (error) {
            console.error('Error loading documents:', error);
            documentsData = [];
        }
    }
    
    // Initialize current documents
    currentDocuments = [...documentsData];
}

// Handle URL parameters for subject filtering
function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const subjectParam = urlParams.get('subject');
    
    if (subjectParam) {
        const subject = subjectsData.find(s => s.id === subjectParam);
        if (subject) {
            // Update page title and description
            document.getElementById('pageTitle').textContent = `${subject.name} Fayllar`;
            document.getElementById('pageDescription').textContent = `${subject.name} fani bo'yicha barcha materiallar`;
            document.getElementById('currentSubject').textContent = subject.name;
            
            // Set filter and apply
            const subjectFilter = document.getElementById('subjectFilter');
            if (subjectFilter) {
                subjectFilter.value = subjectParam;
            }
            currentFilters.subject = subjectParam;
            applyFilters();
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Filter functionality
    const subjectFilter = document.getElementById('subjectFilter');
    const formatFilter = document.getElementById('formatFilter');
    
    if (subjectFilter) {
        subjectFilter.addEventListener('change', handleFilter);
    }
    
    if (formatFilter) {
        formatFilter.addEventListener('change', handleFilter);
    }
}

// Handle search
function handleSearch(e) {
    currentFilters.search = e.target.value.toLowerCase();
    applyFilters();
}

// Handle filter changes
function handleFilter() {
    const subjectFilter = document.getElementById('subjectFilter');
    const formatFilter = document.getElementById('formatFilter');
    
    currentFilters.subject = subjectFilter ? subjectFilter.value : '';
    currentFilters.format = formatFilter ? formatFilter.value : '';
    
    applyFilters();
}

// Apply all filters
function applyFilters() {
    currentDocuments = documentsData.filter(doc => {
        const matchesSearch = !currentFilters.search || 
            doc.title.toLowerCase().includes(currentFilters.search) ||
            doc.description.toLowerCase().includes(currentFilters.search) ||
            getSubjectName(doc.subject).toLowerCase().includes(currentFilters.search) ||
            doc.author.toLowerCase().includes(currentFilters.search);
        
        const matchesSubject = !currentFilters.subject || doc.subject === currentFilters.subject;
        const matchesFormat = !currentFilters.format || doc.format === currentFilters.format;
        
        return matchesSearch && matchesSubject && matchesFormat;
    });
    
    displayedDocuments = 12;
    renderFiles();
}

// Render files
function renderFiles() {
    const filesGrid = document.getElementById('filesGrid');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (!filesGrid) return;
    
    if (currentDocuments.length === 0) {
        filesGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-file-alt"></i>
                <h3>Fayllar topilmadi</h3>
                <p>Qidiruv shartlariga mos fayllar yo'q yoki hali fayllar yuklanmagan</p>
            </div>
        `;
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        return;
    }
    
    const filesToShow = currentDocuments.slice(0, displayedDocuments);
    
    filesGrid.innerHTML = filesToShow.map(doc => `
        <div class="file-card">
            <div class="file-card-header">
                <div class="file-format">
                    <i class="${getFormatIcon(doc.format)}"></i>
                    ${doc.format.toUpperCase()}
                </div>
            </div>
            <div class="file-card-content">
                <h3 class="file-title">${doc.title}</h3>
                <div class="file-subject">
                    <i class="${getSubjectIcon(doc.subject)}"></i>
                    ${getSubjectName(doc.subject)}
                </div>
                <div class="file-description">${doc.description || 'Tavsif mavjud emas'}</div>
                <div class="file-meta">
                    <span><i class="fas fa-user"></i> ${doc.author}</span>
                    <span><i class="fas fa-download"></i> ${doc.downloadCount || 0}</span>
                    <span><i class="fas fa-file"></i> ${doc.size || 'N/A'}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(doc.uploadDate || new Date().toISOString())}</span>
                </div>
            </div>
            <div class="file-actions">
                <button class="btn btn-outline" onclick="showLoginPrompt('${doc.id}')">
                    <i class="fas fa-lock"></i> Yuklab olish
                </button>
                <button class="btn btn-secondary btn-sm" onclick="viewFileInfo('${doc.id}')">
                    <i class="fas fa-info-circle"></i> Ma'lumot
                </button>
            </div>
        </div>
    `).join('');
    
    // Show/hide load more button
    if (loadMoreBtn) {
        loadMoreBtn.style.display = currentDocuments.length > displayedDocuments ? 'block' : 'none';
    }
}

// Load more files
function loadMoreFiles() {
    displayedDocuments += 12;
    renderFiles();
}

// Update statistics
function updateStats() {
    const totalFiles = documentsData.length;
    const totalDownloads = documentsData.reduce((sum, doc) => sum + (doc.downloadCount || 0), 0);
    const totalSubjects = subjectsData.length;
    
    document.getElementById('totalFiles').textContent = totalFiles;
    document.getElementById('totalDownloads').textContent = totalDownloads;
    document.getElementById('totalSubjects').textContent = totalSubjects;
}

// Show login prompt modal
function showLoginPrompt(docId) {
    const doc = documentsData.find(d => d.id === docId);
    if (!doc) return;
    
    const modal = document.createElement('div');
    modal.className = 'login-modal-overlay';
    modal.innerHTML = `
        <div class="login-modal">
            <div class="login-modal-header">
                <h3><i class="fas fa-lock"></i> Kirish Talab Qilinadi</h3>
                <button class="close-btn" onclick="closeLoginModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="login-modal-content">
                <div class="file-preview">
                    <div class="file-icon">
                        <i class="${getFormatIcon(doc.format)}"></i>
                    </div>
                    <div class="file-details">
                        <h4>${doc.title}</h4>
                        <p><i class="${getSubjectIcon(doc.subject)}"></i> ${getSubjectName(doc.subject)}</p>
                    </div>
                </div>
                <div class="login-message">
                    <p>Bu faylni yuklab olish uchun tizimga kirishingiz yoki ro'yxatdan o'tishingiz kerak.</p>
                    <div class="benefits">
                        <h5>Ro'yxatdan o'tganingizda:</h5>
                        <ul>
                            <li><i class="fas fa-check"></i> Barcha fayllarni yuklab olish</li>
                            <li><i class="fas fa-check"></i> Sevimli fayllar ro'yxati</li>
                            <li><i class="fas fa-check"></i> Yuklab olish tarixi</li>
                            <li><i class="fas fa-check"></i> Yangi fayllar haqida xabar</li>
                        </ul>
                    </div>
                </div>
                <div class="login-actions">
                    <a href="login.html" class="btn btn-primary">
                        <i class="fas fa-sign-in-alt"></i> Kirish
                    </a>
                    <a href="register.html" class="btn btn-outline">
                        <i class="fas fa-user-plus"></i> Ro'yxatdan o'tish
                    </a>
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
    
    const modalContent = modal.querySelector('.login-modal');
    modalContent.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        animation: modalSlideIn 0.3s ease;
    `;
    
    // Add animation keyframes if not already added
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
            closeLoginModal();
        }
    });
}

// Close login modal
function closeLoginModal() {
    const modal = document.querySelector('.login-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// View file information
function viewFileInfo(docId) {
    const doc = documentsData.find(d => d.id === docId);
    if (!doc) return;
    
    const modal = document.createElement('div');
    modal.className = 'info-modal-overlay';
    modal.innerHTML = `
        <div class="info-modal">
            <div class="info-modal-header">
                <h3>Fayl Ma'lumotlari</h3>
                <button class="close-btn" onclick="closeInfoModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="info-modal-content">
                <div class="file-info-header">
                    <div class="file-icon-large">
                        <i class="${getFormatIcon(doc.format)}"></i>
                    </div>
                    <div class="file-info-details">
                        <h4>${doc.title}</h4>
                        <p><i class="fas fa-user"></i> ${doc.author}</p>
                        <p><i class="${getSubjectIcon(doc.subject)}"></i> ${getSubjectName(doc.subject)}</p>
                    </div>
                </div>
                <div class="file-info-stats">
                    <div class="info-stat">
                        <i class="fas fa-file"></i>
                        <span>${doc.format.toUpperCase()}</span>
                    </div>
                    <div class="info-stat">
                        <i class="fas fa-hdd"></i>
                        <span>${doc.size || 'N/A'}</span>
                    </div>
                    <div class="info-stat">
                        <i class="fas fa-download"></i>
                        <span>${doc.downloadCount || 0} yuklab olingan</span>
                    </div>
                    <div class="info-stat">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(doc.uploadDate || new Date().toISOString())}</span>
                    </div>
                </div>
                ${doc.description ? `
                    <div class="file-description-full">
                        <h5>Tavsif:</h5>
                        <p>${doc.description}</p>
                    </div>
                ` : ''}
                <div class="download-prompt">
                    <p><i class="fas fa-info-circle"></i> Bu faylni yuklab olish uchun tizimga kirish kerak</p>
                    <div class="download-actions">
                        <a href="login.html" class="btn btn-primary">
                            <i class="fas fa-sign-in-alt"></i> Kirish
                        </a>
                        <a href="register.html" class="btn btn-outline">
                            <i class="fas fa-user-plus"></i> Ro'yxatdan o'tish
                        </a>
                    </div>
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

// Close info modal
function closeInfoModal() {
    const modal = document.querySelector('.info-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Utility functions
function getFormatIcon(format) {
    const icons = {
        'ppt': 'fas fa-file-powerpoint',
        'pptx': 'fas fa-file-powerpoint',
        'pdf': 'fas fa-file-pdf',
        'doc': 'fas fa-file-word',
        'docx': 'fas fa-file-word',
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

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

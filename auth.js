// Authentication JavaScript

// Users data - loaded from localStorage only
let users = [];

// Current user session
let currentUser = null;

// Initialize authentication
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    setupFormValidation();
    setupPasswordStrength();
    setupSocialLogin();
});

// Initialize authentication system
function initializeAuth() {
    // Load users from localStorage if they exist
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
        try {
            users = JSON.parse(savedUsers);
        } catch (error) {
            console.error('Error loading users from localStorage:', error);
            users = [];
        }
    }
    
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        redirectToDashboard();
    }
    
    // Setup form handlers
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Show loading state
    const submitBtn = e.target.querySelector('.auth-btn');
    showLoadingState(submitBtn);
    
    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check if any users exist
        if (users.length === 0) {
            throw new Error('Hali birorta foydalanuvchi ro\'yxatdan o\'tmagan. Iltimos, avval ro\'yxatdan o\'ting.');
        }
        
        // Validate credentials
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user && user.isActive) {
            currentUser = user;
            
            // Save to localStorage
            if (rememberMe) {
                localStorage.setItem('currentUser', JSON.stringify(user));
            } else {
                sessionStorage.setItem('currentUser', JSON.stringify(user));
            }
            
            showNotification('Muvaffaqiyatli kirdingiz!', 'success');
            
            // Redirect after short delay
            setTimeout(() => {
                redirectToDashboard();
            }, 1000);
            
        } else {
            throw new Error('Email yoki parol noto\'g\'ri');
        }
        
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        hideLoadingState(submitBtn);
    }
}

// Handle registration form submission
async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userData = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        agreeTerms: document.getElementById('agreeTerms').checked
    };
    
    // Validate form
    if (!validateRegistrationForm(userData)) {
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('.auth-btn');
    showLoadingState(submitBtn);
    
    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if user already exists
        const existingUser = users.find(u => u.email === userData.email);
        if (existingUser) {
            throw new Error('Bu email allaqachon ro\'yxatdan o\'tgan');
        }
        
        // Create new user
        const nameParts = userData.fullName.split(' ');
        // First user becomes admin, or if email contains 'admin'
        const isFirstUser = users.length === 0;
        const hasAdminInEmail = userData.email.toLowerCase().includes('admin');
        const isAdmin = isFirstUser || hasAdminInEmail;
        
        const newUser = {
            id: Date.now(), // Use timestamp for unique ID
            email: userData.email,
            password: userData.password,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            fullName: userData.fullName,
            phone: '',
            university: '',
            role: isAdmin ? 'admin' : 'user',
            isActive: true,
            createdAt: new Date().toISOString().split('T')[0],
            downloads: 0,
            uploads: 0,
            status: 'active'
        };
        
        users.push(newUser);
        
        // Log activity if this is a new user registration
        if (typeof logActivity === 'function') {
            logActivity(
                'fas fa-user-plus', 
                `${newUser.firstName} ${newUser.lastName} ro'yxatdan o'tdi`,
                newUser.email
            );
        }
        
        // Save users to localStorage for admin panel access
        localStorage.setItem('users', JSON.stringify(users));
        
        showNotification('Hisob muvaffaqiyatli yaratildi!', 'success');
        
        // Redirect to login after short delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        hideLoadingState(submitBtn);
    }
}

// Validate registration form
function validateRegistrationForm(userData) {
    let isValid = true;
    
    // Clear previous errors
    clearFormErrors();
    
    // Validate required fields
    const requiredFields = ['fullName', 'email', 'password', 'confirmPassword'];
    requiredFields.forEach(field => {
        if (!userData[field]) {
            showFieldError(field, 'Bu maydon to\'ldirilishi shart');
            isValid = false;
        }
    });
    
    // Validate email format
    if (userData.email && !isValidEmail(userData.email)) {
        showFieldError('email', 'Email formati noto\'g\'ri');
        isValid = false;
    }
    
    // Validate full name
    if (userData.fullName && userData.fullName.trim().split(' ').length < 2) {
        showFieldError('fullName', 'Ism va familiyani kiriting');
        isValid = false;
    }
    
    // Validate password strength
    if (userData.password && !isStrongPassword(userData.password)) {
        showFieldError('password', 'Parol kamida 8 ta belgi, 1 ta katta harf, 1 ta raqam va 1 ta maxsus belgi bo\'lishi kerak');
        isValid = false;
    }
    
    // Validate password confirmation
    if (userData.password !== userData.confirmPassword) {
        showFieldError('confirmPassword', 'Parollar mos kelmaydi');
        isValid = false;
    }
    
    // Validate terms agreement
    if (!userData.agreeTerms) {
        const agreeTermsGroup = document.getElementById('agreeTerms').closest('.form-group');
        if (agreeTermsGroup) {
            agreeTermsGroup.classList.add('error');
            
            // Remove existing error message
            const existingError = agreeTermsGroup.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            // Add new error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> Foydalanish shartlarini qabul qilishingiz kerak`;
            agreeTermsGroup.appendChild(errorDiv);
        }
        isValid = false;
    }
    
    return isValid;
}

// Setup form validation
function setupFormValidation() {
    // Real-time email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            if (this.value && !isValidEmail(this.value)) {
                showFieldError('email', 'Email formati noto\'g\'ri');
            } else {
                clearFieldError('email');
            }
        });
    }
    
    // Real-time full name validation
    const fullNameInput = document.getElementById('fullName');
    if (fullNameInput) {
        fullNameInput.addEventListener('blur', function() {
            if (this.value && this.value.trim().split(' ').length < 2) {
                showFieldError('fullName', 'Ism va familiyani kiriting');
            } else {
                clearFieldError('fullName');
            }
        });
    }
    
    // Real-time password confirmation
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (passwordInput && confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            if (this.value && this.value !== passwordInput.value) {
                showFieldError('confirmPassword', 'Parollar mos kelmaydi');
            } else {
                clearFieldError('confirmPassword');
            }
        });
    }
    
    // Real-time terms agreement validation
    const agreeTermsCheckbox = document.getElementById('agreeTerms');
    if (agreeTermsCheckbox) {
        agreeTermsCheckbox.addEventListener('change', function() {
            const formGroup = this.closest('.form-group');
            if (formGroup) {
                if (this.checked) {
                    formGroup.classList.remove('error');
                    const errorMessage = formGroup.querySelector('.error-message');
                    if (errorMessage) {
                        errorMessage.remove();
                    }
                } else {
                    formGroup.classList.add('error');
                    
                    // Remove existing error message
                    const existingError = formGroup.querySelector('.error-message');
                    if (existingError) {
                        existingError.remove();
                    }
                    
                    // Add new error message
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error-message';
                    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> Foydalanish shartlarini qabul qilishingiz kerak`;
                    formGroup.appendChild(errorDiv);
                }
            }
        });
    }
}

// Setup password strength indicator
function setupPasswordStrength() {
    const passwordInput = document.getElementById('password');
    if (!passwordInput) return;
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strengthBar = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');
        
        if (!strengthBar || !strengthText) return;
        
        const strength = calculatePasswordStrength(password);
        
        // Update strength bar
        strengthBar.className = 'strength-fill';
        if (strength.score > 0) {
            strengthBar.classList.add(strength.class);
        }
        
        // Update strength text
        strengthText.textContent = strength.text;
        strengthText.style.color = strength.color;
    });
}

// Calculate password strength
function calculatePasswordStrength(password) {
    let score = 0;
    let feedback = [];
    
    if (password.length >= 8) score++;
    else feedback.push('Kamida 8 ta belgi');
    
    if (/[a-z]/.test(password)) score++;
    else feedback.push('Kichik harflar');
    
    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Katta harflar');
    
    if (/[0-9]/.test(password)) score++;
    else feedback.push('Raqamlar');
    
    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push('Maxsus belgilar');
    
    const strengthLevels = [
        { class: 'weak', text: 'Zaif', color: '#ef4444' },
        { class: 'fair', text: 'O\'rtacha', color: '#f59e0b' },
        { class: 'good', text: 'Yaxshi', color: '#10b981' },
        { class: 'strong', text: 'Kuchli', color: '#059669' }
    ];
    
    const level = strengthLevels[Math.min(score - 1, 3)] || strengthLevels[0];
    
    return {
        score,
        class: level.class,
        text: feedback.length > 0 ? `Kerak: ${feedback.join(', ')}` : level.text,
        color: level.color
    };
}

// Setup social login
function setupSocialLogin() {
    const googleBtns = document.querySelectorAll('.google-btn');
    const facebookBtns = document.querySelectorAll('.facebook-btn');
    
    googleBtns.forEach(btn => {
        btn.addEventListener('click', () => handleSocialLogin('google'));
    });
    
    facebookBtns.forEach(btn => {
        btn.addEventListener('click', () => handleSocialLogin('facebook'));
    });
}

// Handle social login
function handleSocialLogin(provider) {
    showNotification(`${provider} orqali kirish hozircha ishlamaydi`, 'info');
    // In real app, implement OAuth flow
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.parentElement.querySelector('.password-toggle i');
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.classList.remove('fa-eye');
        toggle.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        toggle.classList.remove('fa-eye-slash');
        toggle.classList.add('fa-eye');
    }
}

// Show loading state
function showLoadingState(button) {
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'flex';
    
    button.disabled = true;
}

// Hide loading state
function hideLoadingState(button) {
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    if (btnText) btnText.style.display = 'inline';
    if (btnLoading) btnLoading.style.display = 'none';
    
    button.disabled = false;
}

// Show field error
function showFieldError(fieldName, message) {
    const field = document.getElementById(fieldName);
    if (!field) return;
    
    const formGroup = field.closest('.form-group');
    if (!formGroup) return;
    
    formGroup.classList.add('error');
    
    // Remove existing error message
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    formGroup.appendChild(errorDiv);
}

// Clear field error
function clearFieldError(fieldName) {
    const field = document.getElementById(fieldName);
    if (!field) return;
    
    const formGroup = field.closest('.form-group');
    if (!formGroup) return;
    
    formGroup.classList.remove('error');
    
    const errorMessage = formGroup.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

// Clear all form errors
function clearFormErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
    
    const errorGroups = document.querySelectorAll('.form-group.error');
    errorGroups.forEach(group => group.classList.remove('error'));
}

// Show notification
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
        top: 20px;
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
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Get notification icon
function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Get notification color
function getNotificationColor(type) {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    return colors[type] || '#3b82f6';
}

// Redirect to dashboard
function redirectToDashboard() {
    if (currentUser && currentUser.role === 'admin') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^\+998\s\d{2}\s\d{3}\s\d{2}\s\d{2}$/;
    return phoneRegex.test(phone);
}

function isStrongPassword(password) {
    return password.length >= 8 &&
           /[a-z]/.test(password) &&
           /[A-Z]/.test(password) &&
           /[0-9]/.test(password) &&
           /[^A-Za-z0-9]/.test(password);
}

// Logout function
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Check authentication status
function isAuthenticated() {
    return currentUser !== null;
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Clean up localStorage function
function cleanupLocalStorage() {
    // Remove any corrupted data and reset if necessary
    const keys = ['users', 'currentUser', 'subjects', 'documents', 'userDownloads', 'userFavorites', 'adminActivities'];
    
    keys.forEach(key => {
        try {
            const data = localStorage.getItem(key);
            if (data) {
                JSON.parse(data); // Test if data is valid JSON
            }
        } catch (error) {
            console.warn(`Removing corrupted localStorage data for key: ${key}`);
            localStorage.removeItem(key);
        }
    });
}

// Initialize localStorage cleanup on load
cleanupLocalStorage();

// Export functions for use in other files
window.auth = {
    logout,
    isAuthenticated,
    getCurrentUser,
    users,
    cleanupLocalStorage
};

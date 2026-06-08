// Global User State
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    checkAuthStatus();
});

// ==========================================
// NAVIGATION MANAGEMENT
// ==========================================
function initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = navToggle.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.className = 'bx bx-x';
            } else {
                icon.className = 'bx bx-menu';
            }
        });
    }
}

// ==========================================
// AUTHENTICATION STATE WATCHER
// ==========================================
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        
        const navAuth = document.getElementById('navAuth');
        if (!navAuth) return;
        
        if (data.authenticated) {
            currentUser = data.user;
            
            // Render user widget
            let logoutAction = 'logoutUser()';
            if (currentUser.role === 'admin') {
                logoutAction = 'logoutAdmin()';
            }
            
            navAuth.innerHTML = `
                <div class="user-widget">
                    <i class='bx bxs-user-detail' style="color: ${currentUser.role === 'admin' ? 'var(--color-danger)' : 'var(--color-primary)'};"></i>
                    <span class="username">${currentUser.username}</span>
                    <button class="logout-icon-btn" onclick="${logoutAction}" title="Log Out">
                        <i class='bx bx-log-out-circle'></i>
                    </button>
                </div>
            `;
            
            // Dispatch event for other pages to listen
            document.dispatchEvent(new CustomEvent('userAuthStateChanged', { detail: { authenticated: true, user: currentUser } }));
        } else {
            currentUser = null;
            navAuth.innerHTML = `
                <button class="btn btn-primary btn-sm login-btn" onclick="goToLogin()">
                    <i class='bx bx-log-in'></i> Login
                </button>
            `;
            document.dispatchEvent(new CustomEvent('userAuthStateChanged', { detail: { authenticated: false } }));
        }
    } catch (error) {
        console.error('Error fetching auth status:', error);
    }
}

function goToLogin() {
    window.location.href = '/tasks';
}

async function logoutUser() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        showToast(data.message || 'Logged out successfully', 'info');
        setTimeout(() => {
            window.location.href = '/tasks';
        }, 800);
    } catch (error) {
        showToast('Logout request failed', 'error');
    }
}

async function logoutAdmin() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        showToast(data.message || 'Admin session terminated', 'info');
        setTimeout(() => {
            window.location.href = '/admin';
        }, 800);
    } catch (error) {
        showToast('Logout request failed', 'error');
    }
}

// ==========================================
// GLOBAL TOASTS NOTIFICATIONS
// ==========================================
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'bx-info-circle';
    if (type === 'success') iconClass = 'bx-check-circle';
    if (type === 'error') iconClass = 'bx-x-circle';
    if (type === 'warning') iconClass = 'bx-error';
    
    toast.innerHTML = `
        <i class='bx ${iconClass}'></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('active');
    }, 50);
    
    // Auto-destruct
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// Global User State
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    checkAuthStatus();
    registerServiceWorker();
});

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((reg) => console.log('Service Worker registered successfully!', reg.scope))
                .catch((err) => console.log('Service Worker registration failed:', err));
        });
    }
}

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
let googleClientId = '';

async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        
        // Save the Google Client ID configured on the server
        if (data.google_client_id) {
            googleClientId = data.google_client_id;
        }
        initGoogleAuthFlow();
        
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
                    <i class='bx bx-log-in'></i> Client Login
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

// ==========================================
// GOOGLE SINGLE SIGN-ON (SSO) CONTROLLER
// ==========================================
document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.google-signin-trigger-btn');
    if (trigger) {
        openGoogleAuthPopup();
    }
});

function initGoogleAuthFlow() {
    const activeClientId = localStorage.getItem('dev_google_client_id') || googleClientId;
    if (!activeClientId) {
        console.log("No Google Client ID configured. Enter it in the settings panel to test real SSO.");
        return;
    }
    
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
        setTimeout(initGoogleAuthFlow, 500);
        return;
    }
    
    try {
        google.accounts.id.initialize({
            client_id: activeClientId,
            callback: handleGoogleCredentialResponse,
            context: 'signin',
            ux_mode: 'popup',
            auto_select: false
        });
    } catch (e) {
        console.error("Error initializing Google Identity Services:", e);
    }
}

function handleGoogleCredentialResponse(response) {
    if (response && response.credential) {
        submitGoogleLogin(null, null, response.credential);
    }
}

function toggleClientIdConfig() {
    const configBody = document.getElementById('clientIdConfigBody');
    const chevron = document.getElementById('configChevron');
    if (!configBody) return;
    
    if (configBody.style.display === 'none') {
        configBody.style.display = 'block';
        chevron.style.transform = 'rotate(180deg)';
    } else {
        configBody.style.display = 'none';
        chevron.style.transform = 'rotate(0deg)';
    }
}

function saveTempClientId() {
    const input = document.getElementById('tempClientId');
    if (!input) return;
    const value = input.value.trim();
    if (value) {
        localStorage.setItem('dev_google_client_id', value);
        showToast('Google Client ID saved locally. Reinitializing auth...', 'success');
        initGoogleAuthFlow();
        openGoogleAuthPopup();
    } else {
        localStorage.removeItem('dev_google_client_id');
        showToast('Local Client ID cleared. Reinitializing...', 'info');
        initGoogleAuthFlow();
        openGoogleAuthPopup();
    }
}

function openGoogleAuthPopup() {
    let existing = document.getElementById('googleAuthPopupModal');
    if (existing) existing.remove();
    
    const activeClientId = localStorage.getItem('dev_google_client_id') || googleClientId;
    
    const modal = document.createElement('div');
    modal.id = 'googleAuthPopupModal';
    modal.className = 'modal-overlay active';
    modal.style.zIndex = '3000';
    
    modal.innerHTML = `
        <div class="modal-container card" style="max-width: 420px; padding: 2rem; border-color: rgba(212, 175, 55, 0.35); background: var(--bg-card); backdrop-filter: blur(15px);">
            <button class="modal-close-btn" onclick="document.getElementById('googleAuthPopupModal').remove()"><i class='bx bx-x'></i></button>
            <div class="text-center" style="margin-bottom: 1.2rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 48 48" style="margin-bottom: 0.8rem; vertical-align: middle;">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.5 24c0-1.63-.15-3.2-.43-4.73H24v9h12.75c-.55 2.92-2.2 5.4-4.68 7.07l7.27 5.63c4.25-3.92 6.66-9.69 6.66-17.43z"/>
                    <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.98-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.27-5.63c-2.03 1.37-4.63 2.19-7.62 2.19-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <h3 style="font-family: var(--font-luxury), serif; font-size: 1.5rem; margin-top: 0.5rem; color: #ffffff;">Sign in with Google</h3>
                <p style="font-size: 0.85rem; color: var(--text-muted);">Access your premium client shoot dashboard</p>
            </div>
            
            <div class="google-accounts-list" style="display:flex; flex-direction:column; gap:0.8rem;">
                
                <!-- Real Sign In with Google Button Container -->
                <div id="gsi_button_container" style="display: flex; justify-content: center; margin-bottom: 0.2rem; min-height: 40px;"></div>
                
                <!-- Client ID Config Box -->
                <div style="background: rgba(212, 175, 55, 0.04); border: 1px dashed rgba(212, 175, 55, 0.15); border-radius: var(--border-radius-sm); padding: 0.6rem 0.8rem; margin-bottom: 0.2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="toggleClientIdConfig()">
                        <span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600;">
                            <i class='bx bx-cog' style="vertical-align: middle; margin-right: 3px;"></i>
                            Developer / GSI Settings
                        </span>
                        <i class='bx bx-chevron-down' id="configChevron" style="color: var(--color-primary); transition: transform 0.3s;"></i>
                    </div>
                    <div id="clientIdConfigBody" style="display: none; margin-top: 0.8rem;">
                        <p style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.5rem; line-height: 1.3;">
                            To enable the real Google button, configure <code>GOOGLE_CLIENT_ID</code> in config, or paste your credentials Client ID here:
                        </p>
                        <div style="display: flex; gap: 0.4rem;">
                            <input type="text" id="tempClientId" placeholder="123456-abc.apps.googleusercontent.com" value="${activeClientId}" style="flex: 1; padding: 0.4rem; font-size: 0.7rem; background: rgba(0,0,0,0.3); border-color: var(--border-glass); border-radius: 4px; color: #fff;">
                            <button class="btn btn-primary" onclick="saveTempClientId()" style="padding: 0.4rem 0.8rem; font-size: 0.7rem; height: auto;">Save</button>
                        </div>
                        ${!activeClientId ? `
                            <p style="font-size: 0.7rem; color: #ff5252; margin-top: 0.4rem;">
                                <i class='bx bx-info-circle' style="vertical-align: middle;"></i> Real GSI is inactive (no Client ID set).
                            </p>
                        ` : `
                            <p style="font-size: 0.7rem; color: #4caf50; margin-top: 0.4rem;">
                                <i class='bx bx-check-circle' style="vertical-align: middle;"></i> Real GSI initialized with Client ID.
                            </p>
                        `}
                    </div>
                </div>

                <div style="display: flex; align-items: center; margin: 0.1rem 0;">
                    <div style="flex: 1; border-top: 1px solid rgba(255,255,255,0.06);"></div>
                    <span style="font-size: 0.7rem; color: var(--text-muted); padding: 0 0.5rem; text-transform: uppercase;">Or Quick Test</span>
                    <div style="flex: 1; border-top: 1px solid rgba(255,255,255,0.06);"></div>
                </div>

                <button class="btn btn-secondary google-acc-btn" onclick="submitGoogleLogin('tilaksontana59@gmail.com', 'Tilak Sontana')" style="justify-content: flex-start; text-align: left; padding: 0.8rem 1rem; width: 100%; border-color: rgba(255,255,255,0.06); background: rgba(255,255,255,0.02);">
                    <div style="display:flex; align-items:center; gap:0.8rem;">
                        <div style="width:32px; height:32px; border-radius:50%; background:var(--color-primary); color:#000; font-weight:700; display:flex; align-items:center; justify-content:center;">T</div>
                        <div style="line-height:1.2;">
                            <strong style="display:block; font-size:0.9rem; color:#fff;">Tilak Sontana (Client)</strong>
                            <span style="font-size:0.75rem; color:var(--text-muted);">tilaksontana59@gmail.com</span>
                        </div>
                    </div>
                </button>
                
                <button class="btn btn-secondary google-acc-btn" onclick="submitGoogleLogin('demo.client@gmail.com', 'Demo Client')" style="justify-content: flex-start; text-align: left; padding: 0.8rem 1rem; width: 100%; border-color: rgba(255,255,255,0.06); background: rgba(255,255,255,0.02);">
                    <div style="display:flex; align-items:center; gap:0.8rem;">
                        <div style="width:32px; height:32px; border-radius:50%; background:var(--color-secondary); color:#000; font-weight:700; display:flex; align-items:center; justify-content:center;">D</div>
                        <div style="line-height:1.2;">
                            <strong style="display:block; font-size:0.9rem; color:#fff;">Demo Client (Agency User)</strong>
                            <span style="font-size:0.75rem; color:var(--text-muted);">demo.client@gmail.com</span>
                        </div>
                    </div>
                </button>
                
                <div class="form-group" style="margin-bottom:0; display:flex; flex-direction:column; gap:0.4rem; margin-top: 0.2rem;">
                    <label style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted);">Use another Google account</label>
                    <div style="display:flex; gap:0.5rem;">
                        <input type="email" id="customGoogleEmail" placeholder="username@gmail.com" style="padding:0.5rem 0.8rem; font-size:0.85rem; background:rgba(0,0,0,0.25); border-color:var(--border-glass); border-radius: var(--border-radius-sm);">
                        <button class="btn btn-primary" onclick="submitCustomGoogleLogin()" style="padding:0.5rem 1rem; font-size:0.85rem;">Sign In</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Render GSI button if initialized
    setTimeout(() => {
        if (activeClientId && typeof google !== 'undefined' && google.accounts && google.accounts.id) {
            const container = document.getElementById('gsi_button_container');
            if (container) {
                google.accounts.id.renderButton(
                    container,
                    {
                        type: 'standard',
                        theme: 'filled_blue',
                        size: 'large',
                        text: 'signin_with',
                        shape: 'rectangular',
                        logo_alignment: 'left',
                        width: 320
                    }
                );
            }
        }
    }, 100);
}

async function submitGoogleLogin(email, name, credential = null) {
    const modal = document.getElementById('googleAuthPopupModal');
    
    if (modal) {
        modal.querySelector('.google-accounts-list').innerHTML = `
            <div style="text-align:center; padding: 2rem 0; color:var(--color-primary);">
                <i class='bx bx-loader-alt bx-spin' style="font-size:2.5rem; margin-bottom:0.8rem;"></i>
                <p style="font-size:0.9rem; color:var(--text-muted);">Signing you in securely via Google...</p>
            </div>
        `;
    }
    
    try {
        const response = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, credential })
        });
        const data = await response.json();
        
        if (response.ok) {
            showToast('Google sign-in successful', 'success');
            if (modal) modal.remove();
            
            // Re-authenticate session status globally
            checkAuthStatus();
            
            // Close shop login modal if active
            const shopLoginModal = document.getElementById('shopLoginModal');
            if (shopLoginModal) shopLoginModal.classList.remove('active');
        } else {
            showToast(data.error || 'Google Authentication failed', 'error');
            openGoogleAuthPopup();
        }
    } catch (e) {
        showToast('Google API connection failed', 'error');
        if (modal) modal.remove();
    }
}

function submitCustomGoogleLogin() {
    const emailInput = document.getElementById('customGoogleEmail');
    if (!emailInput) return;
    const email = emailInput.value.trim();
    if (!email || !email.includes('@')) {
        showToast('Please enter a valid Google email address.', 'warning');
        return;
    }
    const name = email.split('@')[0];
    submitGoogleLogin(email, name);
}


// Task Manager Page Controller
let userTasks = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    initAuthForms();
    initDashboard();
    
    // Listen to global auth state changes
    document.addEventListener('userAuthStateChanged', (e) => {
        handleAuthStateChange(e.detail);
    });
});

// ==========================================
// AUTHENTICATION TAB NAVIGATION
// ==========================================
function switchAuthTab(tab) {
    const loginTab = document.getElementById('authTabLogin');
    const registerTab = document.getElementById('authTabRegister');
    const loginForm = document.getElementById('tasksLoginForm');
    const registerForm = document.getElementById('tasksRegisterForm');
    
    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    }
}

function initAuthForms() {
    const loginForm = document.getElementById('tasksLoginForm');
    const registerForm = document.getElementById('tasksRegisterForm');
    const logoutBtn = document.getElementById('tasksLogoutBtn');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                
                if (response.ok) {
                    showToast(data.message || 'Log in successful', 'success');
                    checkAuthStatus(); // Reload global header widgets
                } else {
                    showToast(data.error || 'Login failed', 'error');
                }
            } catch (error) {
                showToast('API request error', 'error');
            }
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('registerUsername').value;
            const password = document.getElementById('registerPassword').value;
            
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                
                if (response.ok) {
                    showToast(data.message || 'Registration successful', 'success');
                    checkAuthStatus();
                } else {
                    showToast(data.error || 'Registration failed', 'error');
                }
            } catch (error) {
                showToast('API request error', 'error');
            }
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }
}

// ==========================================
// DASHBOARD WORKSPACE CONTROLS
// ==========================================
function handleAuthStateChange(auth) {
    const authCard = document.getElementById('tasksAuthCard');
    const dashboard = document.getElementById('tasksDashboard');
    const welcomeText = document.getElementById('dashboardUserWelcome');
    
    if (auth.authenticated) {
        if (authCard) authCard.classList.add('hidden');
        if (dashboard) {
            dashboard.classList.remove('hidden');
            welcomeText.textContent = `Hello, ${auth.user.username}!`;
            loadTasks();
        }
    } else {
        if (authCard) authCard.classList.remove('hidden');
        if (dashboard) dashboard.classList.add('hidden');
        userTasks = [];
    }
}

function initDashboard() {
    // Add task form
    const addTaskForm = document.getElementById('addTaskForm');
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('taskTitle').value;
            const due_date = document.getElementById('taskDueDate').value;
            const description = document.getElementById('taskDesc').value;
            
            try {
                const response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, due_date, description })
                });
                const data = await response.json();
                
                if (response.ok) {
                    showToast('Shoot added to tracker!', 'success');
                    addTaskForm.reset();
                    loadTasks();
                } else {
                    showToast(data.error || 'Failed to add task', 'error');
                }
            } catch (error) {
                showToast('API request error', 'error');
            }
        });
    }
    
    // Filter click actions
    const filterButtons = document.querySelectorAll('.task-filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderTasksList();
        });
    });
    
    // Edit task form
    const editForm = document.getElementById('editTaskForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editTaskId').value;
            const title = document.getElementById('editTaskTitle').value;
            const due_date = document.getElementById('editTaskDueDate').value;
            const description = document.getElementById('editTaskDesc').value;
            const status = document.getElementById('editTaskStatus').value;
            
            try {
                const response = await fetch(`/api/tasks/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, due_date, description, status })
                });
                const data = await response.json();
                
                if (response.ok) {
                    showToast('Shoot details modified', 'success');
                    closeEditModal();
                    loadTasks();
                } else {
                    showToast(data.error || 'Failed to modify task', 'error');
                }
            } catch (error) {
                showToast('API request error', 'error');
            }
        });
    }
    
    // Edit modal escape close
    const modal = document.getElementById('editTaskModal');
    const closeBtn = document.getElementById('editTaskModalCloseBtn');
    if (modal) {
        closeBtn.addEventListener('click', closeEditModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeEditModal();
        });
    }
}

// ==========================================
// TASKS LOADING & CRUD OPERATIONS
// ==========================================
async function loadTasks() {
    const list = document.getElementById('tasksList');
    if (!list) return;
    
    try {
        const response = await fetch('/api/tasks');
        if (response.ok) {
            userTasks = await response.json();
            renderTasksList();
        } else {
            list.innerHTML = `<p class="text-center danger-text">Unauthorized access. Try logging in again.</p>`;
        }
    } catch (error) {
        console.error('Error fetching tasks:', error);
        list.innerHTML = `<p class="text-center danger-text">API query exception.</p>`;
    }
}

function renderTasksList() {
    const list = document.getElementById('tasksList');
    const countEl = document.getElementById('tasksSummaryCount');
    if (!list) return;
    
    list.innerHTML = '';
    
    let filtered = userTasks;
    if (currentFilter !== 'all') {
        filtered = userTasks.filter(t => t.status === currentFilter);
    }
    
    // Count pending remaining tasks
    const pendingCount = userTasks.filter(t => t.status === 'Pending').length;
    countEl.textContent = `${pendingCount} Active Shoot${pendingCount !== 1 ? 's' : ''} In Progress`;
    
    if (filtered.length === 0) {
        list.innerHTML = `<p class="text-center text-muted" style="padding: 1.5rem 0;">No shoots found for this status.</p>`;
        return;
    }
    
    filtered.forEach(task => {
        const card = document.createElement('div');
        card.className = `task-item-card ${task.status.toLowerCase() === 'completed' ? 'completed' : ''}`;
        
        // Formulate date representation
        let dateBadge = '';
        if (task.due_date) {
            const dateObj = new Date(task.due_date);
            const isOverdue = !isNaN(dateObj) && dateObj < new Date() && task.status === 'Pending';
            dateBadge = `<span class="task-meta-tag ${isOverdue ? 'overdue' : ''}"><i class='bx bx-calendar'></i> ${task.due_date} ${isOverdue ? '(Overdue)' : ''}</span>`;
        }
        
        card.innerHTML = `
            <div class="task-item-left">
                <div class="task-checkbox-wrapper">
                    <input type="checkbox" class="task-checkbox" ${task.status === 'Completed' ? 'checked' : ''} onchange="toggleTaskStatus(${task.id}, this.checked)">
                </div>
                <div class="task-texts-col">
                    <span class="task-item-title">${task.title}</span>
                    ${task.description ? `<span class="task-item-desc">${task.description}</span>` : ''}
                    ${dateBadge}
                </div>
            </div>
            <div class="task-item-actions">
                <button class="task-action-icon-btn" onclick="openEditModal(${JSON.stringify(task).replace(/"/g, '&quot;')})" title="Edit Task">
                    <i class='bx bx-edit-alt'></i>
                </button>
                <button class="task-action-icon-btn delete" onclick="deleteTask(${task.id})" title="Delete Task">
                    <i class='bx bx-trash'></i>
                </button>
            </div>
        `;
        
        list.appendChild(card);
    });
}

async function toggleTaskStatus(id, checked) {
    const status = checked ? 'Completed' : 'Pending';
    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            // Find task in local list and update
            const idx = userTasks.findIndex(t => t.id === id);
            if (idx !== -1) {
                userTasks[idx].status = status;
                renderTasksList();
                showToast(status === 'Completed' ? 'Shoot marked delivered' : 'Shoot marked in progress', 'success');
            }
        } else {
            showToast('Failed to modify status', 'error');
            loadTasks(); // Reset UI
        }
    } catch (error) {
        showToast('Server update error', 'error');
    }
}

async function deleteTask(id) {
    if (!confirm('Are you sure you want to cancel tracking this shoot?')) return;
    
    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Shoot removed from records', 'success');
            loadTasks();
        } else {
            showToast('Failed to remove shoot', 'error');
        }
    } catch (error) {
        showToast('Server query error', 'error');
    }
}

// ==========================================
// EDIT MODAL CONTROLS
// ==========================================
function openEditModal(task) {
    const modal = document.getElementById('editTaskModal');
    if (!modal) return;
    
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDueDate').value = task.due_date || '';
    document.getElementById('editTaskDesc').value = task.description || '';
    document.getElementById('editTaskStatus').value = task.status;
    
    modal.classList.add('active');
}

function closeEditModal() {
    const modal = document.getElementById('editTaskModal');
    if (modal) modal.classList.remove('active');
}

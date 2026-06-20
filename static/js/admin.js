// Admin Panel Dashboard Controller
let adminStats = {};
let contactMessages = [];
let catalogProducts = [];
let activeAdminTab = 'messages';

document.addEventListener('DOMContentLoaded', () => {
    initAdminAuth();
    initAdminTabs();
    initProductForm();
    
    // Listen to global auth state changes
    document.addEventListener('userAuthStateChanged', (e) => {
        handleAdminAuthStateChange(e.detail);
    });
});

// ==========================================
// OPERATOR AUTHENTICATION
// ==========================================
function initAdminAuth() {
    const form = document.getElementById('adminLoginForm');
    const logoutBtn = document.getElementById('adminLogoutBtn');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('adminUsername').value;
            const password = document.getElementById('adminPassword').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                
                if (response.ok) {
                    if (data.user.role === 'admin') {
                        showToast('Operator session initialized', 'success');
                        checkAuthStatus(); // Reload navbar widgets and trigger dashboard render
                    } else {
                        showToast('Access denied. Administrator privileges required.', 'error');
                        // Log out to clear session
                        fetch('/api/auth/logout', { method: 'POST' });
                    }
                } else {
                    showToast(data.error || 'Authentication failed', 'error');
                }
            } catch (error) {
                showToast('Login request error', 'error');
            }
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutAdmin);
    }
}

function handleAdminAuthStateChange(auth) {
    const authCard = document.getElementById('adminAuthCard');
    const dashboard = document.getElementById('adminDashboard');
    
    if (auth.authenticated && auth.user.role === 'admin') {
        if (authCard) authCard.classList.add('hidden');
        if (dashboard) {
            dashboard.classList.remove('hidden');
            loadAdminStats();
            loadAdminTabContent();
        }
    } else {
        if (authCard) authCard.classList.remove('hidden');
        if (dashboard) dashboard.classList.add('hidden');
    }
}

// ==========================================
// SIDEBAR TABS SELECTION
// ==========================================
function initAdminTabs() {
    const buttons = document.querySelectorAll('.admin-tab-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            activeAdminTab = btn.getAttribute('data-tab');
            
            // Toggle panes
            const panes = document.querySelectorAll('.admin-tab-pane');
            panes.forEach(pane => pane.classList.remove('active'));
            document.getElementById(`pane-${activeAdminTab}`).classList.add('active');
            
            loadAdminTabContent();
        });
    });
}

function loadAdminTabContent() {
    if (activeAdminTab === 'messages') {
        loadContactMessages();
    } else if (activeAdminTab === 'catalog') {
        loadCatalogProducts();
    }
}

// ==========================================
// METRICS STATS FETCH
// ==========================================
async function loadAdminStats() {
    try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) return;
        
        adminStats = await response.json();
        
        document.getElementById('statUsers').textContent = adminStats.users;
        document.getElementById('statTasks').textContent = adminStats.tasks;
        document.getElementById('statProducts').textContent = adminStats.products;
        document.getElementById('statOrders').textContent = adminStats.orders;
        document.getElementById('statMessages').textContent = adminStats.messages;
        document.getElementById('statPosts').textContent = adminStats.posts;
        document.getElementById('adminUnreadBadge').textContent = `${adminStats.unread_messages} Unread`;
    } catch (e) {
        console.error('Error fetching admin stats:', e);
    }
}

// ==========================================
// FEEDBACK INBOX (MESSAGES) VIEW
// ==========================================
async function loadContactMessages() {
    const list = document.getElementById('adminMessagesList');
    if (!list) return;
    
    try {
        const response = await fetch('/api/messages');
        if (!response.ok) {
            list.innerHTML = `<p class="text-center danger-text">Forbidden access. Admin session expired.</p>`;
            return;
        }
        
        contactMessages = await response.json();
        renderContactMessages();
    } catch (e) {
        list.innerHTML = `<p class="text-center danger-text">Error querying database messages.</p>`;
    }
}

function renderContactMessages() {
    const list = document.getElementById('adminMessagesList');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (contactMessages.length === 0) {
        list.innerHTML = `<p class="text-center text-muted" style="padding: 2rem 0;">Inbox folder is empty.</p>`;
        return;
    }
    
    contactMessages.forEach(msg => {
        const card = document.createElement('div');
        card.className = `admin-message-card ${!msg.is_read ? 'unread' : ''}`;
        
        const dateStr = new Date(msg.created_at).toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        card.innerHTML = `
            <div class="admin-message-header">
                <span class="admin-message-sender"><i class='bx bx-user-pin'></i> ${msg.name} (${msg.email})</span>
                <span>${dateStr}</span>
            </div>
            <strong>Sub: ${msg.subject}</strong>
            <p class="admin-message-body">${msg.message}</p>
            <div class="admin-message-footer">
                <button class="btn btn-secondary btn-sm" onclick="toggleMessageRead(${msg.id})">
                    <i class='bx ${msg.is_read ? 'bx-envelope' : 'bx-envelope-open'}'></i> Mark ${msg.is_read ? 'Unread' : 'Read'}
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteMessage(${msg.id})">
                    <i class='bx bx-trash'></i> Delete
                </button>
            </div>
        `;
        
        list.appendChild(card);
    });
}

async function toggleMessageRead(id) {
    try {
        const response = await fetch(`/api/messages/${id}`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            loadContactMessages();
            loadAdminStats(); // Refresh unread count
        } else {
            showToast('Failed to toggle status', 'error');
        }
    } catch (error) {
        showToast('API request error', 'error');
    }
}

async function deleteMessage(id) {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
        const response = await fetch(`/api/messages/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Message removed successfully', 'success');
            loadContactMessages();
            loadAdminStats();
        } else {
            showToast('Failed to delete message', 'error');
        }
    } catch (error) {
        showToast('API request error', 'error');
    }
}

// ==========================================
// STOREFRONT CATALOG CRUD OPERATIONS
// ==========================================
async function loadCatalogProducts() {
    const tbody = document.getElementById('adminProductsCatalogList');
    if (!tbody) return;
    
    try {
        const response = await fetch('/api/shop/products');
        catalogProducts = await response.json();
        renderCatalogProducts();
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center danger-text">Failed to retrieve store items.</td></tr>`;
    }
}

function renderCatalogProducts() {
    const tbody = document.getElementById('adminProductsCatalogList');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (catalogProducts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No items in database catalog.</td></tr>`;
        return;
    }
    
    catalogProducts.forEach(prod => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><code>#${prod.id}</code></td>
            <td class="catalog-details-cell">
                <h4>${prod.name}</h4>
                <p>${prod.description.substring(0, 60)}...</p>
            </td>
            <td><span class="badge">${prod.category}</span></td>
            <td><strong>$${prod.price.toFixed(2)}</strong></td>
            <td>
                <div class="task-item-actions">
                    <button class="task-action-icon-btn" onclick="openProductEditModal(${JSON.stringify(prod).replace(/"/g, '&quot;')})" title="Edit Product">
                        <i class='bx bx-edit-alt'></i>
                    </button>
                    <button class="task-action-icon-btn delete" onclick="deleteCatalogProduct(${prod.id})" title="Delete Product">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function deleteCatalogProduct(id) {
    if (!confirm('Are you sure you want to delete this inventory item?')) return;
    
    try {
        const response = await fetch(`/api/shop/products/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Item removed from inventory', 'success');
            loadCatalogProducts();
            loadAdminStats();
        } else {
            showToast('Failed to delete item', 'error');
        }
    } catch (error) {
        showToast('API request error', 'error');
    }
}

// ==========================================
// ADD/EDIT CATALOG PRODUCT FORM MODAL
// ==========================================
function initProductForm() {
    const modal = document.getElementById('productFormModal');
    const closeBtn = document.getElementById('productFormModalCloseBtn');
    const form = document.getElementById('adminProductForm');
    
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', closeProductModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeProductModal();
        });
    }
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const id = document.getElementById('adminProductId').value;
            const name = document.getElementById('adminProductName').value;
            const category = document.getElementById('adminProductCategory').value;
            const price = document.getElementById('adminProductPrice').value;
            const description = document.getElementById('adminProductDesc').value;
            const image_url = document.getElementById('adminProductImage').value;
            
            const isEdit = !!id;
            const url = isEdit ? `/api/shop/products/${id}` : '/api/shop/products';
            const method = isEdit ? 'PUT' : 'POST';
            
            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, category, price, description, image_url })
                });
                const data = await response.json();
                
                if (response.ok) {
                    showToast(isEdit ? 'Item updated successfully' : 'Item added successfully!', 'success');
                    closeProductModal();
                    loadCatalogProducts();
                    loadAdminStats();
                } else {
                    showToast(data.error || 'Operation failed', 'error');
                }
            } catch (error) {
                showToast('API request error', 'error');
            }
        });
    }
}

function openAddProductModal() {
    const modal = document.getElementById('productFormModal');
    const heading = document.getElementById('productFormModalHeading');
    const submitBtn = document.getElementById('adminProductSubmitBtn');
    
    if (!modal) return;
    
    heading.textContent = 'Create Catalog Item';
    document.getElementById('adminProductId').value = '';
    document.getElementById('adminProductName').value = '';
    document.getElementById('adminProductCategory').value = '';
    document.getElementById('adminProductPrice').value = '';
    document.getElementById('adminProductDesc').value = '';
    document.getElementById('adminProductImage').value = '';
    submitBtn.textContent = 'Save Catalog Item';
    
    modal.classList.add('active');
}

function openProductEditModal(prod) {
    const modal = document.getElementById('productFormModal');
    const heading = document.getElementById('productFormModalHeading');
    const submitBtn = document.getElementById('adminProductSubmitBtn');
    
    if (!modal) return;
    
    heading.textContent = 'Modify Catalog Item';
    document.getElementById('adminProductId').value = prod.id;
    document.getElementById('adminProductName').value = prod.name;
    document.getElementById('adminProductCategory').value = prod.category;
    document.getElementById('adminProductPrice').value = prod.price;
    document.getElementById('adminProductDesc').value = prod.description;
    document.getElementById('adminProductImage').value = prod.image_url || '';
    submitBtn.textContent = 'Save Changes';
    
    modal.classList.add('active');
}

function closeProductModal() {
    const modal = document.getElementById('productFormModal');
    if (modal) modal.classList.remove('active');
}

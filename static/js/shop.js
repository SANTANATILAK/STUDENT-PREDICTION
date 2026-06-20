// E-Commerce Storefront Controller
let allProducts = [];
let cart = [];
let shopCategories = new Set();
let shopFilterCat = 'all';

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    initCartDrawer();
    initSearchAndFilter();
    initProductModal();
    initShopAuth();
    
    // Listen to global auth state changes
    document.addEventListener('userAuthStateChanged', (e) => {
        handleShopAuthStateChange(e.detail);
    });
});

// ==========================================
// STOREFRONT CATALOG LOAD & SEARCH
// ==========================================
async function loadProducts() {
    const grid = document.getElementById('productsCatalogGrid');
    if (!grid) return;
    
    try {
        const response = await fetch('/api/shop/products');
        allProducts = await response.json();
        
        // Parse unique categories
        shopCategories.clear();
        allProducts.forEach(p => shopCategories.add(p.category));
        
        renderCategories();
        renderCatalog();
    } catch (error) {
        console.error('Error fetching products:', error);
        grid.innerHTML = `<p class="text-center danger-text">Failed to query store catalog.</p>`;
    }
}

function renderCategories() {
    const list = document.getElementById('shopCategories');
    if (!list) return;
    
    // Keep 'All' button and clear remainder
    list.innerHTML = `<button class="shop-cat-btn active" data-cat="all">All Prints & Presets</button>`;
    
    shopCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'shop-cat-btn';
        btn.setAttribute('data-cat', cat);
        btn.textContent = cat;
        list.appendChild(btn);
    });
    
    // Rebind listeners
    const buttons = document.querySelectorAll('.shop-cat-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            shopFilterCat = btn.getAttribute('data-cat');
            renderCatalog();
        });
    });
}

function renderCatalog() {
    const grid = document.getElementById('productsCatalogGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const query = document.getElementById('shopSearchInput').value.toLowerCase();
    
    let filtered = allProducts;
    
    // Category filter
    if (shopFilterCat !== 'all') {
        filtered = filtered.filter(p => p.category === shopFilterCat);
    }
    
    // Text search
    if (query) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = `<p class="text-center text-muted" style="grid-column: span 2; padding: 2rem 0;">No prints or presets match your search query.</p>`;
        return;
    }
    
    filtered.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'card catalog-item-card';
        
        card.innerHTML = `
            <div class="catalog-art-wrapper" onclick="openProductModal(${prod.id})">
                ${prod.image_url}
            </div>
            <h3 onclick="openProductModal(${prod.id})" style="cursor: pointer;">${prod.name}</h3>
            <p class="catalog-desc">${prod.description.substring(0, 75)}...</p>
            <div class="catalog-price-row">
                <span class="catalog-price">$${prod.price.toFixed(2)}</span>
                <button class="btn btn-secondary btn-sm" onclick="addToCart(${prod.id})">
                    <i class='bx bx-cart-add'></i> Add
                </button>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function initSearchAndFilter() {
    const search = document.getElementById('shopSearchInput');
    if (search) {
        search.addEventListener('input', renderCatalog);
    }
}

// ==========================================
// PRODUCT DETAIL POPUP MODAL
// ==========================================
function initProductModal() {
    const modal = document.getElementById('productModal');
    const closeBtn = document.getElementById('productModalCloseBtn');
    
    if (modal) {
        const close = () => modal.classList.remove('active');
        if (closeBtn) closeBtn.addEventListener('click', close);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });
    }
}

function openProductModal(id) {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    
    const prod = allProducts.find(p => p.id === id);
    if (!prod) return;
    
    document.getElementById('productModalCategory').textContent = prod.category;
    document.getElementById('productModalName').textContent = prod.name;
    document.getElementById('productModalDesc').textContent = prod.description;
    document.getElementById('productModalPrice').textContent = `$${prod.price.toFixed(2)}`;
    document.getElementById('productModalGraphic').innerHTML = prod.image_url;
    
    const btn = document.getElementById('productModalAddToCartBtn');
    btn.onclick = () => {
        addToCart(prod.id);
        modal.classList.remove('active');
    };
    
    modal.classList.add('active');
}

// ==========================================
// SHOPPING CART DRAWER OPERATIONS
// ==========================================
function initCartDrawer() {
    const cartToggle = document.getElementById('cartToggleBtn');
    const cartClose = document.getElementById('cartCloseBtn');
    const cartDrawer = document.getElementById('cartDrawer');
    const checkoutBtn = document.getElementById('cartCheckoutBtn');
    
    if (cartToggle && cartDrawer) {
        cartToggle.addEventListener('click', () => {
            cartDrawer.classList.toggle('active');
        });
    }
    
    if (cartClose && cartDrawer) {
        cartClose.addEventListener('click', () => {
            cartDrawer.classList.remove('active');
        });
    }
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkoutCart);
    }
    
    const paymentModalClose = document.getElementById('paymentModalCloseBtn');
    const paymentModal = document.getElementById('upiPaymentModal');
    if (paymentModalClose && paymentModal) {
        paymentModalClose.addEventListener('click', () => {
            paymentModal.classList.remove('active');
        });
        paymentModal.addEventListener('click', (e) => {
            if (e.target === paymentModal) paymentModal.classList.remove('active');
        });
    }
    
    // Load cached cart from session storage if exists
    const cached = sessionStorage.getItem('shopping_cart');
    if (cached) {
        try {
            cart = JSON.parse(cached);
            renderCart();
        } catch (e) {
            cart = [];
        }
    }
}

function addToCart(id) {
    const prod = allProducts.find(p => p.id === id);
    if (!prod) return;
    
    const existing = cart.find(item => item.product_id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            product_id: prod.id,
            name: prod.name,
            price: prod.price,
            quantity: 1
        });
    }
    
    saveAndRenderCart();
    showToast(`${prod.name} added to cart!`, 'success');
    
    // Open drawer automatically on mobile/web to show added item
    const drawer = document.getElementById('cartDrawer');
    if (drawer) drawer.classList.add('active');
}

function updateQuantity(id, amount) {
    const item = cart.find(i => i.product_id === id);
    if (!item) return;
    
    item.quantity += amount;
    if (item.quantity <= 0) {
        removeFromCart(id);
    } else {
        saveAndRenderCart();
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.product_id !== id);
    saveAndRenderCart();
}

function saveAndRenderCart() {
    sessionStorage.setItem('shopping_cart', JSON.stringify(cart));
    renderCart();
}

function renderCart() {
    const list = document.getElementById('cartItemsList');
    const badge = document.getElementById('cartCountBadge');
    
    if (!list) return;
    
    // Update badge count
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalCount;
    
    if (cart.length === 0) {
        list.innerHTML = `
            <div class="empty-cart-msg">
                <i class='bx bx-cart-add'></i>
                <p>Your shopping cart is empty.</p>
            </div>
        `;
        
        document.getElementById('cartSubtotal').textContent = '$0.00';
        document.getElementById('cartTax').textContent = '$0.00';
        document.getElementById('cartTotal').textContent = '$0.00';
        return;
    }
    
    list.innerHTML = '';
    
    let subtotal = 0;
    cart.forEach(item => {
        const cost = item.price * item.quantity;
        subtotal += cost;
        
        const row = document.createElement('div');
        row.className = 'cart-item-row';
        row.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>$${item.price.toFixed(2)} ea</p>
            </div>
            <div class="cart-qty-controls">
                <button class="cart-qty-btn" onclick="updateQuantity(${item.product_id}, -1)">-</button>
                <span class="cart-qty-num">${item.quantity}</span>
                <button class="cart-qty-btn" onclick="updateQuantity(${item.product_id}, 1)">+</button>
            </div>
            <button class="cart-item-remove-btn" onclick="removeFromCart(${item.product_id})">
                <i class='bx bx-trash'></i>
            </button>
        `;
        list.appendChild(row);
    });
    
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    
    document.getElementById('cartSubtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('cartTax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('cartTotal').textContent = `$${total.toFixed(2)}`;
}

// ==========================================
// CHECKOUT & AUTHENTICATION
// ==========================================
function handleShopAuthStateChange(auth) {
    const authMsg = document.getElementById('cartCheckoutAuthMessage');
    const ordersSection = document.getElementById('shopOrderHistorySection');
    const checkoutBtn = document.getElementById('cartCheckoutBtn');
    
    if (auth.authenticated) {
        if (authMsg) authMsg.classList.add('hidden');
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.style.opacity = 1;
        }
        if (ordersSection) {
            ordersSection.classList.remove('hidden');
            fetchOrders();
        }
    } else {
        if (authMsg) authMsg.classList.remove('hidden');
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.style.opacity = 0.5;
        }
        if (ordersSection) ordersSection.classList.add('hidden');
    }
}

function checkoutCart() {
    if (cart.length === 0) {
        showToast('Your cart is empty', 'warning');
        return;
    }
    
    if (!currentUser) {
        openShopLoginModal();
        return;
    }
    
    // Close the cart drawer
    const drawer = document.getElementById('cartDrawer');
    if (drawer) drawer.classList.remove('active');
    
    // Open UPI payment modal
    const paymentModal = document.getElementById('upiPaymentModal');
    if (paymentModal) {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.08;
        const total = subtotal + tax;
        document.getElementById('paymentModalTotal').textContent = `$${total.toFixed(2)}`;
        
        paymentModal.classList.add('active');
        
        // Setup confirmation button click handler
        const confirmBtn = document.getElementById('upiConfirmPaymentBtn');
        confirmBtn.onclick = async () => {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Submitting Order...`;
            
            try {
                const response = await fetch('/api/shop/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: cart })
                });
                const data = await response.json();
                
                if (response.ok) {
                    showToast('Order confirmed! Send screenshot to +91 81212 45333 via WhatsApp.', 'success');
                    cart = [];
                    saveAndRenderCart();
                    paymentModal.classList.remove('active');
                    fetchOrders();
                } else {
                    showToast(data.error || 'Failed to place order', 'error');
                }
            } catch (error) {
                showToast('Checkout connection error', 'error');
            } finally {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = `<i class='bx bx-check-shield'></i> Confirm Payment & Place Order`;
            }
        };
    }
}

async function fetchOrders() {
    const tbody = document.getElementById('ordersHistoryList');
    if (!tbody) return;
    
    try {
        const response = await fetch('/api/shop/orders');
        const orders = await response.json();
        
        if (orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No purchase records found.</td></tr>`;
            return;
        }
        
        tbody.innerHTML = '';
        orders.forEach(order => {
            const dateStr = new Date(order.created_at).toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            
            // Format order items list
            const itemsSummary = order.items.map(it => `${it.product_name} (x${it.quantity})`).join(', ');
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><code>#${order.id}</code></td>
                <td>${dateStr}</td>
                <td>${itemsSummary}</td>
                <td><strong>$${order.total_price.toFixed(2)}</strong></td>
                <td><span class="badge" style="background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); color: var(--color-accent-green);">${order.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Error fetching orders:', e);
    }
}

// ==========================================
// IN-SHOP REGISTRATION / LOGIN MODAL
// ==========================================
function initShopAuth() {
    const loginForm = document.getElementById('shopLoginForm');
    const registerForm = document.getElementById('shopRegisterForm');
    const modal = document.getElementById('shopLoginModal');
    const closeBtn = document.getElementById('shopLoginModalCloseBtn');
    
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.remove('active'));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('shopLoginUsername').value;
            const password = document.getElementById('shopLoginPassword').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                
                if (response.ok) {
                    showToast('Logged in successfully', 'success');
                    modal.classList.remove('active');
                    checkAuthStatus(); // Reload global navbar widgets
                } else {
                    showToast(data.error || 'Authentication failed', 'error');
                }
            } catch (error) {
                showToast('Login request error', 'error');
            }
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('shopRegisterUsername').value;
            const password = document.getElementById('shopRegisterPassword').value;
            
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                
                if (response.ok) {
                    showToast('Account created successfully', 'success');
                    modal.classList.remove('active');
                    checkAuthStatus();
                } else {
                    showToast(data.error || 'Registration failed', 'error');
                }
            } catch (error) {
                showToast('Registration request error', 'error');
            }
        });
    }
}

function openShopLoginModal() {
    const modal = document.getElementById('shopLoginModal');
    if (modal) modal.classList.add('active');
}

function switchShopAuthTab(tab) {
    const loginTab = document.getElementById('shopAuthTabLogin');
    const registerTab = document.getElementById('shopAuthTabRegister');
    const loginForm = document.getElementById('shopLoginForm');
    const registerForm = document.getElementById('shopRegisterForm');
    
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

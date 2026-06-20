// Blog Platform Controller
let blogPosts = [];
let currentPostId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadBlogPosts();
    initBlogForms();
    initBlogPostModal();
    
    // Listen to global auth state changes
    document.addEventListener('userAuthStateChanged', (e) => {
        handleBlogAuthStateChange(e.detail);
    });
});

// ==========================================
// ARTICLES LOAD & RENDERING
// ==========================================
async function loadBlogPosts() {
    const list = document.getElementById('blogPostsList');
    if (!list) return;
    
    try {
        const response = await fetch('/api/blog/posts');
        blogPosts = await response.json();
        
        renderBlogPostsList();
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        list.innerHTML = `<p class="text-center danger-text">Failed to query journal entries.</p>`;
    }
}

function renderBlogPostsList() {
    const list = document.getElementById('blogPostsList');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (blogPosts.length === 0) {
        list.innerHTML = `<p class="text-center text-muted">No blog posts found. Write the first post!</p>`;
        return;
    }
    
    blogPosts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'card post-summary-card';
        card.onclick = () => viewPostDetails(post.id);
        
        const dateStr = new Date(post.created_at).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        
        // Render first 200 chars as summary
        const summary = post.content.length > 200 ? post.content.substring(0, 200) + '...' : post.content;
        
        card.innerHTML = `
            <div class="post-meta-details">
                <span class="post-meta-author"><i class='bx bx-user'></i> ${post.author_username}</span>
                <span class="post-meta-date"><i class='bx bx-calendar'></i> ${dateStr}</span>
            </div>
            <h3>${post.title}</h3>
            <p>${summary}</p>
            <div class="read-more-row">
                <span>Read Full Story <i class='bx bx-right-arrow-alt'></i></span>
                <span class="badge comments-count-pill">${post.comments_count} Comment${post.comments_count !== 1 ? 's' : ''}</span>
            </div>
        `;
        
        list.appendChild(card);
    });
}

// ==========================================
// DETAILED POST VIEW & COMMENTS
// ==========================================
async function viewPostDetails(id) {
    const listContainer = document.getElementById('blogPostsListContainer');
    const expContainer = document.getElementById('blogExpandedPostContainer');
    
    if (!listContainer || !expContainer) return;
    
    try {
        const response = await fetch(`/api/blog/posts/${id}`);
        if (!response.ok) throw new Error('Post detail fetch failed');
        
        const post = await response.json();
        currentPostId = post.id;
        
        // Show container
        listContainer.classList.add('hidden');
        expContainer.classList.remove('hidden');
        
        // Set details
        document.getElementById('expandedPostTitle').textContent = post.title;
        document.getElementById('expandedPostAuthor').innerHTML = `<i class='bx bx-user'></i> ${post.author_username}`;
        
        const dateStr = new Date(post.created_at).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        document.getElementById('expandedPostDate').innerHTML = `<i class='bx bx-calendar'></i> ${dateStr}`;
        
        // Render paragraphs
        const bodyEl = document.getElementById('expandedPostBody');
        bodyEl.innerHTML = post.content.split('\n\n').map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`).join('');
        
        // Render comments count badge
        document.getElementById('commentsCountBadge').textContent = post.comments.length;
        
        // Render comments list
        renderComments(post.comments);
        
        // Render Operations buttons based on author ownership or admin role
        const opsRow = document.getElementById('postOperations');
        const editBtn = document.getElementById('editPostBtn');
        const deleteBtn = document.getElementById('deletePostBtn');
        
        if (currentUser && (post.author_username === currentUser.username || currentUser.role === 'admin')) {
            opsRow.classList.remove('hidden');
            editBtn.onclick = () => openBlogPostModal('edit', post);
            deleteBtn.onclick = () => deleteBlogPost(post.id);
        } else {
            opsRow.classList.add('hidden');
        }
        
        // Reset comment author name if logged in
        const nameInput = document.getElementById('commentAuthorName');
        if (currentUser) {
            nameInput.value = currentUser.username;
            nameInput.disabled = true;
        } else {
            nameInput.value = '';
            nameInput.disabled = false;
        }
        
        // Scroll to top of article
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        showToast('Error loading story details', 'error');
        showPostsList();
    }
}

function showPostsList() {
    const listContainer = document.getElementById('blogPostsListContainer');
    const expContainer = document.getElementById('blogExpandedPostContainer');
    
    if (listContainer && expContainer) {
        listContainer.classList.remove('hidden');
        expContainer.classList.add('hidden');
        currentPostId = null;
        loadBlogPosts(); // Reload summaries
    }
}

function renderComments(comments) {
    const list = document.getElementById('commentsList');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (comments.length === 0) {
        list.innerHTML = `<p class="text-center text-muted" style="padding: 1rem 0;">No comments written yet. Be the first to join the conversation!</p>`;
        return;
    }
    
    comments.forEach(com => {
        const card = document.createElement('div');
        card.className = 'comment-card';
        
        const dateStr = new Date(com.created_at).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        card.innerHTML = `
            <div class="comment-meta">
                <span class="comment-author">${com.author_name}</span>
                <span>${dateStr}</span>
            </div>
            <p class="comment-content">${com.content}</p>
        `;
        list.appendChild(card);
    });
}

function initBlogForms() {
    // Comment Form
    const commentForm = document.getElementById('addCommentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentPostId) return;
            
            const author_name = document.getElementById('commentAuthorName').value;
            const content = document.getElementById('commentContent').value;
            
            try {
                const response = await fetch(`/api/blog/posts/${currentPostId}/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ author_name, content })
                });
                const data = await response.json();
                
                if (response.ok) {
                    showToast('Comment appended!', 'success');
                    document.getElementById('commentContent').value = '';
                    
                    // Reload details dynamically
                    viewPostDetails(currentPostId);
                } else {
                    showToast(data.error || 'Failed to submit comment', 'error');
                }
            } catch (error) {
                showToast('Comment submit error', 'error');
            }
        });
    }
    
    // Blog Post modal save form
    const postForm = document.getElementById('blogPostForm');
    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('blogPostId').value;
            const title = document.getElementById('blogPostTitle').value;
            const content = document.getElementById('blogPostContent').value;
            
            const isEdit = !!id;
            const url = isEdit ? `/api/blog/posts/${id}` : '/api/blog/posts';
            const method = isEdit ? 'PUT' : 'POST';
            
            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, content })
                });
                const data = await response.json();
                
                if (response.ok) {
                    showToast(isEdit ? 'Story changes saved' : 'Story published successfully!', 'success');
                    closeBlogPostModal();
                    
                    if (isEdit) {
                        viewPostDetails(id); // Reload active details
                    } else {
                        showPostsList(); // Go back to list and reload
                    }
                } else {
                    showToast(data.error || 'Operation failed', 'error');
                }
            } catch (error) {
                showToast('API save error', 'error');
            }
        });
    }
}

// ==========================================
// AUTH STATE HANDLERS
// ==========================================
function handleBlogAuthStateChange(auth) {
    const authCard = document.getElementById('blogSidebarAuthCard');
    if (!authCard) return;
    
    if (auth.authenticated) {
        authCard.innerHTML = `
            <h3>Author Dashboard</h3>
            <p>Welcome back, ${auth.user.username}! Create and share new coding insights.</p>
            <button class="btn btn-primary btn-sm btn-block" onclick="openBlogPostModal('create')">
                <i class='bx bx-plus-circle'></i> Create New Post
            </button>
        `;
    } else {
        authCard.innerHTML = `
            <h3>Join the Journal</h3>
            <p>Register or log in to post comments or publish your own behind-the-scenes stories.</p>
            <button class="btn btn-primary btn-sm btn-block" onclick="window.location.href='/tasks'">
                Log In / Sign Up
            </button>
        `;
    }
}

// ==========================================
// EDIT / CREATE POST MODAL
// ==========================================
function initBlogPostModal() {
    const modal = document.getElementById('blogPostModal');
    const closeBtn = document.getElementById('blogPostModalCloseBtn');
    
    if (modal) {
        const close = () => modal.classList.remove('active');
        if (closeBtn) closeBtn.addEventListener('click', close);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });
    }
}

function openBlogPostModal(mode, post = null) {
    const modal = document.getElementById('blogPostModal');
    const heading = document.getElementById('blogPostModalHeading');
    const submitBtn = document.getElementById('blogPostSubmitBtn');
    
    if (!modal) return;
    
    if (mode === 'edit' && post) {
        heading.innerHTML = `<i class='bx bx-edit-alt'></i> Modify Story`;
        document.getElementById('blogPostId').value = post.id;
        document.getElementById('blogPostTitle').value = post.title;
        document.getElementById('blogPostContent').value = post.content;
        submitBtn.textContent = 'Save Changes';
    } else {
        heading.innerHTML = `<i class='bx bx-plus-circle'></i> Publish Journal Post`;
        document.getElementById('blogPostId').value = '';
        document.getElementById('blogPostTitle').value = '';
        document.getElementById('blogPostContent').value = '';
        submitBtn.textContent = 'Publish Story';
    }
    
    modal.classList.add('active');
}

function closeBlogPostModal() {
    const modal = document.getElementById('blogPostModal');
    if (modal) modal.classList.remove('active');
}

async function deleteBlogPost(id) {
    if (!confirm('Are you sure you want to delete this blog post? This will delete all comments as well.')) return;
    
    try {
        const response = await fetch(`/api/blog/posts/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Story removed from database', 'success');
            showPostsList();
        } else {
            showToast('Failed to delete story', 'error');
        }
    } catch (error) {
        showToast('Server delete error', 'error');
    }
}

// Skills & Projects Hub Logic
document.addEventListener('DOMContentLoaded', () => {
    initTypewriter();
    loadSkills();
    loadProjects();
    initContactForm();
    initModalEvents();
});

// ==========================================
// HERO TYPEWRITER ANIMATION
// ==========================================
function initTypewriter() {
    const target = document.getElementById('typing-text');
    if (!target) return;
    
    const words = ["scalable web APIs", "responsive UI views", "relational schemas", "full-stack systems"];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function type() {
        const currentWord = words[wordIndex];
        
        if (isDeleting) {
            target.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
        } else {
            target.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
        }
        
        let typeSpeed = isDeleting ? 40 : 80;
        
        if (!isDeleting && charIndex === currentWord.length) {
            typeSpeed = 2000; // Pause at end of word
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typeSpeed = 500; // Pause before typing next word
        }
        
        setTimeout(type, typeSpeed);
    }
    
    setTimeout(type, 500);
}

// ==========================================
// SKILLS LOAD & ANIMATION
// ==========================================
async function loadSkills() {
    try {
        const response = await fetch('/api/skills');
        const skills = await response.json();
        
        // Group skills by category
        const categories = ['Frontend', 'Backend', 'Database', 'Tools'];
        
        categories.forEach(cat => {
            const listContainer = document.getElementById(`skills-${cat}`);
            if (!listContainer) return;
            
            listContainer.innerHTML = '';
            
            const catSkills = skills.filter(s => s.category === cat);
            if (catSkills.length === 0) {
                listContainer.innerHTML = `<p class="text-dark">No skills added yet.</p>`;
                return;
            }
            
            catSkills.forEach(skill => {
                const item = document.createElement('div');
                item.className = 'skill-item-bar';
                item.innerHTML = `
                    <div class="skill-label-row">
                        <span>${skill.name}</span>
                        <span>${skill.proficiency}%</span>
                    </div>
                    <div class="skill-progress-bg">
                        <div class="skill-progress-fill" id="progress-bar-${skill.id}" style="width: 0%;"></div>
                    </div>
                `;
                listContainer.appendChild(item);
                
                // Animate expansion slightly after creation
                setTimeout(() => {
                    const fill = document.getElementById(`progress-bar-${skill.id}`);
                    if (fill) fill.style.width = `${skill.proficiency}%`;
                }, 100);
            });
        });
    } catch (error) {
        console.error('Error fetching skills:', error);
    }
}

// ==========================================
// PROJECTS DATABASE LOAD & CRUD SHOWCASE
// ==========================================
let allProjects = [];

async function loadProjects() {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    
    try {
        const response = await fetch('/api/projects');
        allProjects = await response.json();
        
        renderProjects(allProjects);
        initFilters();
    } catch (error) {
        console.error('Error loading projects:', error);
        grid.innerHTML = `<p class="text-center danger-text">Failed to query projects database.</p>`;
    }
}

function renderProjects(projects) {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (projects.length === 0) {
        grid.innerHTML = `<p class="text-center text-muted">No projects correspond to this filter.</p>`;
        return;
    }
    
    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'card project-card';
        card.setAttribute('data-category', project.category);
        
        // Pick representation icon
        let iconHtml = "<i class='bx bx-code-block'></i>";
        if (project.image_url === 'portfolio') iconHtml = "<i class='bx bx-desktop'></i>";
        if (project.image_url === 'tasks') iconHtml = "<i class='bx bx-task'></i>";
        if (project.image_url === 'shop') iconHtml = "<i class='bx bx-store'></i>";
        if (project.image_url === 'blog') iconHtml = "<i class='bx bx-chat'></i>";
        
        const techTags = project.technologies.split(',').map(t => `<span class="tech-tag">${t.trim()}</span>`).join('');
        
        card.innerHTML = `
            <div class="project-top-row">
                <div class="project-icon-art">
                    ${iconHtml}
                </div>
                <span class="badge">${project.category}</span>
            </div>
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <div class="project-techs-row">
                ${techTags}
            </div>
            <div class="project-footer-row">
                <span class="learn-more-link">Learn More <i class='bx bx-right-arrow-alt'></i></span>
            </div>
        `;
        
        // Add details click listener
        card.addEventListener('click', () => {
            openProjectModal(project);
        });
        
        grid.appendChild(card);
    });
}

function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            if (filter === 'all') {
                renderProjects(allProjects);
            } else {
                const filtered = allProjects.filter(p => p.category === filter);
                renderProjects(filtered);
            }
        });
    });
}

// ==========================================
// PROJECT DETAILS MODAL
// ==========================================
function openProjectModal(project) {
    const modal = document.getElementById('projectModal');
    const title = document.getElementById('modalTitle');
    const category = document.getElementById('modalCategory');
    const desc = document.getElementById('modalDescription');
    const techTags = document.getElementById('modalTechTags');
    const liveLink = document.getElementById('modalLiveLink');
    const codeLink = document.getElementById('modalCodeLink');
    const graphic = document.getElementById('modalGraphic');
    
    if (!modal) return;
    
    // Set contents
    title.textContent = project.title;
    category.textContent = project.category;
    desc.textContent = project.description;
    
    // Set graphics
    let iconHtml = "<i class='bx bx-code-block' style='font-size: 5rem; color: var(--color-primary);'></i>";
    if (project.image_url === 'portfolio') iconHtml = "<i class='bx bx-desktop' style='font-size: 5rem; color: var(--color-primary);'></i>";
    if (project.image_url === 'tasks') iconHtml = "<i class='bx bx-task' style='font-size: 5rem; color: var(--color-primary);'></i>";
    if (project.image_url === 'shop') iconHtml = "<i class='bx bx-store' style='font-size: 5rem; color: var(--color-accent);'></i>";
    if (project.image_url === 'blog') iconHtml = "<i class='bx bx-chat' style='font-size: 5rem; color: var(--color-secondary);'></i>";
    graphic.innerHTML = iconHtml;
    
    // Tech list tags
    techTags.innerHTML = project.technologies.split(',').map(t => `<span class="tech-tag">${t.trim()}</span>`).join('');
    
    // Links
    liveLink.href = project.live_url;
    codeLink.href = project.github_url;
    
    // Show modal
    modal.classList.add('active');
}

function initModalEvents() {
    const modal = document.getElementById('projectModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    
    if (!modal) return;
    
    const close = () => modal.classList.remove('active');
    
    if (closeBtn) closeBtn.addEventListener('click', close);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });
}

// ==========================================
// CONTACT MESSAGE SUBMISSION
// ==========================================
function initContactForm() {
    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('contactSubmitBtn');
    
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value.strip ? document.getElementById('name').value.trim() : document.getElementById('name').value;
        const email = document.getElementById('email').value.strip ? document.getElementById('email').value.trim() : document.getElementById('email').value;
        const subject = document.getElementById('subject').value.strip ? document.getElementById('subject').value.trim() : document.getElementById('subject').value;
        const message = document.getElementById('message').value.strip ? document.getElementById('message').value.trim() : document.getElementById('message').value;
        
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, subject, message })
            });
            const data = await response.json();
            
            if (response.ok) {
                showToast(data.message || 'Message sent successfully!', 'success');
                form.reset();
            } else {
                showToast(data.error || 'Failed to submit contact request.', 'error');
            }
        } catch (error) {
            console.error('Contact Form error:', error);
            showToast('Unable to connect to the backend server.', 'error');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
}

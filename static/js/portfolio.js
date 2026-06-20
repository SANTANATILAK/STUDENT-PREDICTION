// Carbon Cinema - Showcase & Studio Relations Logic
document.addEventListener('DOMContentLoaded', () => {
    initTypewriter();
    loadStudioGear();
    loadGalleryItems();
    initContactForm();
    initModalEvents();
});

// ==========================================
// HERO TYPEWRITER ANIMATION
// ==========================================
function initTypewriter() {
    const target = document.getElementById('typing-text');
    if (!target) return;
    
    const words = ["Lamborghini launches", "Ferrari rolling shots", "superbike trackdays", "night city cinematics"];
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
// GEAR (SKILLS) LOAD & ANIMATION
// ==========================================
async function loadStudioGear() {
    try {
        const response = await fetch('/api/skills');
        const gears = await response.json();
        
        // Group gear by category
        const categories = ['Cameras', 'Lenses', 'Rigging', 'Lighting'];
        
        categories.forEach(cat => {
            const listContainer = document.getElementById(`skills-${cat}`);
            if (!listContainer) return;
            
            listContainer.innerHTML = '';
            
            const catGear = gears.filter(g => g.category === cat);
            if (catGear.length === 0) {
                listContainer.innerHTML = `<p class="text-muted">No gear records loaded.</p>`;
                return;
            }
            
            catGear.forEach(gear => {
                const item = document.createElement('div');
                item.className = 'skill-item-bar';
                item.innerHTML = `
                    <div class="skill-label-row">
                        <span>${gear.name}</span>
                        <span>${gear.proficiency}%</span>
                    </div>
                    <div class="skill-progress-bg">
                        <div class="skill-progress-fill" id="progress-bar-${gear.id}" style="width: 0%; background: var(--gradient-hero);"></div>
                    </div>
                `;
                listContainer.appendChild(item);
                
                // Animate progress bar slightly after creation
                setTimeout(() => {
                    const fill = document.getElementById(`progress-bar-${gear.id}`);
                    if (fill) fill.style.width = `${gear.proficiency}%`;
                }, 100);
            });
        });
    } catch (error) {
        console.error('Error fetching gear catalog:', error);
    }
}

// ==========================================
// GALLERY (PROJECTS) LOAD & FILTER
// ==========================================
let allGalleryItems = [];

async function loadGalleryItems() {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    
    try {
        const response = await fetch('/api/projects');
        allGalleryItems = await response.json();
        
        renderGallery(allGalleryItems);
        initFilters();
    } catch (error) {
        console.error('Error loading gallery:', error);
        grid.innerHTML = `<p class="text-center danger-text">Failed to query studio archives.</p>`;
    }
}

function renderGallery(items) {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (items.length === 0) {
        grid.innerHTML = `<p class="text-center text-muted">No shots correspond to this filter.</p>`;
        return;
    }
    
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.setAttribute('data-category', item.category);
        
        const techTags = item.technologies.split(',').map(t => `<span class="tech-tag">${t.trim()}</span>`).join('');
        
        card.innerHTML = `
            <div class="project-card-image-wrap">
                <img src="/static/images/${item.image_url}.png" alt="${item.title}" class="project-card-img" onerror="this.src='/static/images/lambo_hero.png'">
            </div>
            <div class="project-card-content">
                <div class="project-top-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem;">
                    <span class="badge" style="border-color: var(--color-primary); color: var(--color-primary);">${item.category}</span>
                </div>
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <div class="project-techs-row" style="display:flex; flex-wrap:wrap; gap:0.4rem; margin-bottom: 1.2rem;">
                    ${techTags}
                </div>
                <div class="project-footer-row" style="border-top: 1px solid var(--border-glass); padding-top: 0.8rem;">
                    <span class="learn-more-link" style="color: var(--color-primary); font-size: 0.9rem; font-weight: 600; display:flex; align-items:center; gap:0.3rem;">
                        View Shoot <i class='bx bx-right-arrow-alt'></i>
                    </span>
                </div>
            </div>
        `;
        
        // Add details click listener
        card.addEventListener('click', () => {
            openProjectModal(item);
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
                renderGallery(allGalleryItems);
            } else {
                const filtered = allGalleryItems.filter(p => p.category === filter);
                renderGallery(filtered);
            }
        });
    });
}

// ==========================================
// PORTFOLIO DETAILS MODAL
// ==========================================
function openProjectModal(item) {
    const modal = document.getElementById('projectModal');
    const title = document.getElementById('modalTitle');
    const category = document.getElementById('modalCategory');
    const desc = document.getElementById('modalDescription');
    const techTags = document.getElementById('modalTechTags');
    const liveLink = document.getElementById('modalLiveLink');
    const graphic = document.getElementById('modalGraphic');
    
    if (!modal) return;
    
    // Set contents
    title.textContent = item.title;
    category.textContent = item.category;
    desc.textContent = item.description;
    
    // Inject containment image
    graphic.innerHTML = `<img src="/static/images/${item.image_url}.png" alt="${item.title}" class="modal-img" onerror="this.src='/static/images/lambo_hero.png'">`;
    
    // Tech list tags
    techTags.innerHTML = item.technologies.split(',').map(t => `<span class="tech-tag">${t.trim()}</span>`).join('');
    
    // Set full-screen link
    liveLink.href = item.live_url;
    
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
// CONTACT / BOOKING MESSAGE SUBMISSION
// ==========================================
function initContactForm() {
    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('contactSubmitBtn');
    
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const vehicle = document.getElementById('vehicle_details').value.trim();
        const shootType = document.getElementById('shoot_type').value;
        const bookingDate = document.getElementById('booking_date').value;
        const bookingSlot = document.getElementById('booking_slot').value;
        const msgText = document.getElementById('message').value.trim();
        
        // Pack custom booking parameters into subject and message fields
        const subject = `Shoot Booking: ${shootType} - ${vehicle}`;
        const message = `Client Vehicle: ${vehicle}\nShoot Category: ${shootType}\nPreferred Date: ${bookingDate}\nTime Slot: ${bookingSlot}\n\nPreferred Location & Specs:\n${msgText}\n\nClient Email: ${email}`;
        
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
                showToast('Booking request submitted! Opening WhatsApp...', 'success');
                
                // Formulate the WhatsApp pre-filled message
                const whatsappMsg = `*New Shoot Booking Request* 🎥📸\n` +
                                    `-----------------------------------\n` +
                                    `*Name:* ${name}\n` +
                                    `*Email:* ${email}\n` +
                                    `*Vehicle:* ${vehicle}\n` +
                                    `*Shoot Type:* ${shootType}\n` +
                                    `*Date:* ${bookingDate}\n` +
                                    `*Slot:* ${bookingSlot}\n\n` +
                                    `*Location & Details:*\n${msgText}`;
                
                const encodedMsg = encodeURIComponent(whatsappMsg);
                const whatsappUrl = `https://wa.me/918121245333?text=${encodedMsg}`;
                
                // Open WhatsApp link in new tab after 1 second delay
                setTimeout(() => {
                    window.open(whatsappUrl, '_blank');
                }, 1000);
                
                form.reset();
            } else {
                showToast(data.error || 'Failed to submit booking request.', 'error');
            }
        } catch (error) {
            console.error('Booking Form error:', error);
            showToast('Unable to connect to the studio server.', 'error');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
}

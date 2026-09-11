/* =========================================
   1. CONTENT RENDERING & EMAIL ENCRYPTION
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {

    // Helper: Safely get element
    const el = (id) => document.getElementById(id);

    // Guard against missing data file (e.g., failed load or 404): keep the page readable instead of leaving empty shells.
    if (typeof profileData === 'undefined') {
        document.querySelectorAll('.reveal').forEach(node => node.classList.add('active'));
        const main = document.querySelector('main');
        if (main) {
            main.innerHTML = '<div class="data-fallback"><p class="data-fallback-text">Profile content could not be loaded. Please reload the page, or reach me via <a href="https://www.linkedin.com/in/dr-manuel-d-s-hopp-20855b209/" target="_blank" rel="noopener">LinkedIn</a> or <a href="https://scholar.google.com/citations?user=JC6qJIUlGJMC" target="_blank" rel="noopener">Google Scholar</a>.</p></div>';
        }
        return;
    }

    // --- A. Render Personal Info ---
    if (el('profile-name')) el('profile-name').textContent = profileData.personal.name;
    if (el('nav-name')) el('nav-name').textContent = profileData.personal.name;
    if (el('profile-role')) el('profile-role').textContent = profileData.personal.role;
    if (el('profile-inst')) el('profile-inst').innerHTML = `${profileData.personal.institution}<br>${profileData.personal.university}`;
    if (el('profile-img')) el('profile-img').src = profileData.personal.imagePath;

    // --- B. Render Email (Base64 Obfuscation & Click-to-Copy) ---
    // The email is decoded and assembled here. It does not exist in plaintext in the source.
    const mailLinks = document.querySelectorAll('.email-link');
    let fullEmail = '';
    try {
        const decodedUser = atob(profileData.personal.emailUser);
        const decodedDomain = atob(profileData.personal.emailDomain);
        fullEmail = `${decodedUser}@${decodedDomain}`;
    } catch (err) {
        console.error('Could not decode email address:', err);
    }

    mailLinks.forEach(link => {
        if (fullEmail) link.href = `mailto:${fullEmail}`;
        // Only set text content if the link is empty or explicitly asks for the address
        if (link.classList.contains('show-email-text')) {
            link.textContent = "Contact Me";
        }
    });

    // Legacy fallback for environments without the async Clipboard API (http, older webviews).
    function fallbackCopy(text) {
        return new Promise((resolve, reject) => {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try {
                const ok = document.execCommand('copy');
                ta.remove();
                ok ? resolve() : reject(new Error('execCommand copy failed'));
            } catch (err) {
                ta.remove();
                reject(err);
            }
        });
    }

    const copyBtns = document.querySelectorAll('.email-copy-btn');
    copyBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const tooltip = btn.querySelector('.copy-tooltip');
            if (!tooltip) return;

            const originalText = tooltip.textContent;
            tooltip.dataset.original = tooltip.dataset.original || originalText;

            const showResult = (text, isSuccess) => {
                tooltip.textContent = text;
                btn.classList.remove('copied', 'copy-failed');
                if (isSuccess) {
                    btn.classList.add('copied');
                    setTimeout(() => {
                        tooltip.textContent = originalText;
                        btn.classList.remove('copied');
                    }, 2000);
                } else {
                    // Persistent disclosure: the address stays visible and selectable
                    // until the user interacts elsewhere — no timer to race.
                    btn.classList.add('copy-failed');
                }
            };

            if (!fullEmail) {
                showResult('Email address unavailable', false);
                return;
            }

            const attempt = (window.isSecureContext && navigator.clipboard)
                ? navigator.clipboard.writeText(fullEmail)
                : Promise.reject(new Error('Clipboard API unavailable'));

            attempt.then(
                () => showResult('Copied!', true),
                () => fallbackCopy(fullEmail).then(
                    () => showResult('Copied!', true),
                    () => showResult(fullEmail, false)
                )
            );
        });
    });

    // Dismiss the persistent copy-failure disclosure when the visitor moves on.
    document.addEventListener('click', (e) => {
        document.querySelectorAll('.copy-btn.copy-failed').forEach(btn => {
            if (!btn.contains(e.target)) {
                const tooltip = btn.querySelector('.copy-tooltip');
                if (tooltip && tooltip.dataset.original) tooltip.textContent = tooltip.dataset.original;
                btn.classList.remove('copy-failed');
            }
        });
    });

    // --- C. Render About & Highlights ---
    if (el('about-content')) el('about-content').innerHTML = profileData.about;

    if (el('highlights-list')) {
        el('highlights-list').innerHTML = profileData.highlights.map(item => `
            <li class="flex items-start">
                <i class="ph ph-check-circle text-academic-500 mt-1 mr-3 flex-shrink-0"></i>
                <span class="text-gray-700 dark:text-gray-300">${item}</span>
            </li>
        `).join('');
    }

    // --- D. Render Interests (Badges) ---
    if (el('interests-list')) {
        el('interests-list').innerHTML = profileData.interests.map(interest =>
            `<span class="keyword-tag cursor-default">${interest}</span>`
        ).join('');
    }

    // --- D2. Render Skills (Badges) ---
    if (el('skills-list')) {
        el('skills-list').innerHTML = profileData.skills.map(skill =>
            `<span class="skill-tag cursor-default">${skill}</span>`
        ).join('');
    }

    // --- E. Render Publications ---
    if (el('publications-list')) {
        el('publications-list').innerHTML = profileData.publications.map(pub => {
            let authorsFormatted = pub.authors || '';
            // Ensure author name Hopp, M. D. S. is always bolded
            if (!authorsFormatted.includes('<strong>') && !authorsFormatted.includes('<b>')) {
                authorsFormatted = authorsFormatted.replace(/Hopp,\s*M\.\s*D\.\s*S\./g, '<strong>Hopp, M. D. S.</strong>');
            }
            return `<div class="relative">
                <div class="absolute -left-6 top-2 h-3 w-3 rounded-full border-2 border-white dark:border-[#0a0f15] bg-academic-500"></div>
                <div class="keyword-tag mb-2" style="font-size:0.68rem;font-weight:700;letter-spacing:0.08em;">${pub.year}</div>
                <h3 class="font-serif text-base font-bold text-slate-900 dark:text-white leading-snug mb-1">${pub.title}</h3>
                <p class="text-stone-500 dark:text-slate-400 italic text-sm">${pub.venue}</p>
                <p class="text-stone-600 dark:text-slate-300 mt-1.5 text-sm">${authorsFormatted}</p>
                ${pub.link ? `
                    <a href="${pub.link}" target="_blank" rel="noopener" class="text-academic-500 hover:text-academic-600 text-xs inline-flex items-center gap-1 mt-2 font-medium">
                        ${pub.linkText || 'View'} <i class="ph ph-arrow-right" aria-hidden="true"></i>
                    </a>
                ` : ''}
            </div>`;
        }).join('');
    }

    // --- F. Render Teaching ---
    if (el('teaching-list')) {
        el('teaching-list').innerHTML = profileData.teaching.map(item => `
            <li class="flex gap-3">
                <i class="ph ${item.icon} text-academic-500 text-lg mt-0.5"></i>
                <div>
                    <p class="text-sm font-semibold text-slate-900 dark:text-gray-200">${item.title}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${item.subtitle}</p>
                </div>
            </li>
        `).join('');
    }

    // --- G. Render Talks ---
    if (el('talks-list')) {
        el('talks-list').innerHTML = profileData.talks.map(talk => `
            <div class="flex gap-4">
                <div class="flex-shrink-0 mt-1">
                    <i class="ph ${talk.icon} text-xl text-gray-400"></i>
                </div>
                <div>
                    <h4 class="font-semibold text-slate-900 dark:text-white">${talk.title}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">${talk.location}</p>
                    ${talk.description ? `<p class="text-sm text-gray-700 dark:text-gray-300 mt-1">${talk.description}</p>` : ''}
                </div>
            </div>
        `).join('');
    }
});


/* =========================================
   2. UI INTERACTION (Dark Mode & Menu)
   ========================================= */
// Check local storage or system preference
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

function toggleTheme() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
    } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
    }
    syncThemeToggles();
}

function syncThemeToggles() {
    const isDark = document.documentElement.classList.contains('dark');
    document.querySelectorAll('#theme-toggle, #mobile-theme-toggle').forEach(btn => {
        if (!btn) return;
        btn.setAttribute('aria-pressed', String(isDark));
        if (btn.id === 'theme-toggle') {
            btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        }
    });
    const mobileLabel = document.getElementById('mobile-theme-label');
    if (mobileLabel) mobileLabel.textContent = isDark ? 'Light Mode' : 'Dark Mode';
}

syncThemeToggles();

document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
document.getElementById('mobile-theme-toggle')?.addEventListener('click', toggleTheme);

const menuBtn = document.getElementById('mobile-menu-btn');
const menu = document.getElementById('mobile-menu');

function setMenu(open) {
    if (!menu) return;
    menuBtn?.setAttribute('aria-expanded', String(open));
    if (open) {
        menu.classList.remove('menu-closing', 'hidden');
    } else {
        if (menu.classList.contains('hidden')) return;
        menu.classList.add('menu-closing');
        setTimeout(() => {
            if (menu.classList.contains('menu-closing')) {
                menu.classList.add('hidden');
                menu.classList.remove('menu-closing');
            }
        }, 180);
    }
}

menuBtn?.addEventListener('click', () => {
    setMenu(menu.classList.contains('hidden'));
});

// Close the menu after navigating; the theme toggle keeps the menu open so the
// state change is visible before the visitor continues.
menu?.querySelectorAll('a, button').forEach(item => {
    if (item.id === 'mobile-theme-toggle') return;
    item.addEventListener('click', () => setMenu(false));
});

// Escape closes the menu and returns focus to the toggle.
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu && !menu.classList.contains('hidden')) {
        setMenu(false);
        menuBtn?.focus();
    }
});

// Tapping outside the open menu closes it.
document.addEventListener('click', (e) => {
    if (menu && !menu.classList.contains('hidden') && menuBtn && !menu.contains(e.target) && !menuBtn.contains(e.target)) {
        setMenu(false);
    }
});


/* =========================================
   3. ADVANCED EFFECTS (Scroll & Reveal)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    // A. Scroll Progress Bar
    const progressBar = document.getElementById('scroll-progress');
    if (progressBar) {
        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            progressBar.style.width = scrolled + "%";
        });
    }

    // B. Reveal Animations
    // Content is visible by default (CSS). The hidden pre-reveal state is added
    // only right here, immediately before observing, and a scroll/timer fallback
    // force-reveals anything the observer misses — content can never stay hidden.
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    let revealObserver = null;
    if ('IntersectionObserver' in window) {
        try {
            revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        revealObserver.unobserve(entry.target); // Reveal once
                    }
                });
            }, observerOptions);
        } catch (err) {
            revealObserver = null;
        }
    }

    if (revealObserver) {
        document.querySelectorAll('.reveal').forEach(el => {
            el.classList.add('pre-reveal');
            revealObserver.observe(el);
        });
    }

    // Fallback: force-reveal anything already in the viewport that is still hidden.
    function revealInViewport() {
        const vh = window.innerHeight || document.documentElement.clientHeight;
        document.querySelectorAll('.reveal.pre-reveal:not(.active)').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.top < vh - 40 && r.bottom > 0) {
                el.classList.add('active');
            }
        });
    }
    setTimeout(revealInViewport, 1500);
    setTimeout(revealInViewport, 4000);
    window.addEventListener('scroll', revealInViewport, { passive: true });

    // C. Initialize Hero Background Topological Canvas
    initHeroCanvas();
});

/* =========================================
   4. TOPOLOGICAL BACKGROUND CANVAS
   ========================================= */
function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    let devicePixelRatio = window.devicePixelRatio || 1;

    // Respect the user's motion preference: static frame instead of continuous animation.
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Node count
    const numNodes = 32;
    const nodes = [];
    let currentThreshold = 120;
    let targetThreshold = 120;

    // Mouse coordinates relative to canvas
    const mouse = { x: 0, y: 0, active: false };

    // Setup canvas dimension with high-DPI scaling (capped at 2x: higher densities
    // triple the fill area for near-zero visible gain).
    function resize() {
        const rect = canvas.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = width * devicePixelRatio;
        canvas.height = height * devicePixelRatio;
        // Reset the transform first: repeated ctx.scale calls would otherwise compound on every resize.
        ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    window.addEventListener('resize', () => {
        resize();
        if (reducedMotion) render(0);
    });
    resize();

    // Initialize nodes
    for (let i = 0; i < numNodes; i++) {
        nodes.push({
            x: Math.random() * (width || 800),
            y: Math.random() * (height || 300),
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            radius: 2 + Math.random() * 1.5,
            baseVx: 0,
            baseVy: 0
        });
        nodes[i].baseVx = nodes[i].vx;
        nodes[i].baseVy = nodes[i].vy;
    }

    // Keep track of mouse state
    const heroSection = canvas.closest('.hero-section');

    // Helper: Distance between two nodes/points
    function dist(p1, p2) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }

    function render(timestamp) {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        const isDark = document.documentElement.classList.contains('dark');
        
        // Define colors based on theme
        const nodeColor = isDark ? 'rgba(251, 124, 60, 0.85)' : 'rgba(248, 97, 22, 0.65)';
        const edgeColor = isDark ? 'rgba(140, 175, 210, 0.16)' : 'rgba(120, 108, 96, 0.08)';
        const triangleColor = isDark ? 'rgba(248, 97, 22, 0.04)' : 'rgba(248, 97, 22, 0.015)';
        const cavityColor = '248, 97, 22'; // RGB values for solar orange

        // Pulse factor for cavities
        const pulse = 0.65 + 0.35 * Math.sin(timestamp * 0.0025);

        // Update connection threshold dynamically based on mouse position (filtration parameter ε)
        if (mouse.active) {
            const pct = Math.max(0, Math.min(1, mouse.x / width));
            targetThreshold = 40 + pct * 400; // ε sweeps 40px → 440px as the pointer moves left → right
        } else {
            targetThreshold = 140; // Resting filtration when the pointer leaves the canvas
        }
        currentThreshold = currentThreshold * 0.92 + targetThreshold * 0.08;

        // Update positions & bounce (no mouse attraction)
        for (let i = 0; i < numNodes; i++) {
            const node = nodes[i];

            // Slow drift
            node.x += node.vx;
            node.y += node.vy;

            // Bounce off edges with minor padding
            const pad = 10;
            if (node.x < pad) { node.x = pad; node.vx *= -1; }
            if (node.x > width - pad) { node.x = width - pad; node.vx *= -1; }
            if (node.y < pad) { node.y = pad; node.vy *= -1; }
            if (node.y > height - pad) { node.y = height - pad; node.vy *= -1; }
        }

        // Build adjacency representation using dynamic threshold
        const edgesSet = new Set();
        const adj = Array.from({ length: numNodes }, () => []);

        for (let i = 0; i < numNodes; i++) {
            for (let j = i + 1; j < numNodes; j++) {
                if (dist(nodes[i], nodes[j]) < currentThreshold) {
                    adj[i].push(j);
                    adj[j].push(i);
                    edgesSet.add(`${i}-${j}`);
                }
            }
        }

        function hasEdge(u, v) {
            return edgesSet.has(u < v ? `${u}-${v}` : `${v}-${u}`);
        }

        // 1. Find Triangles (3-cycles) -> Contractible simplices
        const triangles = [];
        for (let i = 0; i < numNodes; i++) {
            for (let idx = 0; idx < adj[i].length; idx++) {
                const j = adj[i][idx];
                if (j > i) {
                    for (let idx2 = 0; idx2 < adj[j].length; idx2++) {
                        const k = adj[j][idx2];
                        if (k > j && hasEdge(i, k)) {
                            triangles.push([i, j, k]);
                        }
                    }
                }
            }
        }

        // Draw triangles (filled 2-simplices)
        ctx.fillStyle = triangleColor;
        triangles.forEach(([i, j, k]) => {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.lineTo(nodes[k].x, nodes[k].y);
            ctx.closePath();
            ctx.fill();
        });

        // 2. Find Chordless 4-cycles -> 1D topological cavities (holes)
        const cavities = [];
        for (let u = 0; u < numNodes; u++) {
            for (let w = u + 1; w < numNodes; w++) {
                if (hasEdge(u, w)) continue; // chordal edge exists

                const common = [];
                for (let idx = 0; idx < adj[u].length; idx++) {
                    const neigh = adj[u][idx];
                    if (hasEdge(w, neigh)) {
                        common.push(neigh);
                    }
                }

                if (common.length >= 2) {
                    for (let idx1 = 0; idx1 < common.length; idx1++) {
                        for (let idx2 = idx1 + 1; idx2 < common.length; idx2++) {
                            const v1 = common[idx1];
                            const v2 = common[idx2];

                            // Chordless condition: no edge between v1 and v2
                            if (hasEdge(v1, v2)) continue;

                            // Deduplication condition
                            if (u < v1 && u < v2) {
                                cavities.push([u, v1, w, v2]);
                            }
                        }
                    }
                }
            }
        }

        // Draw cavities (H₁ topological holes).
        // Each entry is a chordless 4-cycle: both diagonals are non-edges, so no
        // triangle can fill it — a minimal generator of the 1st homology group.
        cavities.forEach(([u, v1, w, v2]) => {
            const pts = [nodes[u], nodes[v1], nodes[w], nodes[v2]];
            const cx = pts.reduce((s, p) => s + p.x, 0) / 4;
            const cy = pts.reduce((s, p) => s + p.y, 0) / 4;

            // Order the vertices around their centroid so the polygon is always a
            // simple convex quadrilateral (a real hole), never a self-crossing bowtie.
            pts.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));

            // Skip degenerate (collinear) cycles that enclose no area.
            const area = Math.abs(
                (pts[0].x * pts[1].y + pts[1].x * pts[2].y + pts[2].x * pts[3].y + pts[3].x * pts[0].y) -
                (pts[1].x * pts[0].y + pts[2].x * pts[1].y + pts[3].x * pts[2].y + pts[0].x * pts[3].y)
            ) / 2;
            if (area < 8) return;

            const rAvg = pts.reduce((s, p) => s + dist(p, {x: cx, y: cy}), 0) / 4;

            // Radial gradient fill
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rAvg);
            grad.addColorStop(0, `rgba(${cavityColor}, ${0.24 * pulse})`);
            grad.addColorStop(0.5, `rgba(${cavityColor}, ${0.12 * pulse})`);
            grad.addColorStop(1, `rgba(${cavityColor}, 0)`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            ctx.lineTo(pts[1].x, pts[1].y);
            ctx.lineTo(pts[2].x, pts[2].y);
            ctx.lineTo(pts[3].x, pts[3].y);
            ctx.closePath();
            ctx.fill();

            // Dashed pulsing border
            ctx.strokeStyle = `rgba(${cavityColor}, ${0.45 * pulse})`;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw scientific marker "H₁" (first homology generator) at the center
            ctx.fillStyle = isDark ? `rgba(248, 250, 252, ${0.5 + 0.4 * pulse})` : `rgba(28, 24, 22, ${0.4 + 0.3 * pulse})`;
            ctx.font = 'italic 10px Merriweather, serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('H₁', cx, cy);
        });

        // 3. Draw Edges
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = 0.8;
        edgesSet.forEach(key => {
            const [i, j] = key.split('-').map(Number);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
        });

        // 4. Draw Nodes
        for (let i = 0; i < numNodes; i++) {
            const node = nodes[i];
            ctx.fillStyle = nodeColor;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Filtration threshold ε at the pointer: a faint vertical guide plus a
        // prominent readout that follows the cursor (no coordinates).
        if (mouse.active) {
            ctx.strokeStyle = isDark ? 'rgba(248, 97, 22, 0.30)' : 'rgba(248, 97, 22, 0.22)';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 6]);
            ctx.beginPath();
            ctx.moveTo(mouse.x, 0);
            ctx.lineTo(mouse.x, height);
            ctx.stroke();
            ctx.setLineDash([]);

            const label = `ε = ${Math.round(currentThreshold)} px`;
            ctx.font = '700 13px "DM Sans", sans-serif';
            const tw = ctx.measureText(label).width;
            const bw = tw + 20;
            const bh = 26;
            let bx = mouse.x + 16;
            let by = mouse.y - bh - 8;
            if (bx + bw > width) bx = mouse.x - bw - 16;
            if (by < 0) by = mouse.y + 16;

            ctx.fillStyle = isDark ? 'rgba(10, 15, 21, 0.95)' : 'rgba(255, 255, 255, 0.92)';
            ctx.strokeStyle = isDark ? 'rgba(248, 97, 22, 0.6)' : 'rgba(248, 97, 22, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(bx, by, bw, bh, bh / 2);
            } else {
                ctx.rect(bx, by, bw, bh);
            }
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = isDark ? '#fb7c3c' : '#b83b05';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, bx + 10, by + bh / 2);
        }
    }

    // Reduced motion: draw a single static frame, re-render on resize, never animate.
    if (reducedMotion) {
        render(0);
        return;
    }

    // Bind interaction only when the animation actually runs.
    if (heroSection) {
        heroSection.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
            mouse.active = true;
        });

        heroSection.addEventListener('mouseleave', () => {
            mouse.active = false;
        });
    }

    let lastFrameTime = 0;
    function animate(timestamp) {
        // Skip frames above ~70fps: saves battery on high-refresh displays without changing motion speed.
        if (timestamp - lastFrameTime < 14) {
            animationFrameId = requestAnimationFrame(animate);
            return;
        }
        lastFrameTime = timestamp;
        render(timestamp);
        animationFrameId = requestAnimationFrame(animate);
    }

    // Pause rendering entirely while the hero is scrolled out of view.
    if (heroSection && 'IntersectionObserver' in window) {
        const pauseObserver = new IntersectionObserver((entries) => {
            const visible = entries.some(entry => entry.isIntersecting);
            if (visible && !animationFrameId) {
                lastFrameTime = 0;
                animationFrameId = requestAnimationFrame(animate);
            } else if (!visible && animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = 0;
            }
        }, { threshold: 0 });
        pauseObserver.observe(heroSection);
    }

    animationFrameId = requestAnimationFrame(animate);
}


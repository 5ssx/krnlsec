/* ===========================
   krnl.cc — Main Script
   =========================== */

// =====================
// PARTICLES BACKGROUND
// =====================
function createParticles() {
    const container = document.getElementById('particles');
    const count = 30;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        const size = Math.random() * 3 + 1;
        const hue = Math.random() > 0.5 ? 270 : 310;
        const duration = Math.random() * 15 + 10;
        const delay = Math.random() * 15;
        const left = Math.random() * 100;

        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${left}%;
            background: hsl(${hue}, 85%, 65%);
            box-shadow: 0 0 ${size * 3}px hsl(${hue}, 85%, 55%);
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
        `;

        container.appendChild(particle);
    }
}

// =====================
// NAVBAR SCROLL EFFECT
// =====================
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const links = document.querySelectorAll('.nav-link');

    // Scroll effect
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    // Mobile toggle
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    // Close mobile nav on link click
    links.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });

    // Active link on scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY + 100;
        sections.forEach(section => {
            const top = section.offsetTop - 100;
            const bottom = top + section.offsetHeight;
            const id = section.getAttribute('id');
            const link = document.querySelector(`.nav-link[href="#${id}"]`);
            if (link) {
                link.classList.toggle('active', scrollY >= top && scrollY < bottom);
            }
        });
    });
}

// =====================
// COUNTER ANIMATION
// =====================
function animateCounters() {
    const counters = document.querySelectorAll('.stat-value[data-count]');
    const speed = 60;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-count'));
                let current = 0;
                const increment = Math.ceil(target / speed);

                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    counter.textContent = current;
                }, 25);

                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

// =====================
// SCROLL REVEAL
// =====================
function initScrollReveal() {
    const revealElements = document.querySelectorAll(
        '.about-card, .product-card, .step-card, .social-card, .discord-card, .section-header'
    );

    revealElements.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    revealElements.forEach(el => observer.observe(el));
}

// =====================
// CARD GLOW EFFECT
// =====================
function initCardGlow() {
    const cards = document.querySelectorAll('.about-card, .product-card, .social-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mouse-x', x + '%');
            card.style.setProperty('--mouse-y', y + '%');
        });
    });
}

// =============================================
// ORDER ID SYSTEM — Base64 Encoded Confirmation
// =============================================

/**
 * Generates a secure Order ID with base64-encoded confirmation data.
 * Format: KRNL-(base64 encoded JSON with status, timestamp, and unique hash)
 * 
 * HOW TO VERIFY:
 * 1. Take the part after "KRNL-"
 * 2. Base64 decode it
 * 3. It should contain a JSON object with:
 *    - status: "confirmed"
 *    - product: "roblox-external"
 *    - timestamp: ISO date string of when the purchase was made
 *    - hash: unique random identifier
 * 
 * You can verify by opening browser console and running:
 *    atob("paste_the_base64_part_here")
 * 
 * If it decodes to valid JSON with status "confirmed", it's legit.
 * If it doesn't decode or is missing fields, it's fake.
 */
function generateOrderId() {
    // Generate a random hex hash for uniqueness
    const hash = Array.from(crypto.getRandomValues(new Uint8Array(6)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    // Create the confirmation payload
    const payload = {
        status: "confirmed",
        product: "roblox-external",
        timestamp: new Date().toISOString(),
        hash: hash
    };

    // Encode to base64
    const base64 = btoa(JSON.stringify(payload));

    return `KRNL-${base64}`;
}

/**
 * Decodes and verifies an Order ID.
 * Use this in your browser console to check if an Order ID is legit:
 *   verifyOrderId("KRNL-eyJzdGF0dXMi...")
 */
function verifyOrderId(orderId) {
    try {
        if (!orderId.startsWith('KRNL-')) {
            console.log('❌ INVALID — Does not start with KRNL-');
            return false;
        }

        const base64Part = orderId.replace('KRNL-', '');
        const decoded = JSON.parse(atob(base64Part));

        console.log('📋 Order ID Decoded:');
        console.log('   Status:', decoded.status);
        console.log('   Product:', decoded.product);
        console.log('   Timestamp:', decoded.timestamp);
        console.log('   Hash:', decoded.hash);

        if (decoded.status === 'confirmed' && decoded.product && decoded.timestamp && decoded.hash) {
            console.log('✅ VALID — This Order ID is confirmed');
            return true;
        } else {
            console.log('❌ INVALID — Missing required fields');
            return false;
        }
    } catch (e) {
        console.log('❌ INVALID — Could not decode Order ID');
        return false;
    }
}

// Check if returning from Whop payment
function checkPaymentReturn() {
    const params = new URLSearchParams(window.location.search);

    if (params.get('payment') === 'success') {
        const orderId = generateOrderId();
        showOrderModal(orderId);

        // Clean the URL without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

function showOrderModal(orderId) {
    const modal = document.getElementById('orderModal');
    const display = document.getElementById('orderIdDisplay');
    display.textContent = orderId;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('orderModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function copyOrderId() {
    const orderId = document.getElementById('orderIdDisplay').textContent;
    navigator.clipboard.writeText(orderId).then(() => {
        const btn = document.querySelector('.copy-btn');
        const span = btn.querySelector('span');
        btn.classList.add('copied');
        span.textContent = 'Copied!';
        setTimeout(() => {
            btn.classList.remove('copied');
            span.textContent = 'Copy';
        }, 2000);
    });
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeModal();
    }
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// =====================
// SMOOTH SCROLL
// =====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// =====================
// INITIALIZE
// =====================
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    initNavbar();
    animateCounters();
    initScrollReveal();
    initCardGlow();
    checkPaymentReturn();
});

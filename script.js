// ============================================
// FORMA STRATEGIES - JAVASCRIPT
// Interactive functionality and animations
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================
    // SMOOTH SCROLL FOR NAVIGATION LINKS
    // ============================================
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const navHeight = document.querySelector('.nav').offsetHeight;
                const targetPosition = targetSection.offsetTop - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ============================================
    // NAVBAR SCROLL EFFECT
    // ============================================
    const nav = document.querySelector('.nav');
    let lastScroll = 0;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        // Add shadow on scroll
        if (currentScroll > 100) {
            nav.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
        } else {
            nav.style.boxShadow = 'none';
        }
        
        lastScroll = currentScroll;
    });
    
    // ============================================
    // INTERSECTION OBSERVER FOR FADE-IN ANIMATIONS
    // ============================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(40px)';
        card.style.transition = `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`;
        observer.observe(card);
    });
    
    // Observe strategy cards
    const strategyCards = document.querySelectorAll('.strategy-card');
    strategyCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(40px)';
        card.style.transition = `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`;
        observer.observe(card);
    });
    
    // ============================================
    // BUTTON INTERACTIONS
    // ============================================
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
        
        button.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255, 255, 255, 0.3)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s ease-out';
            ripple.style.pointerEvents = 'none';
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
    
    // Add ripple animation to stylesheet
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // ============================================
    // PARALLAX EFFECT FOR HERO BACKGROUND
    // ============================================
    const heroBg = document.querySelector('.hero-bg-image');
    const heroSection = document.querySelector('.hero');
    
    if (heroBg && heroSection) {
        // Scroll parallax
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * 0.5;
            // Don't override the animation, just adjust the base position
            heroBg.style.transform = `translateY(${rate}px)`;
        });
        
        // Mouse move interaction - light follows mouse subtly
        heroSection.addEventListener('mousemove', function(e) {
            const rect = heroSection.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calculate movement as percentage of section size
            const moveX = ((x / rect.width) - 0.5) * 30; // Max 15px in each direction
            const moveY = ((y / rect.height) - 0.5) * 30;
            
            // Apply subtle movement that adds to the animation
            heroBg.style.transition = 'transform 0.5s ease-out';
            heroBg.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.05)`;
        });
        
        // Reset when mouse leaves
        heroSection.addEventListener('mouseleave', function() {
            heroBg.style.transition = 'transform 1s ease-out';
            heroBg.style.transform = 'translate(0, 0) scale(1.05)';
        });
    }
    
    // ============================================
    // STATS COUNTER ANIMATION
    // ============================================
    const stats = document.querySelectorAll('.stat-value');
    let hasAnimated = false;
    
    function animateStats() {
        if (hasAnimated) return;
        
        const heroStats = document.querySelector('.hero-stats');
        const rect = heroStats.getBoundingClientRect();
        
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            hasAnimated = true;
            
            stats.forEach(stat => {
                const text = stat.textContent;
                const hasPercent = text.includes('%');
                const hasPlus = text.includes('+');
                const numericValue = parseInt(text.replace(/\D/g, ''));
                
                if (!isNaN(numericValue)) {
                    let current = 0;
                    const increment = numericValue / 50;
                    
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= numericValue) {
                            current = numericValue;
                            clearInterval(timer);
                        }
                        
                        let displayValue = Math.floor(current);
                        if (hasPercent) displayValue += '%';
                        if (hasPlus) displayValue += '+';
                        
                        stat.textContent = displayValue;
                    }, 30);
                }
            });
        }
    }
    
    window.addEventListener('scroll', animateStats);
    animateStats(); // Check on load
    
    // ============================================
    // MOBILE MENU TOGGLE (if needed in future)
    // ============================================
    // Currently navigation is simple, but this provides
    // foundation for hamburger menu on mobile if needed
    
    // ============================================
    // FORM VALIDATION (for future contact forms)
    // ============================================
    // Placeholder for when contact form is added
    
    // ============================================
    // CONSOLE EASTER EGG
    // ============================================
    console.log('%cForma Strategies', 'font-size: 24px; font-weight: bold; color: #60a5fa;');
    console.log('%cModel portfolios of tokenized stocks', 'font-size: 14px; color: #94a3b8;');
    console.log('%cBuilt with ❤️ on Solana', 'font-size: 12px; color: #64748b;');
    console.log('%cInterested in joining our team? Reach out!', 'font-size: 12px; color: #60a5fa;');
    
    // ============================================
    // PERFORMANCE MONITORING
    // ============================================
    if (window.performance) {
        window.addEventListener('load', function() {
            setTimeout(() => {
                const perfData = window.performance.timing;
                const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                console.log(`Page loaded in ${pageLoadTime}ms`);
            }, 0);
        });
    }
    
    // ============================================
    // ACCESSIBILITY ENHANCEMENTS
    // ============================================
    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-nav');
        }
    });
    
    document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-nav');
    });
    
    // Add focus styles for keyboard navigation
    const keyboardStyle = document.createElement('style');
    keyboardStyle.textContent = `
        .keyboard-nav *:focus {
            outline: 2px solid #60a5fa;
            outline-offset: 2px;
        }
    `;
    document.head.appendChild(keyboardStyle);
    
    // ============================================
    // CATALOG MODAL
    // ============================================
    const catalogModal = document.getElementById('catalogModal');
    const openCatalogBtn = document.getElementById('openCatalogBtn');
    const closeCatalogBtn = document.getElementById('closeCatalogBtn');
    const catalogOverlay = document.getElementById('catalogOverlay');
    
    if (openCatalogBtn && catalogModal) {
        openCatalogBtn.addEventListener('click', function() {
            catalogModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        closeCatalogBtn.addEventListener('click', function() {
            catalogModal.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        catalogOverlay.addEventListener('click', function() {
            catalogModal.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && catalogModal.classList.contains('active')) {
                catalogModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // ============================================
    // INIT COMPLETE
    // ============================================
    console.log('Forma Strategies website initialized successfully');
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Check if element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Smooth scroll to element
function smoothScrollTo(element, duration = 1000) {
    const start = window.pageYOffset;
    const target = element.getBoundingClientRect().top + start;
    const distance = target - start;
    let startTime = null;
    
    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, start, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    }
    
    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }
    
    requestAnimationFrame(animation);
}

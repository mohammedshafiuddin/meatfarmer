// Reveal on scroll animation
document.addEventListener('DOMContentLoaded', function() {
    const reveals = document.querySelectorAll('[data-reveal]');
    const revealsStagger = document.querySelectorAll('[data-reveal-stagger]');
    
    const revealOnScroll = () => {
        reveals.forEach(element => {
            const windowHeight = window.innerHeight;
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < windowHeight - elementVisible) {
                element.classList.add('reveal');
            }
        });
        
        revealsStagger.forEach(element => {
            const windowHeight = window.innerHeight;
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < windowHeight - elementVisible) {
                element.classList.add('reveal');
            }
        });
    };
    
    // Initial check
    revealOnScroll();
    
    // Check on scroll
    window.addEventListener('scroll', revealOnScroll);
    
    // Add loading animation for HTMX requests
    document.body.addEventListener('htmx:beforeRequest', function(evt) {
        const target = evt.target;
        if (target.classList.contains('newsletter-form')) {
            const button = target.querySelector('button[type="submit"]');
            if (button) {
                button.innerHTML = '<span class="loading"></span> Subscribing...';
                button.disabled = true;
            }
        }
    });
    
    document.body.addEventListener('htmx:afterRequest', function(evt) {
        const target = evt.target;
        if (target.classList.contains('newsletter-form')) {
            const button = target.querySelector('button[type="submit"]');
            if (button) {
                button.innerHTML = 'Subscribe';
                button.disabled = false;
            }
        }
    });
    
    // Add parallax effect to hero section
    const hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            hero.style.backgroundPositionY = -(scrolled * 0.5) + 'px';
        });
    }
    
    // Add floating animation to cards
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.style.animation = 'float 6s ease-in-out infinite';
    });
    
    // Add hover effect to process steps
    const processSteps = document.querySelectorAll('.process-step');
    processSteps.forEach(step => {
        step.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.05)';
        });
        
        step.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add typing effect to hero title
    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle) {
        const text = heroTitle.textContent;
        heroTitle.textContent = '';
        let index = 0;
        
        const typeWriter = () => {
            if (index < text.length) {
                heroTitle.textContent += text.charAt(index);
                index++;
                setTimeout(typeWriter, 50);
            }
        };
        
        setTimeout(typeWriter, 500);
    }
});



// Add smooth reveal for elements as they come into view
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('reveal');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all elements with data-reveal attribute
document.querySelectorAll('[data-reveal], [data-reveal-stagger]').forEach(el => {
    observer.observe(el);
});
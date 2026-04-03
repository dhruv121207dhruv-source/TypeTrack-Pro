document.addEventListener('DOMContentLoaded', () => {
    // Lock body scroll initially
    document.body.classList.add('locked');

    // Intro Screen Logic
    const blowBtn = document.getElementById('blow-candle-btn');
    const introScreen = document.getElementById('intro-screen');
    const heroContent = document.querySelector('.hero-content');
    const cakeIcon = document.querySelector('.intro-cake');
    const cssCake = document.querySelector('.css-cake');

    if (cssCake) {
        cssCake.style.cursor = 'pointer';
        // Placeholder for bite sound. A bite.mp3 should be placed in this folder.
        const biteSound = new Audio('bite.mp3');
        
        cssCake.addEventListener('click', (e) => {
            // Check if it's the blow button or someone clicked inside
            if (e.target === blowBtn) return;
            
            // Add shake animation
            cssCake.classList.remove('cake-shake');
            void cssCake.offsetWidth; // Trigger reflow
            cssCake.classList.add('cake-shake');
            
            // Play sound
            const soundClone = biteSound.cloneNode();
            soundClone.volume = 0.5;
            soundClone.play().catch(err => console.log('Bite sound blocked or file missing.', err));
            
            // Generate visual bite mark
            const biteSize = 35 + Math.random() * 25; // Random size 35-60px
            const biteMark = document.createElement('div');
            biteMark.classList.add('bite-mark');
            biteMark.style.width = `${biteSize}px`;
            biteMark.style.height = `${biteSize}px`;
            
            // Position relative to the cake bounds
            const rect = cssCake.getBoundingClientRect();
            const x = e.clientX - rect.left - (biteSize / 2);
            const y = e.clientY - rect.top - (biteSize / 2);
            
            biteMark.style.left = `${x}px`;
            biteMark.style.top = `${y}px`;
            
            cssCake.appendChild(biteMark);
        });
    }

    if (blowBtn && introScreen) {
        blowBtn.addEventListener('click', (e) => {
             // Blow the candle effect! Extinguish the actual CSS flame
            const flame = document.querySelector('.flame');
            const smoke = document.querySelector('.smoke');
            
            if (flame) {
                flame.classList.add('out');
            }
            if (smoke) {
                setTimeout(() => {
                    smoke.classList.add('active');
                }, 300); // Smoke appears a bit after blow out starts
            }
            createConfetti(e.clientX, e.clientY);
            
            blowBtn.textContent = 'Yay! 🎉';
            
            setTimeout(() => {
                introScreen.classList.add('hidden');
            }, 800); // Wait for blow effect before fading screen
            
            setTimeout(() => {
                introScreen.style.display = 'none';
                
                // Show photo showcase instead of main website immediately
                const photoShowcase = document.getElementById('photo-showcase-screen');
                if (photoShowcase) {
                    photoShowcase.classList.remove('hidden');
                    // Add active class slightly after to trigger CSS animations
                    setTimeout(() => {
                        photoShowcase.classList.add('active');
                    }, 50);
                }
            }, 1800); // 1s transition + 800ms wait
        });
    }

    // Enter Website Logic from Photo Showcase
    const enterBtn = document.getElementById('enter-website-btn');
    if (enterBtn) {
        enterBtn.addEventListener('click', () => {
            const photoShowcase = document.getElementById('photo-showcase-screen');
            if (photoShowcase) {
                photoShowcase.classList.remove('active');
                photoShowcase.classList.add('hidden');
                
                setTimeout(() => {
                    photoShowcase.style.display = 'none';
                    // Finally unlock body and show hero
                    document.body.classList.remove('locked');
                    if (heroContent) {
                        heroContent.classList.add('visible'); // Trigger hero slide in
                    }
                }, 1000); // Wait for screen to fade out
            }
        });
    }

    // Scroll animation using Intersection Observer
    const sections = document.querySelectorAll('.hidden-section');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Trigger when 15% of the element is visible
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once it has become visible
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    // Smooth scroll for the scroll indicator
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            const messageSection = document.getElementById('message');
            if (messageSection) {
                messageSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Optional interactivity for the button
    const wishBtn = document.querySelector('.warm-wishes-btn');
    if (wishBtn) {
        wishBtn.addEventListener('click', (e) => {
            // Trigger beautiful confetti!
            createConfetti(e.clientX, e.clientY);
            wishBtn.textContent = 'Wishes Sent! ✨';
            wishBtn.style.backgroundColor = 'var(--accent-color)';
            wishBtn.style.color = 'white';
            wishBtn.style.borderColor = 'var(--accent-color)';
            
            setTimeout(() => {
                alert('Your warm wishes have been felt ❤️\nHappy Birthday!');
            }, 1200);
        });
    }

    // Confetti effect function
    function createConfetti(x, y) {
        const colors = ['#ffb6b9', '#ff9a9e', '#fae3d9', '#fdfafb'];
        for (let i = 0; i < 40; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            // Mixed shapes
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = x + 'px';
            confetti.style.top = y + 'px';
            
            const angle = Math.random() * Math.PI * 2;
            const velocity = 50 + Math.random() * 150;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity - 100;
            
            confetti.style.setProperty('--tx', `${tx}px`);
            confetti.style.setProperty('--ty', `${ty}px`);
            
            // Random rotation
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            document.body.appendChild(confetti);
            
            // Remove after animation completes
            setTimeout(() => {
                confetti.remove();
            }, 1000);
        }
    }
});

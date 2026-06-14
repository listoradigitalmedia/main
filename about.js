/* ==============================================
   LISTORA DIGITAL MEDIA — about.js
   About-page-specific interactions & premium animations
   
   RESPONSIBILITIES:
   - Scroll progress bar
   - Ecosystem SVG line drawing (drawLines)
   - Card tilt effect
   - Logo parallax
   - Newsletter handler (guarded by element existence)
   - Button micro-interactions
   - Value hover glow
   - Process step hover
   - Mission block hover
   - Premium ab- animation system (IntersectionObserver)
   
   EXCLUDED (handled by script.js):
   - Drawer open/close
   - Navbar sticky scroll
   - Smooth scroll
   ============================================== */

'use strict';

/* ============================================================
   REDUCED MOTION DETECTION
   ============================================================ */
const abReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ============================================================
   1. SCROLL PROGRESS BAR
   Thin orange bar at the top of the page
   ============================================================ */
(function initScrollProgress() {
    const bar = document.createElement('div');
    bar.id = 'ab-scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    bar.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'height:3px',
        'width:0%',
        'background:#F97316',
        'z-index:9999',
        'transition:width 0.1s linear',
        'pointer-events:none'
    ].join(';');
    document.body.appendChild(bar);

    window.addEventListener('scroll', function () {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress  = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = progress + '%';
    }, { passive: true });
})();


/* ============================================================
   2. PREMIUM AB- ANIMATION SYSTEM
   Uses IntersectionObserver with separate instances per type.
   Respects prefers-reduced-motion.
   ============================================================ */
(function initAbAnimations() {

    if (abReducedMotion) {
        /* Instantly reveal all ab- elements */
        document.querySelectorAll('.ab-word, .ab-para, .ab-img-reveal, .ab-card, .ab-badge').forEach(function (el) {
            el.classList.add('ab-word-in', 'ab-para-in', 'ab-img-in', 'ab-card-in', 'ab-badge-in');
            el.style.opacity   = '1';
            el.style.transform = 'none';
        });
        return;
    }

    /* ── 2a. HEADINGS — word-by-word reveal ── */
    (function initHeadings() {
        const headings = document.querySelectorAll('.ab-heading');
        if (!headings.length) return;

        function splitIntoWords(el) {
            if (el.dataset.abSplit) return;
            el.dataset.abSplit = '1';

            const nodes = Array.from(el.childNodes);
            el.innerHTML = '';

            nodes.forEach(function (node) {
                if (node.nodeType === Node.TEXT_NODE) {
                    const parts = node.textContent.split(/(\s+)/);
                    parts.forEach(function (chunk) {
                        if (!chunk.trim()) {
                            el.appendChild(document.createTextNode(chunk));
                        } else {
                            const span = document.createElement('span');
                            span.className = 'ab-word';
                            span.setAttribute('aria-hidden', 'true');
                            span.textContent = chunk;
                            el.appendChild(span);
                        }
                    });
                } else {
                    /* Keep <br>, icons, etc. */
                    el.appendChild(node.cloneNode(true));
                }
            });

            /* Accessible fallback */
            if (!el.getAttribute('aria-label')) {
                el.setAttribute('aria-label', el.textContent.trim());
            }
        }

        function animateHeading(heading) {
            const words = heading.querySelectorAll('.ab-word');
            words.forEach(function (word, i) {
                word.style.transitionDelay = (i * 60) + 'ms';
                word.classList.add('ab-word-in');
            });
        }

        /* Hero heading: split + animate immediately on load (already in viewport) */
        const heroHeading = document.querySelector('.hero-section .ab-heading');
        if (heroHeading) {
            splitIntoWords(heroHeading);
            /* Double rAF so layout is computed before transition triggers */
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    animateHeading(heroHeading);
                });
            });
        }

        /* All other section headings: split + animate via IntersectionObserver */
        const sectionHeadings = Array.from(headings).filter(function (h) {
            return h !== heroHeading;
        });

        if (!sectionHeadings.length) return;

        const headingObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                animateHeading(entry.target);
                headingObserver.unobserve(entry.target);
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -20px 0px' });

        sectionHeadings.forEach(function (heading) {
            splitIntoWords(heading);
            headingObserver.observe(heading);
        });
    })();


    /* ── 2b. PARAGRAPHS — fade-up ── */
    (function initParas() {
        const paras = document.querySelectorAll('.ab-para');
        if (!paras.length) return;

        const paraObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                const el = entry.target;

                /* Use explicit data-delay if set, otherwise stagger by sibling index */
                var explicitDelay = el.dataset.abDelay;
                if (explicitDelay !== undefined) {
                    el.style.transitionDelay = explicitDelay + 'ms';
                } else {
                    const parent   = el.parentElement;
                    const siblings = parent ? Array.from(parent.querySelectorAll('.ab-para')) : [];
                    const idx      = siblings.indexOf(el);
                    el.style.transitionDelay = (idx >= 0 ? idx * 80 : 0) + 'ms';
                }
                el.classList.add('ab-para-in');
                paraObserver.unobserve(el);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

        paras.forEach(function (el) {
            paraObserver.observe(el);
        });
    })();


    /* ── 2c. IMAGES — scale-in ── */
    (function initImages() {
        const imgs = document.querySelectorAll('.ab-img-reveal');
        if (!imgs.length) return;

        const imgObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('ab-img-in');
                imgObserver.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        imgs.forEach(function (img) {
            imgObserver.observe(img);
        });
    })();


    /* ── 2d. CARDS — staggered fade-up ── */
    (function initCards() {
        const cards = document.querySelectorAll('.ab-card');
        if (!cards.length) return;

        const cardObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                const el = entry.target;

                /* Stagger by index among siblings with ab-card */
                const parent   = el.parentElement;
                const siblings = parent ? Array.from(parent.querySelectorAll('.ab-card')) : [];
                const idx      = siblings.indexOf(el);
                const delay    = idx >= 0 ? idx * 90 : 0;

                setTimeout(function () {
                    el.classList.add('ab-card-in');
                }, delay);

                cardObserver.unobserve(el);
            });
        }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });

        cards.forEach(function (card) {
            cardObserver.observe(card);
        });
    })();


    /* ── 2e. BADGES — spring pop ── */
    (function initBadges() {
        const badges = document.querySelectorAll('.ab-badge');
        if (!badges.length) return;

        const badgeObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var explicitDelay = entry.target.dataset.abDelay;
                if (explicitDelay !== undefined) {
                    entry.target.style.transitionDelay = explicitDelay + 'ms';
                }
                entry.target.classList.add('ab-badge-in');
                badgeObserver.unobserve(entry.target);
            });
        }, { threshold: 0.2, rootMargin: '0px 0px -20px 0px' });

        badges.forEach(function (el) {
            badgeObserver.observe(el);
        });
    })();

})();


/* ============================================================
   3. ECOSYSTEM SVG LINE DRAWING
   drawLines — curved dashed lines from logo center to cards
   ============================================================ */
function drawLines() {
    const svg    = document.getElementById('ecosystemLines');
    const center = document.getElementById('logoCenter');

    if (!svg || !center) return;

    /* Only draw on desktop */
    if (window.innerWidth <= 900) {
        svg.innerHTML = '';
        return;
    }

    const sectionRect = svg.closest('.logo-section').getBoundingClientRect();
    const centerRect  = center.getBoundingClientRect();

    const cx = centerRect.left - sectionRect.left + centerRect.width  / 2;
    const cy = centerRect.top  - sectionRect.top  + centerRect.height / 2;

    const cardIds = ['card-1', 'card-2', 'card-3', 'card-4', 'card-5', 'card-6'];

    svg.innerHTML = '';

    cardIds.forEach(function (id) {
        const card = document.getElementById(id);
        if (!card) return;

        const cardRect = card.getBoundingClientRect();
        const cardX = cardRect.left - sectionRect.left + cardRect.width  / 2;
        const cardY = cardRect.top  - sectionRect.top  + cardRect.height / 2;

        /* Quadratic Bezier control point */
        const cpX = (cx + cardX) / 2;
        const cpY = (cy + cardY) / 2 - 30;

        const pathData = 'M ' + cx + ' ' + cy + ' Q ' + cpX + ' ' + cpY + ' ' + cardX + ' ' + cardY;

        /* Arrow marker */
        const markerId = 'ab-arrow-' + id;
        const defs     = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker   = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', markerId);
        marker.setAttribute('markerWidth', '8');
        marker.setAttribute('markerHeight', '8');
        marker.setAttribute('refX', '6');
        marker.setAttribute('refY', '3');
        marker.setAttribute('orient', 'auto');

        const arrowHead = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrowHead.setAttribute('d', 'M0,0 L0,6 L8,3 z');
        arrowHead.setAttribute('fill', '#1a2b5e');
        arrowHead.setAttribute('opacity', '0.4');

        marker.appendChild(arrowHead);
        defs.appendChild(marker);
        svg.appendChild(defs);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', '#1a2b5e');
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('stroke-dasharray', '6 5');
        path.setAttribute('fill', 'none');
        path.setAttribute('opacity', '0.25');
        path.setAttribute('marker-end', 'url(#' + markerId + ')');

        /* Draw animation */
        const length = 600;
        path.style.strokeDashoffset = String(length);
        path.style.transition = 'stroke-dashoffset 1.2s ease 0.8s';

        svg.appendChild(path);

        /* Trigger draw */
        requestAnimationFrame(function () {
            setTimeout(function () {
                path.style.strokeDashoffset = '0';
            }, 50);
        });
    });
}

/* Redraw on resize (debounced) */
var abResizeTimer;
window.addEventListener('resize', function () {
    clearTimeout(abResizeTimer);
    abResizeTimer = setTimeout(drawLines, 150);
}, { passive: true });


/* ============================================================
   4. CARD SCROLL REVEAL (ecosystem logo-cards via IntersectionObserver)
   ============================================================ */
function setupScrollReveal() {
    if (!('IntersectionObserver' in window)) return;

    const cards = document.querySelectorAll('.logo-card');
    if (!cards.length) return;

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    cards.forEach(function (card) {
        observer.observe(card);
    });
}


/* ============================================================
   5. CARD TILT EFFECT — disabled, CSS hover handles this
   ============================================================ */
function setupCardTilt() {
    /* Tilt removed — the ecosystem grid uses absolute positioning
       for cards 3 & 4, and JS transform overwrites their translateY(-50%)
       centering, causing them to snap to wrong positions on hover. */
}


/* ============================================================
   6. LOGO GENTLE PARALLAX
   Logo center follows mouse subtly
   ============================================================ */
function setupLogoParallax() {
    if (window.innerWidth <= 900) return;

    const logoCenter = document.getElementById('logoCenter');
    if (!logoCenter) return;

    document.addEventListener('mousemove', function (e) {
        const cx   = window.innerWidth  / 2;
        const cy   = window.innerHeight / 2;
        const dx   = (e.clientX - cx) / cx;
        const dy   = (e.clientY - cy) / cy;
        const move = 8;
        logoCenter.style.marginLeft = (dx * move) + 'px';
        logoCenter.style.marginTop  = (dy * move) + 'px';
    });
}


/* ============================================================
   7. BUTTON MICRO-INTERACTIONS
   Subtle press effect on primary buttons
   ============================================================ */
(function initButtonEffects() {
    document.querySelectorAll('.btn, .subscribe-btn, #sub-btn').forEach(function (btn) {
        btn.addEventListener('mousedown', function () {
            btn.style.transform = 'translateY(1px) scale(0.98)';
        });
        btn.addEventListener('mouseup', function () {
            btn.style.transform = '';
        });
        btn.addEventListener('mouseleave', function () {
            btn.style.transform = '';
        });
    });
})();


/* ============================================================
   8. VALUE BLOCK HOVER GLOW
   ============================================================ */
(function initValueHover() {
    document.querySelectorAll('.value-block').forEach(function (block) {
        block.addEventListener('mouseenter', function () {
            block.style.boxShadow = '0 16px 40px rgba(249,115,22,0.12)';
        });
        block.addEventListener('mouseleave', function () {
            block.style.boxShadow = '';
        });
    });
})();


/* ============================================================
   9. PROCESS STEP HOVER — highlight icon
   ============================================================ */
(function initProcessHover() {
    document.querySelectorAll('.process-step').forEach(function (step) {
        const icon = step.querySelector('.process-icon');
        if (!icon) return;

        step.addEventListener('mouseenter', function () {
            icon.style.background   = '#FFF4ED';
            icon.style.borderColor  = '#F97316';
            icon.style.transform    = 'scale(1.08)';
            icon.style.transition   = 'transform 0.25s ease, border-color 0.25s ease';
        });
        step.addEventListener('mouseleave', function () {
            icon.style.transform   = 'scale(1)';
            icon.style.borderColor = '#FED7AA';
        });
    });
})();


/* ============================================================
   10. MISSION BLOCK HOVER GLOW
   ============================================================ */
(function initMissionHover() {
    document.querySelectorAll('.mission-block').forEach(function (block) {
        block.addEventListener('mouseenter', function () {
            block.style.transition   = 'box-shadow 0.3s ease';
            block.style.boxShadow    = '0 8px 32px rgba(249,115,22,0.08)';
            block.style.borderRadius = '16px';
        });
        block.addEventListener('mouseleave', function () {
            block.style.boxShadow = '';
        });
    });
})();


/* ============================================================
   11. NEWSLETTER FORM
   Guarded by element existence — no conflict with script.js
   since the footer newsletter IDs are unique to this page context.
   ============================================================ */
(function initNewsletter() {
    const emailInput = document.getElementById('email');
    const subBtn     = document.getElementById('sub-btn');
    const msgEl      = document.getElementById('msg');
    if (!emailInput || !subBtn || !msgEl) return;

    /* If script.js already bound this, avoid double-binding.
       We check by flag on the element. */
    if (subBtn.dataset.abNewsletter) return;
    subBtn.dataset.abNewsletter = '1';

    function isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    }

    function showMessage(text, type) {
        msgEl.textContent = text;
        msgEl.className   = 'newsletter-msg' + (type ? ' ' + type : '');
    }

    subBtn.addEventListener('click', function () {
        const value = emailInput.value.trim();
        if (!value)               return showMessage('Please enter your email address.', 'err');
        if (!isValidEmail(value)) return showMessage('Please enter a valid email address.', 'err');

        subBtn.disabled      = true;
        subBtn.style.opacity = '0.7';
        showMessage('Sending...', '');

        setTimeout(function () {
            showMessage("Thank you! We'll be in touch soon.", 'ok');
            emailInput.value     = '';
            subBtn.disabled      = false;
            subBtn.style.opacity = '1';
            setTimeout(function () { showMessage('', ''); }, 4000);
        }, 900);
    });

    emailInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') subBtn.click();
    });
})();


/* ============================================================
   INIT — Run ecosystem functions on DOMContentLoaded
   ============================================================ */
window.addEventListener('DOMContentLoaded', function () {
    drawLines();
    setupScrollReveal();
    if (!abReducedMotion) {
        setupCardTilt();
        setupLogoParallax();
    }
});


/* ==========================================================
   GLOBAL CONTENT PROTECTION
   Works on any website
   ========================================================== */

(function () {

    // Disable right click
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });

    // Disable copy
    document.addEventListener('copy', function (e) {
        e.preventDefault();
    });

    // Disable cut
    document.addEventListener('cut', function (e) {
        e.preventDefault();
    });

    // Disable drag
    document.addEventListener('dragstart', function (e) {
        e.preventDefault();
    });

    // Disable text selection
    document.addEventListener('selectstart', function (e) {
        e.preventDefault();
    });

    // Disable common shortcuts
    document.addEventListener('keydown', function (e) {

        const key = e.key.toLowerCase();

        if (
            (e.ctrlKey || e.metaKey) &&
            (
                key === 'c' ||
                key === 'x' ||
                key === 'a' ||
                key === 'u' ||
                key === 's' ||
                key === 'p'
            )
        ) {
            e.preventDefault();
        }

        // F12
        if (e.key === 'F12') {
            e.preventDefault();
        }

        // Ctrl+Shift+I
        if (e.ctrlKey && e.shiftKey && key === 'i') {
            e.preventDefault();
        }

        // Ctrl+Shift+J
        if (e.ctrlKey && e.shiftKey && key === 'j') {
            e.preventDefault();
        }

        // Ctrl+Shift+C
        if (e.ctrlKey && e.shiftKey && key === 'c') {
            e.preventDefault();
        }

    });

})();
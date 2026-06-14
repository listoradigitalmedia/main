/* ============================================================
   LISTORA — service.js  v3.0
   Premium card animations + interactions

   ARCHITECTURE — 5 independent animation layers:
   Layer 1: svc-reveal    — card container slide-up
   Layer 2: card-icon     — icon scale-in (60ms after container)
   Layer 3: card-heading  — heading fade-up (120ms after container)
   Layer 4: card-text     — description fade-up (200ms after container)
   Layer 5: card-cta      — button spring-in (280ms after container)
   Each layer uses its OWN IntersectionObserver instance.
   No shared state. No timing collisions.

   EXCLUDED (handled by script.js):
   - Drawer, navbar scroll, smooth scroll, newsletter
   ============================================================ */

'use strict';

const svcRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   UTILITY — removed (homepage script.js handles text animations)
   ============================================================ */


/* ============================================================
   1. SVC- SCROLL REVEAL
   Only handles .svc-reveal (card container slide-up) and
   .svc-img-reveal (image scale-in).

   ALL heading word-reveals, paragraph fade-ups, and badge
   animations are handled by script.js initTextAnimations()
   which already loads on this page. No duplicate logic here.
   ============================================================ */
(function initSvcReveal() {

    if (svcRM) {
        document.querySelectorAll('.svc-reveal, .svc-img-reveal').forEach(function (el) {
            el.style.opacity = '1';
            el.style.transform = 'none';
            el.classList.add('svc-visible', 'svc-img-in');
        });
        return;
    }

    /* Card container reveal */
    var revealObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var delay = parseInt(entry.target.dataset.delay || '0', 10);
            setTimeout(function () { entry.target.classList.add('svc-visible'); }, delay);
            revealObs.unobserve(entry.target);
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -28px 0px' });

    document.querySelectorAll('.svc-reveal').forEach(function (el) {
        revealObs.observe(el);
    });

    /* Image scale-in */
    var imgObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('svc-img-in');
            imgObs.unobserve(entry.target);
        });
    }, { threshold: 0.10 });

    document.querySelectorAll('.svc-img-reveal').forEach(function (el) {
        imgObs.observe(el);
    });

})();


/* ============================================================
   2. FAQ ACCORDION
   ============================================================ */
(function initFAQ() {

    var faqBtns = document.querySelectorAll('.faq-q');
    if (!faqBtns.length) return;

    faqBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var isOpen = this.getAttribute('aria-expanded') === 'true';
            var answer = this.nextElementSibling;

            faqBtns.forEach(function (b) {
                b.setAttribute('aria-expanded', 'false');
                var a = b.nextElementSibling;
                if (a) a.classList.remove('open');
            });

            if (!isOpen) {
                this.setAttribute('aria-expanded', 'true');
                if (answer) answer.classList.add('open');
            }
        });
    });

})();


/* ============================================================
   3. INTERACTIVE TIMELINE
   ============================================================ */
(function initTimeline() {

    var steps = document.querySelectorAll('.timeline-step');
    if (!steps.length || !('IntersectionObserver' in window)) return;

    var tlObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                steps.forEach(function (s) { s.classList.remove('active'); });
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.5, rootMargin: '-10% 0px -40% 0px' });

    steps.forEach(function (step) { tlObs.observe(step); });

})();


/* ============================================================
   4. COUNTER ANIMATION (why-card stats)
   ============================================================ */
(function initCounters() {

    if (svcRM || !('IntersectionObserver' in window)) return;

    document.querySelectorAll('.why-card__stat').forEach(function (el) {
        var raw = el.textContent.trim();
        var match = raw.match(/^([\d.]+)(.*)$/);
        if (!match) return;

        var target = parseFloat(match[1]);
        var suffix = match[2];
        var isFloat = match[1].indexOf('.') !== -1;

        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                obs.unobserve(el);
                var start = 0;
                var step = (target / 1200) * 16;
                var timer = setInterval(function () {
                    start += step;
                    if (start >= target) { start = target; clearInterval(timer); }
                    el.textContent = (isFloat ? start.toFixed(1) : Math.round(start)) + suffix;
                }, 16);
            });
        }, { threshold: 0.5 });

        obs.observe(el);
    });

})();


/* ============================================================
   5. PREMIUM CARD HOVER MICRO-INTERACTIONS
   CSS handles transforms; JS adds depth-shadow on enter.
   ============================================================ */
(function initCardMicro() {

    if (!window.matchMedia('(hover: hover)').matches) return;

    /* Core cards — icon nudge on hover */
    document.querySelectorAll('.core-card').forEach(function (card) {
        card.addEventListener('mouseenter', function () {
            card.style.boxShadow = '0 20px 48px rgba(3,43,102,0.14), 0 4px 12px rgba(255,102,0,0.08)';
        });
        card.addEventListener('mouseleave', function () {
            card.style.boxShadow = '';
        });
    });

    /* Why cards */
    document.querySelectorAll('.why-card').forEach(function (card) {
        card.addEventListener('mouseenter', function () {
            card.style.boxShadow = '0 16px 44px rgba(3,43,102,0.13)';
        });
        card.addEventListener('mouseleave', function () {
            card.style.boxShadow = '';
        });
    });

    /* Package cards */
    document.querySelectorAll('.pkg-card:not(.pkg-card--featured):not(.pkg-card--premium)').forEach(function (card) {
        card.addEventListener('mouseenter', function () {
            card.style.boxShadow = '0 18px 48px rgba(3,43,102,0.13)';
        });
        card.addEventListener('mouseleave', function () {
            card.style.boxShadow = '';
        });
    });

    /* Ops cards */
    document.querySelectorAll('.ops-card').forEach(function (card) {
        card.addEventListener('mouseenter', function () {
            card.style.boxShadow = '0 14px 36px rgba(3,43,102,0.11)';
        });
        card.addEventListener('mouseleave', function () {
            card.style.boxShadow = '';
        });
    });

    /* Timeline cards */
    document.querySelectorAll('.timeline-card').forEach(function (card) {
        card.addEventListener('mouseenter', function () {
            card.style.boxShadow = '0 10px 32px rgba(255,102,0,0.10)';
        });
        card.addEventListener('mouseleave', function () {
            card.style.boxShadow = '';
        });
    });

})();


/* ============================================================
   6. BUTTON RIPPLE
   ============================================================ */
(function initButtonRipple() {

    if (!document.getElementById('svc-ripple-style')) {
        var s = document.createElement('style');
        s.id = 'svc-ripple-style';
        s.textContent = '@keyframes svcRipple{from{transform:scale(0);opacity:.8}to{transform:scale(3);opacity:0}}';
        document.head.appendChild(s);
    }

    document.querySelectorAll('.btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            var r = document.createElement('span');
            r.style.cssText = 'position:absolute;border-radius:50%;background:rgba(255,255,255,0.25);width:70px;height:70px;transform:scale(0);animation:svcRipple 0.5s ease-out forwards;pointer-events:none;z-index:10;left:' + (e.offsetX - 35) + 'px;top:' + (e.offsetY - 35) + 'px';
            btn.appendChild(r);
            setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 550);
        });
    });

})();


/* ============================================================
   7. MISSING IMAGE FALLBACK
   ============================================================ */
(function handleMissingImages() {

    document.querySelectorAll('img').forEach(function (img) {
        img.addEventListener('error', function () {
            this.style.background = 'linear-gradient(135deg,#e8eef8 0%,#f3f5fa 100%)';
            this.style.minHeight = '200px';
            this.removeAttribute('src');
        });
    });

})();


/* ============================================================
   8. PREMIUM PACKAGES — entrance stagger + price counter
   ============================================================ */
(function initPackages() {
    if (svcRM) return;
    if (!('IntersectionObserver' in window)) return;

    /* ── Staggered card entrance ── */
    var cards = document.querySelectorAll('.pkg-card-v2');
    if (cards.length) {
        var pkgObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var delay = parseInt(entry.target.dataset.delay || '0', 10);
                setTimeout(function () {
                    entry.target.classList.add('svc-visible');
                }, delay);
                pkgObs.unobserve(entry.target);
            });
        }, { threshold: 0.10, rootMargin: '0px 0px -30px 0px' });

        cards.forEach(function (c) { pkgObs.observe(c); });
    }

    /* ── Animated price counter ── */
    function countUp(el) {
        var raw    = el.dataset.target || el.textContent.replace(/,/g, '');
        var target = parseFloat(raw);
        if (!target) return;
        var isSuffix = el.textContent.includes(',');
        var duration = 1400;
        var step     = (target / duration) * 16;
        var current  = 0;

        var timer = setInterval(function () {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            el.textContent = Math.round(current).toLocaleString();
        }, 16);
    }

    var priceNums = document.querySelectorAll('.pkg-price-num');
    if (priceNums.length) {
        var priceObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                countUp(entry.target);
                priceObs.unobserve(entry.target);
            });
        }, { threshold: 0.5 });

        priceNums.forEach(function (el) {
            priceObs.observe(el);
        });
    }

    /* ── Feature icon micro-hover (desktop) ── */
    if (window.matchMedia('(hover: hover)').matches) {
        document.querySelectorAll('.pkg-card-v2').forEach(function (card) {
            card.addEventListener('mouseenter', function () {
                card.style.willChange = 'transform';
            });
            card.addEventListener('mouseleave', function () {
                card.style.willChange = 'auto';
            });
        });
    }

})();


/* ============================================================
   9. BENTO GRID — Mouse Spotlight + Keyboard Navigation
   Scoped strictly to .svc-bc cards. No interference with
   any existing observers or animation layers.
   ============================================================ */
(function initBentoGrid() {

    if (!window.matchMedia('(hover: hover)').matches) return;

    var cards = document.querySelectorAll('.svc-bc');
    if (!cards.length) return;

    cards.forEach(function (card) {
        var glowEl = card.querySelector('.svc-bc__glow');
        if (!glowEl) return;

        var rafId  = null;
        var tx = 50, ty = 50;   /* target position % */
        var cx = 50, cy = 50;   /* current (lerped) position % */

        function lerp(a, b, t) { return a + (b - a) * t; }

        function tick() {
            cx = lerp(cx, tx, 0.10);
            cy = lerp(cy, ty, 0.10);
            card.style.setProperty('--bx', cx.toFixed(2) + '%');
            card.style.setProperty('--by', cy.toFixed(2) + '%');
            rafId = requestAnimationFrame(tick);
        }

        card.addEventListener('mouseenter', function () {
            rafId = requestAnimationFrame(tick);
        });

        card.addEventListener('mousemove', function (e) {
            var rect = card.getBoundingClientRect();
            tx = ((e.clientX - rect.left) / rect.width)  * 100;
            ty = ((e.clientY - rect.top)  / rect.height) * 100;
        });

        card.addEventListener('mouseleave', function () {
            cancelAnimationFrame(rafId);
            rafId = null;
        });

        /* Keyboard: Enter/Space activates the card's CTA link */
        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                var link = card.querySelector('.svc-bc__cta');
                if (link) { e.preventDefault(); link.click(); }
            }
        });
    });

})();

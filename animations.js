/* ═══════════════════════════════════════════════════════════════
   Listora Digital Media — Premium Animation Engine v2.0
   No external libraries · requestAnimationFrame · 60fps
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Reduced motion gate ────────────────────────────────────── */
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Utility: RAF-based delay ───────────────────────────────── */
  function rafDelay(ms, fn) {
    if (reducedMotion) { fn(); return; }
    const start = performance.now();
    function loop(now) {
      if (now - start >= ms) fn();
      else requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ── Utility: easeOutCubic ─────────────────────────────────── */
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  /* ── Utility: easeOutExpo ──────────────────────────────────── */
  function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }


  /* ═══════════════════════════════════════════════════════════
     1. HERO LOAD SEQUENCE — staggered entrance
  ═══════════════════════════════════════════════════════════ */

  function runHeroSequence() {
    if (reducedMotion) {
      /* Skip all entrance animation, show everything instantly */
      document.querySelectorAll(
        '.hero-badge, .hero-word, .hero-desc, .hero-ctas, .hero-trust, .hero-visual, ' +
        '.floating-card'
      ).forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.classList.add('is-visible');
      });
      return;
    }

    /* 1a. Background grid & radial: already visible via CSS, but we
          add a subtle fade-in from opacity 0 → 1 for polish. */
    const heroBgGrid   = document.querySelector('.hero-bg-grid');
    const heroBgRadial = document.querySelector('.hero-bg-radial');
    [heroBgGrid, heroBgRadial].forEach(el => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transition = 'opacity 1.2s ease';
      rafDelay(80, () => { el.style.opacity = '1'; });
    });

    /* 1b. Badge */
    const badge = document.querySelector('.hero-badge');
    if (badge) {
      rafDelay(300, () => badge.classList.add('is-visible'));
    }

    /* 1c. Heading — word-by-word reveal (see section 2 below) */
    rafDelay(520, () => revealHeroWords());

    /* 1d. Description */
    const desc = document.querySelector('.hero-desc');
    if (desc) {
      rafDelay(900, () => desc.classList.add('is-visible'));
    }

    /* 1e. CTA Buttons */
    const ctas = document.querySelector('.hero-ctas');
    if (ctas) {
      rafDelay(1080, () => ctas.classList.add('is-visible'));
    }

    /* 1f. Trust stats */
    const trust = document.querySelector('.hero-trust');
    if (trust) {
      rafDelay(1260, () => {
        trust.classList.add('is-visible');
        /* Trigger counter animation after trust becomes visible */
        rafDelay(200, () => animateCounters());
      });
    }

    /* 1g. Hero visual (right column) */
    const visual = document.querySelector('.hero-visual');
    if (visual) {
      rafDelay(400, () => visual.classList.add('is-visible'));
    }

    /* 1h. Floating cards — staggered */
    const cardDelays = { 'floating-1': 700, 'floating-2': 900, 'floating-3': 1100, 'floating-4': 1300 };
    Object.entries(cardDelays).forEach(([cls, delay]) => {
      const card = document.querySelector('.' + cls);
      if (!card) return;
      rafDelay(delay, () => card.classList.add('is-visible'));
    });
  }


  /* ═══════════════════════════════════════════════════════════
     2. HEADING ANIMATION — word-by-word reveal
  ═══════════════════════════════════════════════════════════ */

  function revealHeroWords() {
    const words = document.querySelectorAll('.hero-word');
    if (!words.length) return;

    words.forEach((word, i) => {
      /* Each word starts hidden (CSS: opacity:0, translateY(36px)) */
      rafDelay(i * 90, () => {
        word.classList.add('is-visible');
      });
    });
  }


  /* ═══════════════════════════════════════════════════════════
     3. TRUST STAT COUNTERS — smooth count-up with easing
  ═══════════════════════════════════════════════════════════ */

  function animateCounters() {
    const counters = document.querySelectorAll('.trust-stat__number[data-count]');
    counters.forEach((el, idx) => {
      const target = parseInt(el.dataset.count, 10);
      const duration = 1400;

      rafDelay(idx * 120, () => {
        const startTime = performance.now();

        function updateCounter(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased    = easeOutExpo(progress);
          const current  = Math.round(eased * target);
          el.textContent = current;
          if (progress < 1) requestAnimationFrame(updateCounter);
          else el.textContent = target;
        }

        requestAnimationFrame(updateCounter);
      });
    });
  }


  /* ═══════════════════════════════════════════════════════════
     4. FLOATING CARDS — continuous ambient float
        Each card gets its own oscillation parameters so they
        never move in sync, creating a natural layered depth feel.
  ═══════════════════════════════════════════════════════════ */

  function initFloatingCards() {
    if (reducedMotion) return;

    const configs = [
      {
        selector: '.floating-1',
        amplY: 10, amplR: 1,
        periodY: 10000, periodR: 13000,
        phaseY: 0, phaseR: Math.PI / 4
      },
      {
        selector: '.floating-2',
        amplY: 14, amplR: 1.2,
        periodY: 13000, periodR: 16000,
        phaseY: Math.PI / 3, phaseR: Math.PI / 2
      },
      {
        selector: '.floating-3',
        amplY: 8,  amplR: 0.8,
        periodY: 11000, periodR: 14000,
        phaseY: Math.PI / 2, phaseR: Math.PI
      },
      {
        selector: '.floating-4',
        amplY: 12, amplR: 1,
        periodY: 9000,  periodR: 12000,
        phaseY: Math.PI, phaseR: Math.PI / 6
      }
    ];

    configs.forEach(cfg => {
      const card = document.querySelector(cfg.selector);
      if (!card) return;

      /* Track hover so we don't fight the hover transform */
      let isHovered = false;
      card.addEventListener('mouseenter', () => { isHovered = true; });
      card.addEventListener('mouseleave', () => { isHovered = false; });

      function floatLoop(timestamp) {
        if (!isHovered) {
          const tY  = (timestamp % cfg.periodY)  / cfg.periodY;
          const tR  = (timestamp % cfg.periodR)  / cfg.periodR;
          const y   = Math.sin(tY * Math.PI * 2 + cfg.phaseY) * cfg.amplY;
          const rot = Math.sin(tR * Math.PI * 2 + cfg.phaseR) * cfg.amplR;
          card.style.transform = `translateY(${y.toFixed(2)}px) rotate(${rot.toFixed(3)}deg)`;
        }
        requestAnimationFrame(floatLoop);
      }

      requestAnimationFrame(floatLoop);
    });
  }


  /* ═══════════════════════════════════════════════════════════
     5. SCROLL ANIMATIONS — Intersection Observer
        Handles: [data-reveal], section tags, benefit cards,
        included cards, problem items, process steps
  ═══════════════════════════════════════════════════════════ */

  /* 5a. Generic reveal: fade-up */
  function initScrollReveals() {
    const revealEls = document.querySelectorAll('[data-reveal]');

    if (reducedMotion) {
      revealEls.forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.classList.add('visible');
      });
      return;
    }

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el    = entry.target;
        const delay = parseInt(el.dataset.delay || 0, 10);
        setTimeout(() => el.classList.add('visible'), delay);
        obs.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => obs.observe(el));
  }

  /* 5b. Section tags: slide in from left */
  function initSectionTagReveals() {
    if (reducedMotion) return;

    document.querySelectorAll('.section-tag').forEach(tag => {
      tag.style.opacity = '0';
      tag.style.transform = 'translateX(-14px)';

      const obs = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        tag.style.transition = 'opacity 0.55s ease, transform 0.55s cubic-bezier(.2,.8,.3,1)';
        tag.style.opacity    = '1';
        tag.style.transform  = 'translateX(0)';
        obs.disconnect();
      }, { threshold: 0.4 });

      obs.observe(tag);
    });
  }

  /* 5c. Benefit cards: staggered scale-in + fade */
  function initBenefitCardReveals() {
    if (reducedMotion) return;

    document.querySelectorAll('.benefit-card').forEach((card, i) => {
      card.style.opacity   = '0';
      card.style.transform = 'translateY(32px) scale(0.97)';

      const obs = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        const delay = parseInt(card.dataset.delay || 0, 10);
        setTimeout(() => {
          card.style.transition = 'opacity 0.65s cubic-bezier(.2,.8,.3,1), transform 0.65s cubic-bezier(.2,.8,.3,1)';
          card.style.opacity    = '1';
          card.style.transform  = 'translateY(0) scale(1)';
        }, delay);
        obs.disconnect();
      }, { threshold: 0.1 });

      obs.observe(card);
    });
  }

  /* 5d. Included cards: staggered reveal */
  function initIncludedCardReveals() {
    if (reducedMotion) return;

    document.querySelectorAll('.included-card').forEach(card => {
      card.style.opacity   = '0';
      card.style.transform = 'translateY(28px)';

      const obs = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        const delay = parseInt(card.dataset.delay || 0, 10);
        setTimeout(() => {
          card.style.transition = 'opacity 0.6s cubic-bezier(.2,.8,.3,1), transform 0.6s cubic-bezier(.2,.8,.3,1)';
          card.style.opacity    = '1';
          card.style.transform  = 'translateY(0)';
        }, delay);
        obs.disconnect();
      }, { threshold: 0.1 });

      obs.observe(card);
    });
  }

  /* 5e. Problem items: slide in alternating left/right */
  function initProblemItemReveals() {
    if (reducedMotion) return;

    document.querySelectorAll('.problem-item').forEach((item, i) => {
      const isOdd = i % 2 === 0;
      item.style.opacity   = '0';
      item.style.transform = `translateX(${isOdd ? '-24px' : '24px'})`;

      item.addEventListener('mouseenter', () => {
        const num = item.querySelector('.problem-number');
        if (num) num.style.textShadow = '0 0 18px rgba(255,98,0,0.75)';
      });
      item.addEventListener('mouseleave', () => {
        const num = item.querySelector('.problem-number');
        if (num) num.style.textShadow = '';
      });

      const obs = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        const delay = parseInt(item.dataset.delay || 0, 10);
        setTimeout(() => {
          item.style.transition = 'opacity 0.65s cubic-bezier(.2,.8,.3,1), transform 0.65s cubic-bezier(.2,.8,.3,1)';
          item.style.opacity    = '1';
          item.style.transform  = 'translateX(0)';
        }, delay);
        obs.disconnect();
      }, { threshold: 0.12 });

      obs.observe(item);
    });
  }


  /* ═══════════════════════════════════════════════════════════
     6. PROCESS STEPS — connector line draw + step number pop-in
  ═══════════════════════════════════════════════════════════ */

  function initProcessSteps() {
    /* Step connector lines */
    document.querySelectorAll('.step-line').forEach(line => {
      if (reducedMotion) return;
      line.style.height     = '0';
      line.style.transition = 'none';

      const obs = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        requestAnimationFrame(() => {
          line.style.transition = 'height 0.85s cubic-bezier(.2,.8,.3,1)';
          line.style.height     = '';
        });
        obs.unobserve(line);
      }, { threshold: 0.1 });

      obs.observe(line);
    });

    /* Step number pop-in */
    document.querySelectorAll('.step-num').forEach((el, i) => {
      if (reducedMotion) return;
      el.style.opacity    = '0';
      el.style.transform  = 'scale(0.5)';
      el.style.transition = 'none';

      const obs = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        setTimeout(() => {
          el.style.transition = 'opacity 0.5s ease, transform 0.55s cubic-bezier(.2,1.5,.4,1)';
          el.style.opacity    = '1';
          el.style.transform  = 'scale(1)';
        }, i * 130);
        obs.disconnect();
      }, { threshold: 0.5 });

      obs.observe(el);
    });
  }


  /* ═══════════════════════════════════════════════════════════
     7. CARD TILT — 3D perspective tilt on mouse move
  ═══════════════════════════════════════════════════════════ */

  function initCardTilt(selector, maxTilt) {
    if (reducedMotion) return;

    document.querySelectorAll(selector).forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const dx   = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
        const dy   = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
        card.style.transform = `perspective(800px) rotateX(${(-dy * maxTilt).toFixed(2)}deg) rotateY(${(dx * maxTilt).toFixed(2)}deg) translateY(-6px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.45s cubic-bezier(.2,.8,.3,1)';
        card.style.transform  = '';
        /* Clean up transition after it's done */
        card.addEventListener('transitionend', () => {
          card.style.transition = '';
        }, { once: true });
      });
    });
  }


  /* ═══════════════════════════════════════════════════════════
     8. CTA BUTTON — breathing glow pulse
  ═══════════════════════════════════════════════════════════ */

  function initCtaGlow() {
    if (reducedMotion) return;

    const btn = document.querySelector('.cta-btn.primary');
    if (!btn) return;

    let isHovered = false;
    let rafId;

    btn.addEventListener('mouseenter', () => {
      isHovered = true;
      cancelAnimationFrame(rafId);
      btn.style.transform = 'translateY(-2px)';
    });
    btn.addEventListener('mouseleave', () => {
      isHovered = false;
      breathe();
    });

    function breathe() {
      let t = 0;
      function step() {
        if (isHovered) return;
        t += 0.035;
        const s = 1 + Math.sin(t) * 0.012;
        btn.style.transform = `scale(${s.toFixed(4)})`;
        rafId = requestAnimationFrame(step);
      }
      step();
    }

    breathe();
  }


  /* ═══════════════════════════════════════════════════════════
     9. BACK BUTTON — entrance slide
  ═══════════════════════════════════════════════════════════ */

  function initBackButton() {
    const btn = document.querySelector('.back-btn');
    if (!btn) return;

    if (reducedMotion) {
      btn.style.opacity   = '1';
      btn.style.transform = 'none';
      return;
    }

    btn.style.opacity    = '0';
    btn.style.transform  = 'translateX(-18px)';
    btn.style.transition = 'opacity 0.5s ease 0.25s, transform 0.5s cubic-bezier(.2,.8,.3,1) 0.25s, background 0.25s ease, color 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease';

    requestAnimationFrame(() => {
      setTimeout(() => {
        btn.style.opacity   = '1';
        btn.style.transform = 'translateX(0)';
      }, 150);
    });
  }


  /* ═══════════════════════════════════════════════════════════
     10. PARTICLE CANVAS — ambient hero sparkles
  ═══════════════════════════════════════════════════════════ */

  function initParticleCanvas() {
    if (reducedMotion) return;

    const hero = document.querySelector('.hero');
    if (!hero) return;

    const canvas    = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;opacity:0.3;';
    hero.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let W, H, dots;

    function setup() {
      W = canvas.width  = hero.offsetWidth;
      H = canvas.height = hero.offsetHeight;

      dots = Array.from({ length: 65 }, () => ({
        x:      Math.random() * W,
        y:      Math.random() * H,
        r:      Math.random() * 1.4 + 0.4,
        dx:     (Math.random() - 0.5) * 0.28,
        dy:     (Math.random() - 0.5) * 0.28,
        alpha:  Math.random(),
        dalpha: (Math.random() - 0.5) * 0.007
      }));
    }

    setup();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setup, 150);
    });

    function draw() {
      ctx.clearRect(0, 0, W, H);

      dots.forEach(d => {
        d.x += d.dx;
        d.y += d.dy;
        d.alpha = Math.max(0.05, Math.min(1, d.alpha + d.dalpha));
        if (d.alpha <= 0.05 || d.alpha >= 1) d.dalpha *= -1;
        if (d.x < 0)  d.x = W;
        if (d.x > W)  d.x = 0;
        if (d.y < 0)  d.y = H;
        if (d.y > H)  d.y = 0;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,98,0,${(d.alpha * 0.55).toFixed(3)})`;
        ctx.fill();
      });

      requestAnimationFrame(draw);
    }

    draw();
  }


  /* ═══════════════════════════════════════════════════════════
     11. TRUST PILLAR REVEALS — in the Why Trust section
  ═══════════════════════════════════════════════════════════ */

  function initTrustPillarReveals() {
    if (reducedMotion) return;

    document.querySelectorAll('.trust-pillar').forEach((pillar, i) => {
      pillar.style.opacity   = '0';
      pillar.style.transform = 'translateX(20px)';

      const obs = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        const delay = parseInt(pillar.dataset.delay || 0, 10);
        setTimeout(() => {
          pillar.style.transition = 'opacity 0.6s cubic-bezier(.2,.8,.3,1), transform 0.6s cubic-bezier(.2,.8,.3,1)';
          pillar.style.opacity    = '1';
          pillar.style.transform  = 'translateX(0)';
        }, delay);
        obs.disconnect();
      }, { threshold: 0.2 });

      obs.observe(pillar);
    });
  }


  /* ═══════════════════════════════════════════════════════════
     12. HERO IMAGE — subtle parallax on mouse move
  ═══════════════════════════════════════════════════════════ */

  function initHeroParallax() {
    if (reducedMotion) return;

    const hero     = document.querySelector('.hero');
    const imgFrame = document.querySelector('.hero-image-frame');
    if (!hero || !imgFrame) return;

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let rafId;

    hero.addEventListener('mousemove', e => {
      const rect = hero.getBoundingClientRect();
      const cx   = rect.width  / 2;
      const cy   = rect.height / 2;
      targetX    = ((e.clientX - rect.left - cx) / cx) * 8;
      targetY    = ((e.clientY - rect.top  - cy) / cy) * 5;
    });

    hero.addEventListener('mouseleave', () => {
      targetX = 0;
      targetY = 0;
    });

    function lerp(a, b, t) { return a + (b - a) * t; }

    function tick() {
      currentX = lerp(currentX, targetX, 0.06);
      currentY = lerp(currentY, targetY, 0.06);
      imgFrame.style.transform =
        `translate(calc(-50% + ${currentX.toFixed(2)}px), calc(-50% + ${currentY.toFixed(2)}px))`;
      rafId = requestAnimationFrame(tick);
    }

    tick();
  }


  /* ═══════════════════════════════════════════════════════════
     13. SCROLL-TRIGGERED SCALE-IN — for section headings
  ═══════════════════════════════════════════════════════════ */

  function initSectionHeadings() {
    if (reducedMotion) return;

    document.querySelectorAll('.section-title').forEach(title => {
      /* Don't re-animate the hero title */
      if (title.closest('.hero')) return;

      title.style.opacity   = '0';
      title.style.transform = 'translateY(22px)';

      const obs = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        title.style.transition = 'opacity 0.7s cubic-bezier(.2,.8,.3,1), transform 0.7s cubic-bezier(.2,.8,.3,1)';
        title.style.opacity    = '1';
        title.style.transform  = 'translateY(0)';
        obs.disconnect();
      }, { threshold: 0.2 });

      obs.observe(title);
    });
  }


  /* ═══════════════════════════════════════════════════════════
     14. SECTION INTRO paragraphs — fade up
  ═══════════════════════════════════════════════════════════ */

  function initSectionIntros() {
    if (reducedMotion) return;

    document.querySelectorAll('.section-intro').forEach(intro => {
      intro.style.opacity   = '0';
      intro.style.transform = 'translateY(18px)';

      const obs = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        intro.style.transition = 'opacity 0.65s ease 0.15s, transform 0.65s cubic-bezier(.2,.8,.3,1) 0.15s';
        intro.style.opacity    = '1';
        intro.style.transform  = 'translateY(0)';
        obs.disconnect();
      }, { threshold: 0.15 });

      obs.observe(intro);
    });
  }


  /* ═══════════════════════════════════════════════════════════
     15. HERO SCROLL INDICATOR — appears after load sequence
  ═══════════════════════════════════════════════════════════ */

  function initScrollIndicator() {
    /* The CSS already handles the scrollFadeIn animation via
       @keyframes with a 2s delay. We only need to hide it once
       the user starts scrolling. */
    const indicator = document.querySelector('.hero-scroll-indicator');
    if (!indicator) return;

    const onScroll = () => {
      if (window.scrollY > 80) {
        indicator.style.transition = 'opacity 0.4s ease';
        indicator.style.opacity    = '0';
        indicator.style.pointerEvents = 'none';
        window.removeEventListener('scroll', onScroll);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
  }


  /* ═══════════════════════════════════════════════════════════
     16. PROCESS STEP IMAGE SWITCHER
         As each step scrolls into view, swap the sticky panel
         image to match the active step.
  ═══════════════════════════════════════════════════════════ */

  function initProcessImageSwitcher() {
    const steps      = document.querySelectorAll('.process-step');
    const panelImgs  = document.querySelectorAll('.process-panel-img');
    const stepNumEl  = document.getElementById('active-step-num');
    const stepTitle  = document.getElementById('active-step-title');

    if (!steps.length || !panelImgs.length) return;

    const stepTitles = [
      'Local Presence Audit',
      'Strategy Development',
      'Profile & SEO Optimization',
      'Citation & Reputation Management',
      'Monitoring & Reporting',
      'Continuous Growth Optimization'
    ];

    function activateStep(index) {
      panelImgs.forEach((img, i) => {
        img.classList.toggle('process-panel-img--active', i === index);
      });
      if (stepNumEl)  stepNumEl.textContent  = index + 1;
      if (stepTitle)  stepTitle.textContent  = stepTitles[index] || '';
    }

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const step  = entry.target;
        const index = Array.from(steps).indexOf(step);
        if (index !== -1) activateStep(index);
      });
    }, { threshold: 0.5, rootMargin: '0px 0px -30% 0px' });

    steps.forEach(step => obs.observe(step));
  }


  /* ═══════════════════════════════════════════════════════════
     INIT — boot order
  ═══════════════════════════════════════════════════════════ */

  function init() {
    /* Scroll-based reveals (runs for all non-hero sections) */
    initScrollReveals();
    initSectionTagReveals();
    initSectionHeadings();
    initSectionIntros();
    initBenefitCardReveals();
    initIncludedCardReveals();
    initProblemItemReveals();
    initProcessSteps();
    initTrustPillarReveals();

    /* Interaction */
    initCardTilt('.benefit-card',  5);
    initCardTilt('.included-card', 4);
    initCtaGlow();
    initBackButton();
    initScrollIndicator();

    /* Hero visual */
    initParticleCanvas();
    initFloatingCards();
    initHeroParallax();

    /* Process image switcher */
    initProcessImageSwitcher();

    /* Hero entrance — fires immediately on DOMContentLoaded */
    runHeroSequence();
  }

  /* ── Wait for DOM ready ─────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

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

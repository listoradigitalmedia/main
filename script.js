/* ============================================================
   LISTORA — script.js  v2.0
   Premium Animation & Interaction Layer  (ES6+, 60 FPS)
   ============================================================
   TABLE OF CONTENTS
   00. Config & Utilities
   01. Navbar — sticky scroll
   02. Mobile Drawer
   03. Smooth Scroll
   04. Hero & Section Text Animations (UNIFIED, no conflicts)
   05. Typing / word-cycle animation
   06. Scroll-reveal (IntersectionObserver)
   07. Problem cards — accordion
   08. Ecosystem flip cards
   09. Service card navigation
   10. Newsletter
   11. Timeline Pro
   ============================================================ */

'use strict';

/* ============================================================
   00. CONFIG & UTILITIES
   ============================================================ */

/** Respect prefers-reduced-motion */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Debounce — delay until N ms after last call */
function debounce(fn, wait = 120) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

/** Throttle — at most once per animation frame */
function throttleRAF(fn) {
  let ticking = false;
  return (...args) => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { fn(...args); ticking = false; });
  };
}

/** Viewport helpers */
const isMobile = () => window.innerWidth < 768;
const isTablet = () => window.innerWidth < 992;


/* ============================================================
   01. NAVBAR — sticky scroll styling
   ============================================================ */

(function initNavbar() {
  /* Support both old .navbar and new unified .ct-nav */
  const navbar = document.querySelector('.navbar') || document.querySelector('.ct-nav');
  if (!navbar) return;

  const onScroll = throttleRAF(() => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


/* ============================================================
   02. MOBILE DRAWER
   ============================================================ */

(function initDrawer() {
  const menuBtn    = document.getElementById('menuBtn');
  const drawer     = document.getElementById('navDrawer');
  const overlay    = document.getElementById('navOverlay');
  const closeBtn   = document.getElementById('drawerCloseBtn');

  if (!menuBtn || !drawer || !overlay) return;

  const drawerLinks = drawer.querySelectorAll('.drawer-link');
  let isOpen = false;
  let lastFocused = null;
  let scrollbarWidth = 0;

  const FOCUS_SELECTORS = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function openDrawer() {
    if (isOpen) return;
    isOpen = true;
    lastFocused = document.activeElement;
    scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-width', scrollbarWidth + 'px');
    document.body.classList.add('drawer-open');
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
      const first = drawer.querySelector(FOCUS_SELECTORS);
      if (first) first.focus();
    });
  }

  function closeDrawer() {
    if (!isOpen) return;
    isOpen = false;
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    document.body.classList.remove('drawer-open');
    document.documentElement.style.setProperty('--scrollbar-width', '0px');
    menuBtn.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function trapFocus(e) {
    if (!isOpen || e.key !== 'Tab') return;
    const focusable = Array.from(drawer.querySelectorAll(FOCUS_SELECTORS))
      .filter(el => !el.disabled && el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  /* Swipe to close */
  (function attachSwipe() {
    let startX = 0, startY = 0, dragging = false;
    const THRESHOLD = 72, MAX_Y = 60;

    drawer.addEventListener('touchstart', e => {
      if (!isOpen) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      dragging = true;
    }, { passive: true });

    drawer.addEventListener('touchmove', e => {
      if (!dragging || !isOpen) return;
      const dx = e.touches[0].clientX - startX;
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dy > MAX_Y) { dragging = false; return; }
      if (dx > 0) {
        drawer.style.transform = `translateX(${dx}px)`;
        overlay.style.opacity  = String(Math.max(0, 1 - dx / THRESHOLD));
      }
    }, { passive: true });

    drawer.addEventListener('touchend', e => {
      if (!dragging || !isOpen) return;
      dragging = false;
      const dx = e.changedTouches[0].clientX - startX;
      drawer.style.transform = '';
      overlay.style.opacity  = '';
      if (dx > THRESHOLD) closeDrawer();
    }, { passive: true });
  })();

  menuBtn.addEventListener('click', e => { e.stopPropagation(); isOpen ? closeDrawer() : openDrawer(); });
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  drawerLinks.forEach(link => link.addEventListener('click', closeDrawer));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) closeDrawer();
    trapFocus(e);
  });

  document.addEventListener('click', e => {
    if (!isOpen) return;
    if (!drawer.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) closeDrawer();
  });

  window.addEventListener('resize', debounce(() => {
    if (window.innerWidth >= 992 && isOpen) closeDrawer();
  }, 150), { passive: true });

  const desktopNav = document.getElementById('desktopNavLinks');
  if (desktopNav) {
    new MutationObserver(mutations => {
      mutations.forEach(m => {
        if (m.attributeName === 'class' && window.innerWidth < 992 && desktopNav.classList.contains('active')) {
          desktopNav.classList.remove('active');
        }
      });
    }).observe(desktopNav, { attributes: true });
  }
})();


/* ============================================================
   03. SMOOTH SCROLL
   ============================================================ */

(function initSmoothScroll() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href === '#' || href.length <= 1) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  });
})();


/* ============================================================
   04. TEXT ANIMATIONS — UNIFIED SYSTEM
   ─────────────────────────────────────────────────────────────
   ARCHITECTURE:
   • Hero headings  → word-by-word mask reveal (CSS clip)
                      triggered on DOMContentLoaded, no IO needed
   • Section headings (h2 inside .section-header, .listora-advantage-header,
     .timelinepro-heading, etc.) → word-by-word reveal via IO
   • Paragraphs / descriptions → elegant fade-up via IO,
     on a SEPARATE timeline from headings (no shared state)
   • Badges / tags → subtle spring pop-in via IO
   
   COLLISION PREVENTION:
   • Only opacity + transform(translateY) used — never competing axes
   • Hero h1 managed exclusively here; initHeroEntrance() removed
   • JS only adds/removes CSS classes — never touches inline style
     on animated properties once animation fires
   • Headings and paragraphs use DISTINCT observer instances,
     DISTINCT CSS classes, DISTINCT timing
   ============================================================ */

(function initTextAnimations() {

  /* ─── Reduced motion: reveal everything instantly ─── */
  if (reducedMotion) {
    document.querySelectorAll(
      '.txt-hero-word, .txt-section-heading, .txt-para, .txt-badge-anim, .txt-para-word'
    ).forEach(el => {
      el.classList.add('txt-in');
      el.style.opacity = '1';
    });
    return;
  }

  /* ─── STEP 1: Split headings into word spans ─── */
  function splitHeadingWords(el, baseClass) {
    if (el.dataset.txtSplit) return; // idempotent
    el.dataset.txtSplit = '1';

    /* Walk only direct text / inline children — skip .typing-text span */
    const nodes = Array.from(el.childNodes);
    el.innerHTML = '';

    nodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const words = node.textContent.split(/(\s+)/);
        words.forEach(chunk => {
          if (!chunk.trim()) {
            el.appendChild(document.createTextNode(chunk));
          } else {
            const wrap = document.createElement('span');
            wrap.className = `txt-word ${baseClass}`;
            wrap.setAttribute('aria-hidden', 'true');
            wrap.textContent = chunk;
            el.appendChild(wrap);
          }
        });
      } else {
        /* Keep element nodes (like <br>, <span class="typing-text">, .gradient-text) */
        el.appendChild(node.cloneNode(true));
      }
    });

    /* Accessible: a hidden aria label holds the full text */
    if (!el.getAttribute('aria-label')) {
      el.setAttribute('aria-label', el.textContent.trim());
    }
  }

  /* ─── STEP 2: Hero h1 — animate on load (no IO) ─── */
  const heroH1 = document.querySelector('.hero-content h1');
  if (heroH1) {
    splitHeadingWords(heroH1, 'txt-hero-word');
    const words = heroH1.querySelectorAll('.txt-hero-word');

    /* Double rAF so layout is computed before transition triggers */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        words.forEach((w, i) => {
          w.style.transitionDelay = `${i * 65}ms`;
          w.classList.add('txt-in');
        });
      });
    });
  }

  /* ─── STEP 3: Section headings — IO triggered, word reveal ─── */
  const sectionHeadingSelectors = [
    '.section-header h2',
    '.listora-advantage-header h2',
    '.timelinepro-heading',
    '.affiliate-content h2',
    '.ecosystem h2',
    '.footer-col h4',
    /* Service page */
    '.svc-hero__headline',
    '.core-card__title',
    '.ops-card__header h3',
    '.why-card h3',
    '.pkg-card__header h3',
    '.timeline-card h3',
    '.alt-block__content h3',
    '.websites-content h2',
  ].join(', ');

  const sectionHeadings = document.querySelectorAll(sectionHeadingSelectors);

  const headingObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const heading = entry.target;
      const words   = heading.querySelectorAll('.txt-section-word');
      words.forEach((w, i) => {
        w.style.transitionDelay = `${i * 55}ms`;
        w.classList.add('txt-in');
      });
      headingObserver.unobserve(heading);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  sectionHeadings.forEach(h => {
    splitHeadingWords(h, 'txt-section-word');
    headingObserver.observe(h);
  });

  /* ─── STEP 4: Paragraphs & card descriptions — IO triggered, word-by-word reveal ─── */
  /* Same split mechanic as headings but uses .txt-para-word class with
     softer easing, smaller stagger (40ms), and shorter translateY (60%)
     so paragraphs feel gentler / more readable than bold headings */

  const paraSelectors = [
    '.section-header > p',
    '.hero-content p',
    '.listora-advantage-header p',
    '.timelinepro-card-desc',
    '.ref-cta-description',
    '.affiliate-content p',
    '.card-desc',
    '.content p',
    '.footer-tagline',
    '.listora-advantage-card p',
    '.card-content p',
    /* Service page */
    '.svc-hero__sub',
    '.core-card__desc',
    '.ops-card > p',
    '.why-card p',
    '.pkg-card__header p',
    '.timeline-card p',
    '.alt-block__content p',
    '.websites-desc',
    '.section-sub',
  ].join(', ');

  const paraEls = document.querySelectorAll(paraSelectors);

  const paraObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el    = entry.target;
      const words = el.querySelectorAll('.txt-para-word');

      /* Stagger: paragraph index adds a base delay so para fires after heading */
      const siblings  = Array.from(el.parentElement.children).filter(
        c => c.matches && c.matches(paraSelectors.split(', ').join(', '))
      );
      const paraIdx   = siblings.indexOf(el);
      const baseDelay = paraIdx >= 0 ? paraIdx * 120 : 0;

      words.forEach((w, i) => {
        w.style.transitionDelay = `${baseDelay + i * 40}ms`;
        w.classList.add('txt-in');
      });

      paraObserver.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

  paraEls.forEach(el => {
    splitHeadingWords(el, 'txt-para-word'); /* reuse same splitter */
    paraObserver.observe(el);
  });

  /* Hero paragraph fires immediately after h1 words */
  const heroPara = document.querySelector('.hero-content p');
  if (heroPara) {
    paraObserver.unobserve(heroPara);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const words = heroPara.querySelectorAll('.txt-para-word');
        words.forEach((w, i) => {
          w.style.transitionDelay = `${520 + i * 40}ms`;
          w.classList.add('txt-in');
        });
      });
    });
  }

  /* ─── STEP 5: Badges / tags — spring pop, SEPARATE observer ─── */
  const badgeSelectors = [
    '.section-tag',
    '.listora-advantage-badge',
    '.timelinepro-badge',
    '.pain-badge',
    '.affiliate-tag',
    /* Service page */
    '.section-label',
    '.svc-hero__label',
    '.service-tag',
    '.pkg-tier',
    '.core-card__badge',
    '.ops-card--featured::before',
    '.tl-tags span',
  ].join(', ');

  const badgeEls = document.querySelectorAll(badgeSelectors);

  const badgeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('txt-badge-in');
      badgeObserver.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -20px 0px' });

  badgeEls.forEach(el => {
    if (!el.classList.contains('txt-badge-anim')) {
      el.classList.add('txt-badge-anim');
    }
    badgeObserver.observe(el);
  });

})();


/* ============================================================
   05. TYPING / WORD-CYCLE ANIMATION
   ============================================================ */

(function initTyping() {
  const el = document.querySelector('.typing-text');
  if (!el) return;

  const words = ['GROWING', 'CONVERTING', 'SCALING', 'WINNING', 'DOMINATING', 'EXPANDING'];
  let index = 0;

  el.style.transition = 'opacity 0.42s cubic-bezier(0.4, 0, 0.2, 1), transform 0.42s cubic-bezier(0.4, 0, 0.2, 1)';
  el.style.display    = 'inline-block';
  el.textContent      = words[0];

  if (reducedMotion) return;

  function cycleWord() {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(-10px)';

    setTimeout(() => {
      index = (index + 1) % words.length;
      el.textContent     = words[index];
      el.style.transform = 'translateY(12px)';
      void el.offsetWidth; /* force reflow */
      el.style.opacity   = '1';
      el.style.transform = 'translateY(0)';
    }, 450);
  }

  setTimeout(() => {
    cycleWord();
    setInterval(cycleWord, 3500);
  }, 2000);
})();


/* ============================================================
   06. SCROLL REVEAL — IntersectionObserver
   ============================================================ */

(function initScrollReveal() {
  if (reducedMotion) {
    document.querySelectorAll(
      '.problem-card, .service-card, .listora-advantage-card, .reveal, .flip-card'
    ).forEach(el => {
      el.classList.add('show', 'listora-card-visible', 'is-visible', 'show-card');
      el.style.opacity   = '1';
      el.style.transform = 'none';
    });
    return;
  }

  /* Generic .reveal elements */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const revealObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const delay = parseInt(entry.target.dataset.delay || '0', 10);
        setTimeout(() => entry.target.classList.add('is-visible'), delay);
        revealObs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
    revealEls.forEach(el => revealObs.observe(el));
  }

  /* Problem cards — staggered by data-index */
  const problemCards = document.querySelectorAll('.problem-card');
  if (problemCards.length) {
    const problemObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const idx   = parseInt(entry.target.dataset.index || '0', 10);
        setTimeout(() => entry.target.classList.add('show'), idx * 110);
        problemObs.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    problemCards.forEach(card => problemObs.observe(card));
  }

  /* Service cards */
  const serviceCards = document.querySelectorAll('.service-card');
  if (serviceCards.length) {
    const serviceObs = new IntersectionObserver(entries => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        setTimeout(() => entry.target.classList.add('show'), i * 80);
        serviceObs.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    serviceCards.forEach(card => serviceObs.observe(card));
  }

  /* Listora advantage cards */
  const advCards = document.querySelectorAll('.listora-advantage-card');
  if (advCards.length) {
    const advObs = new IntersectionObserver(entries => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        setTimeout(() => entry.target.classList.add('listora-card-visible'), i * 120);
        advObs.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    advCards.forEach(card => advObs.observe(card));
  }
})();


/* ============================================================
   07. PROBLEM CARDS — ACCORDION
   ============================================================ */

(function initProblemAccordion() {
  const cards = document.querySelectorAll('.problem-card');
  if (!cards.length) return;

  let openCard = null;

  function openItem(card) {
    const header = card.querySelector('.card-header');
    const panel  = card.querySelector('.pain-panel');
    card.classList.add('is-open');
    if (header) header.setAttribute('aria-expanded', 'true');
    if (panel)  panel.setAttribute('aria-hidden', 'false');
    openCard = card;
  }

  function closeItem(card) {
    const header = card.querySelector('.card-header');
    const panel  = card.querySelector('.pain-panel');
    card.classList.remove('is-open');
    if (header) header.setAttribute('aria-expanded', 'false');
    if (panel)  panel.setAttribute('aria-hidden', 'true');
    if (openCard === card) openCard = null;
  }

  function toggleItem(card) {
    const wasOpen = card.classList.contains('is-open');
    if (openCard && openCard !== card) closeItem(openCard);
    wasOpen ? closeItem(card) : openItem(card);
  }

  cards.forEach(card => {
    const header = card.querySelector('.card-header');
    if (!header) return;
    header.addEventListener('click', () => toggleItem(card));
    header.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleItem(card); }
    });
  });
})();


/* ============================================================
   08. ECOSYSTEM FLIP / ACCORDION CARDS
   ============================================================ */

(function initEcosystemCards() {
  const flipCards = document.querySelectorAll('.flip-card');
  if (!flipCards.length) return;

  /* Inject mobile arrow buttons once */
  flipCards.forEach(card => {
    if (card.querySelector('.flip-card-arrow')) return;
    const front = card.querySelector('.flip-card-front');
    if (!front) return;
    const btn = document.createElement('button');
    btn.className = 'flip-card-arrow';
    btn.setAttribute('aria-label', 'Toggle details');
    btn.innerHTML = '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i>';
    front.appendChild(btn);
  });

  /* Scroll reveal */
  if (!reducedMotion) {
    const revealObs = new IntersectionObserver(entries => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        setTimeout(() => entry.target.classList.add('show-card'), i * 100);
        revealObs.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    flipCards.forEach(card => revealObs.observe(card));
  } else {
    flipCards.forEach(card => card.classList.add('show-card'));
  }

  function handleDesktopClick() {
    const inner = this.querySelector('.flip-card-inner');
    if (!inner) return;
    flipCards.forEach(c => {
      if (c !== this) c.querySelector('.flip-card-inner')?.classList.remove('active');
    });
    inner.classList.toggle('active');
  }

  function handleMobileArrow(e) {
    e.stopPropagation();
    const card   = this.closest('.flip-card');
    const isOpen = card.classList.contains('accordion-open');
    flipCards.forEach(c => c.classList.remove('accordion-open'));
    if (!isOpen) card.classList.add('accordion-open');
  }

  let mobileActive = false;

  function syncBehavior() {
    const shouldBeMobile = isMobile();
    if (shouldBeMobile === mobileActive) return;

    if (shouldBeMobile) {
      flipCards.forEach(c => {
        c.removeEventListener('click', handleDesktopClick);
        c.querySelector('.flip-card-inner')?.classList.remove('active');
        c.querySelector('.flip-card-arrow')?.addEventListener('click', handleMobileArrow);
      });
      mobileActive = true;
    } else {
      flipCards.forEach(c => {
        c.querySelector('.flip-card-arrow')?.removeEventListener('click', handleMobileArrow);
        c.classList.remove('accordion-open');
        c.addEventListener('click', handleDesktopClick);
      });
      mobileActive = false;
    }
  }

  syncBehavior();
  window.addEventListener('resize', debounce(syncBehavior, 150), { passive: true });
})();


/* ============================================================
   09. SERVICE CARD — click anywhere to navigate
   ============================================================ */

(function initServiceCardNav() {
  document.querySelectorAll('.service-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', e => {
      if (e.target.closest('.learn-btn, a')) return;
      const link = card.querySelector('.learn-btn');
      if (link && link.href && !link.href.endsWith('#')) {
        window.location.href = link.href;
      }
    });
  });
})();


/* ============================================================
   10. NEWSLETTER
   ============================================================ */

(function initNewsletter() {
  const subBtn  = document.getElementById('sub-btn');
  const emailEl = document.getElementById('email');
  const msgEl   = document.getElementById('msg');
  if (!subBtn || !emailEl || !msgEl) return;

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function showMsg(text, type) {
    msgEl.textContent = text;
    msgEl.className   = `newsletter-msg${type ? ' ' + type : ''}`;
  }

  function submit() {
    const email = emailEl.value.trim();
    if (!email)               return showMsg('Please enter your email.', 'err');
    if (!EMAIL_RE.test(email)) return showMsg('Enter a valid email address.', 'err');
    showMsg('Subscribing…', '');
    subBtn.disabled = true;
    setTimeout(() => {
      emailEl.value   = '';
      subBtn.disabled = false;
      showMsg("You're subscribed! Welcome 🎉", 'ok');
      setTimeout(() => showMsg('', ''), 4000);
    }, 900);
  }

  subBtn.addEventListener('click', submit);
  emailEl.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
})();


/* ============================================================
   11. TIMELINE PRO
   Scroll-driven sticky timeline (desktop) + auto-advance (mobile)
   ============================================================ */

(function timelinePro() {
  'use strict';

  function svgIcon(paths) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;
  }

  const STEP_DATA = [
    {
      title: 'Discovery',
      desc:  'We audit your brand, market position, and growth opportunities.',
      icon:  svgIcon('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
    },
    {
      title: 'Strategy',
      desc:  'We craft a tailored growth strategy and roadmap for your business.',
      icon:  svgIcon('<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>'),
    },
    {
      title: 'Implementation',
      desc:  'We launch websites, ads, content, and automations to drive results.',
      icon:  svgIcon('<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>'),
    },
    {
      title: 'Optimization',
      desc:  'We monitor performance, test, and refine every part of the system.',
      icon:  svgIcon('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'),
    },
    {
      title: 'Scale & Dominate',
      desc:  'Once the system is proven, we scale traffic, leads, and revenue to maximize long-term growth.',
      icon:  svgIcon('<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>'),
    },
  ];

  const N = STEP_DATA.length;

  const tp = {
    section: null, leftPanel: null, rightPanel: null,
    trackEl: null, trackFill: null,
    cardBody: null, cardIcon: null, cardTitle: null, cardDesc: null,
    stepEls: [], nodeCenters: [],
    trackTop: 0, trackHeight: 0, trackLeft: 0,
    currentStep: -1, rafId: null, needUpdate: false, lastScrollY: -1,
    isOnMobile: false, wrapOffsetTop: 0, scrollPerStep: 0,
    totalScrollRange: 0, mobileTimer: null, mobileStep: 0, _cardTimer: null,
  };

  function init() {
    tp.section    = document.getElementById('timelinepro-root');
    tp.leftPanel  = document.getElementById('timelinepro-left-panel');
    tp.rightPanel = document.getElementById('timelinepro-right-panel');
    tp.trackEl    = document.getElementById('timelinepro-track');
    tp.trackFill  = document.getElementById('timelinepro-track-fill');
    tp.cardBody   = document.querySelector('.timelinepro-card-body');
    tp.cardIcon   = document.getElementById('timelinepro-card-icon');
    tp.cardTitle  = document.getElementById('timelinepro-card-title');
    tp.cardDesc   = document.getElementById('timelinepro-card-desc');
    if (!tp.section) return;

    tp.stepEls    = Array.from(tp.section.querySelectorAll('.timelinepro-step'));
    tp.isOnMobile = isMobile();

    if (tp.isOnMobile) {
      startMobileAuto();
    } else {
      makeScrollWrapper();
      applyCard(0);
      tp.currentStep = 0;
      setTimeout(() => { measure(); tp.needUpdate = true; startRAF(); }, 80);
      window.addEventListener('scroll', () => { tp.needUpdate = true; }, { passive: true });
    }

    window.addEventListener('resize', debounce(onResize, 150), { passive: true });
  }

  function startMobileAuto() {
    tp.mobileStep = 0;
    measure();
    applyCard(0);
    updateSteps(0);
    updateFill(0);

    let started = false;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (started || !entry.isIntersecting) return;
        started = true;
        tp.mobileTimer = setInterval(() => {
          tp.mobileStep++;
          if (tp.mobileStep >= N) {
            clearInterval(tp.mobileTimer);
            tp.mobileTimer = null;
            tp.mobileStep  = N - 1;
          }
          measure();
          updateFill(tp.mobileStep);
          updateSteps(tp.mobileStep);
        }, 2000);
        obs.disconnect();
      });
    }, { threshold: 0.4 });
    obs.observe(tp.section);
  }

  function makeScrollWrapper() {
    if (tp.isOnMobile || tp.section.closest('.timelinepro-scroll-wrapper')) return;
    const wrapper         = document.createElement('div');
    wrapper.className     = 'timelinepro-scroll-wrapper';
    wrapper.style.cssText = 'position:relative;';
    wrapper.style.height  = (window.innerHeight * (N + 1)) + 'px';
    tp.section.parentNode.insertBefore(wrapper, tp.section);
    wrapper.appendChild(tp.section);
    tp.section.style.position = 'sticky';
    tp.section.style.top      = '0';
    tp.section.style.height   = '100vh';
    tp.section.style.overflow = 'hidden';
  }

  function measure() {
    if (!tp.stepEls.length || !tp.rightPanel) return;
    const nodeWraps = tp.stepEls.map(s => s.querySelector('.timelinepro-node-wrap'));
    if (!nodeWraps[0]) return;

    const scrollY = window.scrollY;
    const absCenters = nodeWraps.map(nw => {
      const r = nw.getBoundingClientRect();
      return scrollY + r.top + r.height / 2;
    });

    const firstAbs = absCenters[0];
    const lastAbs  = absCenters[absCenters.length - 1];
    tp.nodeCenters = absCenters.map(c => c - firstAbs);
    tp.trackHeight = lastAbs - firstAbs;

    const rightRect        = tp.rightPanel.getBoundingClientRect();
    const rightPanelAbsTop = scrollY + rightRect.top;
    tp.trackTop  = firstAbs - rightPanelAbsTop;
    tp.trackLeft = nodeWraps[0].getBoundingClientRect().left
                 + nodeWraps[0].getBoundingClientRect().width / 2
                 - rightRect.left - 1;

    tp.trackEl.style.cssText = `top:${tp.trackTop}px; height:${tp.trackHeight}px; bottom:unset; left:${tp.trackLeft}px; width:2px;`;

    const wrapper = tp.section.closest('.timelinepro-scroll-wrapper');
    if (wrapper) {
      tp.wrapOffsetTop    = wrapper.getBoundingClientRect().top + scrollY;
      tp.totalScrollRange = wrapper.offsetHeight - window.innerHeight;
      tp.scrollPerStep    = tp.totalScrollRange / N;
    }
  }

  function onResize() {
    const wasMobile = tp.isOnMobile;
    tp.isOnMobile   = isMobile();

    if (wasMobile !== tp.isOnMobile) {
      if (tp.mobileTimer) { clearInterval(tp.mobileTimer); tp.mobileTimer = null; }
      if (tp.rafId) { cancelAnimationFrame(tp.rafId); tp.rafId = null; }

      if (tp.isOnMobile) {
        const wrapper = tp.section.closest('.timelinepro-scroll-wrapper');
        if (wrapper) {
          wrapper.parentNode.insertBefore(tp.section, wrapper);
          wrapper.remove();
          Object.assign(tp.section.style, { position: '', top: '', height: '', overflow: '' });
        }
        startMobileAuto();
      } else {
        makeScrollWrapper();
        applyCard(0);
        tp.currentStep = 0;
        setTimeout(() => { measure(); tp.needUpdate = true; startRAF(); }, 80);
      }
      return;
    }

    if (!tp.isOnMobile) {
      const wrapper = tp.section.closest('.timelinepro-scroll-wrapper');
      if (wrapper) wrapper.style.height = (window.innerHeight * (N + 1)) + 'px';
    }
    measure();
    tp.needUpdate = true;
  }

  function startRAF() {
    function tick() {
      tp.rafId = requestAnimationFrame(tick);
      if (!tp.isOnMobile && (tp.needUpdate || window.scrollY !== tp.lastScrollY)) {
        tp.lastScrollY = window.scrollY;
        tp.needUpdate  = false;
        updateDesktop();
      }
    }
    tick();
  }

  function updateDesktop() {
    if (tp.isOnMobile || tp.scrollPerStep <= 0) return;
    const scrolledIn = Math.max(0, window.scrollY - tp.wrapOffsetTop);
    const rawStep    = scrolledIn / tp.scrollPerStep;
    const active     = Math.min(Math.round(rawStep), N - 1);
    updateFill(Math.min(rawStep, N - 1));
    updateSteps(active);
  }

  function updateFill(fillRaw) {
    if (tp.trackHeight <= 0 || tp.nodeCenters.length < 2) return;
    let fillPx;
    if (fillRaw <= 0)         fillPx = 0;
    else if (fillRaw >= N - 1) fillPx = tp.nodeCenters[N - 1];
    else {
      const seg  = Math.floor(fillRaw);
      const frac = fillRaw - seg;
      fillPx = tp.nodeCenters[seg] + (tp.nodeCenters[seg + 1] - tp.nodeCenters[seg]) * frac;
    }
    tp.trackFill.style.height = ((fillPx / tp.trackHeight) * 100) + '%';
  }

  function updateSteps(active) {
    tp.stepEls.forEach((el, i) => {
      el.classList.remove('timelinepro-active', 'timelinepro-completed');
      if      (i < active)  el.classList.add('timelinepro-completed');
      else if (i === active) el.classList.add('timelinepro-active');
    });
    if (active !== tp.currentStep) {
      switchCard(active);
      tp.currentStep = active;
    }
  }

  function switchCard(idx) {
    if (!tp.cardBody) return;
    tp.cardBody.classList.add('timelinepro-fade-out');
    clearTimeout(tp._cardTimer);
    tp._cardTimer = setTimeout(() => {
      applyCard(idx);
      tp.cardBody.classList.remove('timelinepro-fade-out');
    }, 240);
  }

  function applyCard(idx) {
    const d = STEP_DATA[idx];
    if (!d) return;
    if (tp.cardTitle) tp.cardTitle.textContent = d.title;
    if (tp.cardDesc)  tp.cardDesc.textContent  = d.desc;
    if (tp.cardIcon)  tp.cardIcon.innerHTML    = d.icon;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      if (!tp.isOnMobile) { measure(); tp.needUpdate = true; }
    }, 300);
  });

  /* ── Mobile pause/resume hooks exposed for external use ── */
  window.__tpMobileTimerKill = function () {
    if (tp.mobileTimer) {
      clearInterval(tp.mobileTimer);
      tp.mobileTimer = null;
    }
  };

  window.__tpMobileRestart = function (fromStep) {
    if (!tp.isOnMobile) return;
    if (tp.mobileTimer) { clearInterval(tp.mobileTimer); tp.mobileTimer = null; }
    tp.mobileStep = (fromStep !== undefined) ? fromStep : tp.currentStep;
    tp.mobileTimer = setInterval(() => {
      tp.mobileStep++;
      if (tp.mobileStep >= N) {
        clearInterval(tp.mobileTimer);
        tp.mobileTimer = null;
        tp.mobileStep  = N - 1;
        return;
      }
      measure();
      updateFill(tp.mobileStep);
      updateSteps(tp.mobileStep);
    }, 2000);
  };

})();


/* ============================================================
   12. PREMIUM MICRO-INTERACTIONS  v2.0
   ─────────────────────────────────────────────────────────────
   • Smooth lerp-interpolated 3D tilt on service + advantage cards
   • will-change cleanup after flip-card entrance
   ============================================================ */

(function initPremiumReveal() {
  'use strict';

  if (reducedMotion) return;

  const isDesktop = () => window.innerWidth > 900;

  /* ── Smooth lerp tilt — runs on requestAnimationFrame ── */
  function attachTilt(card, maxDeg) {
    if (!maxDeg) maxDeg = 3;

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let rafId = null;
    let isHovered = false;

    function lerp(a, b, t) { return a + (b - a) * t; }

    function tick() {
      currentX = lerp(currentX, targetX, 0.08);
      currentY = lerp(currentY, targetY, 0.08);

      const dx = Math.abs(currentX - targetX);
      const dy = Math.abs(currentY - targetY);

      card.style.transform = isHovered
        ? `translateY(-12px) perspective(900px) rotateX(${currentX}deg) rotateY(${currentY}deg)`
        : `translateY(${currentX === 0 && currentY === 0 ? '0' : (-12 * (1 - Math.max(dx,dy)/maxDeg)).toFixed(2)}px) perspective(900px) rotateX(${currentX}deg) rotateY(${currentY}deg)`;

      if (dx > 0.005 || dy > 0.005) {
        rafId = requestAnimationFrame(tick);
      } else {
        if (!isHovered) {
          card.style.transform = '';
          card.style.willChange = 'auto';
        }
        rafId = null;
      }
    }

    card.addEventListener('mousemove', function(e) {
      if (!isDesktop()) return;
      const r  = card.getBoundingClientRect();
      const x  = (e.clientX - r.left) / r.width  - 0.5;  /* -0.5 → 0.5 */
      const y  = (e.clientY - r.top)  / r.height - 0.5;
      targetX  = -y * maxDeg * 2;   /* tilt X (pitch) */
      targetY  =  x * maxDeg * 2;   /* tilt Y (yaw)   */
      if (!rafId) rafId = requestAnimationFrame(tick);
    }, { passive: true });

    card.addEventListener('mouseenter', function() {
      if (!isDesktop()) return;
      isHovered = true;
      card.style.willChange = 'transform';
    }, { passive: true });

    card.addEventListener('mouseleave', function() {
      isHovered = false;
      targetX   = 0;
      targetY   = 0;
      if (!rafId) rafId = requestAnimationFrame(tick);
    }, { passive: true });
  }

  /* Apply tilt to cards */
  document.querySelectorAll('.service-card').forEach(c => attachTilt(c, 3));
  document.querySelectorAll('.listora-advantage-card').forEach(c => attachTilt(c, 2.5));

  /* ── will-change cleanup after flip-card entrance ── */
  document.querySelectorAll('.flip-card').forEach(function(card) {
    if (card.classList.contains('show-card')) {
      card.style.willChange = 'auto';
      return;
    }
    const obs = new MutationObserver(function() {
      if (card.classList.contains('show-card')) {
        setTimeout(function() { card.style.willChange = 'auto'; }, 900);
        obs.disconnect();
      }
    });
    obs.observe(card, { attributes: true, attributeFilter: ['class'] });
  });

})();


/* ============================================================
   13. TIMELINE — MOBILE MANUAL NODE SELECTION
   ─────────────────────────────────────────────────────────────
   SCOPE: Mobile only (≤768px). Desktop completely untouched.

   HOOKS used (exposed by timelinePro above):
     window.__tpMobileTimerKill()        — pause autoplay
     window.__tpMobileRestart(fromStep)  — resume from step N

   FLOW:
   Tap node → kill timer → switch card + highlight → schedule resume
   Resume after RESUME_DELAY ms of no new taps
   ============================================================ */

(function initMobileTimelineNodes() {
  'use strict';

  const RESUME_DELAY = 12000; /* 12 s inactivity */

  window.addEventListener('load', function () {

    var section = document.getElementById('timelinepro-root');
    if (!section) return;

    var steps        = Array.from(section.querySelectorAll('.timelinepro-step'));
    var N            = steps.length;
    var resumeTimer  = null;
    var isManualMode = false;

    if (!steps.length) return;

    /* ── Widen tap targets on mobile ── */
    function enhanceTapTargets() {
      if (window.innerWidth > 768) return;
      steps.forEach(function (stepEl) {
        var nw = stepEl.querySelector('.timelinepro-node-wrap');
        if (nw && !nw.dataset.tpEnhanced) {
          nw.dataset.tpEnhanced = '1';
          nw.setAttribute('role', 'button');
          nw.setAttribute('tabindex', '0');
          var idx = parseInt(stepEl.dataset.step || '0', 10);
          nw.setAttribute('aria-label', 'View step ' + (idx + 1));
        }
      });
    }

    /* ── Switch to a step (reuses existing tp internals via hooks) ── */
    function goToStep(idx) {
      /* Kill existing autoplay */
      if (typeof window.__tpMobileTimerKill === 'function') {
        window.__tpMobileTimerKill();
      }

      /* Activate step — tp's updateSteps + switchCard run normally */
      /* We call them by dispatching on the section element so
         timelinePro's existing code handles the card animation */
      section.dispatchEvent(new CustomEvent('tp:goToStep', { detail: { idx: idx } }));

      /* Visual indicator */
      steps.forEach(function (s) { s.classList.remove('tp-manual-active'); });
      steps[idx] && steps[idx].classList.add('tp-manual-active');

      isManualMode = true;
    }

    /* ── Schedule auto-resume ── */
    function scheduleResume(fromStep) {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function () {
        steps.forEach(function (s) { s.classList.remove('tp-manual-active'); });
        isManualMode = false;
        if (typeof window.__tpMobileRestart === 'function') {
          window.__tpMobileRestart(fromStep);
        }
      }, RESUME_DELAY);
    }

    /* ── Attach tap listeners ── */
    function attachListeners() {
      enhanceTapTargets();
      steps.forEach(function (stepEl) {
        var nw  = stepEl.querySelector('.timelinepro-node-wrap');
        var cnt = stepEl.querySelector('.timelinepro-step-content');

        [nw, cnt].forEach(function (target) {
          if (!target) return;
          target.addEventListener('click', function () {
            if (window.innerWidth > 768) return; /* desktop guard */
            var idx = parseInt(stepEl.dataset.step || '0', 10);
            goToStep(idx);
            scheduleResume(idx);
          });
          if (target === nw) {
            target.addEventListener('keydown', function (e) {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                target.click();
              }
            });
          }
        });
      });
    }

    /* Wait for timelinePro to finish initialising */
    setTimeout(attachListeners, 600);

    /* Re-enhance on resize to mobile */
    window.addEventListener('resize', debounce(function () {
      if (window.innerWidth <= 768) enhanceTapTargets();
      else {
        /* Went to desktop — clear manual state */
        clearTimeout(resumeTimer);
        steps.forEach(function (s) { s.classList.remove('tp-manual-active'); });
        isManualMode = false;
      }
    }, 200), { passive: true });

  });

  /* ── Handle tp:goToStep inside timelinePro's scope ── */
  /* We do this by appending a listener that calls the exposed hooks */
  document.addEventListener('DOMContentLoaded', function () {
    var section = document.getElementById('timelinepro-root');
    if (!section) return;

    section.addEventListener('tp:goToStep', function (e) {
      var idx = e.detail.idx;
      /* The actual card switch is done via the public hooks.
         updateSteps and switchCard are internal — we trigger them
         by calling __tpMobileRestart then immediately killing it
         after one step, or we let the node's active class do the UI
         and call applyCard via a lightweight reimplementation. */
      if (typeof window.__tpMobileTimerKill === 'function') {
        window.__tpMobileTimerKill();
      }
      /* Trigger card content update via a minimal reimpl */
      var cardBody  = document.querySelector('.timelinepro-card-body');
      var cardTitle = document.getElementById('timelinepro-card-title');
      var cardDesc  = document.getElementById('timelinepro-card-desc');
      var fill      = document.getElementById('timelinepro-track-fill');
      var steps     = Array.from(section.querySelectorAll('.timelinepro-step'));
      var N         = steps.length;

      var CONTENT = [
        { title: 'Discovery',        desc: 'We audit your brand, market position, and growth opportunities.' },
        { title: 'Strategy',         desc: 'We craft a tailored growth strategy and roadmap for your business.' },
        { title: 'Implementation',   desc: 'We launch websites, ads, content, and automations to drive results.' },
        { title: 'Optimization',     desc: 'We monitor performance, test, and refine every part of the system.' },
        { title: 'Scale & Dominate', desc: 'Once the system is proven, we scale traffic, leads, and revenue to maximize long-term growth.' },
      ];

      /* Update step classes */
      steps.forEach(function (el, i) {
        el.classList.remove('timelinepro-active', 'timelinepro-completed');
        if      (i < idx)  el.classList.add('timelinepro-completed');
        else if (i === idx) el.classList.add('timelinepro-active');
      });

      /* Update fill bar */
      if (fill && N > 1) {
        fill.style.height = ((idx / (N - 1)) * 100) + '%';
      }

      /* Fade card content */
      if (cardBody) {
        cardBody.classList.add('timelinepro-fade-out');
        setTimeout(function () {
          var d = CONTENT[idx];
          if (d) {
            if (cardTitle) cardTitle.textContent = d.title;
            if (cardDesc)  cardDesc.textContent  = d.desc;
          }
          cardBody.classList.remove('timelinepro-fade-out');
        }, 240);
      }
    });
  });

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
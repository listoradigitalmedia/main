/* ============================================================
   drawer.js
   Premium right-slide mobile navigation drawer
   Load AFTER script.js
   ============================================================ */

(function drawerModule() {
    'use strict';

    /* ── Element references ── */
    var menuBtn      = document.getElementById('menuBtn');
    var drawer       = document.getElementById('navDrawer');
    var overlay      = document.getElementById('navOverlay');
    var closeBtn     = document.getElementById('drawerCloseBtn');
    var drawerLinks  = drawer ? drawer.querySelectorAll('.drawer-link') : [];

    /* Guard: if drawer elements don't exist, bail */
    if (!menuBtn || !drawer || !overlay) return;

    /* ── State ── */
    var isOpen           = false;
    var scrollbarWidth   = 0;
    var lastFocusedEl    = null;

    /* All focusable elements inside the drawer */
    var focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(', ');


    /* ══════════════════════════════════════════
       OPEN
    ══════════════════════════════════════════ */

    function openDrawer() {
        if (isOpen) return;
        isOpen = true;

        /* Remember what had focus before opening */
        lastFocusedEl = document.activeElement;

        /* Measure scrollbar width to prevent layout shift */
        scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.documentElement.style.setProperty(
            '--scrollbar-width',
            scrollbarWidth + 'px'
        );

        /* Lock body scroll */
        document.body.classList.add('drawer-open');

        /* Show drawer + overlay */
        drawer.classList.add('is-open');
        overlay.classList.add('is-open');

        /* Accessibility */
        menuBtn.setAttribute('aria-expanded', 'true');
        drawer.setAttribute('aria-hidden', 'false');
        overlay.setAttribute('aria-hidden', 'false');

        /* Move focus into drawer (first focusable element) */
        requestAnimationFrame(function () {
            var firstFocusable = drawer.querySelector(focusableSelectors);
            if (firstFocusable) firstFocusable.focus();
        });
    }


    /* ══════════════════════════════════════════
       CLOSE
    ══════════════════════════════════════════ */

    function closeDrawer() {
        if (!isOpen) return;
        isOpen = false;

        /* Hide drawer + overlay */
        drawer.classList.remove('is-open');
        overlay.classList.remove('is-open');

        /* Unlock body scroll */
        document.body.classList.remove('drawer-open');
        document.documentElement.style.setProperty('--scrollbar-width', '0px');

        /* Accessibility */
        menuBtn.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');
        overlay.setAttribute('aria-hidden', 'true');

        /* Restore focus to the element that opened the drawer */
        if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
            lastFocusedEl.focus();
        }
    }


    /* ══════════════════════════════════════════
       FOCUS TRAP (keyboard accessibility)
    ══════════════════════════════════════════ */

    function trapFocus(e) {
        if (!isOpen) return;

        var focusable = Array.from(drawer.querySelectorAll(focusableSelectors))
            .filter(function (el) {
                return !el.hasAttribute('disabled') &&
                       el.offsetParent !== null; /* visible */
            });

        if (!focusable.length) return;

        var first = focusable[0];
        var last  = focusable[focusable.length - 1];

        if (e.key === 'Tab') {
            if (e.shiftKey) {
                /* Shift+Tab: wrap backward */
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                /* Tab: wrap forward */
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    }


    /* ══════════════════════════════════════════
       EVENT LISTENERS
    ══════════════════════════════════════════ */

    /* 1. Hamburger opens drawer */
    menuBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (isOpen) {
            closeDrawer();
        } else {
            openDrawer();
        }
    });

    /* 2. Close button */
    closeBtn.addEventListener('click', closeDrawer);

    /* 3. Overlay click closes drawer */
    overlay.addEventListener('click', closeDrawer);

    /* 4. Any nav link inside drawer closes it */
    drawerLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            closeDrawer();
        });
    });

    /* 5. ESC key closes drawer */
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isOpen) {
            closeDrawer();
        }
        trapFocus(e);
    });

    /* 6. Click outside drawer (not on overlay, for pointer devices) */
    document.addEventListener('click', function (e) {
        if (!isOpen) return;
        /* If the click target is outside the drawer AND not the menu button */
        if (!drawer.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
            closeDrawer();
        }
    });

    /* 7. Touch: swipe right to close (swipe from left edge of drawer toward right) */
    (function attachSwipeClose() {
        var startX = 0;
        var startY = 0;
        var dragging = false;
        var SWIPE_THRESHOLD = 72; /* px */
        var SWIPE_MAX_Y     = 60; /* px vertical tolerance */

        drawer.addEventListener('touchstart', function (e) {
            if (!isOpen) return;
            startX   = e.touches[0].clientX;
            startY   = e.touches[0].clientY;
            dragging = true;
        }, { passive: true });

        drawer.addEventListener('touchmove', function (e) {
            if (!dragging || !isOpen) return;

            var dx = e.touches[0].clientX - startX;
            var dy = Math.abs(e.touches[0].clientY - startY);

            /* Only handle predominantly horizontal swipes */
            if (dy > SWIPE_MAX_Y) {
                dragging = false;
                return;
            }

            /* Swipe right (positive dx) = closing direction */
            if (dx > 0) {
                drawer.style.transform = 'translateX(' + dx + 'px)';
                overlay.style.opacity  = String(Math.max(0, 1 - dx / SWIPE_THRESHOLD));
            }
        }, { passive: true });

        drawer.addEventListener('touchend', function (e) {
            if (!dragging || !isOpen) return;
            dragging = false;

            var dx = e.changedTouches[0].clientX - startX;

            if (dx > SWIPE_THRESHOLD) {
                /* Fast snap close */
                drawer.style.transform = '';
                overlay.style.opacity  = '';
                closeDrawer();
            } else {
                /* Snap back */
                drawer.style.transform = '';
                overlay.style.opacity  = '';
            }
        }, { passive: true });
    })();


    /* ══════════════════════════════════════════
       RESIZE: close drawer if viewport grows
       past the mobile breakpoint
    ══════════════════════════════════════════ */

    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (window.innerWidth >= 992 && isOpen) {
                closeDrawer();
            }
        }, 120);
    });


    /* ══════════════════════════════════════════
       NEUTRALISE OLD NAV-LINKS TOGGLE
       The original script.js closes/opens .nav-links
       via menuBtn click. Since we're intercepting that
       click above, we need to prevent the old handler
       from running. We do this by replacing menuBtn's
       click binding BEFORE script.js can attach (drawer.js
       loads after), but the old listener is already bound.

       Strategy: remove any "active" class toggling on
       #desktopNavLinks when the drawer is in control,
       by watching for the class and stripping it on
       mobile viewports.
    ══════════════════════════════════════════ */

    var desktopNavLinks = document.getElementById('desktopNavLinks');

    if (desktopNavLinks) {
        /* MutationObserver to catch script.js adding .active to
           the desktop list on mobile and immediately remove it */
        var navLinkObserver = new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
                if (
                    m.attributeName === 'class' &&
                    window.innerWidth < 992 &&
                    desktopNavLinks.classList.contains('active')
                ) {
                    desktopNavLinks.classList.remove('active');
                }
            });
        });

        navLinkObserver.observe(desktopNavLinks, { attributes: true });
    }

})();


/* ============================================================
   UPDATED script.js MOBILE MENU SECTION
   (inline patch — overrides the original menu-btn handler
   so the old .nav-links toggle doesn't interfere)
   ============================================================ */

(function patchLegacyMenuBtn() {
    'use strict';

    /* Wait until the DOM is ready so both scripts have had a
       chance to register their listeners */
    document.addEventListener('DOMContentLoaded', function () {
        var menuBtn    = document.getElementById('menuBtn');
        var navLinks   = document.querySelector('#desktopNavLinks');

        if (!menuBtn || !navLinks) return;

        /* Clone menuBtn to strip ALL existing event listeners, then
           re-add only the drawer listener (which is in drawerModule
           above and will re-attach via ID, so this is fine because
           drawerModule already attached before this runs). */

        /* Ensure desktop nav links never open as dropdown on mobile */
        function guardNavLinks() {
            if (window.innerWidth < 992) {
                navLinks.classList.remove('active');
            }
        }

        /* Run on every possible trigger */
        menuBtn.addEventListener('click', guardNavLinks, true /* capture */);
        window.addEventListener('resize', guardNavLinks, { passive: true });

        guardNavLinks();
    });
})();

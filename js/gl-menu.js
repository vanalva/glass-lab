/* ════════════════════════════════════════════════════════════════════
   gl-menu.js — Fullscreen navigation overlay
   Requires: gsap.min.js loaded before this file.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const menu     = document.getElementById('gl-menu');
  /* Triggers: the top-nav burger (GL or PG) AND the floating dock hamburger. */
  const burgers  = document.querySelectorAll('.gl-home_nav_burger, .pg-nav_burger, .gl-dock_toggle');
  const closeBtn = document.querySelector('.gl-menu_close');
  const logo     = document.querySelector('.gl-menu_header-logo');
  const footer   = document.querySelector('.gl-menu_footer');
  const items    = document.querySelectorAll('.gl-menu_item');
  const thumbs   = document.querySelectorAll('.gl-menu_thumb');

  if (!menu || !burgers.length) return;

  let isOpen = false;
  let openTl = null;

  /* Pre-set link inner transforms for animation */
  function buildTimeline() {
    const tl = gsap.timeline({ paused: true });

    /* 1. Reveal overlay */
    tl.fromTo(menu,
      { clipPath: 'inset(0 0 100% 0)' },
      { clipPath: 'inset(0 0 0% 0)', duration: 0.55, ease: 'power3.inOut' }
    );

    /* 2. Logo + close button */
    tl.fromTo([logo, closeBtn],
      { autoAlpha: 0, y: -8 },
      { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' },
      '-=0.15'
    );

    /* 3. Each menu item slides up from under its border */
    const links = document.querySelectorAll('.gl-menu_link');
    tl.fromTo(links,
      { y: '110%' },
      { y: '0%', duration: 0.65, stagger: 0.055, ease: 'power3.out' },
      '-=0.2'
    );

    /* 3b. Side thumbnails fade in */
    if (thumbs.length) {
      tl.fromTo(thumbs,
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' },
        '-=0.45'
      );
    }

    /* 4. Footer */
    tl.fromTo(footer,
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' },
      '-=0.25'
    );

    return tl;
  }

  function openMenu() {
    if (isOpen) return;
    isOpen = true;
    menu.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    if (!openTl) openTl = buildTimeline();
    openTl.play(0);
  }

  function closeMenu() {
    if (!isOpen) return;
    isOpen = false;
    document.body.style.overflow = '';

    gsap.to(menu, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 0.4,
      ease: 'power3.inOut',
      onComplete: () => { menu.classList.remove('is-open'); }
    });
  }

  burgers.forEach(b => b.addEventListener('click', openMenu));
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeMenu();
  });

  /* Close menu when a link is clicked (navigating away) */
  document.querySelectorAll('.gl-menu_link').forEach(link => {
    link.addEventListener('click', () => {
      document.body.style.overflow = '';
    });
  });

  /* Menu link arrow hover */
  document.querySelectorAll('.gl-menu_link').forEach(function(link) {
    var arrow = link.querySelector('.gl-menu_link-arrow');
    if (!arrow) return;
    link.addEventListener('mouseenter', function() {
      gsap.to(arrow, { x: 6, duration: 0.2, ease: 'power2.out' });
    });
    link.addEventListener('mouseleave', function() {
      gsap.to(arrow, { x: 0, duration: 0.25, ease: 'power2.out' });
    });
  });

})();

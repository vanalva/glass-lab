/* ════════════════════════════════════════════════════════════════════
   pg-sistemas-animations.js — GSAP scroll animations for the Pernia
   Sistemas landing page. Shares the Mobiliario motion vocabulary: a
   reveal() helper (pre-hide + scroll fade/slide), a 3D word-flip hero,
   parallax on feature media, plus a batch reveal for the filterable
   family grid and the anodized profile swatches. Respects reduced-motion.
   Requires: gsap.min.js + ScrollTrigger.min.js loaded before this.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out', duration: 0.75 });

  function splitWords(el) {
    if (!el) return [];
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words
      .map(function (w) {
        return '<span class="gsap-word" style="display:inline-block;overflow:hidden;vertical-align:top"><span class="gsap-word-inner" style="display:inline-block">' + w + '</span></span>';
      })
      .join(' ');
    return Array.prototype.slice.call(el.querySelectorAll('.gsap-word-inner'));
  }

  function reveal(targets, trigger, opts) {
    opts = opts || {};
    var els;
    if (typeof targets === 'string') els = gsap.utils.toArray(targets);
    else if (!targets) els = [];
    else if (targets.length != null) els = Array.prototype.slice.call(targets);
    else els = [targets];
    els = els.filter(Boolean);
    if (!els.length) return;
    gsap.set(els, {
      autoAlpha: 0,
      y: (opts.y != null ? opts.y : 28),
      x: (opts.x || 0),
      scale: (opts.fromScale != null ? opts.fromScale : 1)
    });
    gsap.to(els, {
      autoAlpha: 1, y: 0, x: 0, scale: 1,
      duration: opts.duration || 0.7,
      stagger: opts.stagger || 0,
      delay: opts.delay || 0,
      ease: opts.ease || 'power3.out',
      scrollTrigger: {
        trigger: trigger || els[0],
        start: opts.start || 'top 82%',
        toggleActions: 'play none none none'
      }
    });
  }

  var started = false;
  function startPageAnimations() {
    if (started) return;
    started = true;
    var mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', function () {
      runAnimations();
      return function () { ScrollTrigger.getAll().forEach(function (t) { t.kill(); }); };
    });
    mm.add('(prefers-reduced-motion: reduce)', function () {
      document.documentElement.classList.remove('gl-js');
    });
  }
  setTimeout(startPageAnimations, (window.GL_PAGE_OVERLAY && window.GL_PAGE_OVERLAY.entranceDelay) || 180);
  window.addEventListener('gl:preloader-exiting', startPageAnimations, { once: true });

  function runAnimations() {

    var GL_HEAVY_OK = !window.matchMedia('(max-width: 991px)').matches
      && !window.matchMedia('(hover: none)').matches
      && !window.matchMedia('(pointer: coarse)').matches;

    /* ── HERO — centered text + sliding-glass panel field ─────────── */
    var nav     = document.querySelector('.pg-nav-edge');
    var heading = document.querySelector('.gl-lab_hero_heading');
    var sub     = document.querySelector('.gl-lab_hero_sub');
    var eyebrow = document.querySelector('.gl-lab_hero_content .gl-section-number');

    if (nav) gsap.set(nav, { y: -18 });
    if (sub) gsap.set(sub, { y: 14 });
    if (eyebrow) gsap.set(eyebrow, { autoAlpha: 0, y: 12 });

    var headingWords = heading ? splitWords(heading) : [];
    if (headingWords.length) {
      gsap.set(heading, { opacity: 1 });
      if (heading.parentElement) gsap.set(heading.parentElement, { perspective: 1200 });
      gsap.set(headingWords, { y: 40, autoAlpha: 0, rotationX: 45, transformOrigin: '0% 50% -30px' });
    }

    /* Panels slide in from alternating sides and assemble the fluted field. */
    var panels = gsap.utils.toArray('.pg-sis_hero_panel');
    var panelOpacity = [0.9, 0.68, 0.84, 0.62, 0.86, 0.72, 0.8];
    if (panels.length) {
      panels.forEach(function (p, i) {
        gsap.set(p, { xPercent: (i % 2 === 0 ? -120 : 120), autoAlpha: 0 });
      });
    }

    var tl = gsap.timeline();
    if (nav) tl.to(nav, { opacity: 1, y: 0, duration: 0.65 });
    if (panels.length) {
      tl.to(panels, {
        xPercent: 0,
        autoAlpha: function (i) { return panelOpacity[i % panelOpacity.length]; },
        duration: 1.05, stagger: 0.06, ease: 'power3.out'
      }, 0);
    }
    if (eyebrow) tl.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.45);
    if (headingWords.length) {
      tl.to(headingWords, { y: 0, autoAlpha: 1, rotationX: 0, duration: 0.6, stagger: 0.05, ease: 'power3.out' }, 0.55);
    }
    if (sub) tl.to(sub, { opacity: 1, y: 0, duration: 0.6 }, '-=0.25');

    /* Idle sway + pointer parallax + scroll drift (desktop only). */
    if (panels.length && GL_HEAVY_OK) {
      panels.forEach(function (p, i) {
        gsap.to(p, {
          xPercent: (i % 2 ? 1.8 : -1.8),
          duration: 3.8 + i * 0.35, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.3
        });
        gsap.to(p, {
          yPercent: -(4 + i * 2), ease: 'none',
          scrollTrigger: { trigger: '.pg-sis_hero', start: 'top top', end: 'bottom top', scrub: 1.2 }
        });
      });
      var sHero = document.querySelector('.pg-sis_hero');
      if (sHero) {
        sHero.addEventListener('pointermove', function (e) {
          var r = sHero.getBoundingClientRect();
          var rx = (e.clientX - r.left) / r.width - 0.5;
          panels.forEach(function (p, i) {
            gsap.to(p, { x: rx * (10 + i * 5), duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
          });
        });
      }
    }

    /* Buscador section fades up as a whole. */
    reveal(document.querySelector('.pg-index_find'), '.pg-index_find', { y: 30, duration: 0.8, start: 'top 90%' });

    /* ── MANIFESTO — word-by-word reveal ──────────────────────────── */
    var manifesto = document.querySelector('.pg-mob_manifesto');
    if (manifesto) {
      reveal(manifesto.querySelector('.gl-section-number'), manifesto, { start: 'top 85%' });
      var body = manifesto.querySelector('.pg-mob_manifesto_body');
      var words = body ? splitWords(body) : [];
      if (words.length) {
        gsap.set(body, { autoAlpha: 1, y: 0 });
        gsap.set(words, { y: 30, autoAlpha: 0 });
        gsap.to(words, {
          y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.025, ease: 'power3.out',
          scrollTrigger: { trigger: manifesto, start: 'top 78%', toggleActions: 'play none none none' }
        });
      }
      reveal(manifesto.querySelector('.pg-mob_manifesto_cta'), manifesto, { y: 24, delay: 0.15, start: 'top 72%' });
    }

    /* ── FAMILY GRID — header, filter pills, batch card reveal ────── */
    var pageTitle = document.querySelector('.pg-page-header_title');
    if (pageTitle) {
      var titleWords = splitWords(pageTitle);
      gsap.set(pageTitle, { opacity: 1 });
      gsap.set(titleWords, { y: 30, autoAlpha: 0 });
      gsap.to(titleWords, {
        y: 0, autoAlpha: 1, duration: 0.55, stagger: 0.05, ease: 'power3.out',
        scrollTrigger: { trigger: '.pg-page-header', start: 'top 82%', toggleActions: 'play none none none' }
      });
    }
    reveal(document.querySelector('.pg-page-header_desc'), '.pg-page-header', { y: 18, delay: 0.1, start: 'top 80%' });
    reveal(document.querySelectorAll('.pg-filter-bar .gl-filter-input'), '.pg-filter-bar', {
      x: -10, y: 0, stagger: 0.05, duration: 0.4, start: 'top 88%'
    });

    var cards = gsap.utils.toArray('.pg-sistemas_card');
    if (cards.length) {
      gsap.set(cards, { autoAlpha: 0, y: 24 });
      ScrollTrigger.batch('.pg-sistemas_card', {
        start: 'top 90%',
        onEnter: function (els) {
          gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out', overwrite: true });
        },
        once: true
      });
    }

    /* ── FEATURE SPOTLIGHTS — alternating slide-in + media parallax ─ */
    document.querySelectorAll('.pg-mob_feature').forEach(function (sec) {
      var media = sec.querySelector('.pg-mob_feature_media');
      var text  = sec.querySelector('.pg-mob_feature_text');
      var fromLeft = !sec.classList.contains('is-reverse');

      if (media) {
        gsap.set(media, { autoAlpha: 0, x: fromLeft ? -40 : 40 });
        gsap.to(media, {
          autoAlpha: 1, x: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: sec, start: 'top 80%', toggleActions: 'play none none none' }
        });
        var inner = media.querySelector('.pg-mob_feature_img');
        if (inner && GL_HEAVY_OK) {
          gsap.fromTo(inner, { y: -16 }, {
            y: 16, ease: 'none',
            scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 1.2 }
          });
        }
      }
      if (text) {
        reveal(text.querySelector('.gl-section-number'), sec, { start: 'top 82%' });
        reveal(text.querySelector('.pg-mob_feature_title'), sec, { y: 24, delay: 0.05, start: 'top 80%' });
        reveal(text.querySelector('.pg-mob_feature_body'), sec, { y: 24, delay: 0.1, start: 'top 78%' });
        reveal(text.querySelectorAll('.gl-spec-row'), sec, { y: 16, stagger: 0.06, duration: 0.5, delay: 0.15, start: 'top 76%' });
        reveal(text.querySelector('.pg-mob_feature_link'), sec, { y: 16, delay: 0.2, start: 'top 74%' });
      }
    });

    /* ── PROFILE COLORS — heading + swatch stagger ────────────────── */
    var colors = document.querySelector('.pg-sistema_colors');
    if (colors) {
      reveal(colors.querySelector('.gl-section-number'), colors, { start: 'top 85%' });
      reveal(colors.querySelector('.pg-sistema_colors_heading'), colors, { y: 24, delay: 0.05, start: 'top 82%' });
      var swatches = colors.querySelectorAll('.pg-sistema_swatch-item');
      if (swatches.length) {
        gsap.set(swatches, { autoAlpha: 0, y: 20, scale: 0.85 });
        gsap.to(swatches, {
          autoAlpha: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.05,
          scrollTrigger: { trigger: colors, start: 'top 80%', toggleActions: 'play none none none' }
        });
      }
    }

    /* ── GALLERY — heading + staggered tiles ──────────────────────── */
    var gallery = document.querySelector('.pg-mob_gallery');
    if (gallery) {
      reveal(gallery.querySelector('.gl-section-number'), gallery, { start: 'top 85%' });
      reveal(gallery.querySelector('.pg-mob_gallery_title'), gallery, { y: 24, delay: 0.05, start: 'top 82%' });
      reveal(gallery.querySelectorAll('.pg-mob_gallery_item'), gallery.querySelector('.pg-mob_gallery_grid'), {
        y: 36, fromScale: 0.96, stagger: 0.08, duration: 0.7, start: 'top 80%'
      });
    }

    /* ── CTA ──────────────────────────────────────────────────────── */
    var cta = document.querySelector('.pg-mob_cta');
    if (cta) {
      reveal(cta.querySelector('.gl-section-number'), cta, { start: 'top 84%' });
      reveal(cta.querySelector('.pg-mob_cta_heading'), cta, { duration: 0.8, start: 'top 80%' });
      reveal(cta.querySelector('.pg-mob_cta_sub'), cta, { duration: 0.65, delay: 0.12, start: 'top 80%' });
      reveal(cta.querySelector('.pg-mob_cta_buttons'), cta, { duration: 0.65, delay: 0.22, start: 'top 80%' });
    }

    /* ── Footer columns ───────────────────────────────────────────── */
    reveal(document.querySelectorAll('.pg-footer_col'), '.pg-footer', { stagger: 0.08, duration: 0.55, start: 'top 90%' });

    ScrollTrigger.refresh();
  }
})();

/* ════════════════════════════════════════════════════════════════════
   pg-index-hero.js — Pernia Glass home hero image slider.
   Cross-fades the stacked .pg-index_hero_media images and keeps the
   .pg-index_hero_dot indicators in sync. Dot click jumps to a slide;
   autoplay advances every 6s and pauses on hover. CSS owns the fade
   (.is-active → opacity 1); this only toggles the class.
   No dependencies.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const wrap = document.querySelector('.pg-index_hero_media-wrap');
  if (!wrap) return;

  const slides = Array.from(wrap.querySelectorAll('.pg-index_hero_media'));
  /* Dots live outside the media-wrap (at the hero section level). */
  const dots   = Array.from(document.querySelectorAll('.pg-index_hero_dot'));
  if (slides.length < 2) return;

  const AUTOPLAY_MS = 6000;
  const reduceMotion = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let current = Math.max(0, slides.findIndex(s => s.classList.contains('is-active')));
  if (current < 0) current = 0;
  let timer = null;

  function show(index) {
    index = (index + slides.length) % slides.length;
    if (index === current) return;
    slides[current].classList.remove('is-active');
    dots[current] && dots[current].classList.remove('is-active');
    current = index;
    slides[current].classList.add('is-active');
    dots[current] && dots[current].classList.add('is-active');
  }

  function next() { show(current + 1); }

  function start() {
    if (reduceMotion || timer) return;
    timer = window.setInterval(next, AUTOPLAY_MS);
  }
  function stop() {
    if (timer) { window.clearInterval(timer); timer = null; }
  }
  function restart() { stop(); start(); }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { show(i); restart(); });
  });

  wrap.addEventListener('mouseenter', stop);
  wrap.addEventListener('mouseleave', start);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });

  start();
})();

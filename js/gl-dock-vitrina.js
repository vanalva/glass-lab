/* ════════════════════════════════════════════════════════════════════
   gl-dock-vitrina.js — Vitrina hover panels for the dock
   Panels: Catálogo · Visor · Contacto · Lente (logo trigger)
   Requires: gsap.min.js
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (typeof gsap === 'undefined') return;

  var dock     = document.querySelector('.gl-dock');
  var dockInner = dock && dock.querySelector('.gl-dock_inner');
  if (!dock || !dockInner) return;

  /* ─── Panel HTML ─────────────────────────────────────────────────── */
  function cellHTML(symbol, code, name) {
    return '<a href="gl-vidrio.html?code=' + symbol + '" class="gl-vitrina_cell">' +
      '<span class="gl-vitrina_cell_code">' + code + '</span>' +
      '<span class="gl-vitrina_cell_symbol">' + symbol + '</span>' +
      '<span class="gl-vitrina_cell_name">' + name + '</span>' +
      '</a>';
  }

  var panelHTML = {
    catalogo:
      '<div class="gl-vitrina_header">' +
        '<span class="gl-vitrina_title">Catálogo</span>' +
        '<a href="gl-catalogo.html" class="gl-vitrina_header_link">Ver completo →</a>' +
      '</div>' +
      '<div class="gl-vitrina_cells">' +
        cellHTML('Vc',  '001', 'Claro') +
        cellHTML('In',  '002', 'Interlayer') +
        cellHTML('Ds',  '003', 'Sunset') +
        cellHTML('Dc',  '005', 'Dicroico') +
        cellHTML('Af',  '016', 'Afrodita') +
        cellHTML('Gra', '019', 'Gradient') +
        cellHTML('Ac',  '040', 'Sa-Cuadros') +
        cellHTML('Lm',  '012', 'Laminado') +
      '</div>',

    visor:
      '<div class="gl-vitrina_header">' +
        '<span class="gl-vitrina_title">Visor</span>' +
      '</div>' +
      '<p class="gl-vitrina_desc u-text-style-small">Compositor interactivo de vidrio. Combina sistemas, capas y acabados en tiempo real.</p>' +
      '<a href="gl-visor.html" class="gl-vitrina_cta">Abrir Visor →</a>',

    contacto:
      '<div class="gl-vitrina_header">' +
        '<span class="gl-vitrina_title">Contacto</span>' +
      '</div>' +
      '<form class="gl-vitrina_form" onsubmit="return false">' +
        '<input type="text"  class="gl-vitrina_input" placeholder="Nombre">' +
        '<input type="email" class="gl-vitrina_input" placeholder="Email">' +
        '<textarea class="gl-vitrina_textarea" placeholder="Mensaje" rows="3"></textarea>' +
        '<button type="submit" class="gl-vitrina_submit">Enviar</button>' +
      '</form>',

    lente: '<!-- built dynamically after GL_LENTE_CATALOG is available -->'
  };

  /* ─── Build DOM ──────────────────────────────────────────────────── */
  var anchor = document.createElement('div');
  anchor.className = 'gl-vitrina';

  ['catalogo', 'visor', 'contacto', 'lente'].forEach(function (key) {
    var panel = document.createElement('div');
    panel.className = 'gl-vitrina_panel';
    panel.dataset.vitrina = key;
    panel.innerHTML = panelHTML[key];
    anchor.appendChild(panel);
  });

  dock.insertBefore(anchor, dockInner);
  gsap.set('.gl-vitrina_panel', { autoAlpha: 0, y: 10 });

  /* ─── Show / hide ────────────────────────────────────────────────── */
  var activeKey = null;
  var hideTimer = null;

  function showPanel(key) {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    if (activeKey === key) return;
    if (activeKey) {
      var old = anchor.querySelector('[data-vitrina="' + activeKey + '"]');
      if (old) gsap.to(old, { autoAlpha: 0, y: 10, duration: 0.12, ease: 'power2.in', overwrite: 'auto' });
    }
    activeKey = key;
    var panel = anchor.querySelector('[data-vitrina="' + key + '"]');
    if (panel) gsap.to(panel, { autoAlpha: 1, y: 0, duration: 0.22, ease: 'power2.out', overwrite: 'auto' });
  }

  function scheduleHide() {
    hideTimer = setTimeout(function () {
      if (!activeKey) return;
      var panel = anchor.querySelector('[data-vitrina="' + activeKey + '"]');
      if (panel) gsap.to(panel, { autoAlpha: 0, y: 10, duration: 0.18, ease: 'power2.in', overwrite: 'auto' });
      activeKey = null;
    }, 100);
  }

  function cancelHide() {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  }

  /* ─── Wire dock links ────────────────────────────────────────────── */
  var linkMap = { 'gl-catalogo': 'catalogo', 'gl-visor': 'visor', 'gl-contacto': 'contacto' };

  dockInner.querySelectorAll('.gl-dock_link').forEach(function (link) {
    var href = link.getAttribute('href') || '';
    var key = null;
    Object.keys(linkMap).forEach(function (pattern) {
      if (href.indexOf(pattern) !== -1) key = linkMap[pattern];
    });
    if (!key) return;
    link.addEventListener('mouseenter', function () { showPanel(key); });
  });

  /* Logo: hover → show Lente panel, click → spawn a new glass lens */
  var logo = dockInner.querySelector('.gl-dock_logo');
  if (logo) {
    /* Mark the logo as a JS-only trigger so gl-page-transition.js
       doesn't intercept the click in capture phase (which would block
       our bubble-phase handler below from running). */
    logo.dataset.noTransition = 'true';
    logo.addEventListener('mouseenter', function () { showPanel('lente'); });
    logo.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (window.glLente) window.glLente.spawn();
    });
  }

  /* Public: show lente panel from outside (kept for compatibility) */
  window.glVitrina = { showLente: function () { showPanel('lente'); } };

  anchor.addEventListener('mouseenter', cancelHide);
  anchor.addEventListener('mouseleave', scheduleHide);
  dockInner.addEventListener('mouseleave', scheduleHide);
  dockInner.addEventListener('mouseenter', cancelHide);

  /* Stop panel link clicks from triggering page-transition */
  anchor.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    e.stopPropagation();
  });

  /* ─── Lente panel — compact branded preset launcher ──────────────
     The full settings editor lives inside gl-lente.js (opens after spawn).
     This panel just lets the user pick a starting point and launch:
       1. Preset chips (uses GL_LENTE_PRESETS — same data as the editor row)
       2. "Lente vacía" button to spawn a blank lens
     Both actions spawn a lens AND auto-open the full editor next to it.

     CSS shares the editor's classes (.gl-le-preset, .gl-lente-editor_*) so
     visual changes to the editor propagate here automatically. */
  var lensPanel = anchor.querySelector('[data-vitrina="lente"]');

  function buildLentePanel() {
    var presets = window.GL_LENTE_PRESETS || [];
    var chips = presets.map(function (p) {
      var ds = p.dot && (p.dot.indexOf('gradient') !== -1 || p.dot.indexOf('conic') !== -1)
        ? 'background-image:' + p.dot
        : 'background-color:' + (p.dot || '#444');
      return '<button class="gl-le-preset gl-lp-preset" data-preset-id="' + p.id + '" title="' + p.name + ' — ' + p.sub + '">' +
        '<span class="gl-le-preset-dot" style="' + ds + '"></span>' +
        '<span class="gl-le-preset-name">' + p.name + '</span>' +
        '</button>';
    }).join('');

    lensPanel.innerHTML =
      '<div class="gl-vitrina_header">' +
        '<span class="gl-vitrina_title">Lente</span>' +
        /* Clear-all — top-right of the Lente panel. Removes every
           non-bounded lens (preserves the section-anchored interlude
           samples). */
        '<button class="gl-lp-clear-all" id="gl-lp-clear-all" type="button" aria-label="Limpiar todas las lentes" title="Limpiar todas las lentes">' +
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>' +
            '<path d="M10 11v6M14 11v6"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<p class="gl-lp-intro">Compositor de vidrio en tiempo real. Elige un preset o lanza una lente vacía.</p>' +
      '<div class="gl-lente-editor_section-label" style="margin-bottom:0.4rem">Presets</div>' +
      '<div class="gl-lp-presets">' + chips + '</div>' +
      /* Brand skew CTA — same signature button used across the homepage */
      '<div class="gl-btn_skew_wrap gl-btn_skew_wrap_brand gl-lp-spawn-wrap">' +
        '<svg class="gl-btn_skew_shape" viewBox="0 0 240 56" preserveAspectRatio="none" fill="none">' +
          '<polygon points="16,1 239,1 239,42 224,55 1,55 1,14" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="miter" vector-effect="non-scaling-stroke"/>' +
        '</svg>' +
        '<button type="button" class="gl-btn_skew_element gl-btn_skew_element_sm" id="gl-lp-spawn">' +
          '<span class="gl-btn_skew_text gl-btn_skew_text_sm">Lente vacía</span>' +
        '</button>' +
      '</div>';

    wireLentePanel();
  }

  function spawnAndHide(presetId) {
    if (!window.glLente) return;
    if (presetId) window.glLente.loadPreset(presetId);
    else          window.glLente.spawn({});
    /* Auto-open the editor — the user just configured a lens; show settings */
    if (window.glLente.openEditor) window.glLente.openEditor();
    scheduleHide();
  }

  function wireLentePanel() {
    /* Preset chip → spawn lens + load preset + open editor */
    lensPanel.querySelectorAll('.gl-lp-preset').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        spawnAndHide(btn.dataset.presetId);
      });
    });
    /* Empty-lens button */
    var spawn = lensPanel.querySelector('#gl-lp-spawn');
    if (spawn) spawn.addEventListener('click', function (e) {
      e.stopPropagation();
      spawnAndHide(null);
    });
    /* Clear-all — close every user-spawned lens (skips bounded
       interlude samples, which are part of the page composition). */
    var clearBtn = lensPanel.querySelector('#gl-lp-clear-all');
    if (clearBtn) clearBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (window.glLente && window.glLente.closeAllUnbounded) {
        window.glLente.closeAllUnbounded();
      } else if (window.glLente && window.glLente.closeAll) {
        window.glLente.closeAll();
      }
    });
  }

  /* Build after catalog is ready (gl-lente.js loads before gl-dock-vitrina.js) */
  if (window.GL_LENTE_CATALOG) {
    buildLentePanel();
  } else {
    document.addEventListener('DOMContentLoaded', buildLentePanel);
  }

})();

/* ════════════════════════════════════════════════════════════════════
   gl-interlude-samples.js — section-anchored decorative lenses on the
   "Vidrio que recuerda la luz" Interlude section.

   These are REAL lenses spawned through glLente.spawn() with a
   `bounds` option that clamps their drag/resize to the interlude
   <section> and makes them follow the section on scroll. They behave
   exactly like normal lenses (draggable, editable via the panel
   editor) but cannot be moved outside the section.

   Each sample is kept SIMPLE: always two glass layers, with at most ONE
   feature (a single pattern OR a single texture) sandwiched between them.
   Never two patterns in one lens. ~25% are plain (just the two glasses)
   so the section reads as a mix of "raw glass" and "patterned glass."
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function rand(min, max) { return min + Math.random() * (max - min); }

  /* Vidrio glass types — for plain-glass layers / bases */
  var GLASS_TYPES = ['vu', 'vc', 'vb', 'vg', 'vp', 'vi', 'gra', 'in'];
  /* Wire-mesh + line patterns — used in patterned samples */
  var PATTERN_TYPES = ['at', 'ac', 'va', 'sh', 'sz', 'sbl', 'iml', 'vmp'];

  /* Tint palette — picks a coherent anchor hue per sample so layers
     feel related but each sample looks different. RGB triplet + an
     alpha range; layer alpha is randomised within range. */
  var TINTS = [
    { rgb: [218, 178, 92],  alpha: [0.7, 0.95] }, /* gold */
    { rgb: [110, 140, 195], alpha: [0.6, 0.85] }, /* pacífica */
    { rgb: [85, 105, 200],  alpha: [0.65, 0.9] }, /* indigo */
    { rgb: [195, 145, 55],  alpha: [0.7, 0.95] }, /* bronze */
    { rgb: [38, 50, 130],   alpha: [0.65, 0.9] }, /* deep indigo */
    { rgb: [245, 225, 175], alpha: [0.4, 0.7]  }, /* cream */
    { rgb: [180, 110, 30],  alpha: [0.7, 0.92] }, /* warm amber */
    { rgb: [225, 240, 252], alpha: [0.35, 0.6] }, /* ice */
    { rgb: [70, 80, 100],   alpha: [0.5, 0.8]  }, /* slate */
    { rgb: [255, 75, 0],    alpha: [0.6, 0.85] }  /* sunset orange */
  ];

  function tintCss(hue, alpha) {
    return 'rgba(' + hue.rgb[0] + ',' + hue.rgb[1] + ',' + hue.rgb[2] + ',' + alpha.toFixed(2) + ')';
  }

  /* Textures — used at most once per sample, as the optional middle layer. */
  var TEXTURE_TYPES = ['tx-linen', 'tx-marble', 'tx-concrete', 'tx-leather', 'tx-velvet', 'tx-noise'];

  /* Common layer settings. Blur is capped low (2-8) for bounded samples —
     backdrop-filter is the single biggest GPU cost in the lens render. */
  function baseLayer(anchorHue, type, opts) {
    opts = opts || {};
    /* 60% chance to share the sample's anchor hue, 40% to drift. */
    var hue = Math.random() < 0.6 ? anchorHue : pick(TINTS);
    var alpha = rand(hue.alpha[0], hue.alpha[1]);
    return {
      type: type,
      blur: Math.round(rand(2, 8)),
      color: Math.round(rand(35, 75)),
      refraction: Math.round(rand(5, 18)),
      edge: Math.round(rand(15, 35)),
      edgeBlur: Math.round(rand(0, 3)),
      edgeBd: 0,
      tint: tintCss(hue, alpha),
      tintIntensity: Math.round(rand(opts.tintLo || 45, opts.tintHi || 90)),
      layerOpacity: Math.round(rand(opts.opLo || 70, opts.opHi || 100))
    };
  }
  function glassLayer(anchorHue, isCap) {
    /* The cap glass is lighter + more transparent so the feature below it
       reads through, like a real laminated interlayer. */
    return baseLayer(anchorHue, pick(GLASS_TYPES),
      isCap ? { tintLo: 18, tintHi: 50, opLo: 55, opHi: 80 } : {});
  }
  function patternLayer(anchorHue) {
    var s = baseLayer(anchorHue, pick(PATTERN_TYPES), { tintLo: 55, tintHi: 95 });
    s.patternScale      = Math.round(rand(35, 75));
    s.patternRotation   = Math.random() < 0.7 ? 0 : Math.round(rand(0, 90));
    s.patternThickness  = Math.round(rand(40, 75));
    s.patternDepth      = Math.round(rand(0, 25));
    s.patternShine      = Math.round(rand(40, 80));
    s.patternShineAngle = Math.round(rand(10, 50));
    return s;
  }
  function textureLayer(anchorHue) {
    return baseLayer(anchorHue, pick(TEXTURE_TYPES), { tintLo: 50, tintHi: 85, opLo: 60, opHi: 90 });
  }

  /* Spawn one sample lens. Composition is deliberately SIMPLE: two glass
     layers, with at most ONE feature (a single pattern OR a single texture)
     sandwiched between them. Never two patterns. ~25% are plain glass-only.
     With suppressSpawn=true the lens is created invisible and revealed later. */
  function spawnSample(boundsEl, anchorPx, sizePx, suppressSpawn) {
    var anchorHue = pick(TINTS);
    var roll = Math.random();
    var feature = roll < 0.25 ? null : (roll < 0.85 ? 'pattern' : 'texture');

    var layers = [ glassLayer(anchorHue, false) ];               /* base glass */
    if (feature === 'pattern')      layers.push(patternLayer(anchorHue));  /* the "intersection" */
    else if (feature === 'texture') layers.push(textureLayer(anchorHue));
    layers.push(glassLayer(anchorHue, true));                    /* cap glass (shows feature through) */

    var spawnOpts = Object.assign({}, layers[0], {
      bounds: boundsEl,
      anchorX: anchorPx.x,
      anchorY: anchorPx.y,
      size: sizePx
    });
    if (suppressSpawn) spawnOpts.suppressSpawnAnim = true;
    var lens = window.glLente.spawn(spawnOpts);
    if (!lens) return null;
    /* Add remaining layers — addLayer() inherits the lens's preHidden flag. */
    for (var i = 1; i < layers.length; i++) {
      window.glLente.addLayer(layers[i]);
    }
    return lens;
  }

  /* Anchor positions — fractions of the section width/height.

     The wide desktop scatter (7 samples, 170-260px) buries the centered
     heading once the section narrows. So the layout is viewport-aware:
     on tablet/phone we drop to fewer, smaller samples pinned to the TOP
     and BOTTOM bands, leaving the vertical centre clear for the heading.
     Sizes are clamped so a sample + its -21% skin bleed never crosses the
     viewport edge (the samples are position:fixed, so they aren't clipped
     by the section's overflow:hidden). */
  /* Touch devices (incl. a wide iPad Pro that reports desktop width in
     Chrome) get a LIGHTER scatter: backdrop-filter is the dominant GPU
     cost and tablet GPUs choke on the full 7-lens desktop set, so touch
     wide screens use ~5 smaller samples. Only a real mouse desktop gets
     the full scatter. */
  var IS_TOUCH = window.matchMedia('(hover: none)').matches
    || window.matchMedia('(pointer: coarse)').matches;
  var VW = window.innerWidth;
  /* Mobile/touch: 3 samples only (down from 4-5). They keep their frosted
     backdrop, but fewer fixed backdrop-filter layers = far less per-scroll
     recompositing. The dichroic shimmer animations are also stopped via CSS
     (≤991px) so nothing repaints continuously off-screen. */
  var ANCHORS = VW <= 478 ? [
    { fx: 0.24, fy: 0.12, size: 112 },
    { fx: 0.78, fy: 0.16, size: 104 },
    { fx: 0.30, fy: 0.87, size: 116 }
  ] : VW <= 991 ? [
    { fx: 0.18, fy: 0.13, size: 160 },
    { fx: 0.82, fy: 0.18, size: 140 },
    { fx: 0.50, fy: 0.88, size: 150 }
  ] : IS_TOUCH ? [
    { fx: 0.14, fy: 0.28, size: 188 },
    { fx: 0.50, fy: 0.15, size: 148 },
    { fx: 0.86, fy: 0.32, size: 172 },
    { fx: 0.30, fy: 0.72, size: 196 },
    { fx: 0.72, fy: 0.78, size: 180 }
  ] : [
    { fx: 0.11, fy: 0.30, size: 220 },
    { fx: 0.49, fy: 0.14, size: 170 },
    { fx: 0.85, fy: 0.34, size: 200 },
    { fx: 0.29, fy: 0.68, size: 260 },
    { fx: 0.13, fy: 0.88, size: 170 },
    { fx: 0.66, fy: 0.80, size: 230 },
    { fx: 0.92, fy: 0.76, size: 190 }
  ];

  /* Pre-spawn every sample lens in the BACKGROUND via requestIdleCallback
     so the heavy backdrop-filter compositing happens off the critical
     path. Each lens is created invisible (opacity 0, visibility hidden)
     so the user never sees them being built. When the section scrolls
     into view, a separate reveal step fades them in cheaply (just an
     opacity tween — no spawn cost). */
  function preSpawnAllSamples(section, rect, onAllDone) {
    var spawned = [];
    var i = 0;
    function next() {
      if (i >= ANCHORS.length) { onAllDone(spawned); return; }
      var a = ANCHORS[i++];
      var lens = spawnSample(section, {
        x: a.fx * rect.width  - a.size / 2,
        y: a.fy * rect.height - a.size / 2
      }, a.size, /* suppressSpawn */ true);
      if (lens) spawned.push(lens);
      /* Yield to the browser between spawns. requestIdleCallback is
         best — runs in spare frame time so we don't compete with
         scroll handlers or other rendering. Falls back to a short
         setTimeout where IC isn't available (Safari < 17). */
      if (window.requestIdleCallback) {
        window.requestIdleCallback(next, { timeout: 600 });
      } else {
        setTimeout(next, 24); /* ~1.5 frames at 60fps */
      }
    }
    next();
  }

  function revealAllSamples(samples) {
    samples.forEach(function (lens, i) {
      /* Stagger the reveal with a soft 110ms gap. The reveal itself
         is just a 0.7s opacity fade per lens — the rendering work has
         already been done during pre-spawn. */
      setTimeout(function () { window.glLente.reveal(lens); }, i * 110);
    });
  }

  function init() {
    var section = document.querySelector('.gl-home_interlude');
    if (!section || !window.glLente) return;
    /* Wait until the section is in the DOM with measurable dimensions. */
    var rect = section.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      requestAnimationFrame(init);
      return;
    }

    /* If we get here AFTER the user has already scrolled past the
       trigger point (e.g. page loaded with a hash deep-link), don't
       bother with the deferred pre-spawn dance — just reveal
       everything immediately. */
    var triggered = false;
    var samples = [];

    preSpawnAllSamples(section, rect, function (allLenses) {
      samples = allLenses;
      /* If the section is ALREADY in view by the time pre-spawning
         finishes (slow device, very fast user), reveal immediately. */
      if (triggered) revealAllSamples(samples);
    });

    if (window.gsap && window.ScrollTrigger) {
      window.ScrollTrigger.create({
        trigger: section,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          triggered = true;
          /* If pre-spawn already finished, samples[] is populated and
             we can reveal now. Otherwise the preSpawn callback above
             will reveal when it finishes. */
          if (samples.length) revealAllSamples(samples);
        }
      });
    } else {
      /* No ScrollTrigger — fall back to revealing as soon as
         pre-spawn finishes (no scroll-based delay). */
      triggered = true;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

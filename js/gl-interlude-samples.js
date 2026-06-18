/* ════════════════════════════════════════════════════════════════════
   gl-interlude-samples.js — section-anchored decorative lenses on the
   "Vidrio que recuerda la luz" Interlude section.

   These are REAL lenses spawned through glLente.spawn() with a
   `bounds` option that clamps their drag/resize to the interlude
   <section> and makes them follow the section on scroll. They behave
   exactly like normal lenses (draggable, editable via the panel
   editor) but cannot be moved outside the section.

   Each sample gets a random composition of 3–4 layers built from the
   same catalog as the regular lens system. A subset of samples (~30%)
   are intentionally rendered as plain glass (no patterns) so the
   section reads as a mix of "raw glass" and "patterned glass."
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

  /* Build a layer settings object — random pattern/glass type, random
     tint, random scale & opacity. Returns the same shape as preset
     layers in gl-lente.js so addLayer() accepts it. */
  function randomLayer(anchorHue, mode) {
    /* 60% chance to share the sample's anchor hue, 40% to drift. */
    var hue = Math.random() < 0.6 ? anchorHue : pick(TINTS);
    var alpha = rand(hue.alpha[0], hue.alpha[1]);
    var type;
    if (mode === 'plain') {
      type = pick(GLASS_TYPES);
    } else if (mode === 'pattern') {
      type = pick(PATTERN_TYPES);
    } else {
      /* mixed — 50/50 */
      type = Math.random() < 0.5 ? pick(GLASS_TYPES) : pick(PATTERN_TYPES);
    }
    /* Blur is capped low (2-8) for bounded samples — backdrop-filter
       is the single biggest GPU cost in the lens render. With 7 lenses
       × 3-4 layers each, the original 4-22 blur range was producing
       scroll-time stutters as the section came into view. Lower blur
       still reads as "glass" because the pattern + tint + shine carry
       most of the visual identity. */
    var s = {
      type: type,
      blur: Math.round(rand(2, 8)),
      color: Math.round(rand(35, 75)),
      refraction: Math.round(rand(5, 18)),
      edge: Math.round(rand(15, 35)),
      edgeBlur: Math.round(rand(0, 3)),
      edgeBd: 0,
      tint: tintCss(hue, alpha),
      tintIntensity: Math.round(rand(45, 90)),
      layerOpacity: Math.round(rand(70, 100))
    };
    if (PATTERN_TYPES.indexOf(type) !== -1) {
      s.patternScale     = Math.round(rand(25, 80));
      s.patternRotation  = Math.random() < 0.6 ? 0 : Math.round(rand(0, 90));
      s.patternThickness = Math.round(rand(35, 80));
      s.patternDepth     = Math.round(rand(0, 25));
      s.patternShine     = Math.round(rand(35, 85));
      s.patternShineAngle = Math.round(rand(10, 50));
    }
    return s;
  }

  /* Spawn one sample lens at a viewport position relative to the
     bounds element. With suppressSpawn=true, the lens is created
     invisible (no back.out animation, opacity 0, visibility hidden);
     a later glLente.reveal(lens) call fades it in. */
  function spawnSample(boundsEl, anchorPx, sizePx, suppressSpawn) {
    var layerCount = Math.random() < 0.5 ? 3 : 4;
    /* ~30% of samples are plain (no patterns at all). Rest are mixed. */
    var sampleMode = Math.random() < 0.3 ? 'plain' : 'mixed';
    var anchorHue = pick(TINTS);

    /* Build the first layer via spawn(), then add the rest. */
    var firstLayer = randomLayer(anchorHue, sampleMode);
    var spawnOpts = Object.assign({}, firstLayer, {
      bounds: boundsEl,
      anchorX: anchorPx.x,
      anchorY: anchorPx.y,
      size: sizePx
    });
    if (suppressSpawn) spawnOpts.suppressSpawnAnim = true;
    var lens = window.glLente.spawn(spawnOpts);
    if (!lens) return null;
    /* Add remaining layers — addLayer() inherits the lens's preHidden
       flag so they stay invisible until reveal(). */
    for (var i = 1; i < layerCount; i++) {
      window.glLente.addLayer(randomLayer(anchorHue, sampleMode));
    }
    /* Pre-spawned bounded lenses don't auto-activate (spawnLens skips
       setActiveLens when suppressSpawnAnim is set), but addLayer()
       above does set activeLayerIdx. We don't reset it here because
       there's no active lens to update — the user opens the editor by
       clicking, and only THEN does this lens become active. */
    return lens;
  }

  /* Anchor positions — fractions of the section width/height. */
  var ANCHORS = [
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

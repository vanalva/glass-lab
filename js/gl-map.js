/* ============================================================
   gl-map.js — Leaflet single-location map (Glass Lab / Pernia)
   Ported from the Alttura map tool. Themed to the Glass Lab
   electric-blue accent, CartoDB tiles (dark or light per section).

   Usage — drop a container on the page:
     <div class="gl-map gl-contacto_info_map"
          data-gl-map
          data-lat="8.9838" data-lng="-79.5205"
          data-zoom="16" data-map-theme="dark">
       <a class="gl-map_gmaps" target="_blank" rel="noopener"
          href="https://www.google.com/maps/search/?api=1&query=...">
          Abrir en Google Maps &gt;&gt;&gt;</a>
     </div>

   Requires Leaflet 1.9.x CSS + JS loaded before this file.
   ============================================================ */
(function () {
  'use strict';

  var ACCENT = '#1400FF'; // --swatch--brand-500

  /* Inject the brand duotone filters once. These recolor the neutral
     CartoDB basemap into the Glass Lab palette:
       dark  → blue-black shadows  +  periwinkle-brand features
       light → cream background    +  electric-blue features
     A luminance matrix flattens the tile to grayscale, then a component
     transfer maps luminance 0→shadow colour, 1→highlight colour. */
  function injectFilters() {
    if (document.getElementById('gl-map-filters')) return;
    var LUMA =
      '0.2126 0.7152 0.0722 0 0 ' +
      '0.2126 0.7152 0.0722 0 0 ' +
      '0.2126 0.7152 0.0722 0 0 ' +
      '0 0 0 1 0';
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('id', 'gl-map-filters');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
    svg.innerHTML =
      '<defs>' +
        '<filter id="gl-map-duotone-dark" color-interpolation-filters="sRGB">' +
          '<feColorMatrix type="matrix" values="' + LUMA + '"/>' +
          '<feComponentTransfer>' +
            '<feFuncR type="table" tableValues="0.039 0.404"/>' +
            '<feFuncG type="table" tableValues="0.043 0.443"/>' +
            '<feFuncB type="table" tableValues="0.078 0.902"/>' +
          '</feComponentTransfer>' +
        '</filter>' +
        '<filter id="gl-map-duotone-light" color-interpolation-filters="sRGB">' +
          '<feColorMatrix type="matrix" values="' + LUMA + '"/>' +
          '<feComponentTransfer>' +
            '<feFuncR type="table" tableValues="0.078 0.929"/>' +
            '<feFuncG type="table" tableValues="0 0.906"/>' +
            '<feFuncB type="table" tableValues="1 0.867"/>' +
          '</feComponentTransfer>' +
        '</filter>' +
      '</defs>';
    document.body.appendChild(svg);
  }

  function initMap(el) {
    if (el._glMapInit) return;
    if (typeof L === 'undefined') return; // Leaflet not loaded yet
    el._glMapInit = true;
    injectFilters();

    var lat = parseFloat(el.getAttribute('data-lat'));
    var lng = parseFloat(el.getAttribute('data-lng'));
    var zoom = parseInt(el.getAttribute('data-zoom'), 10);
    var theme = (el.getAttribute('data-map-theme') || 'dark').toLowerCase();

    if (isNaN(lat) || isNaN(lng)) return;
    if (isNaN(zoom)) zoom = 15;

    var map = L.map(el, {
      center: [lat, lng],
      zoom: zoom,
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: false
    });

    // Ctrl + wheel to zoom (keeps page scroll natural otherwise)
    el.addEventListener('wheel', function (e) {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) { map.zoomIn(); } else { map.zoomOut(); }
      }
    }, { passive: false });

    // CartoDB basemap — dark_all for dark sections, light_all for light
    var tileId = theme === 'light' ? 'light_all' : 'dark_all';
    L.tileLayer('https://{s}.basemaps.cartocdn.com/' + tileId + '/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Recolor the basemap into the brand duotone
    var tilePane = map.getPane('tilePane');
    if (tilePane) {
      tilePane.style.filter = theme === 'light'
        ? 'url(#gl-map-duotone-light)'
        : 'url(#gl-map-duotone-dark)';
    }

    // Electric-blue pulsing marker
    L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'gl-map_marker',
        html: '<span class="gl-map_marker_dot"></span><span class="gl-map_marker_ring"></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      })
    }).addTo(map);

    // Leaflet mis-measures inside flex/aspect-ratio containers until visible
    setTimeout(function () { map.invalidateSize(); }, 60);
    window.addEventListener('load', function () { map.invalidateSize(); });
  }

  function initAll() {
    var nodes = document.querySelectorAll('[data-gl-map]');
    for (var i = 0; i < nodes.length; i++) { initMap(nodes[i]); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
  // Re-try once Leaflet's async CDN script has certainly landed
  window.addEventListener('load', initAll);

  // Expose accent for any external theming hooks
  window.GL_MAP_ACCENT = ACCENT;
})();

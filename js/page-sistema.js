/* ════════════════════════════════════════════════════════════════════
   page-sistema.js — populates pg-sistema.html from pernia-systems.json

   Reads ?code=GLSS01..08 from URL (defaults to GLSS01), then fills
   every element tagged with data-bind / data-spec / data-feature.
   Generates the profile color swatches and the related-systems row.
   ════════════════════════════════════════════════════════════════════ */

window.GL_DATA.then(({ pernia, helpers }) => {
  const code = helpers.getCodeFromUrl('GLSS01');
  const system = helpers.getSystem(code);

  if (!system) {
    renderNotFound(code);
    return;
  }

  renderSystem(system, pernia);
}).catch(err => {
  console.error('[page-sistema] failed to load pernia data:', err);
  console.error('Are you opening this page via file://? Use the local server (http://localhost:8765) instead.');
});

function renderSystem(system, pernia) {
  const universal = pernia.family.universal;
  const isComingSoon = system.availability === 'proximamente';

  // Page chrome
  document.title = `${system.code} — ${stripCode(system.name?.es)} | Pernia Glass`;

  // Breadcrumb + tags + title
  setText('[data-bind="breadcrumb"]', '');
  const bc = document.querySelector('[data-bind="breadcrumb"]');
  if (bc) {
    bc.innerHTML = `<a href="pg-sistemas.html" class="pg-sistema_hero_breadcrumb-link">Sistemas</a> &gt; ${system.code}`;
  }
  setText('[data-bind="configTag"]', cap(system.configType || ''));
  setText('[data-bind="code"]',       system.code);
  setText('[data-bind="title"]',      stripCode(system.name?.es) || system.code);

  // Hero image
  const heroImg = document.querySelector('[data-bind-src="hero"]');
  if (heroImg && system.media?.detailRender) {
    heroImg.src = system.media.detailRender;
    heroImg.alt = `${system.code} — ${stripCode(system.name?.es)}`;
  }

  // Overview heading + description
  setText('[data-bind="overviewHeading"]', stripCode(system.name?.es) || '');
  setText('[data-bind="overviewDesc"]',    system.description?.es || system.tagline?.es || '');

  // Overview detail render
  const overviewImg = document.querySelector('[data-bind-src="overview"]');
  if (overviewImg && system.media?.detailRender) {
    overviewImg.src = system.media.detailRender;
    overviewImg.alt = `Detalle técnico — ${system.code}`;
  }

  // Features
  const features = document.querySelector('[data-bind="features"]');
  if (features) {
    features.innerHTML = '';
    const bullets = [
      `${system.panels} panel${system.panels > 1 ? 'es' : ''} · ${system.configuration?.es || ''}`,
      system.hasPocket ? 'Configuración con pocket — los paneles se ocultan en el muro' : 'Sin pocket — instalación de superficie',
      `${universal.vidrio?.es || '8mm laminado'} · ${universal.mecanismo?.es || 'Soft close'}`,
      '10 colores de perfil anodizado — personalización del marco'
    ];
    bullets.forEach(b => features.appendChild(featureItem(b)));
  }

  // Specs table
  setSpec('configuracion', system.configuration?.es || '—');

  const dims = (system.dimensions || []).map(d => `${d.width}×${d.height} mm`).join(' / ');
  setSpec('dimensiones', dims || 'Por confirmar');
  setSpec('espesorVidrio', universal.vidrio?.es || '8mm laminado');
  setSpec('perfil',        universal.perfil?.es || 'Aluminio slim anodizado');
  setSpec('mecanismo',     universal.mecanismo?.es || 'Soft close');
  setSpec('headerCarga',   system.headerSteel || '—');
  setSpec('cieloRaso',     `${universal.soffit?.es || 'GYPSUM'} · ${universal.trim?.es || 'MADERA 2×1 opcional'}`);
  setSpec('pocket',        system.hasPocket ? 'Sí — pocket completo en el muro' : 'No');
  setSpec('apertura',      `Corrediza ${cap(system.configType?.replace('-', ' ') || '')}`);

  // Profile color swatches
  const swatchContainer = document.querySelector('[data-bind="profileColors"]');
  if (swatchContainer) {
    swatchContainer.innerHTML = '';
    (pernia.family.perfilColores || []).forEach(c => {
      const item = document.createElement('div');
      item.className = 'pg-sistema_swatch-item';
      const block = document.createElement('div');
      block.className = 'gl-swatch pg-sistema_swatch-block';
      block.dataset.color = c.id;
      block.style.backgroundColor = c.hex;
      const label = document.createElement('span');
      label.className = 'gl-mono gl-mono_label';
      label.textContent = c.ral ? `${c.name.es} · ${c.ral}` : c.name.es;
      item.appendChild(block);
      item.appendChild(label);
      swatchContainer.appendChild(item);
    });
  }

  // Video
  const video = document.querySelector('[data-bind-src="video"]');
  if (video && system.media?.video) {
    const source = video.querySelector('source');
    if (source) { source.src = system.media.video; video.load(); }
  }

  // Glass Lab compatible products row (curated selection spanning all 3 categories)
  const glContainer = document.querySelector('[data-bind="glasslabCells"]');
  if (glContainer) {
    glContainer.innerHTML = '';
    // Show 6 representative codes: 2 COLORES, 2 INSERCIONES, 2 REFLECTIVOS
    const FEATURED_CODES = ['Vc', 'Va', 'In', 'Aq', 'Ec', 'Ed'];
    FEATURED_CODES.forEach(code => {
      const a = document.createElement('a');
      a.href = `gl-vidrio.html?code=${code}`;
      a.className = 'gl-link-reset gl-cell gl-cell_filled pg-sistema_glasslab_cell';
      a.style.textDecoration = 'none';
      a.innerHTML = `
        <div class="gl-home_catalog_cell-meta"></div>
        <span class="gl-cell_symbol">${code}</span>
        <div class="gl-home_catalog_cell-meta">
          <span class="gl-cell_name">${code}</span>
        </div>`;
      glContainer.appendChild(a);
    });
    // Resolve names from data once GL_DATA is available
    window.GL_DATA.then(({ helpers }) => {
      FEATURED_CODES.forEach((code, i) => {
        const p = helpers.getProduct(code);
        if (!p) return;
        const cell = glContainer.children[i];
        if (!cell) return;
        const sym = cell.querySelector('.gl-cell_symbol');
        const name = cell.querySelector('.gl-cell_name');
        const meta = cell.querySelectorAll('.gl-home_catalog_cell-meta')[0];
        if (sym) sym.textContent = p.code;
        if (name) name.textContent = p.shortName?.es || p.name?.es || p.code;
        if (meta) meta.innerHTML = `<span class="gl-cell_code">${String(p.slot).padStart(3,'0')}</span>`;
        const cat = helpers.getCategory(p.category);
        cell.classList.add(`gl-cell_cat-${p.category}`);
      });
    });
  }

  // Related systems (3 nearest by panel count)
  const relatedContainer = document.querySelector('[data-bind="relatedSystems"]');
  if (relatedContainer) {
    relatedContainer.innerHTML = '';
    const related = pernia.systems
      .filter(s => s.code !== system.code && s.availability !== 'proximamente')
      .sort((a, b) => Math.abs(a.panels - system.panels) - Math.abs(b.panels - system.panels))
      .slice(0, 3);
    related.forEach(s => relatedContainer.appendChild(relatedCard(s)));
  }

  // CTA heading
  setText('[data-bind="ctaHeading"]', `Solicitar cotización para ${system.code}`);

  // Próximamente notice
  if (isComingSoon) {
    const main = document.querySelector('main');
    if (main) {
      const notice = document.createElement('div');
      notice.style.cssText = 'padding:1rem 2rem;margin:0;border-bottom:1px dashed var(--swatch--brand-500);text-align:center;background-color:color-mix(in srgb, var(--swatch--brand-500) 8%, transparent);';
      notice.innerHTML = `<span class="gl-mono gl-mono_muted">⚠ PRÓXIMAMENTE — ${system.code} está en desarrollo. Las dimensiones y especificaciones pueden variar en la versión final.</span>`;
      main.prepend(notice);
    }
  }
}

function featureItem(text) {
  const div = document.createElement('div');
  div.className = 'pg-sistema_feature-item';
  const bullet = document.createElement('div');
  bullet.className = 'pg-sistema_feature-bullet';
  const span = document.createElement('span');
  span.className = 'gl-mono';
  span.textContent = text;
  div.appendChild(bullet);
  div.appendChild(span);
  return div;
}

function relatedCard(system) {
  const a = document.createElement('a');
  a.href = `pg-sistema.html?code=${system.code}`;
  a.className = 'pg-sistema_related_card';

  const img = document.createElement('img');
  img.className = 'pg-sistema_related_card-img';
  img.loading = 'lazy';
  img.src = system.media?.detailRender || '';
  img.alt = `${system.code} — ${stripCode(system.name?.es)}`;

  const info = document.createElement('div');
  info.className = 'pg-sistema_related_card-info';
  const tag = document.createElement('span');
  tag.className = 'gl-tag';
  tag.textContent = system.code;
  const title = document.createElement('p');
  title.className = 'pg-sistema_related_card-title';
  title.textContent = `${cap(system.configType?.replace('-', ' ') || '')} · ${system.configuration?.es || ''}`;

  info.appendChild(tag);
  info.appendChild(title);
  a.appendChild(img);
  a.appendChild(info);
  return a;
}

function renderNotFound(code) {
  document.title = 'Sistema no encontrado | Pernia Glass';
  const main = document.querySelector('main');
  if (main) {
    main.innerHTML = `
      <section class="gl-hero-cap" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;padding:4rem 2rem;text-align:center;">
        <span class="gl-mono gl-mono_muted">404 — SISTEMA NO ENCONTRADO</span>
        <h1 class="pg-sistema_hero_title" style="margin:1rem 0;">El código «${code}» no existe</h1>
        <p class="gl-mono gl-mono_muted" style="max-width:40ch;margin-bottom:2rem;">La línea Pernia abarca de GLSS01 a GLSS08.</p>
        <a href="pg-sistemas.html" class="gl-mono">&larr; Volver al catálogo de sistemas</a>
      </section>`;
  }
}

/* ── Helpers ─────────────────────────────────────────────── */

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function setSpec(key, value) {
  const row = document.querySelector(`[data-spec="${key}"]`);
  if (row) {
    const valEl = row.querySelector('.gl-mono:not(.gl-mono_muted)');
    if (valEl) valEl.textContent = value;
  }
}

function cap(s) {
  if (!s) return '';
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}

function stripCode(name) {
  // "GLSS01 — Puerta Monopanel" → "Puerta Monopanel"
  if (!name) return '';
  return String(name).replace(/^GLSS\d+\s*[—-]\s*/, '');
}

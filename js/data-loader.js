/* ════════════════════════════════════════════════════════════════════
   data-loader.js — shared data layer for The Glass Lab + Pernia Glass

   Loads glass-types.json and pernia-systems.json once, exposes them
   to all page scripts via window.GL_DATA (a Promise). Pages just do:

       window.GL_DATA.then(({ glass, pernia, helpers }) => { ... })

   Helpers expose convenient lookups (getProduct, getSystem, getRelated...).
   This works for local development. When the site moves to Webflow CMS,
   replace the fetch calls with Webflow's CMS bindings — the helpers
   API stays the same.
   ════════════════════════════════════════════════════════════════════ */

window.GL_DATA = (async function loadData() {
  const [glass, pernia] = await Promise.all([
    fetch('data/glass-types.json').then(r => r.json()),
    fetch('data/pernia-systems.json').then(r => r.json())
  ]);

  /* ── Lookups ─────────────────────────────────────────── */

  function getProduct(code) {
    return glass.products.find(p => p.code === code) || null;
  }

  function getCategory(id) {
    return glass.categories.find(c => c.id === id) || null;
  }

  function getSubcategory(catId, subId) {
    const cat = getCategory(catId);
    return cat ? (cat.subcategories.find(s => s.id === subId) || null) : null;
  }

  function getSystem(code) {
    return pernia.systems.find(s => s.code === code) || null;
  }

  /* ── Related products (siblings + tier + mirror + acidada + film) ─ */

  function getRelated(code) {
    const product = getProduct(code);
    if (!product) return [];
    const rel = product.relations || {};
    const out = [];

    // version espejo (the mirrored version of this glass)
    if (rel.esVersionEspejoDe) {
      const target = getProduct(rel.esVersionEspejoDe);
      if (target) out.push({ kind: 'es-version-espejo-de',         product: target });
    }
    // glass that THIS mirror is the espejo of (inverse)
    glass.products.forEach(p => {
      if (p.relations && p.relations.esVersionEspejoDe === code) {
        out.push({ kind: 'tiene-version-espejo', product: p });
      }
    });
    // tier alternativo
    if (rel.esTierAlternativoDe) {
      const target = getProduct(rel.esTierAlternativoDe);
      if (target) out.push({ kind: 'es-tier-alternativo-de',       product: target });
    }
    if (rel.tieneTierAlternativo) {
      const target = getProduct(rel.tieneTierAlternativo);
      if (target) out.push({ kind: 'tiene-tier-alternativo',       product: target });
    }
    // variantes de color
    (rel.variantesDeColor || []).forEach(siblingCode => {
      if (siblingCode === code) return;
      const target = getProduct(siblingCode);
      if (target) out.push({ kind: 'variante-de-color',            product: target });
    });
    // acidada
    if (rel.esVersionAcidadaDe) {
      const target = getProduct(rel.esVersionAcidadaDe);
      if (target) out.push({ kind: 'es-version-acidada-de',        product: target });
    }
    // con film
    if (rel.esVersionConFilmDe) {
      const target = getProduct(rel.esVersionConFilmDe);
      if (target) out.push({ kind: 'es-version-con-film-de',       product: target });
    }
    // comparte familia (mesh series members)
    (rel.comparteFamiliaCon || []).slice(0, 4).forEach(famCode => {
      const target = getProduct(famCode);
      if (target) out.push({ kind: 'comparte-familia-con',         product: target });
    });

    return out;
  }

  /* ── Pernia: systems that use this glass type ─────────── */

  function getCompatiblePerniaSystems(_glassCode) {
    // All 8 GLSS systems are universally 8mm laminated — they're
    // compatible with every Glass Lab product (the laminated mesh inserts
    // become the front layer of the system's 8mm laminated glass).
    return pernia.systems.filter(s => s.availability !== 'proximamente');
  }

  /* ── Distinct facet values present in the catalog ─────── */

  function getFacets() {
    const out = {
      acabado: new Set(), patron: new Set(), disponibilidad: new Set(),
      personalizacionColor: new Set(), tier: new Set(), subcategory: new Set()
    };
    glass.products.forEach(p => {
      const a = p.attributes || {};
      (a.acabado || []).forEach(v => out.acabado.add(v));
      if (a.patron) out.patron.add(a.patron);
      if (a.disponibilidad) out.disponibilidad.add(a.disponibilidad);
      if (a.personalizacionColor) out.personalizacionColor.add(a.personalizacionColor);
      if (a.tier) out.tier.add(a.tier);
      if (p.subcategory) out.subcategory.add(p.subcategory);
    });
    Object.keys(out).forEach(k => { out[k] = Array.from(out[k]).sort(); });
    return out;
  }

  /* ── URL helpers ─────────────────────────────────────── */

  function getCodeFromUrl(fallback = null) {
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || fallback;
  }

  return {
    glass,
    pernia,
    helpers: {
      getProduct, getCategory, getSubcategory, getSystem,
      getRelated, getCompatiblePerniaSystems,
      getFacets, getCodeFromUrl
    }
  };
})();

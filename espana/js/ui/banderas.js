/* Banderas de las comunidades y ciudades autónomas, dibujadas en SVG (redibujos simplificados: los escudos son esquemáticos).
   Uso: C.Banderas.svg('CAT', { h: 18 }) → <svg> en línea · C.Banderas.nombre(E, id) → bandera + nombre · C.Banderas.dentro('CAT', x, y, w) → trozo para anidar en otro SVG. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, esc = U.esc;
  const W = 60, H = 40, ORO = '#FCDD09', ROJO = '#DA121A', CARMESI = '#B5122C';
  const f1 = n => Math.round(n * 10) / 10;
  const estrella = (cx, cy, r, fill) => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.4 : r; p.push(f1(cx + rr * Math.cos(a)) + ',' + f1(cy + rr * Math.sin(a))); } return `<polygon points="${p.join(' ')}" fill="${fill}"/>`; };
  /* Escudo esquemático centrado en (cx, cy); s = alto en unidades de la bandera. */
  const escudo = (cx, cy, s, fill, borde, tinta) => { const w = s * 0.78, x = cx - w / 2, y = cy - s / 2; return `<path d="M${f1(x)} ${f1(y)} H${f1(x + w)} V${f1(y + s * 0.52)} Q${f1(x + w)} ${f1(y + s * 0.92)} ${f1(cx)} ${f1(y + s)} Q${f1(x)} ${f1(y + s * 0.92)} ${f1(x)} ${f1(y + s * 0.52)} Z" fill="${fill}" stroke="${borde || '#6b5a1e'}" stroke-width="0.7"/>${tinta ? `<path d="M${f1(cx - w * 0.28)} ${f1(cy + s * 0.18)} V${f1(cy - s * 0.12)} L${f1(cx - w * 0.16)} ${f1(cy - s * 0.02)} L${f1(cx)} ${f1(cy - s * 0.24)} L${f1(cx + w * 0.16)} ${f1(cy - s * 0.02)} L${f1(cx + w * 0.28)} ${f1(cy - s * 0.12)} V${f1(cy + s * 0.18)} Z" fill="${tinta}"/>` : ''}`; };
  const corona = (cx, cy, w, fill) => `<path d="M${f1(cx - w / 2)} ${f1(cy)} l${f1(w * 0.08)} ${f1(-w * 0.34)} l${f1(w * 0.2)} ${f1(w * 0.18)} l${f1(w * 0.22)} ${f1(-w * 0.3)} l${f1(w * 0.22)} ${f1(w * 0.3)} l${f1(w * 0.2)} ${f1(-w * 0.18)} l${f1(w * 0.08)} ${f1(w * 0.34)} Z" fill="${fill}" stroke="#6b5a1e" stroke-width="0.4"/>`;
  const castillo = (cx, cy, w, fill) => { const h = w * 0.8; return `<g fill="${fill}"><rect x="${f1(cx - w / 2)}" y="${f1(cy - h / 4)}" width="${f1(w)}" height="${f1(h * 0.75)}"/><rect x="${f1(cx - w * 0.32)}" y="${f1(cy - h * 0.6)}" width="${f1(w * 0.64)}" height="${f1(h * 0.4)}"/><rect x="${f1(cx - w / 2)}" y="${f1(cy - h * 0.4)}" width="${f1(w * 0.18)}" height="${f1(h * 0.18)}"/><rect x="${f1(cx + w * 0.32)}" y="${f1(cy - h * 0.4)}" width="${f1(w * 0.18)}" height="${f1(h * 0.18)}"/><rect x="${f1(cx - w * 0.12)}" y="${f1(cy - h * 0.78)}" width="${f1(w * 0.24)}" height="${f1(h * 0.2)}"/></g><rect x="${f1(cx - w * 0.1)}" y="${f1(cy + h * 0.1)}" width="${f1(w * 0.2)}" height="${f1(h * 0.4)}" fill="#3a2a1a" opacity=".55"/>`; };
  const leon = (cx, cy, s, fill) => `<g fill="${fill}"><ellipse cx="${f1(cx)}" cy="${f1(cy + s * 0.12)}" rx="${f1(s * 0.34)}" ry="${f1(s * 0.2)}"/><circle cx="${f1(cx + s * 0.22)}" cy="${f1(cy - s * 0.14)}" r="${f1(s * 0.16)}"/><path d="M${f1(cx - s * 0.3)} ${f1(cy + s * 0.12)} q${f1(-s * 0.26)} ${f1(-s * 0.1)} ${f1(-s * 0.1)} ${f1(-s * 0.36)} q${f1(s * 0.02)} ${f1(s * 0.2)} ${f1(s * 0.14)} ${f1(s * 0.22)} Z"/><rect x="${f1(cx - s * 0.2)}" y="${f1(cy + s * 0.22)}" width="${f1(s * 0.09)}" height="${f1(s * 0.26)}"/><rect x="${f1(cx + s * 0.1)}" y="${f1(cy + s * 0.22)}" width="${f1(s * 0.09)}" height="${f1(s * 0.26)}"/></g>`;
  const franjas = (cols, vertical) => cols.map((c, i) => vertical ? `<rect x="${f1(W / cols.length * i)}" y="0" width="${f1(W / cols.length + 0.2)}" height="${H}" fill="${c}"/>` : `<rect x="0" y="${f1(H / cols.length * i)}" width="${W}" height="${f1(H / cols.length + 0.2)}" fill="${c}"/>`).join('');
  const senyera = (x0 = 0, w = W) => Array.from({ length: 9 }, (_, i) => `<rect x="${x0}" y="${f1(H / 9 * i)}" width="${w}" height="${f1(H / 9 + 0.2)}" fill="${i % 2 ? ROJO : ORO}"/>`).join('');

  /* Cada bandera es una cadena SVG en un lienzo de 60 × 40. */
  const BAND = {
    AND: () => franjas(['#007A33', '#fff', '#007A33']) + `<circle cx="30" cy="20" r="5.4" fill="#fff" stroke="#7a6a2b" stroke-width="0.9"/><circle cx="30" cy="20" r="3.2" fill="#c8a64b"/><rect x="26.4" y="16.5" width="1.4" height="7" fill="#7a6a2b"/><rect x="32.2" y="16.5" width="1.4" height="7" fill="#7a6a2b"/>`,
    ARA: () => senyera() + `<rect x="2" y="2.5" width="13" height="15" fill="${ORO}" stroke="${ROJO}" stroke-width="1"/><path d="M8.5 2.5 V17.5 M2 8 H15" stroke="${ROJO}" stroke-width="1.6"/>`,
    AST: () => `<rect width="60" height="40" fill="#0066B3"/><path d="M26.5 5 H33.5 L32.6 14 H42 V21 H32.6 L33.5 35 H26.5 L27.4 21 H18 V14 H27.4 Z" fill="#FFD200" stroke="#c9a200" stroke-width="0.5"/><circle cx="30" cy="17.5" r="2" fill="#0066B3"/>`,
    BAL: () => senyera() + `<rect x="0" y="0" width="25" height="22" fill="#6a2c91"/>` + castillo(12.5, 12, 12, '#fff'),
    CAN: () => franjas(['#fff', '#0033A0', '#FFDD00'], true) + escudo(30, 20, 11, '#f4d35e', '#7a6a2b') + `<circle cx="30" cy="20" r="2" fill="#0033A0"/>`,
    CNT: () => `<rect width="60" height="20" fill="#fff"/><rect y="20" width="60" height="20" fill="#C8102E"/>` + escudo(30, 20, 14, '#fff', '#7a6a2b') + `<circle cx="30" cy="20" r="3" fill="#C8102E"/>`,
    CLM: () => `<rect width="60" height="40" fill="${CARMESI}"/>` + escudo(30, 20, 18, '#f1d65d', '#7a6a2b') + castillo(30, 21, 8, '#b5122c'),
    CYL: () => `<rect width="30" height="20" fill="${CARMESI}"/><rect x="30" width="30" height="20" fill="#fff"/><rect y="20" width="30" height="20" fill="#fff"/><rect x="30" y="20" width="30" height="20" fill="${CARMESI}"/>` + castillo(15, 11, 12, '#f1d65d') + leon(45, 10, 14, '#7a3b8f') + leon(15, 30, 14, '#7a3b8f') + castillo(45, 31, 12, '#f1d65d'),
    CAT: () => senyera(),
    VAL: () => senyera() + `<rect x="0" y="0" width="13" height="40" fill="#1a4fa3"/>` + corona(6.5, 14, 9, '#f1d65d') + `<path d="M6.5 14 V22" stroke="#f1d65d" stroke-width="0.8"/>`,
    EXT: () => franjas(['#00A04A', '#fff', '#111']) + escudo(30, 20, 14, '#f2f2f2', '#6b5a1e') + `<circle cx="30" cy="20" r="3.4" fill="#c33"/><path d="M26.8 23.4 H33.2" stroke="#2a7a2a" stroke-width="1.2"/>`,
    GAL: () => `<rect width="60" height="40" fill="#fff"/><polygon points="0,0 11,0 60,31 60,40 49,40 0,9" fill="#0A5EA8"/>` + escudo(30, 20, 10, '#fff', '#c8a64b') + `<circle cx="30" cy="19.5" r="2.2" fill="#c8a64b"/>`,
    MAD: () => `<rect width="60" height="40" fill="#C8102E"/>` + [[14, 12], [25, 12], [35, 12], [46, 12], [19.5, 27], [30, 27], [40.5, 27]].map(([x, y]) => estrella(x, y, 5, '#fff')).join(''),
    MUR: () => `<rect width="60" height="40" fill="${CARMESI}"/>` + corona(30, 12, 10, '#f1d65d') + escudo(30, 24, 16, '#f1d65d', '#7a6a2b') + castillo(30, 24, 7, '#b5122c'),
    NAV: () => `<rect width="60" height="40" fill="#D2102B"/>` + corona(30, 10, 9, '#f1d65d') + escudo(30, 23, 18, '#d4af37', '#6b5a1e') + `<path d="M25 17 L35 29 M35 17 L25 29 M30 15 V31 M24 23 H36" stroke="#b5122c" stroke-width="0.8"/><circle cx="30" cy="23" r="2.2" fill="#0a8f5a"/>`,
    PVA: () => `<rect width="60" height="40" fill="#D52B1E"/><path d="M0 0 L60 40 M60 0 L0 40" stroke="#009B48" stroke-width="3.6"/><path d="M30 0 V40 M0 20 H60" stroke="#fff" stroke-width="3.8"/>`,
    RIO: () => franjas(['#D52B1E', '#fff', '#3B8F3B', '#F8D200']) + escudo(14, 20, 14, '#f4f0e0', '#6b5a1e') + `<rect x="11.5" y="17" width="5" height="6" fill="#b5122c"/>`,
    CEU: () => `<rect width="60" height="40" fill="#fff"/>` + escudo(30, 20, 20, '#fff', '#7a6a2b') + `<rect x="24" y="12" width="12" height="3" fill="#C8102E"/><rect x="24" y="16" width="12" height="8" fill="#f1d65d"/><path d="M30 15 V30" stroke="#C8102E" stroke-width="1.6"/>`,
    MEL: () => `<rect width="60" height="40" fill="#fff"/>` + escudo(30, 20, 20, '#fff', '#7a6a2b') + castillo(30, 21, 12, '#C8102E')
  };

  const Bn = C.Banderas = {
    ids: () => Object.keys(BAND),
    tiene: id => !!BAND[id],
    /* Trozo SVG (lienzo 60 × 40) para anidar en otro SVG, ya posicionado y con borde. */
    dentro(id, x, y, w) { if (!BAND[id]) return ''; const h = w * H / W; return `<svg x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" viewBox="0 0 ${W} ${H}">${BAND[id]()}<rect width="${W}" height="${H}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.2"/></svg>`; },
    /* Bandera en línea; o.h = alto en px (por defecto 16). */
    svg(id, o = {}) {
      if (!BAND[id]) return '';
      const h = o.h || 16, w = Math.round(h * 1.5), nom = (C.DATA && C.DATA.ccaa && C.DATA.ccaa[id] && C.DATA.ccaa[id].nombre) || id;
      return `<svg class="bnd" viewBox="0 0 ${W} ${H}" width="${w}" height="${h}" role="img" aria-label="Bandera de ${esc(nom)}" xmlns="http://www.w3.org/2000/svg">${BAND[id]()}</svg>`;
    },
    /* Bandera seguida del nombre de la comunidad. */
    nombre(E, id, o = {}) { const d = C.DATA && C.DATA.ccaa && C.DATA.ccaa[id]; return `<span class="bnd-nombre">${Bn.svg(id, o)}<span>${esc(d ? d.nombre : id)}</span></span>`; },
    /* Sólo la bandera, o nada si no existe (para antepuesta a textos). */
    mini(id, h) { return BAND[id] ? Bn.svg(id, { h: h || 13 }) + ' ' : ''; }
  };
})(window.ESP);

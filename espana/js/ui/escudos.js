/* Escudos de los 66 grandes ayuntamientos, dibujados en SVG. Son esquemáticos: figuras sencillas inspiradas en elementos tradicionales de cada ciudad
   (castillo, puente, faro, nave…), no los escudos oficiales. Las ciudades sin figura propia reciben una generada a partir de su identificador.
   Uso: C.Escudos.svg('m_mad', { h: 28 }) → <svg> en línea · C.Escudos.mini('m_mad', 14) → escudo antepuesto a un texto · C.Escudos.nombre(E, id). */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, esc = U.esc;
  const f1 = n => Math.round(n * 10) / 10;
  const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  // Esmaltes heráldicos
  const T = { gules: '#C0262D', azur: '#2A5CA8', oro: '#E9C24A', plata: '#F1F1EC', sinople: '#2E8B57', sable: '#2B2B33', purpura: '#7A3E8E', cielo: '#4FA3D9' };
  const OSC = new Set(['gules', 'azur', 'sinople', 'sable', 'purpura']);
  const tinta = c => OSC.has(c) ? T.plata : T.sable;

  /* Figuras en un lienzo de 40 × 46 (centro 20, 25). f = color de la figura, g = color de contraste. */
  const FIG = {
    castillo: (f, g) => `<g fill="${f}"><rect x="10" y="19" width="20" height="16"/><rect x="10" y="14" width="4" height="6"/><rect x="18" y="14" width="4" height="6"/><rect x="26" y="14" width="4" height="6"/></g><path d="M17 35 V28 Q20 24 23 28 V35 Z" fill="${g}"/><rect x="13" y="22" width="3" height="4" fill="${g}"/><rect x="24" y="22" width="3" height="4" fill="${g}"/>`,
    torre: (f, g) => `<g fill="${f}"><rect x="14" y="14" width="12" height="22"/><rect x="12" y="10" width="3.2" height="6"/><rect x="18.4" y="10" width="3.2" height="6"/><rect x="24.8" y="10" width="3.2" height="6"/></g><path d="M18 36 V30 Q20 27 22 30 V36 Z" fill="${g}"/><rect x="18.5" y="19" width="3" height="5" fill="${g}"/>`,
    leon: (f, g) => `<g fill="${f}"><ellipse cx="19" cy="28" rx="9" ry="6"/><circle cx="26" cy="20" r="5.5"/><path d="M11 25 q-4 -5 -1 -10 q3 4 4 7 Z"/><rect x="13" y="31" width="3" height="6"/><rect x="21" y="31" width="3" height="6"/></g><circle cx="27.5" cy="19" r="1" fill="${g}"/><path d="M22 14 l2 -3 l2 2.5 l2 -2.5 l2 3 Z" fill="${f}"/>`,
    arbol: (f, g) => `<rect x="18.4" y="27" width="3.2" height="11" fill="${g}"/><g fill="${f}"><circle cx="20" cy="19" r="8"/><circle cx="14" cy="24" r="5"/><circle cx="26" cy="24" r="5"/></g>`,
    puente: (f, g) => `<g fill="${f}"><rect x="6" y="20" width="28" height="5"/><rect x="6" y="25" width="28" height="12"/></g><path d="M9 37 V31 Q13 26 17 31 V37 Z M23 37 V31 Q27 26 31 31 V37 Z" fill="${g}"/>`,
    cruz: (f) => `<path d="M17.5 9 H22.5 V20 H33 V25 H22.5 V40 H17.5 V25 H7 V20 H17.5 Z" fill="${f}"/>`,
    llaves: (f) => `<g fill="none" stroke="${f}" stroke-width="3" stroke-linecap="round"><path d="M12 36 L26 14"/><path d="M28 36 L14 14"/></g><g fill="${f}"><circle cx="26.5" cy="13" r="4.2"/><circle cx="13.5" cy="13" r="4.2"/></g>`,
    estrella: (f) => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6 : 14; p.push(f1(20 + r * Math.cos(a)) + ',' + f1(25 + r * Math.sin(a))); } return `<polygon points="${p.join(' ')}" fill="${f}"/>`; },
    ola: (f) => `<g fill="none" stroke="${f}" stroke-width="3" stroke-linecap="round"><path d="M7 20 q4 -5 8 0 t8 0 t8 0"/><path d="M7 28 q4 -5 8 0 t8 0 t8 0"/><path d="M7 36 q4 -5 8 0 t8 0 t8 0"/></g>`,
    montana: (f, g) => `<path d="M5 37 L16 15 L22 25 L27 18 L35 37 Z" fill="${f}"/><path d="M16 15 L19.5 21 L16 20 L13 22 Z" fill="${g}"/>`,
    nave: (f, g) => `<path d="M7 29 H33 L29 37 H11 Z" fill="${f}"/><rect x="19" y="10" width="2" height="19" fill="${f}"/><path d="M21 12 L31 26 H21 Z" fill="${g}"/><path d="M19 15 L10 26 H19 Z" fill="${g}"/>`,
    corona: (f, g) => `<path d="M8 32 L10 16 L16 23 L20 12 L24 23 L30 16 L32 32 Z" fill="${f}"/><rect x="8" y="32" width="24" height="5" fill="${f}"/><circle cx="20" cy="12" r="1.8" fill="${g}"/>`,
    sol: (f) => `<circle cx="20" cy="25" r="6.5" fill="${f}"/><g stroke="${f}" stroke-width="2.2" stroke-linecap="round">${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<line x1="${f1(20 + 9.5 * Math.cos(a))}" y1="${f1(25 + 9.5 * Math.sin(a))}" x2="${f1(20 + 13.5 * Math.cos(a))}" y2="${f1(25 + 13.5 * Math.sin(a))}"/>`; }).join('')}</g>`,
    faro: (f, g) => `<path d="M16 37 L18 17 H22 L24 37 Z" fill="${f}"/><rect x="16.5" y="12" width="7" height="6" fill="${g}"/><path d="M15 12 H25 L20 7 Z" fill="${f}"/><path d="M6 37 H34" stroke="${f}" stroke-width="2.4"/><path d="M13 15 L5 12 M27 15 L35 12" stroke="${f}" stroke-width="1.6"/>`,
    espiga: (f) => `<g fill="${f}"><rect x="19.2" y="14" width="1.6" height="24"/>${[0, 1, 2, 3, 4].map(i => `<ellipse cx="15.5" cy="${17 + i * 4.6}" rx="3.6" ry="1.8" transform="rotate(-25 15.5 ${17 + i * 4.6})"/><ellipse cx="24.5" cy="${17 + i * 4.6}" rx="3.6" ry="1.8" transform="rotate(25 24.5 ${17 + i * 4.6})"/>`).join('')}</g>`,
    barras: (f, g) => `<g>${[0, 1, 2, 3].map(i => `<rect x="${7 + i * 6.5}" y="9" width="3.6" height="30" fill="${f}"/>`).join('')}</g>`,
    arcos: (f, g) => `<g fill="${f}"><rect x="5" y="16" width="30" height="5"/><rect x="5" y="21" width="30" height="15"/></g><path d="M8 36 V28 Q11.5 22 15 28 V36 Z M17.5 36 V28 Q21 22 24.5 28 V36 Z M27 36 V28 Q30.5 22 34 28 V36 Z" fill="${g}"/>`,
    concha: (f) => `<g fill="${f}"><path d="M20 36 L8 22 Q8 12 20 12 Q32 12 32 22 Z"/></g><g stroke="${T.sable}" stroke-width="0.9" opacity=".55" fill="none"><path d="M20 36 L20 13 M20 36 L13 14 M20 36 L27 14 M20 36 L9 20 M20 36 L31 20"/></g>`,
    palmera: (f, g) => `<rect x="18.6" y="20" width="2.8" height="18" fill="${g}"/><g fill="${f}"><path d="M20 20 Q10 12 5 17 Q12 15 20 21 Z"/><path d="M20 20 Q30 12 35 17 Q28 15 20 21 Z"/><path d="M20 20 Q14 8 8 8 Q16 10 20 20 Z"/><path d="M20 20 Q26 8 32 8 Q24 10 20 20 Z"/></g>`,
    toro: (f, g) => `<g fill="${f}"><ellipse cx="19" cy="28" rx="10" ry="6"/><circle cx="29" cy="23" r="4.8"/><rect x="11" y="31" width="3" height="7"/><rect x="22" y="31" width="3" height="7"/></g><path d="M26 19 q-4 -6 -7 -5 M32 19 q4 -6 7 -5" fill="none" stroke="${f}" stroke-width="1.8" stroke-linecap="round"/><circle cx="30.5" cy="22.5" r="0.9" fill="${g}"/>`,
    uvas: (f, g) => `<g fill="${f}">${[[15, 18], [20, 18], [25, 18], [17.5, 23], [22.5, 23], [20, 28], [20, 33]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.8"/>`).join('')}</g><path d="M20 9 q-1 4 -3 5 M20 9 q4 0 6 3" fill="none" stroke="${g}" stroke-width="1.6" stroke-linecap="round"/>`,
    rueda: (f, g) => `<circle cx="20" cy="25" r="11" fill="${f}"/><circle cx="20" cy="25" r="4" fill="${g}"/><g stroke="${g}" stroke-width="1.6">${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<line x1="${f1(20 + 5 * Math.cos(a))}" y1="${f1(25 + 5 * Math.sin(a))}" x2="${f1(20 + 9.5 * Math.cos(a))}" y2="${f1(25 + 9.5 * Math.sin(a))}"/>`; }).join('')}</g>`,
    luna: (f) => `<path d="M26 11 A14 14 0 1 0 26 39 A11 11 0 1 1 26 11 Z" fill="${f}"/>`,
    aguila: (f, g) => `<g fill="${f}"><path d="M20 15 L24 20 L36 14 L31 27 L25 28 L20 38 L15 28 L9 27 L4 14 L16 20 Z"/><circle cx="20" cy="15" r="3.4"/></g><path d="M20 15 L23.5 16 L20 18 Z" fill="${g}"/>`
  };
  const NOMBRES = Object.keys(FIG);

  /* Figuras tradicionales de cada ciudad: [campo, figura, color de la figura, figura 2 opcional (cabeza)]. Las que faltan se generan. */
  const E0 = {
    m_mad: ['plata', 'arbol', 'sinople'], m_bcn: ['oro', 'cruz', 'gules'], m_vlc: ['oro', 'corona', 'gules'], m_sev: ['gules', 'torre', 'oro'], m_zar: ['plata', 'leon', 'gules'], m_mal: ['azur', 'castillo', 'oro'],
    m_mur: ['gules', 'castillo', 'oro'], m_pal2: ['plata', 'torre', 'gules'], m_lpa: ['azur', 'palmera', 'oro'], m_bil: ['plata', 'puente', 'gules'], m_ali: ['oro', 'castillo', 'gules'], m_cor: ['plata', 'puente', 'gules'],
    m_vll: ['gules', 'castillo', 'oro'], m_vig: ['azur', 'nave', 'oro'], m_gij: ['azur', 'sol', 'oro'], m_aco: ['plata', 'faro', 'azur'], m_gra: ['azur', 'estrella', 'oro'], m_ovi: ['azur', 'cruz', 'oro'], m_snt: ['plata', 'nave', 'gules'],
    m_pam: ['gules', 'cruz', 'oro'], m_log: ['plata', 'puente', 'gules'], m_ssb: ['azur', 'nave', 'plata'], m_vit: ['plata', 'castillo', 'gules'], m_bur: ['gules', 'castillo', 'oro'], m_leo: ['plata', 'leon', 'gules'],
    m_sal: ['plata', 'toro', 'sable'], m_seg: ['gules', 'arcos', 'plata'], m_avi: ['plata', 'castillo', 'gules'], m_tol: ['gules', 'castillo', 'oro'], m_cad: ['azur', 'torre', 'oro'], m_huv: ['azur', 'nave', 'plata'],
    m_jae: ['gules', 'castillo', 'oro'], m_alm: ['plata', 'sol', 'gules'], m_car: ['azur', 'nave', 'oro'], m_ceu: ['plata', 'cruz', 'gules'], m_mel: ['plata', 'castillo', 'gules'], m_jer: ['oro', 'uvas', 'purpura'],
    m_tfe: ['plata', 'cruz', 'azur'], m_gir: ['plata', 'torre', 'gules'], m_tar: ['oro', 'castillo', 'gules'], m_lle: ['plata', 'castillo', 'gules'], m_hos: ['plata', 'rueda', 'gules'], m_bad: ['azur', 'ola', 'plata'], m_ter2: ['plata', 'rueda', 'azur'],
    m_sab: ['oro', 'rueda', 'gules'], m_elc: ['gules', 'palmera', 'oro'], m_alb: ['plata', 'espiga', 'gules'], m_cre: ['plata', 'castillo', 'azur'], m_cue: ['oro', 'estrella', 'gules'], m_gua: ['azur', 'castillo', 'oro'],
    m_cac: ['plata', 'estrella', 'gules'], m_bda: ['gules', 'castillo', 'oro'], m_cas: ['plata', 'estrella', 'azur'], m_hue: ['plata', 'montana', 'azur'], m_ter: ['azur', 'toro', 'oro'], m_zam: ['plata', 'puente', 'azur'],
    m_pal: ['plata', 'cruz', 'gules'], m_sor: ['plata', 'montana', 'gules'], m_lug: ['plata', 'arcos', 'gules'], m_our: ['plata', 'puente', 'azur'], m_pon: ['azur', 'concha', 'oro'],
    m_mos: ['azur', 'rueda', 'oro'], m_alc: ['oro', 'torre', 'azur'], m_fue: ['gules', 'rueda', 'plata'], m_leg: ['plata', 'arbol', 'sinople'], m_get: ['azur', 'aguila', 'oro']
  };

  /* Escudo español: forma cuadrilonga con la punta redondeada. */
  const FORMA = 'M4 8 H36 V27 Q36 41 20 46 Q4 41 4 27 Z';
  const generar = id => { const h = hash(id), cs = Object.keys(T), campo = cs[h % 6], fig = NOMBRES[(h >>> 3) % NOMBRES.length], col = ['oro', 'plata', 'gules', 'azur', 'sinople', 'sable'].filter(c => c !== campo)[(h >>> 7) % 5]; return [campo, fig, col]; };
  /* Las combinaciones repetidas se distinguen cambiando el color de la figura (y, si hace falta, el campo). */
  let CACHE = null;
  const todos = () => {
    if (CACHE) return CACHE; CACHE = {}; const usados = new Set(), cols = ['oro', 'plata', 'gules', 'azur', 'sinople', 'sable', 'purpura'];
    const ids = (C.DATA && C.DATA.municipios ? C.DATA.municipios.map(m => m[0]) : []).concat(Object.keys(E0));
    for (const id of ids) {
      if (CACHE[id]) continue; let [c, f, col] = E0[id] || generar(id), n = 0;
      while (usados.has(c + f + col) && n < 40) { n++; col = cols[(cols.indexOf(col) + 1) % cols.length]; if (col === c) col = cols[(cols.indexOf(col) + 1) % cols.length]; if (n % 7 === 0) c = cols[(cols.indexOf(c) + 1) % cols.length]; if (c === col) col = cols[(cols.indexOf(col) + 1) % cols.length]; }
      usados.add(c + f + col); CACHE[id] = [c, f, col];
    }
    return CACHE;
  };
  const blasonDe = id => todos()[id] || E0[id] || generar(id);
  const corona = () => `<path d="M8 8 V3 h3 v2 h3 v-2 h3 v2 h3 v-2 h3 v2 h3 v-2 h3 v5 Z" fill="#B88A2F" stroke="#7a5a1c" stroke-width="0.6"/>`;

  const Es = C.Escudos = {
    ids: () => Object.keys(E0),
    tiene: id => !!(C.DATA && C.DATA.municipios && C.DATA.municipios.some(m => m[0] === id)) || !!E0[id],
    blason: blasonDe,
    /* Fragmento SVG (lienzo 40 × 50) para anidar en otras escenas. */
    dentro(id, x, y, w) { const [campo, fig, col] = blasonDe(id), fg = FIG[fig](T[col], T[campo]); return `<svg x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(w * 1.25)}" viewBox="0 0 40 50">${corona()}<path d="${FORMA}" fill="${T[campo]}" stroke="#3a3a42" stroke-width="1.2"/><g transform="translate(0 2)">${fg}</g></svg>`; },
    /* Escudo en línea; o.h = alto en px (por defecto 18). */
    svg(id, o = {}) {
      const h = o.h || 18, w = Math.round(h * 0.8), m = C.DATA && C.DATA.municipios && C.DATA.municipios.find(x => x[0] === id), nom = m ? m[1] : id, [campo, fig, col] = blasonDe(id);
      return `<svg class="esc" viewBox="0 0 40 50" width="${w}" height="${h}" role="img" aria-label="Escudo esquemático de ${esc(nom)}" xmlns="http://www.w3.org/2000/svg">${corona()}<path d="${FORMA}" fill="${T[campo]}" stroke="#3a3a42" stroke-width="1.2"/><g transform="translate(0 2)">${FIG[fig](T[col], T[campo])}</g></svg>`;
    },
    nombre(E, id, o = {}) { const m = E && E.esp && E.esp.muni && E.esp.muni.m[id]; return `<span class="esc-nombre">${Es.svg(id, o)}<span>${esc(m ? m.nombre : id)}</span></span>`; },
    /* Sólo el escudo, seguido de un espacio (para antepuesto a textos). */
    mini(id, h) { return Es.svg(id, { h: h || 15 }) + ' '; }
  };
})(window.ESP);

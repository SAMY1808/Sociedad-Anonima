/* Logotipos de los partidos, dibujados en SVG: una insignia en el color del partido con una figura según su familia política (arquetipo).
   Son emblemas ficticios y esquemáticos. Los partidos creados por el jugador conservan su logotipo elegido (un emoji).
   Uso: C.Logos.svg(E, 'ES_ASD', { h: 36 }) → <svg> en línea · C.Logos.mini(E, pid, 14) → insignia antepuesta a un texto · C.Logos.dentro(E, pid, x, y, w) → para anidar en una escena. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, esc = U.esc;
  const f1 = n => Math.round(n * 10) / 10;
  const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const hex = c => { const m = /^#?([0-9a-f]{6})$/i.exec(String(c || '')); const n = m ? parseInt(m[1], 16) : 0x556070; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mezcla = (c, d, k) => { const a = hex(c), b = hex(d); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
  const lum = c => { const [r, g, b] = hex(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

  /* Figuras en un lienzo de 40 × 40; f = color de la figura. */
  const FIG = {
    estrella: f => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6 : 14; p.push(f1(20 + r * Math.cos(a)) + ',' + f1(21 + r * Math.sin(a))); } return `<polygon points="${p.join(' ')}" fill="${f}"/>`; },
    rosa: f => `<g fill="${f}">${Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return `<circle cx="${f1(20 + 7 * Math.cos(a))}" cy="${f1(20 + 7 * Math.sin(a))}" r="5.6"/>`; }).join('')}</g><circle cx="20" cy="20" r="3.4" fill="${mezcla(f, '#000000', 0.4)}"/><path d="M20 28 V37" stroke="${f}" stroke-width="2.4" stroke-linecap="round"/>`,
    hoja: f => `<path d="M9 31 Q8 11 31 9 Q33 30 12 32 Z" fill="${f}"/><path d="M10 31 Q18 22 26 14" stroke="${mezcla(f, '#000000', 0.45)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
    antorcha: f => `<path d="M20 5 Q28 14 24 21 Q22 17 20 18 Q17 14 20 5 Z" fill="${f}"/><path d="M14 22 H26 L23 36 H17 Z" fill="${f}"/><rect x="15" y="22" width="10" height="2.4" fill="${mezcla(f, '#000000', 0.4)}"/>`,
    balanza: f => `<circle cx="14" cy="20" r="9" fill="none" stroke="${f}" stroke-width="3"/><circle cx="26" cy="20" r="9" fill="none" stroke="${f}" stroke-width="3"/>`,
    cruz: f => `<path d="M17.5 6 H22.5 V16 H33 V21 H22.5 V35 H17.5 V21 H7 V16 H17.5 Z" fill="${f}"/>`,
    espiga: f => `<g fill="${f}"><rect x="19.2" y="9" width="1.6" height="27"/>${[0, 1, 2, 3, 4].map(i => `<ellipse cx="15.5" cy="${12 + i * 5}" rx="3.8" ry="1.9" transform="rotate(-25 15.5 ${12 + i * 5})"/><ellipse cx="24.5" cy="${12 + i * 5}" rx="3.8" ry="1.9" transform="rotate(25 24.5 ${12 + i * 5})"/>`).join('')}</g>`,
    montana: f => `<path d="M4 33 L15 12 L21 22 L26 15 L36 33 Z" fill="${f}"/><circle cx="29" cy="9" r="3.4" fill="${f}"/>`,
    torre: f => `<g fill="${f}"><rect x="12" y="13" width="16" height="23"/><rect x="10" y="8" width="4" height="7"/><rect x="18" y="8" width="4" height="7"/><rect x="26" y="8" width="4" height="7"/></g><path d="M17 36 V28 Q20 24 23 28 V36 Z" fill="${mezcla(f, '#000000', 0.55)}"/>`,
    rayos: f => `<g stroke="${f}" stroke-width="3.4" stroke-linecap="round">${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<line x1="${f1(20 + 5 * Math.cos(a))}" y1="${f1(21 + 5 * Math.sin(a))}" x2="${f1(20 + 14 * Math.cos(a))}" y2="${f1(21 + 14 * Math.sin(a))}"/>`; }).join('')}</g><circle cx="20" cy="21" r="4" fill="${f}"/>`,
    chevron: f => `<path d="M6 25 L20 9 L34 25 L34 32 L20 17 L6 32 Z" fill="${f}"/>`,
    sol: f => `<circle cx="20" cy="21" r="7" fill="${f}"/><g stroke="${f}" stroke-width="2.4" stroke-linecap="round">${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<line x1="${f1(20 + 10 * Math.cos(a))}" y1="${f1(21 + 10 * Math.sin(a))}" x2="${f1(20 + 14 * Math.cos(a))}" y2="${f1(21 + 14 * Math.sin(a))}"/>`; }).join('')}</g>`,
    arbol: f => `<rect x="18.4" y="24" width="3.2" height="12" fill="${f}"/><g fill="${f}"><circle cx="20" cy="15" r="8"/><circle cx="13.5" cy="21" r="5"/><circle cx="26.5" cy="21" r="5"/></g>`,
    ola: f => `<g fill="none" stroke="${f}" stroke-width="3.2" stroke-linecap="round"><path d="M6 14 q4.5 -5 9 0 t9 0 t9 0"/><path d="M6 23 q4.5 -5 9 0 t9 0 t9 0"/><path d="M6 32 q4.5 -5 9 0 t9 0 t9 0"/></g>`,
    escudo: f => `<path d="M9 8 H31 V22 Q31 32 20 36 Q9 32 9 22 Z" fill="${f}"/>`
  };
  /* Figura por familia política. */
  const POR_ARQ = { izq: ['estrella', 'rayos'], soc: ['rosa', 'estrella'], ver: ['hoja', 'arbol'], lib: ['antorcha', 'sol'], cen: ['balanza', 'escudo', 'sol'], dem: ['cruz', 'arbol'], agr: ['espiga', 'hoja', 'arbol'], reg: ['montana', 'sol', 'ola', 'arbol', 'hoja', 'torre', 'espiga'], nac: ['torre', 'escudo'], pop: ['rayos', 'estrella'], ext: ['chevron', 'torre'] };

  const figDe = (E, pid) => { const p = E.partidos[pid], l = POR_ARQ[p && p.arq] || ['estrella', 'escudo']; return l[hash(pid) % l.length]; };

  /* Contenido de la insignia en un lienzo de 40 × 40. */
  const insignia = (E, pid, o = {}) => {
    const p = E.partidos[pid]; if (!p) return '';
    const c = p.color || '#556070', claro = lum(c) > 0.62, tx = claro ? mezcla(c, '#000000', 0.7) : '#FFFFFF', grande = !!o.sigla;
    const fondo = `<rect x="1" y="1" width="38" height="38" rx="9" fill="${c}" stroke="${mezcla(c, '#000000', 0.45)}" stroke-width="1.6"/><rect x="1" y="1" width="38" height="14" rx="9" fill="#FFFFFF" opacity=".12"/>`;
    let glifo;
    if (p.logo) glifo = `<text x="20" y="${grande ? 22 : 27}" text-anchor="middle" font-size="${grande ? 18 : 22}">${esc(p.logo)}</text>`;
    else glifo = `<g${grande ? ' transform="translate(6 0.3) scale(0.7)"' : ''}>${FIG[figDe(E, pid)](tx)}</g>`;
    const texto = grande && !p.logo ? `<text x="20" y="35" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="${(p.sigla || '').length > 3 ? 8 : 9.5}" fill="${tx}">${esc((p.sigla || '').slice(0, 4))}</text>` : '';
    return fondo + glifo + texto;
  };

  const Lg = C.Logos = {
    figDe,
    /* Logotipo en línea; o.h = alto en px (por defecto 18); o.sigla = añade la sigla bajo la figura (para tamaños grandes). */
    svg(E, pid, o = {}) {
      const p = E.partidos[pid]; if (!p) return ''; const h = o.h || 18;
      return `<svg class="logo-p" viewBox="0 0 40 40" width="${h}" height="${h}" role="img" aria-label="Logotipo de ${esc(p.nombre)}" xmlns="http://www.w3.org/2000/svg">${insignia(E, pid, { sigla: o.sigla != null ? o.sigla : h >= 30 })}</svg>`;
    },
    /* Sólo la insignia pequeña (sustituye al punto de color en los listados). */
    mini(E, pid, h) { return Lg.svg(E, pid, { h: h || 14, sigla: false }); },
    /* Trozo SVG (lienzo 40 × 40) para anidar en otra escena. */
    dentro(E, pid, x, y, w, o = {}) { const p = E.partidos[pid]; if (!p) return ''; return `<svg x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(w)}" viewBox="0 0 40 40">${insignia(E, pid, { sigla: o.sigla != null ? o.sigla : w >= 30 })}</svg>`; }
  };
})(window.ESP);

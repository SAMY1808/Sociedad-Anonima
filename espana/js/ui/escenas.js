/* Escenas ilustradas para los momentos clave (noche electoral, funeral de Estado, investidura, debate…).
   Cada escena se dibuja en SVG con los colores y las siglas de tu partido. Si en data/imagenes.js se asocia un archivo a una escena
   (por ejemplo una imagen generada con IA), se muestra esa imagen en su lugar; la ilustración queda como respaldo.
   Uso: C.Escenas.html(E, 'noche_victoria', { pid, compacta, leyenda }). */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, esc = U.esc;
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const f1 = n => Math.round(n * 10) / 10;
  const hex = c => /^#[0-9a-f]{6}$/i.test(c || '') ? c : '#c9a24b';
  const mezcla = (a, b, t) => { a = hex(a); b = hex(b); const p = (c, i) => parseInt(c.slice(1 + i * 2, 3 + i * 2), 16); return '#' + [0, 1, 2].map(i => Math.round(p(a, i) * (1 - t) + p(b, i) * t).toString(16).padStart(2, '0')).join(''); };
  const oscuro = (c, t) => mezcla(c, '#000000', t), claro = (c, t) => mezcla(c, '#ffffff', t);
  let N = 0;

  /* ── Piezas ── */
  const persona = (x, y, s, fill, o = {}) => `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(s)})" fill="${fill}"><circle cx="0" cy="-26" r="6.5"/><path d="M-11 0 C-11 -12 -7 -19 0 -19 C7 -19 11 -12 11 0 Z"/>${o.brazo ? '<path d="M7 -15 L17 -34 L20.5 -31.5 L11 -10 Z"/>' : ''}${o.bandera ? `<rect x="15" y="-48" width="1.8" height="30"/><path d="M16.8 -48 h15 v10 h-15 Z" fill="${o.bandera}"/>` : ''}${o.cartel ? `<rect x="-1" y="-58" width="1.8" height="34"/><rect x="-11" y="-72" width="22" height="15" fill="${o.cartel}"/><rect x="-8" y="-69" width="16" height="2" fill="#0b1220" opacity=".55"/><rect x="-8" y="-65" width="11" height="2" fill="#0b1220" opacity=".55"/>` : ''}${o.casco ? `<path d="M-7 -29 C-7 -39 7 -39 7 -29 Z" fill="${o.casco}"/><path d="M0 -37 C6 -48 11 -44 12 -38 C8 -40 4 -38 0 -37 Z" fill="${o.pluma || '#d33'}"/>` : ''}${o.inclinada ? '' : ''}</g>`;
  const multitud = (r, n, x0, x1, y0, y1, cols, s0, s1, o = {}) => {
    const l = []; for (let i = 0; i < n; i++) l.push({ x: x0 + r() * (x1 - x0), y: y0 + r() * (y1 - y0) }); l.sort((a, b) => a.y - b.y);
    return l.map(p => { const k = (p.y - y0) / Math.max(1, y1 - y0), s = s0 + (s1 - s0) * k, c = cols[Math.floor(r() * cols.length)]; const bandera = o.banderas && r() < o.banderas ? o.cols[Math.floor(r() * o.cols.length)] : null, cartel = !bandera && o.carteles && r() < o.carteles ? o.cartelCols[Math.floor(r() * o.cartelCols.length)] : null; return persona(p.x, p.y, s, mezcla(c, '#000000', 0.25 * (1 - k)), { brazo: (bandera || cartel || (o.brazos && r() < o.brazos)), bandera, cartel }); }).join('');
  };
  const foco = (id, x, y, ancho, alto, color, op) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity="${op}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient><polygon points="${x},${y} ${x - ancho / 2},${y + alto} ${x + ancho / 2},${y + alto}" fill="url(#${id})"/>`;
  const grad = (id, a, b, vertical = true) => `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const resplandor = (id, cx, cy, rad, color, op) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${rad}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${color}" stop-opacity="${op}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
  const atril = (x, y, w, c, sigla, o = {}) => `<g><path d="M${x - w / 2} ${y} L${x + w / 2} ${y} L${x + w / 2 - 12} ${y + 70} L${x - w / 2 + 12} ${y + 70} Z" fill="${o.madera || '#2b2118'}"/><path d="M${x - w / 2 + 8} ${y + 8} L${x + w / 2 - 8} ${y + 8} L${x + w / 2 - 18} ${y + 62} L${x - w / 2 + 18} ${y + 62} Z" fill="${c}"/><text x="${x}" y="${y + 42}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="${w > 110 ? 26 : 20}" fill="#fff" letter-spacing="2">${esc(sigla || '')}</text><rect x="${x - w / 2 - 2}" y="${y - 3}" width="${w + 4}" height="6" rx="2" fill="${o.borde || '#111'}"/>${o.micros === false ? '' : `<path d="M${x - 16} ${y - 3} q-2 -22 -10 -30 M${x + 16} ${y - 3} q2 -22 10 -30" stroke="#111" stroke-width="2" fill="none"/><ellipse cx="${x - 26}" cy="${y - 34}" rx="4" ry="6" fill="#222"/><ellipse cx="${x + 26}" cy="${y - 34}" rx="4" ry="6" fill="#222"/>`}</g>`;
  const bandera = (x, y, w, h, c1, c2 = c1) => `<g><rect x="${x - 2}" y="${y}" width="3" height="${h * 3.2}" fill="#9aa4b5"/><path d="M${x + 1} ${y} q${w / 4} 7 ${w / 2} 0 t${w / 2} 0 v${h} q${-w / 4} -7 ${-w / 2} 0 t${-w / 2} 0 Z" fill="${c1}"/>${c2 !== c1 ? `<path d="M${x + 1} ${y + h * 0.33} q${w / 4} 7 ${w / 2} 0 t${w / 2} 0 v${h * 0.34} q${-w / 4} -7 ${-w / 2} 0 t${-w / 2} 0 Z" fill="${c2}"/>` : ''}</g>`;
  const banderaES = (x, y, w, h) => `<g><rect x="${x - 2}" y="${y}" width="3" height="${h * 3.2}" fill="#9aa4b5"/><path d="M${x + 1} ${y} q${w / 4} 6 ${w / 2} 0 t${w / 2} 0 v${h} q${-w / 4} -6 ${-w / 2} 0 t${-w / 2} 0 Z" fill="#AA151B"/><path d="M${x + 1} ${y + h * 0.25} q${w / 4} 6 ${w / 2} 0 t${w / 2} 0 v${h * 0.5} q${-w / 4} -6 ${-w / 2} 0 t${-w / 2} 0 Z" fill="#F1BF00"/></g>`;
  const lluvia = (r, n, op) => { let s = ''; for (let i = 0; i < n; i++) { const x = r() * 840 - 20, y = r() * 360; s += `M${f1(x)} ${f1(y)} l-6 16 `; } return `<path d="${s}" stroke="#a9bddb" stroke-opacity="${op}" stroke-width="1.2" fill="none"/>`; };
  const estrellas = (r, n, ymax) => { let s = ''; for (let i = 0; i < n; i++) s += `<circle cx="${f1(r() * 800)}" cy="${f1(r() * ymax)}" r="${f1(0.5 + r() * 1.1)}" fill="#fff" opacity="${f1(0.3 + r() * 0.6)}"/>`; return s; };
  const edificios = (r, uid, x0, x1, base, hmin, hmax, col, ventanas, op = 1) => { let s = '', x = x0; while (x < x1) { const w = 28 + r() * 48, h = hmin + r() * (hmax - hmin); s += `<rect x="${f1(x)}" y="${f1(base - h)}" width="${f1(w)}" height="${f1(h)}" fill="${col}" opacity="${op}"/>`; if (ventanas) for (let vy = base - h + 8; vy < base - 8; vy += 12) for (let vx = x + 5; vx < x + w - 6; vx += 10) if (r() < ventanas.p) s += `<rect x="${f1(vx)}" y="${f1(vy)}" width="4" height="6" fill="${ventanas.c}" opacity="${f1(0.5 + r() * 0.5)}"/>`; x += w + 2 + r() * 6; } return s; };
  const humo = (id, x, y, rx, ry, color, op) => `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${color}" opacity="${op}" filter="url(#${id})"/>`;

  /* ── Escenas ── */
  const ESCENAS = {
    noche_victoria: {
      n: 'Noche electoral: victoria', d: 'Atril del partido con el discurso desde la sede, confeti y militancia entusiasta.', prompt: 'cinematic photo of an election night victory speech in Spain, a leader at a podium with a large party-coloured backdrop and logo, confetti falling, cheering crowd waving flags, warm stage lights, dusk, shallow depth of field, photojournalism style, no real faces',
      f(ctx) { const { c, cd, cl, sigla, logo, r, u } = ctx; let s = grad(u + 'a', '#070b16', mezcla(c, '#070b16', 0.6)) + `<rect width="800" height="360" fill="url(#${u}a)"/>` + resplandor(u + 'b', 400, 150, 380, c, 0.55) + `<rect width="800" height="360" fill="url(#${u}b)"/>`;
        s += `<rect x="150" y="30" width="500" height="172" rx="6" fill="${cd}"/><rect x="150" y="30" width="500" height="14" fill="${cl}" opacity=".85"/><text x="400" y="124" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="${sigla.length > 4 ? 70 : 88}" fill="#fff" letter-spacing="6">${esc(sigla)}</text>${logo ? `<text x="400" y="86" text-anchor="middle" font-size="30">${esc(logo)}</text>` : ''}<rect x="250" y="136" width="300" height="3" fill="#fff" opacity=".6"/>`;
        s += bandera(86, 36, 64, 32, c) + bandera(650, 36, 64, 32, c) + foco(u + 'c', 60, 0, 220, 330, '#fff', 0.2) + foco(u + 'd', 740, 0, 220, 330, '#fff', 0.2);
        s += persona(400, 240, 2.9, '#0a1019', { brazo: true }) + atril(400, 206, 150, c, sigla);
        s += multitud(r, 70, -10, 810, 314, 384, ['#04070e', '#070b14', '#0a101c'], 1.7, 2.6, { banderas: 0.2, cols: [c, cl, '#e3c06a', '#fff'], carteles: 0.1, cartelCols: ['#fff', cl], brazos: 0.3 });
        for (let i = 0; i < 90; i++) { const col = [c, cl, '#e3c06a', '#fff', '#ffffff'][Math.floor(r() * 5)], x = f1(r() * 800), y = f1(r() * 300), rot = Math.floor(r() * 180); s += `<rect x="${x}" y="${y}" width="${f1(3 + r() * 4)}" height="${f1(5 + r() * 5)}" fill="${col}" opacity="${f1(0.55 + r() * 0.45)}" transform="rotate(${rot} ${x} ${y})"/>`; }
        return s; }
    },
    noche_derrota: {
      n: 'Noche electoral: derrota', d: 'Comparecencia ante una militancia abatida bajo una luz tenue.', prompt: 'cinematic photo of a disappointing election night in Spain, a leader speaking from a podium in front of a dim party backdrop, a few downcast supporters, rain, muted blue light, melancholic mood, photojournalism style, no real faces',
      f(ctx) { const { c, cd, sigla, r, u } = ctx, ap = mezcla(c, '#232a38', 0.7); let s = grad(u + 'a', '#05080f', '#161c29') + `<rect width="800" height="360" fill="url(#${u}a)"/>`;
        s += `<rect x="170" y="34" width="460" height="168" rx="6" fill="${oscuro(ap, 0.35)}"/><rect x="170" y="34" width="460" height="12" fill="${ap}" opacity=".7"/><text x="400" y="122" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="${sigla.length > 4 ? 64 : 80}" fill="#aab3c4" opacity=".62" letter-spacing="6">${esc(sigla)}</text>`;
        s += bandera(120, 150, 52, 26, ap) + foco(u + 'c', 400, 0, 240, 300, '#bcd0f0', 0.16);
        s += persona(400, 240, 2.9, '#080c14') + atril(400, 206, 150, ap, sigla, { micros: true }) + multitud(r, 26, 60, 740, 318, 384, ['#04060c', '#070a12'], 1.8, 2.6, { brazos: 0 }) + lluvia(r, 70, 0.3);
        s += resplandor(u + 'g', 400, 360, 320, '#4a6fa8', 0.18) + `<rect width="800" height="360" fill="url(#${u}g)"/>`; return s; }
    },
    funeral_estado: {
      n: 'Funeral de Estado', d: 'Catafalco con ataúd cubierto por la bandera, velas, guardia de honor y la nave de una catedral.', prompt: 'cinematic photo inside a Spanish cathedral during a state funeral, a coffin draped with the red and yellow flag on a catafalque, candles, honour guards in ceremonial uniform, mourners in black, golden light through stained glass, solemn atmosphere, no real faces',
      f(ctx) { const { r, u } = ctx; let s = grad(u + 'a', '#0b0807', '#2a1d14') + `<rect width="800" height="360" fill="url(#${u}a)"/>` + resplandor(u + 'b', 400, 120, 260, '#f0b560', 0.5) + `<rect width="800" height="360" fill="url(#${u}b)"/>`;
        s += grad(u + 'p', '#4b3d33', '#241b15', false);
        for (const x of [40, 150, 650, 760]) s += `<rect x="${x - 18}" y="0" width="36" height="300" fill="url(#${u}p)"/><rect x="${x - 24}" y="288" width="48" height="14" fill="#3c2f26"/>`;
        s += `<path d="M215 300 L215 130 Q215 40 400 20 Q585 40 585 130 L585 300 Z" fill="#1a130f"/><path d="M245 300 L245 140 Q245 66 400 46 Q555 66 555 140 L555 300 Z" fill="#26364f"/>` + resplandor(u + 'v', 400, 150, 200, '#8fb0ff', 0.45) + `<rect x="245" y="46" width="310" height="254" fill="url(#${u}v)" opacity=".55"/><path d="M400 46 V300 M300 70 V300 M500 70 V300 M245 150 H555" stroke="#0f0b09" stroke-width="3"/>`;
        s += `<polygon points="360,0 440,0 560,300 240,300" fill="#f6c673" opacity=".1"/>`;
        s += `<polygon points="120,300 680,300 800,360 0,360" fill="#17110d"/><polygon points="360,300 440,300 470,360 330,360" fill="#6d1620"/><polygon points="385,300 415,300 420,360 380,360" fill="#b8932f" opacity=".5"/>`;
        s += `<g transform="translate(400 252) scale(1.32) translate(-400 -252)"><rect x="300" y="276" width="200" height="14" fill="#2e231b"/><rect x="316" y="264" width="168" height="14" fill="#3a2d23"/><rect x="332" y="252" width="136" height="14" fill="#47382c"/>`;
        s += `<path d="M345 252 L455 252 L448 214 L352 214 Z" fill="#1f1713"/><path d="M350 252 L450 252 L446 214 L354 214 Z" fill="#AA151B"/><path d="M351 241 L449 241 L447 225 L353 225 Z" fill="#F1BF00"/><path d="M348 252 L452 252 L450 257 L350 257 Z" fill="#0f0b09"/><circle cx="400" cy="236" r="6" fill="#AA151B" stroke="#F1BF00" stroke-width="1.4"/></g>`;
        s += `<g fill="none" stroke="#3f6b3a" stroke-width="7"><circle cx="520" cy="296" r="15"/></g><circle cx="520" cy="296" r="3" fill="#e8e0d4"/><circle cx="509" cy="290" r="2.4" fill="#c33"/><circle cx="530" cy="301" r="2.4" fill="#c33"/>`;
        for (const x of [215, 290, 510, 585]) s += `<rect x="${x - 2}" y="214" width="4" height="86" fill="#3b2c20"/><rect x="${x - 7}" y="212" width="14" height="5" fill="#b8932f"/><ellipse cx="${x}" cy="204" rx="3.4" ry="7" fill="#ffd27a"/>` + resplandor(u + 'f' + x, x, 204, 38, '#ffc15a', 0.65) + `<circle cx="${x}" cy="204" r="38" fill="url(#${u}f${x})"/>`;
        for (const [x, y] of [[320, 300], [480, 300], [255, 306], [545, 306]]) s += persona(x, y, 2.1, '#0b0806', { casco: '#b8932f', pluma: '#c0392b' });
        for (let k = 0; k < 3; k++) s += multitud(r, 16 + k * 4, 20, 780, 346 + k * 12, 358 + k * 12, ['#050403', '#0a0807', '#0d0a08'], 1.9 + k * 0.25, 2.2 + k * 0.25, {});
        return s; }
    },
    investidura: {
      n: 'Investidura en el hemiciclo', d: 'El candidato defiende su programa desde la tribuna ante los escaños, coloreados según el reparto real.', prompt: 'cinematic photo of the Spanish Congress of Deputies chamber during an investiture debate, a speaker at the tribune facing the semicircle of red seats, the speaker\'s dais with the coat of arms behind, warm light, no real faces',
      f(ctx) { return hemiciclo(ctx, false); }
    },
    mocion_censura: {
      n: 'Moción de censura', d: 'Tensión en el hemiciclo: un portavoz interpela al Gobierno bajo una luz roja.', prompt: 'cinematic photo of a no-confidence motion in the Spanish Congress of Deputies, a deputy speaking intensely from the tribune, tense faces on the benches, dramatic red-tinted lighting, no real faces',
      f(ctx) { return hemiciclo(ctx, true); }
    },
    debate_tv: {
      n: 'Debate electoral en televisión', d: 'Dos atriles, un moderador y un plató con luces de estudio.', prompt: 'cinematic wide photo of a televised election debate studio, two candidates at podiums in different party colours, a moderator desk in the centre, large LED screen backdrop, studio spotlights and cameras, no real faces',
      f(ctx) { const { c, c2, sigla, sigla2, r, u } = ctx; let s = grad(u + 'a', '#050810', '#101a2e') + `<rect width="800" height="360" fill="url(#${u}a)"/>`;
        s += `<rect x="70" y="28" width="660" height="156" rx="8" fill="#0a1226" stroke="#26385e" stroke-width="3"/>`; for (let i = 0; i < 12; i++) s += `<path d="M${70 + i * 55} 28 V184" stroke="#16264a" stroke-width="1"/>`; for (let i = 0; i < 4; i++) s += `<path d="M70 ${60 + i * 32} H730" stroke="#16264a" stroke-width="1"/>`;
        s += `<rect x="70" y="28" width="330" height="9" fill="${c}"/><rect x="400" y="28" width="330" height="9" fill="${c2}"/><text x="400" y="116" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="58" letter-spacing="12" fill="#fff">DEBATE</text><text x="400" y="148" text-anchor="middle" font-family="sans-serif" font-size="15" letter-spacing="8" fill="#9db0d6">ELECCIONES</text>`;
        s += foco(u + 'c', 230, 0, 260, 330, '#fff', 0.22) + foco(u + 'd', 570, 0, 260, 330, '#fff', 0.22);
        s += `<rect x="330" y="206" width="140" height="26" rx="3" fill="#1b2438"/><rect x="330" y="206" width="140" height="5" fill="#2e3b5c"/>` + persona(400, 212, 1.7, '#0a0f1a');
        s += persona(230, 268, 2.8, '#0a0f1a') + persona(570, 268, 2.8, '#0a0f1a') + atril(230, 250, 118, c, sigla, { micros: false }) + atril(570, 250, 118, c2, sigla2, { micros: false });
        s += `<polygon points="0,320 800,320 800,360 0,360" fill="#0c1424"/><path d="M0 332 H800" stroke="#1d2b4a" stroke-width="2"/>`;
        for (const x of [60, 740]) s += `<g transform="translate(${x} 300)"><rect x="-20" y="-16" width="40" height="24" rx="3" fill="#06080e" stroke="#2a3552"/><circle cx="-8" cy="-4" r="7" fill="#0b1226" stroke="#3a4a74"/><circle cx="14" cy="-12" r="2.4" fill="#e03131"/><path d="M-6 8 L-14 36 M6 8 L14 36" stroke="#2a3552" stroke-width="3"/></g>`;
        return s; }
    },
    congreso_partido: {
      n: 'Congreso del partido', d: 'Escenario con el lema del partido, delegados con sus papeletas y el atril del liderazgo.', prompt: 'cinematic photo of a political party congress in Spain, a big stage with a huge party-coloured banner and logo, a leader at the podium, hundreds of delegates seen from behind holding voting cards, warm stage lighting, no real faces',
      f(ctx) { const { c, cd, cl, sigla, logo, r, u } = ctx; let s = grad(u + 'a', '#060a14', mezcla(c, '#060a14', 0.72)) + `<rect width="800" height="360" fill="url(#${u}a)"/>`;
        s += `<rect x="40" y="26" width="720" height="160" fill="${cd}"/><rect x="40" y="26" width="720" height="12" fill="${cl}"/><text x="400" y="116" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="${sigla.length > 4 ? 66 : 84}" fill="#fff" letter-spacing="6">${esc(sigla)}</text>${logo ? `<text x="400" y="70" text-anchor="middle" font-size="30">${esc(logo)}</text>` : ''}<text x="400" y="154" text-anchor="middle" font-family="sans-serif" font-size="13" letter-spacing="7" fill="#fff" opacity=".8">CONGRESO FEDERAL</text>`;
        s += `<rect x="120" y="190" width="560" height="20" fill="#15110d"/>` + foco(u + 'c', 400, 0, 300, 250, '#fff', 0.24) + persona(400, 238, 2.7, '#0a0f1a', { brazo: true }) + atril(400, 212, 124, c, sigla);
        for (let k = 0; k < 5; k++) { const y = 296 + k * 17, sc = 2.2 + k * 0.45; for (let x = 20 + (k % 2) * 12; x < 790; x += 31 + k * 4) s += persona(x + (r() - 0.5) * 6, y + 20, sc, mezcla('#0a0f18', c, 0.12 + 0.05 * (k % 2)), { brazo: r() < 0.14 }); }
        for (let i = 0; i < 16; i++) s += `<rect x="${f1(30 + r() * 740)}" y="${f1(290 + r() * 50)}" width="8" height="11" fill="${r() < 0.5 ? '#fff' : '#e3c06a'}" opacity=".9"/>`;
        s += bandera(22, 40, 54, 26, cl) + bandera(724, 40, 54, 26, cl); return s; }
    },
    manifestacion: {
      n: 'Manifestación', d: 'Una multitud con pancartas y banderas en una plaza al atardecer.', prompt: 'cinematic documentary photo of a large street demonstration in a Spanish city at dusk, dense crowd with placards and flags, red flares and smoke, old city buildings in the background, no real faces',
      f(ctx) { const { r, u, c } = ctx; let s = grad(u + 'a', '#141b30', '#493542') + `<rect width="800" height="360" fill="url(#${u}a)"/>` + resplandor(u + 'b', 400, 215, 420, '#ff9a54', 0.4) + `<rect width="800" height="360" fill="url(#${u}b)"/>`;
        s += edificios(r, u, -10, 810, 250, 70, 190, '#0d1220', { p: 0.18, c: '#ffd9a0' });
        s += humo(u + 'h1', 250, 250, 70, 34, '#e0413a', 0.6) + humo(u + 'h2', 560, 262, 60, 28, '#d9503c', 0.5);
        s += multitud(r, 110, -10, 810, 262, 362, ['#05070d', '#090c14', '#0c111b'], 2, 3.6, { banderas: 0.14, cols: ['#c0392b', '#e3c06a', c, '#2f7de1', '#fff'], carteles: 0.28, cartelCols: ['#fff', '#f1d27a', '#e8654f', '#cfe3ff'], brazos: 0.2 });
        s += `<g><rect x="120" y="248" width="560" height="38" fill="#e8d9a8" opacity=".92"/><rect x="120" y="248" width="560" height="5" fill="#b0381f"/><path d="M150 270 H650" stroke="#2a2418" stroke-width="5" stroke-dasharray="26 8 40 10 18 12"/></g>`; return s; }
    },
    emergencia: {
      n: 'Emergencia en la calle', d: 'Ambulancias y policía con luces de emergencia, cinta de balizamiento y equipos de rescate.', prompt: 'cinematic night photo of an emergency scene in a Spanish city street, ambulance and police car with flashing blue and red lights, police tape, rescue workers in reflective vests, smoke in the air, wet asphalt, no real faces',
      f(ctx) { const { r, u } = ctx; let s = grad(u + 'a', '#050810', '#16203a') + `<rect width="800" height="360" fill="url(#${u}a)"/>` + edificios(r, u, -10, 810, 230, 60, 170, '#0b1020', { p: 0.12, c: '#ffd9a0' });
        s += `<polygon points="0,236 800,236 800,360 0,360" fill="#0b0f19"/><path d="M0 300 H800" stroke="#1d2434" stroke-width="2" stroke-dasharray="30 22"/>`;
        s += resplandor(u + 'r', 250, 200, 150, '#ff3b3b', 0.55) + resplandor(u + 'b', 560, 200, 160, '#3a7bff', 0.6) + `<rect width="800" height="360" fill="url(#${u}r)"/><rect width="800" height="360" fill="url(#${u}b)"/>`;
        s += `<g transform="translate(150 218)"><rect x="0" y="0" width="190" height="68" rx="7" fill="#eef1f7"/><rect x="118" y="8" width="60" height="30" rx="4" fill="#26324f"/><rect x="0" y="40" width="190" height="8" fill="#d33"/><rect x="26" y="14" width="26" height="8" fill="#d33"/><rect x="35" y="5" width="8" height="26" fill="#d33"/><rect x="60" y="-8" width="60" height="8" rx="3" fill="#ff4d4d"/><circle cx="40" cy="70" r="13" fill="#0a0d14"/><circle cx="150" cy="70" r="13" fill="#0a0d14"/></g>`;
        s += `<g transform="translate(450 232)"><rect x="0" y="0" width="170" height="56" rx="7" fill="#f4f5f9"/><rect x="0" y="26" width="170" height="10" fill="#1e5bd8"/><rect x="104" y="6" width="54" height="22" rx="4" fill="#26324f"/><rect x="58" y="-8" width="50" height="8" rx="3" fill="#3a7bff"/><circle cx="36" cy="58" r="12" fill="#0a0d14"/><circle cx="134" cy="58" r="12" fill="#0a0d14"/></g>`;
        s += humo(u + 'h', 400, 220, 120, 34, '#7a8499', 0.35);
        for (const [x, y, sc] of [[360, 330, 3], [400, 336, 3.1], [660, 332, 3], [120, 338, 3.2]]) s += persona(x, y, sc, '#07090f') + `<rect x="${x - 7 * sc / 2.2}" y="${y - 17 * sc / 1.2}" width="${f1(9 * sc / 1.1)}" height="${f1(4 * sc / 1.2)}" fill="#e6f24a" opacity=".9"/>`;
        s += `<g transform="rotate(-6 400 300)"><rect x="-20" y="286" width="840" height="14" fill="#f2c500"/><path d="M-20 286 l24 14 M16 286 l24 14 M52 286 l24 14 M88 286 l24 14 M124 286 l24 14 M160 286 l24 14 M196 286 l24 14 M232 286 l24 14 M268 286 l24 14 M304 286 l24 14 M340 286 l24 14 M376 286 l24 14 M412 286 l24 14 M448 286 l24 14 M484 286 l24 14 M520 286 l24 14 M556 286 l24 14 M592 286 l24 14 M628 286 l24 14 M664 286 l24 14 M700 286 l24 14 M736 286 l24 14 M772 286 l24 14" stroke="#111" stroke-width="5"/></g>`; return s; }
    },
    incendio: {
      n: 'Incendio forestal', d: 'Una ladera en llamas bajo un cielo naranja, con un hidroavión descargando agua.', prompt: 'cinematic aerial-style photo of a wildfire in the Spanish countryside at dusk, flames on a hillside, thick smoke columns, orange sky, a firefighting seaplane dropping water, embers in the air',
      f(ctx) { const { r, u } = ctx; let s = grad(u + 'a', '#220a08', '#c4521f') + `<rect width="800" height="360" fill="url(#${u}a)"/>` + resplandor(u + 'b', 400, 270, 380, '#ffb347', 0.55) + `<rect width="800" height="360" fill="url(#${u}b)"/>`;
        s += humo(u + 'h1', 220, 120, 120, 80, '#2a1612', 0.85) + humo(u + 'h2', 520, 90, 150, 90, '#35201a', 0.8) + humo(u + 'h3', 700, 140, 90, 70, '#2a1612', 0.7);
        s += `<path d="M0 300 Q120 230 260 270 T520 250 T800 280 V360 H0 Z" fill="#1a0c08"/><path d="M0 330 Q160 280 320 310 T800 300 V360 H0 Z" fill="#0d0605"/>`;
        for (let i = 0; i < 46; i++) { const x = r() * 800, y = 255 + r() * 70, h = 18 + r() * 34, w = 8 + r() * 12; s += `<path d="M${f1(x)} ${f1(y)} q${-w} ${-h * 0.5} ${-w * 0.3} ${-h} q${w * 0.2} ${h * 0.4} ${w * 0.7} ${h * 0.3} q${w * 0.5} ${-h * 0.3} ${w * 0.1} ${-h * 0.8} q${w * 1.3} ${h * 0.9} ${w * 0.4} ${h * 1.5} Z" fill="${r() < 0.5 ? '#ff7a1a' : '#ffb21e'}" opacity="${f1(0.7 + r() * 0.3)}"/>`; }
        for (let i = 0; i < 40; i++) s += `<circle cx="${f1(r() * 800)}" cy="${f1(100 + r() * 220)}" r="${f1(0.8 + r() * 1.6)}" fill="#ffd27a" opacity="${f1(0.4 + r() * 0.6)}"/>`;
        s += `<g transform="translate(560 60)"><path d="M-40 0 H34 l12 -6 l-4 10 l-12 4 H-30 Z" fill="#1a1210"/><path d="M-6 0 L-26 -14 L-14 -14 L6 0 Z" fill="#1a1210"/><path d="M-4 8 q-10 40 -30 80 M2 8 q-4 46 -8 86 M8 8 q12 40 14 80" stroke="#cfe3f0" stroke-opacity=".55" stroke-width="3" fill="none"/></g>`; return s; }
    },
    inundacion: {
      n: 'Inundación', d: 'Calles anegadas bajo la lluvia, tejados asomando y una barca de rescate.', prompt: 'cinematic photo of a flooded Spanish town after torrential rain, brown water up to the first floor of houses, rescue boat with emergency workers, grey stormy sky, heavy rain, no real faces',
      f(ctx) { const { r, u } = ctx; let s = grad(u + 'a', '#222b3a', '#566275') + `<rect width="800" height="360" fill="url(#${u}a)"/>`;
        s += edificios(r, u, -10, 810, 250, 90, 190, '#1b222f', { p: 0.12, c: '#ffd9a0' }, 0.9);
        for (let x = 10; x < 800; x += 120 + r() * 40) { const h = 50 + r() * 30; s += `<polygon points="${x},${230 - h} ${x + 34},${200 - h} ${x + 68},${230 - h}" fill="#5a2d22"/><rect x="${x}" y="${230 - h}" width="68" height="${h + 60}" fill="#b9a58a" opacity=".92"/><rect x="${x + 12}" y="${240 - h}" width="12" height="16" fill="#26324a"/><rect x="${x + 42}" y="${240 - h}" width="12" height="16" fill="#26324a"/>`; }
        s += grad(u + 'w', '#7a6a4f', '#3b3426') + `<path d="M0 262 q50 -8 100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 V360 H0 Z" fill="url(#${u}w)"/>`;
        for (let i = 0; i < 16; i++) s += `<path d="M${f1(r() * 780)} ${f1(274 + r() * 80)} h${f1(30 + r() * 50)}" stroke="#c9b78e" stroke-opacity=".28" stroke-width="2"/>`;
        s += `<g transform="translate(470 292)"><path d="M-70 0 H70 L52 22 H-52 Z" fill="#e8742a"/><path d="M-70 0 H70" stroke="#fff" stroke-width="4"/>` + persona(-24, 0, 1.9, '#0b0f18') + persona(10, 0, 2, '#0b0f18', { brazo: true }) + persona(40, 0, 1.8, '#0b0f18') + `<circle cx="-56" cy="8" r="6" fill="none" stroke="#fff" stroke-width="3"/></g>`;
        s += lluvia(r, 140, 0.4); return s; }
    },
    apagon: {
      n: 'Apagón', d: 'Una ciudad a oscuras bajo la luna, con solo unas pocas velas en las ventanas.', prompt: 'cinematic night photo of a Spanish city during a total blackout, skyline completely dark under a bright moon and stars, a few candles lit in windows, car headlights on a road, quiet eerie atmosphere',
      f(ctx) { const { r, u } = ctx; let s = grad(u + 'a', '#04060f', '#141b3a') + `<rect width="800" height="360" fill="url(#${u}a)"/>` + estrellas(r, 90, 170) + resplandor(u + 'm', 620, 70, 120, '#cfdcff', 0.5) + `<rect width="800" height="360" fill="url(#${u}m)"/><circle cx="620" cy="70" r="26" fill="#eef3ff"/><circle cx="610" cy="62" r="5" fill="#cfd8f0"/><circle cx="632" cy="80" r="7" fill="#cfd8f0" opacity=".7"/>`;
        s += edificios(r, u, -10, 810, 280, 80, 220, '#070a14', { p: 0.04, c: '#ffbe5c' });
        s += `<polygon points="0,282 800,282 800,360 0,360" fill="#080b14"/><polygon points="300,282 500,282 640,360 160,360" fill="#0d121f"/>`;
        s += `<polygon points="360,312 70,360 150,360" fill="#fff6c8" opacity=".14"/><polygon points="360,312 70,360 150,360" fill="none"/><circle cx="360" cy="312" r="3" fill="#fff6c8"/><circle cx="372" cy="313" r="3" fill="#fff6c8"/>`;
        for (const x of [60, 200, 600, 740]) s += `<rect x="${x}" y="226" width="4" height="60" fill="#0c101b"/><path d="M${x + 2} 226 h16" stroke="#0c101b" stroke-width="4"/><rect x="${x + 14}" y="224" width="9" height="5" fill="#1a2030"/>`; return s; }
    },
    toma_posesion: {
      n: 'Promesa del cargo', d: 'Mano alzada sobre el texto constitucional ante las banderas, con cortinas de palacio y flashes.', prompt: 'cinematic photo of a government swearing-in ceremony in a Spanish palace hall, a person with a raised hand over an open constitution on a table, Spanish and EU flags behind, crimson curtains, camera flashes, formal lighting, no real faces',
      f(ctx) { const { r, u } = ctx; let s = grad(u + 'a', '#150b0c', '#3a2218') + `<rect width="800" height="360" fill="url(#${u}a)"/>` + resplandor(u + 'b', 400, 130, 320, '#f3c778', 0.4) + `<rect width="800" height="360" fill="url(#${u}b)"/>`;
        s += grad(u + 'c', '#8c1d2b', '#4a0e17', false) + `<path d="M0 0 H120 Q100 120 140 230 Q90 300 120 360 H0 Z" fill="url(#${u}c)"/><path d="M800 0 H680 Q700 120 660 230 Q710 300 680 360 H800 Z" fill="url(#${u}c)"/><path d="M30 0 Q22 180 40 360 M70 0 Q60 180 78 360" stroke="#2e0910" stroke-width="3" fill="none" opacity=".6"/><path d="M770 0 Q778 180 760 360 M730 0 Q740 180 722 360" stroke="#2e0910" stroke-width="3" fill="none" opacity=".6"/>`;
        s += banderaES(250, 40, 96, 52) + `<g><rect x="520" y="40" width="3" height="170" fill="#9aa4b5"/><rect x="523" y="40" width="96" height="62" fill="#1d4fbf"/>${Array.from({ length: 12 }, (_, i) => `<circle cx="${571 + 20 * Math.cos(i * Math.PI / 6)}" cy="${71 + 20 * Math.sin(i * Math.PI / 6)}" r="2.4" fill="#f6d03c"/>`).join('')}</g>`;
        s += `<rect x="260" y="260" width="280" height="14" fill="#3a2a1d"/><rect x="270" y="274" width="260" height="86" fill="#2b1f16"/><rect x="262" y="256" width="276" height="6" fill="#b8932f"/>`;
        s += `<path d="M340 256 L400 246 L460 256 L460 262 L400 252 L340 262 Z" fill="#f2ead8"/><path d="M400 246 V252" stroke="#bfb396"/><rect x="336" y="258" width="128" height="5" fill="#b02030"/>`;
        s += persona(400, 330, 3.6, '#090c14', { brazo: true }) + persona(320, 330, 3, '#090c14') + persona(480, 330, 3, '#090c14');
        for (let i = 0; i < 9; i++) { const x = f1(r() < 0.5 ? 20 + r() * 150 : 630 + r() * 150), y = f1(250 + r() * 100); s += `<path d="M${x} ${y} l2 -8 l2 8 l8 2 l-8 2 l-2 8 l-2 -8 l-8 -2 Z" fill="#fff" opacity="${f1(0.5 + r() * 0.5)}"/>`; }
        return s; }
    },
    retirada: {
      n: 'Fin de una carrera', d: 'Un atril vacío contra un atardecer: se cierra una etapa política.', prompt: 'cinematic photo of an empty political podium with a single microphone at sunset in front of a Spanish government building, long shadows, warm golden light, quiet and reflective mood, no people',
      f(ctx) { const { r, u } = ctx; let s = grad(u + 'a', '#1b1530', '#e07a45') + `<rect width="800" height="360" fill="url(#${u}a)"/>` + resplandor(u + 'b', 560, 250, 260, '#ffd58a', 0.85) + `<rect width="800" height="360" fill="url(#${u}b)"/><circle cx="560" cy="256" r="46" fill="#ffe3a8"/>`;
        s += `<path d="M0 260 H800 V360 H0 Z" fill="#0f0b14"/>` + edificios(r, u, 320, 800, 262, 24, 90, '#140f1c', null) + `<path d="M600 232 q8 -8 16 0 M630 216 q8 -8 16 0 M668 240 q8 -8 16 0" stroke="#150f1c" stroke-width="2.4" fill="none"/>`;
        s += `<polygon points="190,360 420,360 640,330 460,330" fill="#07050b" opacity=".6"/>` + atril(200, 250, 120, '#4a2c34', '', { madera: '#1a1211', borde: '#0b0708' }) + `<path d="M170 150 H260" stroke="#0b0708" stroke-width="0"/>`;
        s += `<g fill="#0b0708"><rect x="36" y="296" width="22" height="12"/><rect x="38" y="308" width="3" height="22"/><rect x="53" y="308" width="3" height="22"/><rect x="36" y="280" width="22" height="3"/></g>`; return s; }
    }
  };

  /* Hemiciclo: escaños en semicírculo coloreados por el reparto real; la tribuna en el centro. */
  function hemiciclo(ctx, tension) {
    const { E, r, u } = ctx; let s = grad(u + 'a', tension ? '#2a0a10' : '#2a1316', '#0f0809') + `<rect width="800" height="360" fill="url(#${u}a)"/>`;
    s += `<rect x="250" y="16" width="300" height="52" rx="4" fill="#3a2418"/><rect x="250" y="16" width="300" height="6" fill="#b8932f"/><circle cx="400" cy="38" r="15" fill="#b8932f"/><path d="M393 32 h14 v12 h-14 Z" fill="#7a1e24"/>`;
    for (const x of [320, 360, 440, 480]) s += persona(x, 66, 1.3, '#120a08');
    let cols = []; try { const P = E.paises.ES, esc2 = P.escanos; cols = P.partidos.filter(k => esc2[k] > 0).sort((a, b) => E.partidos[a].eco - E.partidos[b].eco).flatMap(k => Array(Math.round(esc2[k])).fill(hex(E.partidos[k].color))); } catch (e) { }
    const filas = 9, total = 350; while (cols.length < total) cols.push('#6b5a55'); cols.length = total;
    const asientos = []; for (let i = 0; i < filas; i++) { const rad = 118 + i * 24, n = Math.round(total * rad / (118 * filas + 24 * filas * (filas - 1) / 2)); for (let j = 0; j < n; j++) asientos.push({ a: Math.PI * (1.04 - 1.08 * (j + 0.5) / n), rad }); }
    asientos.sort((p, q) => q.a - p.a); const cx = 400, cy = 338;
    asientos.forEach((p, i) => { const col = cols[Math.min(cols.length - 1, Math.floor(i * cols.length / asientos.length))]; s += `<circle cx="${f1(cx + p.rad * Math.cos(p.a))}" cy="${f1(cy - p.rad * Math.sin(p.a) * 0.78)}" r="4.6" fill="${col}"/>`; });
    s += `<rect x="360" y="238" width="80" height="54" rx="3" fill="#2b1d14"/><rect x="354" y="232" width="92" height="9" fill="#b8932f"/>` + persona(400, 246, 2.7, '#0c0709', { brazo: tension });
    s += foco(u + 'c', 400, 0, 220, 300, tension ? '#ff8a7a' : '#ffe2a8', tension ? 0.3 : 0.24);
    if (tension) s += resplandor(u + 'v', 400, 170, 460, '#000000', 0) + `<polygon points="410,92 382,138 402,138 392,176 428,126 406,126" fill="#ff6a4a" opacity=".5"/><rect width="800" height="360" fill="#7a0d12" opacity=".18"/>`;
    return s;
  }

  const Es = C.Escenas = {
    ESCENAS,
    ids() { return Object.keys(ESCENAS); },
    svg(E, id, o = {}) {
      const d = ESCENAS[id]; if (!d) return '';
      const pa = E && o.pid && E.partidos[o.pid] ? E.partidos[o.pid] : (E && E.jugador && E.partidos[E.jugador.partido]) || null, pa2 = E && o.pid2 && E.partidos[o.pid2] ? E.partidos[o.pid2] : null;
      const c = hex(pa && pa.color ? pa.color : '#b8932f'), c2 = hex(pa2 && pa2.color ? pa2.color : '#2f7de1');
      const u = 'es' + (++N), ctx = { E, c, cd: oscuro(c, 0.45), cl: claro(c, 0.3), c2, sigla: (pa && pa.sigla) || 'PARTIDO', sigla2: (pa2 && pa2.sigla) || '', logo: pa && pa.logo ? pa.logo : '', u, r: rng(hash(id + ((pa && pa.sigla) || '') + (o.semilla || ''))) };
      return `<svg viewBox="0 0 800 360" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(d.n)}" xmlns="http://www.w3.org/2000/svg">${d.f(ctx)}</svg>`;
    },
    /* Bloque listo para insertar en un modal: la imagen asociada (si la hay) sobre la ilustración de respaldo. */
    html(E, id, o = {}) {
      const d = ESCENAS[id]; if (!d) return '';
      let svg = ''; try { svg = Es.svg(E, id, o); } catch (e) { console.error('[escenas]', id, e); return ''; }
      const url = C.IMAGENES && C.IMAGENES[id], img = url ? `<img src="${esc(url)}" alt="${esc(d.n)}" loading="lazy" onerror="this.remove()">` : '';
      const ley = o.leyenda != null ? o.leyenda : d.n;
      return `<figure class="escena${o.compacta ? ' compacta' : ''}" data-escena="${esc(id)}">${svg}${img}${ley ? `<figcaption>${esc(ley)}</figcaption>` : ''}</figure>`;
    },
    /* Escena que acompaña a un paso de una crisis en directo. */
    paraCrisis(cr, s, paso) {
      const txt = ((paso && paso[1]) || '') + ' ' + (s.n || '') + ' ' + (cr.id || '');
      if (/funeral|exequias|capilla ardiente/i.test(txt)) return 'funeral_estado';
      if (/incendio|llamas|fuego/i.test(txt)) return 'incendio';
      if (/inundaci|riada|dana|crecida|desbord|temporal/i.test(txt)) return 'inundacion';
      if (/apag[oó]n|blackout|sin luz|suministro el[eé]ctrico/i.test(txt)) return 'apagon';
      if (/huelga|manifestaci|protesta|disturbios|bloquean/i.test(txt)) return 'manifestacion';
      if (/atentado|explosi|accidente|descarril|derrumb|v[ií]ctimas|heridos|hospitaliz|ciberataque|rehenes|secuestr/i.test(txt)) return 'emergencia';
      return null;
    }
  };
})(window.ESP);

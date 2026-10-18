/* Mapa de España: geometría real de las 52 circunscripciones (data/mapa-es.js, de Natural Earth), capas de datos, dibujo en SVG y cámara con zoom y desplazamiento.
   Uso: C.Mapa.svg(E, 'voto', { altoMax: 420 }) → <svg> estático · C.Mapa.leyenda(E, capa) · C.Mapa.camara(svgEl, contEl, opciones) → cámara con zoom/desplazamiento.
   Las pantallas interactivas (pantallas/mapa.js) montan el mapa con su selector de capas, su panel de datos y sus acciones. */
window.ESP = window.ESP || {};
(function (C) {
  const U = C.U, esc = U.esc, clamp = U.clamp, D = () => C.DATA, G = () => D().mapaEs;
  const f1 = n => Math.round(n * 10) / 10;
  const prov = id => D().provincias[id], ccaaDe = id => prov(id)[1], nomC = c => D().ccaa[c].nombre;

  /* ── Color ── */
  const rgb = a => `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})`;
  const rampa = (stops, t) => { t = clamp(t, 0, 1); const n = stops.length - 1, i = Math.min(n - 1, Math.floor(t * n)), u = t * n - i, a = stops[i], b = stops[i + 1]; return rgb([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]); };
  const BUENO = [[192, 74, 70], [214, 176, 70], [63, 175, 110]];          // peor → mejor
  const ALERTA = [[48, 72, 112], [214, 176, 70], [204, 66, 58]];           // calma → alerta
  const INDEP = [[56, 88, 150], [232, 177, 0]];
  const AZUL = [[30, 54, 92], [70, 140, 200], [168, 222, 248]];
  const NEUTRO = '#22314d', OCULTA = '#16223a';
  const gradCss = st => `linear-gradient(90deg,${st.map(rgb).join(',')})`;
  const semanas = (E, t) => Math.max(0, Math.round(t - E.fecha.t));

  const ccaaRC = (E, c) => E.esp.ccaa[c];
  /* Helpers de las capas por comunidad: color por rampa, valor para el ranking y líneas del aviso. */
  const capaCcaa = o => ({
    nivel: 'ccaa', rank: true, ...o,
    etq(E, p) { const v = o.valor(E, ccaaDe(p)); return v == null ? null : (o.fmt ? o.fmt(v) : Math.round(v)); },
    color(E, p) { const c = ccaaDe(p), v = o.valor(E, c); return v == null ? { f: NEUTRO } : { f: rampa(o.rampa, (v - o.min) / (o.max - o.min)) }; },
    leyenda: () => ({ grad: gradCss(o.rampa), de: o.de, a: o.a })
  });
  const tt = (E, p, lineas) => { const d = prov(p); return `<div class="tt-t">${esc(d[0])} · ${esc(nomC(d[1]))}</div>` + lineas.map(([k, v]) => `<div class="tt-f"><span>${k}</span><b>${v}</b></div>`).join(''); };
  const lineasCcaa = (E, c) => { const rc = ccaaRC(E, c), g = rc.gob; return [['Gobierno', g ? esc(E.partidos[g.partido].sigla) + (g.coalicion.length > 1 ? ' +' + (g.coalicion.length - 1) : '') : '—'], ['Relación con Moncloa', Math.round(rc.relM)], ['Independentismo', U.d1(rc.indep) + ' %'], ['Autogobierno', Math.round(rc.aut)]]; };
  const ordenVotos = pr => Object.keys(pr.votos).sort((a, b) => pr.votos[b] - pr.votos[a]);
  const nivelEmerg = (E, c) => { const Cr = C.Crisis, Em = C.Emerg; if (!Cr) return 0; let n = 0; for (const cr of Cr.asegurar(E).activas) { if (cr.fase === 'cerrada' || !cr.regs.includes(c)) continue; n = Math.max(n, Em && Em.regional(cr) ? Em.nivel(cr, c) : cr.sev || 1); } return n; };
  const crisisDe = (E, c) => C.Crisis ? C.Crisis.asegurar(E).activas.filter(cr => cr.fase !== 'cerrada' && cr.regs.includes(c)) : [];
  const alcaldePrincipal = (E, p) => { const m = Object.values(E.esp.muni.m).filter(x => x.prov === p).sort((a, b) => b.pob - a.pob)[0]; return m || null; };

  const infra = (E, p) => (C.Obras && C.Obras.porProv(E)[p]) || { eurHab: 0, autovia: 0, ave: 0, electrica: 0, puntos: 0, curso: 0 };
  const CAPAS = [
    { id: 'voto', g: 'Política', n: 'Generales', d: 'Partido ganador en cada circunscripción; más intenso cuanto mayor la ventaja.', nivel: 'prov', etq: (E, p) => prov(p)[2],
      color(E, p) { const pr = E.esp.prov[p]; if (!pr) return { f: NEUTRO }; const o = ordenVotos(pr), m = pr.votos[o[0]] - (pr.votos[o[1]] || 0); return { f: E.partidos[pr.ganador].color, o: clamp(0.55 + m / 60, 0.55, 1) }; },
      tt(E, p) { const pr = E.esp.prov[p], d = prov(p); if (!pr) return tt(E, p, [['Diputados', d[2]]]); return tt(E, p, [['Diputados', d[2]]].concat(Object.keys(pr.escanos).sort((a, b) => pr.escanos[b] - pr.escanos[a]).slice(0, 4).map(k => [`<i class="pto" style="background:${E.partidos[k].color}"></i> ${esc(E.partidos[k].sigla)}`, pr.escanos[k] + ' · ' + U.d1(pr.votos[k]) + ' %']))); },
      leyenda: E => ({ partidos: E.paises.ES.partidos.filter(k => Object.values(E.esp.prov).some(p => p.ganador === k)) }) },
    { id: 'autonomico', g: 'Política', n: 'Gobierno autonómico', d: 'Partido que gobierna cada comunidad (rayado: intervenida por el artículo 155).', nivel: 'ccaa',
      color(E, p) { const rc = ccaaRC(E, ccaaDe(p)); return { f: rc.gob ? E.partidos[rc.gob.partido].color : NEUTRO, h: !!rc.suspendida }; },
      tt: (E, p) => tt(E, p, lineasCcaa(E, ccaaDe(p))),
      leyenda: E => ({ partidos: [...new Set(Object.values(E.esp.ccaa).filter(rc => rc.gob).map(rc => rc.gob.partido))] }) },
    { id: 'alcaldias', g: 'Política', n: 'Alcaldías', d: 'Partido que gobierna la ciudad principal de cada provincia; los puntos son las 66 grandes ciudades.', nivel: 'prov', ciudades: 'todas',
      color(E, p) { const m = alcaldePrincipal(E, p); return m ? { f: E.partidos[m.alcalde] ? E.partidos[m.alcalde].color : NEUTRO, o: 0.82 } : { f: NEUTRO }; },
      tt(E, p) { const m = alcaldePrincipal(E, p); return tt(E, p, m ? [['Ciudad principal', esc(m.nombre)], ['Alcaldía', esc((E.partidos[m.alcalde] || {}).sigla || '—')], ['Aprobación', Math.round(m.aprob)]] : [['Ciudades grandes', 'ninguna']]); },
      leyenda: E => ({ partidos: [...new Set(Object.values(E.esp.muni.m).map(m => m.alcalde).filter(k => E.partidos[k]))] }) },
    capaCcaa({ id: 'relM', g: 'Territorio', n: 'Relación con Moncloa', d: 'Cómo se lleva cada comunidad con el Gobierno central.', valor: (E, c) => ccaaRC(E, c).relM, rampa: BUENO, min: 15, max: 80, de: 'Tensa', a: 'Buena', fmt: v => Math.round(v),
      tt: (E, p) => tt(E, p, lineasCcaa(E, ccaaDe(p))) }),
    capaCcaa({ id: 'indep', g: 'Territorio', n: 'Independentismo', d: 'Apoyo a la independencia.', valor: (E, c) => ccaaRC(E, c).indep, rampa: INDEP, min: 0, max: 40, de: 'Bajo', a: 'Alto', fmt: v => U.d1(v) + ' %', altoMalo: true,
      tt: (E, p) => tt(E, p, lineasCcaa(E, ccaaDe(p))) }),
    capaCcaa({ id: 'aut', g: 'Territorio', n: 'Autogobierno', d: 'Nivel de autogobierno según las competencias asumidas.', valor: (E, c) => ccaaRC(E, c).aut, rampa: BUENO, min: 40, max: 90, de: 'Menor', a: 'Mayor', fmt: v => Math.round(v),
      tt: (E, p) => tt(E, p, lineasCcaa(E, ccaaDe(p))) }),
    capaCcaa({ id: 'agravio', g: 'Territorio', n: 'Agravio comparativo', d: 'Sensación de maltrato frente al resto.', valor: (E, c) => ccaaRC(E, c).agravio, rampa: ALERTA, min: 0, max: 8, de: 'Bajo', a: 'Alto', fmt: v => U.d1(v), altoMalo: true,
      tt: (E, p) => tt(E, p, [['Agravio', U.d1(ccaaRC(E, ccaaDe(p)).agravio)], ['Relación con Moncloa', Math.round(ccaaRC(E, ccaaDe(p)).relM)]]) }),
    capaCcaa({ id: 'competencias', g: 'Territorio', n: 'Competencias', d: 'Competencias plenamente transferidas.', valor: (E, c) => Object.values(ccaaRC(E, c).comp || {}).filter(v => v === 2).length, rampa: AZUL, min: 5, max: 17, de: 'Pocas', a: 'Muchas', fmt: v => v + ' de ' + Object.keys(D().competencias).length,
      tt: (E, p) => { const rc = ccaaRC(E, ccaaDe(p)), n = Object.values(rc.comp || {}).filter(v => v === 2).length; return tt(E, p, [['Transferidas', n + ' de ' + Object.keys(D().competencias).length], ['Autogobierno', Math.round(rc.aut)]]); } }),
    capaCcaa({ id: 'fin', g: 'Economía', n: 'Financiación', d: 'Recursos por habitante respecto a la media (100).', valor: (E, c) => ccaaRC(E, c).fin.nivel, rampa: BUENO, min: 82, max: 125, de: 'Infrafinanciada', a: 'Mejor financiada', fmt: v => Math.round(v),
      tt: (E, p) => { const rc = ccaaRC(E, ccaaDe(p)); return tt(E, p, [['Régimen', esc({ comun: 'Común', foral: 'Foral', singular: 'Singular', canario: 'Canario' }[rc.fin.regimen] || rc.fin.regimen)], ['Nivel', Math.round(rc.fin.nivel)], ['Deuda', Math.round(rc.deuda) + ' %']]); } }),
    capaCcaa({ id: 'deuda', g: 'Economía', n: 'Deuda', d: 'Deuda autonómica.', valor: (E, c) => ccaaRC(E, c).deuda, rampa: ALERTA, min: 8, max: 70, de: 'Baja', a: 'Alta', fmt: v => Math.round(v) + ' %', altoMalo: true,
      tt: (E, p) => { const rc = ccaaRC(E, ccaaDe(p)); return tt(E, p, [['Deuda', Math.round(rc.deuda) + ' %'], ['Financiación', Math.round(rc.fin.nivel)]]); } }),
    capaCcaa({ id: 'aprob', g: 'Economía', n: 'Aprobación autonómica', d: 'Aprobación del Gobierno de cada comunidad.', valor: (E, c) => ccaaRC(E, c).gob ? ccaaRC(E, c).gob.aprob : null, rampa: BUENO, min: 30, max: 65, de: 'Baja', a: 'Alta', fmt: v => Math.round(v),
      tt: (E, p) => { const g = ccaaRC(E, ccaaDe(p)).gob; return tt(E, p, g ? [['Gobierno', esc(E.partidos[g.partido].sigla)], ['Aprobación', Math.round(g.aprob)], ['Estabilidad', Math.round(g.estab)]] : [['Gobierno', '—']]); } }),
    capaCcaa({ id: 'estab', g: 'Economía', n: 'Estabilidad autonómica', d: 'Estabilidad del Gobierno de cada comunidad.', valor: (E, c) => ccaaRC(E, c).gob ? ccaaRC(E, c).gob.estab : null, rampa: BUENO, min: 30, max: 90, de: 'Frágil', a: 'Sólida', fmt: v => Math.round(v),
      tt: (E, p) => { const g = ccaaRC(E, ccaaDe(p)).gob; return tt(E, p, g ? [['Gobierno', esc(E.partidos[g.partido].sigla) + (g.coalicion.length > 1 ? ' +' + (g.coalicion.length - 1) : '')], ['Estabilidad', Math.round(g.estab)], ['Tipo', g.tipo === 'mayoria' ? 'Mayoría' : 'Minoría']] : [['Gobierno', '—']]); } }),
    capaCcaa({ id: 'eleccion', g: 'Política', n: 'Próximas autonómicas', d: 'Cuánto falta para las elecciones de cada comunidad (más cálido = más cerca).', valor: (E, c) => { const s = semanas(E, ccaaRC(E, c).parl.proxT); return clamp(1 - s / 208, 0, 1) * 100; }, rampa: ALERTA, min: 0, max: 100, de: 'Lejos', a: 'Pronto', fmt: v => Math.round((1 - v / 100) * 208) + ' sem.',
      tt: (E, p) => { const rc = ccaaRC(E, ccaaDe(p)); return tt(E, p, [['Elecciones', U.fmtT(rc.parl.proxT, true)], ['Faltan', semanas(E, rc.parl.proxT) + ' semanas'], ['Gobierno', rc.gob ? esc(E.partidos[rc.gob.partido].sigla) : '—']]); } }),
    { id: 'emerg', g: 'Emergencias', n: 'Emergencias', d: 'Nivel de emergencia activo (1 operativa, 2 grave, 3 desbordada); con puntos, comunidades con riesgo estacional.', nivel: 'ccaa', marcas: 'crisis',
      color(E, p) { const c = ccaaDe(p), n = nivelEmerg(E, c); return { f: n === 0 ? NEUTRO : [null, '#d8b13f', '#e07a2f', '#cf3c3a'][n], p: C.Emerg && (C.Emerg.riesgo(E)[c] || []).length > 0 }; },
      tt(E, p) { const c = ccaaDe(p), cs = crisisDe(E, c), rs = C.Emerg ? (C.Emerg.riesgo(E)[c] || []) : []; return tt(E, p, [['Emergencia', cs.length ? cs.map(cr => esc(C.Crisis.TIPOS[cr.tipo].ic + ' ' + C.Crisis.TIPOS[cr.tipo].n)).join(', ') : 'ninguna'], ['Nivel', nivelEmerg(E, c) || '—'], ['Riesgo de temporada', rs.length ? rs.map(k => esc(C.Crisis.TIPOS[k].ic + ' ' + C.Crisis.TIPOS[k].n)).join(', ') : 'bajo']]); },
      leyenda: () => ({ items: [[NEUTRO, 'Sin emergencia'], ['#d8b13f', 'Nivel 1'], ['#e07a2f', 'Nivel 2'], ['#cf3c3a', 'Nivel 3'], ['url(#m-puntos)', 'Riesgo estacional']] }) },
    { id: 'impl', g: 'Partido', n: 'Implantación', d: 'Fuerza organizativa de tu partido en cada provincia.', nivel: 'prov', rank: false, etq: (E, p) => C.Sede ? Math.round(C.Sede.asegurar(E).impl[p] || 0) : null,
      color(E, p) { if (!C.Sede) return { f: NEUTRO }; return C.Sede.enRegion(E, p) ? { f: rampa(AZUL, ((C.Sede.asegurar(E).impl[p] || 0) - 10) / 70) } : { f: OCULTA }; },
      tt(E, p) { const v = C.Sede ? Math.round(C.Sede.asegurar(E).impl[p] || 0) : 0; return tt(E, p, [['Implantación de tu partido', v + ' %'], ['Diputados en juego', prov(p)[2]]]); },
      leyenda: () => ({ grad: gradCss(AZUL), de: 'Débil', a: 'Fuerte' }) },
    { id: 'pob', g: 'Partido', n: 'Peso en el Congreso', d: 'Diputados que elige cada circunscripción.', nivel: 'prov', rank: false, etq: (E, p) => prov(p)[2],
      color: (E, p) => ({ f: rampa(AZUL, Math.sqrt(prov(p)[2] / 37)) }), tt: (E, p) => tt(E, p, [['Diputados', prov(p)[2]], ['Población (miles)', U.n(prov(p)[3])]]), leyenda: () => ({ grad: gradCss(AZUL), de: '1 diputado', a: '37' }) },
    { id: 'obras', g: 'Obras', n: 'Infraestructuras', d: 'Inversión en obras por habitante y red de autovías, alta velocidad y líneas eléctricas. Aquí se trazan, se piden y se siguen las obras nuevas.', nivel: 'prov', ciudades: 'todas', ciuNeutra: true, obras: true, rank: false,
      etq: (E, p) => C.Obras ? U.n(Math.round(infra(E, p).eurHab)) : null,
      color(E, p) { return C.Obras ? { f: rampa(AZUL, 0.04 + 0.5 * Math.sqrt(clamp(infra(E, p).eurHab / 8000, 0, 1))) } : { f: NEUTRO }; },
      tt(E, p) { const x = infra(E, p); return tt(E, p, [['Inversión en obras', U.n(Math.round(x.eurHab)) + ' €/hab.'], ['Autovías · alta velocidad · eléctricas', `${x.autovia} · ${x.ave} · ${x.electrica}`], ['Obras puntuales', x.puntos], ['En construcción', x.curso]]); },
      leyenda: () => ({ grad: gradCss(AZUL), de: 'Menos', a: 'Más', lineas: C.Obras ? ['autovia', 'ave', 'electrica'].map(k => [C.Obras.TIPOS[k].col, C.Obras.TIPOS[k].n]) : [] }) }
  ];
  const POR_ID = Object.fromEntries(CAPAS.map(c => [c.id, c]));

  const Mapa = C.Mapa = {
    CAPAS, ESC: { rampa, BUENO, ALERTA, INDEP, AZUL, NEUTRO, OCULTA },
    capa: id => POR_ID[id] || POR_ID.voto,
    grupos() { const g = []; for (const c of CAPAS) { let x = g.find(y => y.n === c.g); if (!x) g.push(x = { n: c.g, capas: [] }); x.capas.push(c); } return g; },
    geo: G,
    nombreCcaa: nomC,

    /* ── Geografía ── */
    bbProv: p => G().bb[p], bbCcaa: c => G().ccBb[c],
    /* Lo que le pertenece al jugador en el mapa. */
    propio(E) { const J = E.jugador; if (!J || J.pais !== 'ES') return {}; return { prov: J.nivel === 'nacional' ? J.circ : null, ccaa: J.nivel === 'autonomico' ? J.region : null, muni: J.nivel === 'local' ? J.muni : null }; },

    /* Color y aviso de una provincia en una capa. */
    estiloProv(E, capa, p) { const L = Mapa.capa(capa); return L.color(E, p); },
    avisoProv(E, capa, p) { const L = Mapa.capa(capa); return L.tt(E, p); },
    /* Valores por comunidad de una capa numérica, ordenados (para el ranking). */
    ranking(E, capa) { const L = Mapa.capa(capa); if (!L.rank || !L.valor) return null; const ids = C.Territorio.ids().map(c => ({ c, v: L.valor(E, c) })).filter(x => x.v != null); ids.sort((a, b) => b.v - a.v); return { L, ids }; },

    /* Leyenda en HTML. */
    leyenda(E, capa) {
      const L = Mapa.capa(capa), x = L.leyenda ? L.leyenda(E) : {};
      if (x.partidos) return `<div class="leyenda">${x.partidos.map(k => `<span><i style="background:${E.partidos[k].color}"></i>${esc(E.partidos[k].sigla)}</span>`).join('')}</div>`;
      if (x.grad) return `<div class="leyenda mapa-grad"><span>${esc(x.de)}</span><i style="background:${x.grad}"></i><span>${esc(x.a)}</span></div>` + (x.lineas && x.lineas.length ? `<div class="leyenda mapa-lineas">${x.lineas.map(([c, t]) => `<span><i class="sw-l" style="background:${c}"></i>${esc(t)}</span>`).join('')}<span><i class="sw-l sw-d"></i>En obras</span></div>` : '');
      if (x.items) return `<div class="leyenda">${x.items.map(([c, t]) => `<span><i style="background:${c.startsWith('url') ? 'repeating-radial-gradient(circle,#fff 0 1px,transparent 1.5px 4px)' : c}"></i>${esc(t)}</span>`).join('')}</div>`;
      return '';
    },
    selector(capa, atr = 'data-capa') { return `<div class="seg">${CAPAS.map(c => `<button ${atr}="${c.id}" class="${c.id === capa ? 'activo' : ''}">${esc(c.n)}</button>`).join('')}</div>`; },

    /* Aviso (tooltip) de una ciudad grande. */
    avisoCiudad(E, m) { return `<div class="tt-t">${esc(m.nombre)}</div><div class="tt-f"><span>Población</span><b>${U.n(m.pob)} mil</b></div><div class="tt-f"><span>Alcaldía</span><b>${esc((E.partidos[m.alcalde] || {}).sigla || '—')}</b></div><div class="tt-f"><span>Aprobación</span><b>${Math.round(m.aprob)}</b></div>`; },

    /* Marcas sobre el mapa (emergencias, 155…) para una capa. */
    marcas(E, capa) {
      const m = [], rc = c => E.esp.ccaa[c];
      if (Mapa.capa(capa).marcas === 'crisis' && C.Crisis) for (const cr of C.Crisis.asegurar(E).activas) { if (cr.fase === 'cerrada') continue; const T = C.Crisis.TIPOS[cr.tipo]; for (const c of cr.regs.slice(0, 4)) m.push({ c, ic: T.ic, t: `${T.n} · ${cr.regs.length > 4 ? 'toda España' : nomC(c)}`, nivel: C.Emerg && C.Emerg.regional(cr) ? C.Emerg.nivel(cr, c) : cr.sev || 1 }); }
      for (const c of C.Territorio.ids()) { if (rc(c).suspendida) m.push({ c, ic: '⚖️', t: `Artículo 155 en ${nomC(c)}`, nivel: 0 }); }
      return m;
    },

    /* ── Dibujo ── */
    /* defs: rayado (155) y puntos (riesgo). */
    defs: () => `<defs><pattern id="m-rayas" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="26" height="26" fill="rgba(0,0,0,.18)"/><rect width="9" height="26" fill="rgba(255,255,255,.55)"/></pattern><pattern id="m-puntos" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="4.6" fill="rgba(255,255,255,.55)"/><circle cx="26" cy="26" r="4.6" fill="rgba(255,255,255,.55)"/></pattern><radialGradient id="m-mar" gradientUnits="userSpaceOnUse" cx="2338" cy="2250" r="3400"><stop offset="0" stop-color="#12233d"/><stop offset="1" stop-color="#0a1424"/></radialGradient></defs>`,

    /* Mapa estático. o: { altoMax, region (comunidad resaltada), prov (provincia resaltada), muni (ciudad resaltada), ciudades (dibuja las ciudades grandes, pulsables), sinPropio, visible (Set de provincias), etq ('prov'|'ccaa'|'no'), interactivo, vb } */
    svg(E, capa, o = {}) {
      const M = G(), L = Mapa.capa(capa), vb = o.vb || M.vb, propio = o.sinPropio ? {} : Mapa.propio(E), etq = o.etq || ((o.altoMax || 520) >= 380 ? 'prov' : 'no');
      let s = `<svg class="mapa-es${o.interactivo ? ' mapa-int' : ''}" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Mapa de España: ${esc(L.n)}${o.interactivo ? '. Con el teclado: más y menos para acercar, flechas para moverte, cero para ver todo.' : ''}" style="${o.altoMax ? 'max-height:' + o.altoMax + 'px' : ''}" xmlns="http://www.w3.org/2000/svg">${Mapa.defs()}`;
      s += `<rect class="mar" x="-9000" y="-9000" width="${M.vb[2] + 18000}" height="${M.vb[3] + 18000}" fill="url(#m-mar)"/>`;
      let tierra = '', haches = '', puntos = '';
      for (const p in M.prov) {
        const c = ccaaDe(p), oculta = o.visible && !o.visible.has(p), st = oculta ? { f: OCULTA } : L.color(E, p);
        const tip = oculta ? '' : ` data-tt="${esc(L.tt(E, p))}"`;
        tierra += `<path class="ficha" data-prov="${p}" data-ccaa="${c}"${tip} d="${M.prov[p]}" fill="${st.f}"${st.o != null ? ` fill-opacity="${f1(st.o)}"` : ''}/>`;
        if (st.h) haches += `<path d="${M.prov[p]}" fill="url(#m-rayas)" pointer-events="none"/>`;
        if (st.p) puntos += `<path d="${M.prov[p]}" fill="url(#m-puntos)" pointer-events="none"/>`;
      }
      s += `<g class="m-tierra">${tierra}</g><g class="m-trama">${haches}${puntos}</g>`;
      s += `<path class="m-b-prov" d="${M.bProv}" fill="none" vector-effect="non-scaling-stroke" pointer-events="none"/><path class="m-b-ccaa" d="${M.bCcaa}" fill="none" vector-effect="non-scaling-stroke" pointer-events="none"/><path class="m-costa-halo" d="${M.bExt}" fill="none" vector-effect="non-scaling-stroke" pointer-events="none"/><path class="m-costa" d="${M.bExt}" fill="none" vector-effect="non-scaling-stroke" pointer-events="none"/>`;
      // Ciudades autónomas: anillo pulsable
      for (const p of ['CEU', 'MEL']) { const oc = o.visible && !o.visible.has(p), st = oc ? { f: OCULTA } : L.color(E, p), cc = M.cen[p]; s += `<circle class="ficha m-aro" data-prov="${p}" data-ccaa="${p}"${oc ? '' : ` data-tt="${esc(L.tt(E, p))}"`} cx="${cc[0]}" cy="${cc[1]}" r="38" fill="${st.f}" fill-opacity="${st.o != null ? f1(st.o) : 0.9}" vector-effect="non-scaling-stroke"/>`; }
      // Recuadro de Canarias
      const i = M.inset; s += `<rect class="m-inset" x="${i[0]}" y="${i[1]}" width="${i[2]}" height="${i[3]}" fill="none" vector-effect="non-scaling-stroke" pointer-events="none"/>`;
      // Resaltado
      let res = '';
      const resalta = (ps, cl) => ps.map(p => `<path class="${cl}" d="${M.prov[p]}" fill="none" vector-effect="non-scaling-stroke" pointer-events="none"/>`).join('');
      if (o.region && M.ccaa[o.region]) res += resalta(M.ccaa[o.region], o.prov ? 'm-sel-c' : 'm-sel');
      if (o.prov && M.prov[o.prov]) res += resalta([o.prov], 'm-sel');
      if (propio.ccaa && M.ccaa[propio.ccaa]) res += resalta(M.ccaa[propio.ccaa], 'm-propio');
      if (propio.prov && M.prov[propio.prov]) res += resalta([propio.prov], 'm-propio');
      s += `<g class="m-res">${res}</g>`;
      if (etq !== 'no') {
        const tam = etq === 'prov' ? 56 : 66, txt = [];
        if (etq === 'prov') { for (const p in M.cen) { if (p === 'CEU' || p === 'MEL') continue; const bb = M.bb[p], ancho = bb[2] - bb[0]; if (ancho < 150) continue; txt.push(`<text x="${M.cen[p][0]}" y="${M.cen[p][1] + tam * 0.35}" font-size="${tam}">${p}</text>`); } }
        else for (const c in M.ccCen) txt.push(`<text x="${M.ccCen[c][0]}" y="${M.ccCen[c][1] + tam * 0.35}" font-size="${tam}">${c}</text>`);
        s += `<g class="m-etq-est" pointer-events="none">${txt.join('')}</g>`;
      }
      if (o.ciudades) {
        let cs = '';
        for (const m of Object.values(E.esp.muni.m)) { const p = M.ciu[m.id]; if (!p) continue; const sel = o.muni === m.id; cs += `<circle class="ciu${sel ? ' sel' : ''}" data-muni="${m.id}" data-tt="${esc(Mapa.avisoCiudad(E, m))}" cx="${p[0]}" cy="${p[1]}" r="${sel ? 62 : 38}" fill="${sel ? '#f2d57a' : '#f2eee0'}" vector-effect="non-scaling-stroke"/>`; }
        s += `<g class="m-ciu">${cs}</g>`;
      }
      if (o.interactivo) s += '<g class="m-obras"></g><g class="m-ciu"></g><g class="m-marc"></g><g class="m-etq"></g>';
      return s + '</svg>';
    }
  };

  /* ── Cámara: zoom con rueda y pellizco, desplazamiento arrastrando, doble clic y animación. ──
     opciones: { click(evento, elemento), cambio(vb, z), gestos (bool), zoomMax, suave (mapa dentro de una página que se desplaza: la rueda sólo acerca con Ctrl y el dedo sólo arrastra con el mapa ampliado), pista() } */
  Mapa.camara = function (svg, cont, o = {}) {
    const M = G(), W0 = M.vb[2], H0 = M.vb[3], ZMAX = o.zoomMax || 14;
    let cx = W0 / 2, cy = H0 / 2, z = 1, anim = null, destruido = false; const punteros = new Map(); let arrastre = null, movido = false, pinza = null;
    const tam = () => { const r = svg.getBoundingClientRect(); return { w: Math.max(1, r.width), h: Math.max(1, r.height) }; };
    const s0 = () => { const t = tam(); return Math.min(t.w / W0, t.h / H0) * 0.95; };
    const vista = () => { const t = tam(), k = s0() * z, w = t.w / k, h = t.h / k; return { x: cx - w / 2, y: cy - h / 2, w, h }; };
    const limitar = () => { const v = vista(), mx = v.w * 0.35, my = v.h * 0.35; cx = clamp(cx, -mx + v.w / 2 - 0, W0 + mx - v.w / 2 + 0); cy = clamp(cy, -my + v.h / 2, H0 + my - v.h / 2); if (v.w >= W0) cx = W0 / 2; if (v.h >= H0) cy = H0 / 2; };
    const aplicar = () => { limitar(); const v = vista(); svg.setAttribute('viewBox', `${f1(v.x)} ${f1(v.y)} ${f1(v.w)} ${f1(v.h)}`); if (o.suave && o.gestos !== false) svg.style.touchAction = z > 1.05 ? 'none' : 'pan-y'; if (o.cambio) o.cambio(v, z, s0() * z); };
    const aUnidades = (px, py) => { const v = vista(), r = svg.getBoundingClientRect(); return { x: v.x + (px - r.left) / r.width * v.w, y: v.y + (py - r.top) / r.height * v.h }; };
    const zoomEn = (factor, px, py) => { const antes = aUnidades(px, py), nz = clamp(z * factor, 1, ZMAX); if (nz === z) return; z = nz; const v = vista(), r = svg.getBoundingClientRect(); cx = antes.x - ((px - r.left) / r.width - 0.5) * v.w; cy = antes.y - ((py - r.top) / r.height - 0.5) * v.h; aplicar(); };
    const animar = (nx, ny, nz, ms = 420) => {
      cancelAnimationFrame(anim); if (matchMedia('(prefers-reduced-motion: reduce)').matches) ms = 0;
      const x0 = cx, y0 = cy, z0 = z, t0 = performance.now(); if (!ms) { cx = nx; cy = ny; z = nz; aplicar(); return; }
      const paso = t => { if (destruido) return; const u = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - u, 3); z = z0 * Math.pow(nz / z0, e); cx = x0 + (nx - x0) * e; cy = y0 + (ny - y0) * e; aplicar(); if (u < 1) anim = requestAnimationFrame(paso); };
      anim = requestAnimationFrame(paso);
    };
    const cam = {
      z: () => z, vista, centro: () => [cx, cy],
      reset(ms) { animar(W0 / 2, H0 / 2, 1, ms); },
      /* Encuadra una caja [x0,y0,x1,y1] con margen. */
      ajustarA(bb, pad = 1.35, ms, zmax) { const t = tam(), k0 = s0(), bw = Math.max(1, bb[2] - bb[0]) * pad, bh = Math.max(1, bb[3] - bb[1]) * pad; const nz = clamp(Math.min(t.w / bw, t.h / bh) / k0, 1, zmax || ZMAX); animar((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2, nz, ms); },
      zoom(factor) { const r = svg.getBoundingClientRect(); zoomEn(factor, r.left + r.width / 2, r.top + r.height / 2); },
      fijar(nx, ny, nz) { cx = nx; cy = ny; z = clamp(nz, 1, ZMAX); aplicar(); },
      aplicar, destruir() { destruido = true; cancelAnimationFrame(anim); }
    };
    if (o.gestos !== false) {
      svg.style.touchAction = o.suave ? 'pan-y' : 'none'; svg.style.cursor = 'grab';
      svg.addEventListener('wheel', e => { if (o.suave && !(e.ctrlKey || e.metaKey)) { if (o.pista) o.pista(); return; } e.preventDefault(); zoomEn(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016)), e.clientX, e.clientY); }, { passive: false });
      svg.addEventListener('pointerdown', e => {
        if (e.button != null && e.button > 0) return; punteros.set(e.pointerId, { x: e.clientX, y: e.clientY }); movido = false;
        if (punteros.size === 1) arrastre = { x: e.clientX, y: e.clientY, cx, cy };
        else if (punteros.size === 2) { const [a, b] = [...punteros.values()]; pinza = { d: Math.hypot(a.x - b.x, a.y - b.y), z }; arrastre = null; movido = true; }
      });
      svg.addEventListener('pointermove', e => {
        if (!punteros.has(e.pointerId)) return; punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (punteros.size === 2 && pinza) { const [a, b] = [...punteros.values()], d = Math.hypot(a.x - b.x, a.y - b.y); zoomEn((pinza.z * d / pinza.d) / z, (a.x + b.x) / 2, (a.y + b.y) / 2); return; }
        if (arrastre) {
          const dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y;
          if (!movido && Math.hypot(dx, dy) > 5) { movido = true; try { svg.setPointerCapture(e.pointerId); } catch (x) { /* nada */ } svg.style.cursor = 'grabbing'; }
          if (movido) { const k = s0() * z; cx = arrastre.cx - dx / k; cy = arrastre.cy - dy / k; aplicar(); }
        }
      });
      const fin = e => {
        const era = punteros.has(e.pointerId); punteros.delete(e.pointerId); if (punteros.size < 2) pinza = null; svg.style.cursor = 'grab';
        if (era && !movido && o.click) { const el = document.elementFromPoint(e.clientX, e.clientY); o.click(e, el); }
        if (!punteros.size) { arrastre = null; setTimeout(() => { movido = false; }, 0); }
      };
      svg.addEventListener('pointerup', fin); svg.addEventListener('pointercancel', e => { punteros.delete(e.pointerId); arrastre = null; pinza = null; });
      svg.addEventListener('dblclick', e => { e.preventDefault(); zoomEn(2, e.clientX, e.clientY); });
    } else if (o.click) svg.addEventListener('click', e => o.click(e, e.target));
    /* Teclado: + / − acercan, 0 encuadra todo y las flechas desplazan. */
    svg.setAttribute('tabindex', '0');
    svg.addEventListener('keydown', e => {
      const k = e.key, v = vista(), paso = Math.min(v.w, v.h) * 0.12;
      if (k === '+' || k === '=') cam.zoom(1.4); else if (k === '-' || k === '_') cam.zoom(1 / 1.4); else if (k === '0') cam.reset(300);
      else if (k === 'ArrowLeft') { cx -= paso; aplicar(); } else if (k === 'ArrowRight') { cx += paso; aplicar(); } else if (k === 'ArrowUp') { cy -= paso; aplicar(); } else if (k === 'ArrowDown') { cy += paso; aplicar(); }
      else return;
      e.preventDefault();
    });
    aplicar();
    return cam;
  };
})(window.ESP);
